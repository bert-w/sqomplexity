import _ from 'lodash.get';
import * as fs from 'fs';

/**
 * Calculate a complexity score based on an AST of the SQL query and meta properties.
 */
export class Calculator {
    /**
     * @param {Sqomplexity.AST[]|Sqomplexity.AST} asts
     * @param {Sqomplexity.Weights} weights
     * @param {int} nestingLevel
     * @param {{expression: Sqomplexity.Hook[]}} hooks
     */
    constructor(asts, weights, nestingLevel = 0, hooks = {}) {
        /**
         * @type {Sqomplexity.AST[]}
         * @private
         */
        this.asts = Array.isArray(asts) ? asts : [asts];

        /**
         * @type {Sqomplexity.Weights}
         * @private
         */
        this.weights = weights;

        /**
         * @type {number}
         * @private
         */
        this.nestingLevel = nestingLevel;

        /**
         * @type {{expression: Sqomplexity.Hook[]}}
         * @private
         */
        this.hooks = hooks;

        /**
         * General stats that keeps a count of clauses and expressions.
         * @type {object}
         * @private
         */
        this.stats = {
            subqueries: 0, // >= 0

            columns: [],
            numbers: [],
            strings: [],
            string_types: [],
            tables: [],
            databases: [],

            expressions_per_clause: {
                select: 0,
                from: 0,
                join: 0,
                where: 0,
                group_by: 0,
                having: 0,
                order_by: 0,
                limit: 0,
                offset: 0
            },

            expressions_per_type: {
                table: 0,
                column: 0,
                string: 0,
                number: 0,
                star: 0,
                unary: 0,
                binary: 0,
                function: 0,
                aggregation_function: 0,
                list: 0,
                null: 0
            }
        };

        /**
         * Stats that depend on the base stats and usually consist of filtered lists to indicate
         * different expression usage.
         * @type {object}
         * @private
         */
        this.meta_stats = {};

        /**
         * @type {number|null}
         * @private
         */
        this.score = null;
    }

    /**
     * @param {string} type
     * @param {Hook} hook
     * @returns {this}
     */
    addHook(type, hook) {
        if (!this.hooks[type]) {
            this.hooks[type] = [];
        }
        this.hooks[type].push(hook);

        return this;
    }

    /**
     * @param {{expression: Sqomplexity.Hook[]}} hooks
     * @returns {this}
     */
    setHooks(hooks) {
        this.hooks = hooks;

        return this;
    }

    /**
     * @returns {object}
     */
    getStats() {
        return {
            ...this.stats,
            ...this.meta_stats
        };
    }

    /**
     * @returns {number}
     */
    getScore() {
        return this.score;
    }

    /**
     * @returns {number}
     */
    getNestingLevel() {
        return this.nestingLevel;
    }

    /**
     * @returns {this}
     */
    calculate() {
        let score = 0;

        // Loop AST's. This property will be an array if a query is given
        // with a semicolon at the end.
        this.asts.forEach((el) => {
            for (const fn of ['Select', 'From', 'Where', 'GroupBy', 'Having', 'LimitOffset', 'OrderBy']) {
                score += this[`_calculate${fn}`](el);
            }
        });

        this.meta_stats = this._calculateMetaStats();

        // Apply multiplier if nesting takes place.
        if (this.nestingLevel > 0) {
            score *= this.weights.emergent.subquery * this.nestingLevel;
        }

        // Add complexity if a cycle has been detected.
        if (this.meta_stats.is_cyclic) {
            score += this.weights.emergent.cycle;
        }

        this.score = score;

        return this;
    }

    /**
     * @returns {object}
     * @private
     */
    _calculateMetaStats() {
        // Retrieve extra data from hooks.
        const hookMeta = Object.entries(this.hooks).flatMap(([, value]) => value.map((hook) => hook.stats()));
        let hookData = {};
        hookMeta.forEach((value) => {
            hookData = { ...hookData, ...value };
        });

        return {
            case_usage: this._calculateCaseUsage(this.stats.columns),
            quote_usage: this._calculateQuoteUsage(this.stats.string_types),
            ...hookData
        };
    }

    /**
     * Apply a calculation to a nested expression, increasing the nesting level.
     * @param {Sqomplexity.AST[]|Sqomplexity.AST} ast
     * @returns {number}
     */
    _calculateNested(ast) {
        const calculator = (new Calculator(ast, this.weights, this.nestingLevel + 1, this.hooks))
            .calculate();

        // Add stats to the current scope.
        this._addStats(calculator.stats);
        // Add 1 extra subquery since we always have 1 nesting.
        this.stats.subqueries++;

        return calculator.score;
    }

    /**
     * @param {Sqomplexity.AST} ast
     * @returns {number}
     * @private
     */
    _calculateSelect(ast) {
        let score = 0;
        if (Array.isArray(ast.columns)) {
            ast.columns.forEach((el) => {
                if (!el.expr) {
                    // Fallback for empty expressions (take column_ref score).
                    score += this.weights.expressions.column;
                    return;
                }
                score += this._expression(el.expr, 'select');
            }, 0);
        } else if (ast.columns === '*') {
            // Star is not parsed as an expression, so we manually create one.
            score += this._expression({
                type: 'star',
                value: '*'
            }, 'select');
        }

        return this.weights.clauses.select * score;
    }

    /**
     * @param {Sqomplexity.AST} ast
     * @returns {number}
     * @private
     */
    _calculateFrom(ast) {
        let score = 0;
        (ast.from || []).forEach((expr) => {
            if (expr.join) {
                // Defer to join.
                score += this._calculateJoin({
                    type: 'table',
                    ...expr
                });
            } else if (expr.expr) {
                // Subexpression like a subquery.
                score += this.weights.clauses.from * this._expression(expr.expr, 'from');
            } else {
                // Make custom expression since there was none for table.
                score += this.weights.clauses.from * this._expression({
                    type: 'table',
                    ...expr
                }, 'from');
            }
        });

        return score;
    }

    /**
     * Joins use expressions since they are subtypes of FROM.
     * @param {Sqomplexity.Expression} expr
     * @return {number}
     * @private
     */
    _calculateJoin(expr) {
        return this._expression(expr, 'join') * this.weights.clauses.join;
    }

    /**
     * @param {Sqomplexity.AST} ast
     * @returns {number}
     * @private
     */
    _calculateGroupBy(ast) {
        let score = 0;
        (ast.groupby || []).forEach((el) => {
            score += this._expression(el, 'group_by');
        });

        return score * this.weights.clauses.group_by;
    }

    /**
     * @param {Sqomplexity.AST} ast
     * @returns {number}
     * @private
     */
    _calculateHaving(ast) {
        let score = 0;
        if (_(ast, 'having.type') === 'binary_expr') {
            score += this._expression(ast.having, 'having');
        }

        return score * this.weights.clauses.having;
    }

    /**
     * @param {Sqomplexity.AST} ast
     * @returns {number}
     * @private
     */
    _calculateLimitOffset(ast) {
        let score = 0;
        if (ast.limit) {
            // LIMIT provided.
            this.stats.expressions_per_clause.limit++;
            score += this._expression(ast.limit.value[0], 'limit') * this.weights.clauses.limit;

            if (ast.limit.separator === 'offset') {
                // OFFSET provided.
                this.stats.expressions_per_clause.offset++;
                score += this._expression(ast.limit.value[1], 'offset') * this.weights.clauses.offset;
            }
        }

        return score;
    }

    /**
     * @param {Sqomplexity.AST} ast
     * @returns {number}
     * @private
     */
    _calculateOrderBy(ast) {
        let score = 0;
        if (ast.orderby) {
            ast.orderby.forEach((el) => {
                score += this._expression(el.expr, 'order_by');
            });
        }

        return score * this.weights.clauses.order_by;
    }

    /**
     * @param {Sqomplexity.AST} ast
     * @returns {number}
     * @private
     */
    _calculateWhere(ast) {
        let score = 0;
        if (ast.where) {
            score += this._expression(ast.where, 'where');
        }

        return score * this.weights.clauses.where;
    }

    /**
     * Map a given input to a key in a score object.
     * @param {string} el
     * @param {object} scores
     * @param {number} ifNull Score to assign if the given el is null or undefined.
     * @param {number} ifNoMap Score to assign if the given el cannot be found in the map.
     * @returns {number}
     * @private
     */
    _map(el, scores, ifNull = 0, ifNoMap = 0) {
        if (el != null) {
            return Object.prototype.hasOwnProperty.call(scores, el.toLowerCase()) ? scores[el.toLowerCase()] : ifNoMap;
        }
        return ifNull;
    }

    /**
     * @param {Sqomplexity.Expression} expr
     * @param {string} clause
     * @returns {number}
     * @private
     */
    _expression(expr, clause) {
        (this.hooks.expression ?? []).forEach((hook) => {
            hook.handle(...arguments, this);
        });

        this.stats.expressions_per_clause[clause]++;

        if (expr.ast) {
            // Subqueries can be returned immediately.
            return this._calculateNested(expr.ast);
        }

        let score = (() => {
            switch (expr.type) {
            case 'table':
                if (expr.db) {
                    // Database prefix (if any).
                    this.stats.databases.push(expr.db);
                }
                if (expr.on) {
                    // ON clause (JOINs).
                    return this._expression(expr.on, clause);
                }
                break;
            case 'binary_expr':
                return (this._expression(expr.left, clause) + this._expression(expr.right, clause));
            case 'number':
                this.stats.numbers.push(expr.value);
                break;
            case 'column_ref':
                this.stats.columns.push(expr.column);
                break;
            case 'expr_list':
                return (Array.isArray(expr.value) ? expr.value : [expr.value]).reduce((accumulator, i) => {
                    return this._expression(i, clause) + accumulator;
                }, 0);
            case 'star':
                break;
            case 'aggr_func':
            case 'function':
                break;
            case 'string':
            case 'natural_string':
            case 'single_quote_string':
            case 'hex_string':
            case 'full_hex_string':
            case 'bit_string':
                this.stats.strings.push(expr.value);
                this.stats.string_types.push(expr.type);
                break;
            case 'unary_expr':
                break;
            }
            if (expr.args) {
                return (Array.isArray(expr.args) ? expr.args : [expr.args]).reduce((accumulator, i) => {
                    return (expr.args.distinct ? this.weights.expressions.function : 0) +
                        // Some arguments have a nested expression immediately which takes precedence.
                        this._expression(i.expr ?? i, clause);
                }, 0);
            }

            return 1;
        })();

        if (expr.operator) {
            // Add weight for specific operator.
            score += this.weights.operator;
        }

        if (expr.table != null) {
            // `null` values are pushed too (intended).
            this.stats.tables.push(expr.table);
        }

        let weight = this.weights.expressions._base;
        try {
            // Find base weight of the expression type.
            const mappedWeightName = this._mapExpressionType(expr.type);
            weight = this.weights.expressions[mappedWeightName];
            this.stats.expressions_per_type[mappedWeightName]++;
        } catch (e) {
            // Unknown expression type. Use the existing base score.
        }

        return weight * score;
    }

    /**
     * Determines the casing (camelcase/snakecase/titlecase) for the input.
     * @param {string} str
     * @returns {string|null}
     * @private
     */
    _getStringCase(str) {
        if (str === '*') {
            return null;
        }
        if (str.match(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/)) {
            return 'snake_case';
        } if (str.match(/^[a-z][a-z0-9]*([A-Z][a-z0-9]+)*$/)) {
            return 'camelCase';
        } if (str.match(/^[A-Z][a-zA-Z0-9]+$/)) {
            return 'PascalCase';
        } if (str === str.toUpperCase()) {
            return 'UPPERCASE';
        } if (str === str.toLowerCase()) {
            return 'lowercase';
        }
        return 'Unknown case';
    }

    /**
     * Determine the case usage in an array of strings.
     * @param {string[]} arr
     * @returns {string[]}
     * @private
     */
    _calculateCaseUsage(arr) {
        return arr.map(c => this._getStringCase(c))
            .filter(c => c)
            .filter(this._unique);
    }

    /**
     * Determine the type of quotes used in a list of expression types.
     * @param {string[]} arr
     * @returns {string[]}
     * @private
     */
    _calculateQuoteUsage(arr) {
        return arr.map((i) => {
            switch (i) {
            case 'string':
                return 'double';
            case 'single_quote_string':
                return 'single';
            default:
                return null;
            }
        }).filter(i => i).filter(this._unique);
    }

    /**
     * Map an expression type to an expression weight.
     * @param {string} type
     * @private
     */
    _mapExpressionType(type) {
        const mapped = {
            string: 'string',
            natural_string: 'string',
            single_quote_string: 'string',
            hex_string: 'string',
            full_hex_string: 'string',
            bit_string: 'string',

            unary_expr: 'unary',
            binary_expr: 'binary',

            function: 'function',
            cast: 'function',
            distinct: 'function',

            aggr_func: 'aggregation_function',

            column_ref: 'column',

            expr_list: 'list',

            table: 'table',

            number: 'number',
            bigint: 'number',

            star: 'star',

            null: 'null'
        }[type];

        if (!mapped) {
            throw new Error(`Unknown expression "${type}" encountered.`);
        }

        return mapped;
    }

    /**
     * Add stats (from a nested query) to this object.
     * @param {object} stats
     * @returns {void}
     * @private
     */
    _addStats(stats) {
        this.stats.subqueries += stats.subqueries;
        this.stats.strings = this.stats.strings.concat(stats.strings);
        this.stats.string_types = this.stats.string_types.concat(stats.string_types);
        this.stats.columns = this.stats.columns.concat(stats.columns);
        this.stats.tables = this.stats.tables.concat(stats.tables);
        this.stats.databases = this.stats.databases.concat(stats.databases);

        for (const clause in stats.expressions_per_clause) {
            this.stats.expressions_per_clause[clause] += stats.expressions_per_clause[clause];
        }

        for (const expression in stats.expressions_per_type) {
            this.stats.expressions_per_type[expression] += stats.expressions_per_type[expression];
        }
    }

    /**
     * Callback function for filtering unique values in an array.
     * @param {any} value
     * @param {number} index
     * @param {array} array
     * @returns {boolean}
     * @private
     */
    _unique(value, index, array) {
        return array.indexOf(value) === index;
    }

    /**
     *
     * @TODO promisify
     * @param {any} message
     * @private
     */
    _log(message) {
        try {
            fs.accessSync('./error.log', fs.constants.W_OK);
            fs.appendFileSync('./error.log', `[${(new Date()).toISOString()}] ${JSON.stringify(message)}\n`);
        } catch (e) {
            // No write permissions.
        }
    }
}
