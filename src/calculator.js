import _ from 'lodash.get';

/**
 * Calculate a complexity score based on an AST of the SQL query and meta properties.
 */
export class Calculator {
    /**
     * @param {Sqomplexity.AST[]|Sqomplexity.AST} asts
     * @param {Sqomplexity.Weights} weights
     * @param {int} nesting_level
     * @param {{expression: Sqomplexity.Hook[]}} hooks
     */
    constructor(asts, weights, nesting_level = 0, hooks = {}) {
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
        this.nesting_level = nesting_level;

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
                where: 0,
                group_by: 0,
                having: 0,
                order_by: 0,
                limit: 0,
                offset: 0,
            },

            expressions_per_type: {
                unary_expr: 0,
                binary_expr: 0,
                number: 0,
                column_ref: 0,
                aggr_func: 0,
                expr_list: 0,
                star: 0,
                function: 0,
                string: 0,
            }
        }

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
     * @param {Sqomplexity.Hook} hook
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
        // Retrieve extra data from hooks.
        const hookMeta = Object.entries(this.hooks).flatMap(([key, value]) => value.map((hook) => hook.stats()));
        let hookData = {};
        hookMeta.forEach((value) => hookData = {...hookData, ...value});

        return {
            ...this.stats,
            ...this.meta_stats,
            ...hookData,
        };
    }

    /**
     * @returns {number}
     */
    getScore() {
        return this.weights.m_score * this.score +
            this.weights.m_meta_score * this.getMetaScore();
    }

    /**
     * @returns {number}
     */
    getMetaScore() {
        let score = 0;
        score += this.meta_stats.case_usage.length > 1 ? this.weights.meta_score.case_usage * this.meta_stats.case_usage.length : 0;
        score += this.meta_stats.quote_usage.length > 1 ? this.weights.meta_score.quote_usage * this.meta_stats.quote_usage.length : 0;

        return score;
    }

    /**
     * @returns {number}
     */
    getNestingLevel() {
        return this.nesting_level;
    }

    /**
     * @returns {this}
     */
    calculate() {
        let score = 0;

        // Loop AST's. This property will be an array if a query is given
        // with a semicolon at the end.
        this.asts.forEach((el) => {
            score += this._calculateSelect(el);

            score += this._calculateFrom(el);

            score += this._calculateWhere(el);

            score += this._calculateGroupBy(el);

            score += this._calculateHaving(el);

            score += this._calculateLimitOffset(el);

            score += this._calculateOrderBy(el);
        });


        this.meta_stats = this._calculateStats();

        // Apply multiplier if nesting takes place.
        this.score = score * Math.pow(this.weights.m_nesting, this.nesting_level);

        return this;
    }

    /**
     * @returns {object}
     * @private
     */
    _calculateStats() {
        return {
            case_usage: this._calculateCaseUsage(this.stats.columns),
            quote_usage: this._calculateQuoteUsage(this.stats.string_types),
        };
    }

    /**
     * Apply a calculation to a nested expression, increasing the nesting level.
     * @param {Sqomplexity.AST[]|Sqomplexity.AST} ast
     * @returns {number}
     */
    _calculateNested(ast) {
        const calculator = (new Calculator(ast, this.weights, this.nesting_level + 1, this.hooks))
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
                this.stats.select++;
                if (!el.expr) {
                    // Fallback for empty expressions (take column_ref score).
                    score += this.weights.expressions.column_ref;
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

        return score;
    }

    /**
     * @param {Sqomplexity.AST} ast
     * @returns {number}
     * @private
     */
    _calculateFrom(ast) {
        let score = 0;
        (ast.from || []).forEach((i) => {
            score += this.weights.from._base;

            if (i.db) {
                // Database prefix.
                score += this.weights.from.database_prefix;
                this.stats.databases.push(i.db);
            }

            if (i.join) {
                // JOIN type.
                score += this._expression({
                    table: i.table,
                }, 'join');

                score += this._map(i.join, {
                    'left join': this.weights.from.left_join,
                    'right join': this.weights.from.right_join,
                    'inner join': this.weights.from.inner_join,
                    'cross join': this.weights.from.cross_join,
                });

                if (i.on) {
                    score += this._expression(i.on, 'join');
                }
            } else if (i.expr) {
                // Subexpression like a subquery.
                score += this._expression(i.expr, 'from');
            } else {
                // Count anything else as a FROM expression.
                this.stats.expressions_per_clause.from++;
            }
        });

        return score;
    }

    /**
     * @param {Sqomplexity.AST} ast
     * @returns {number}
     * @private
     */
    _calculateGroupBy(ast) {
        let score = 0;
        (ast.groupby || []).forEach((el) => {
            score += this.weights.m_group_by * this._expression(el, 'group_by');
        });

        return score;
    }

    /**
     * @param {Sqomplexity.AST} ast
     * @returns {number}
     * @private
     */
    _calculateHaving(ast) {
        let score = 0;
        if (_(ast, 'having.type') === 'binary_expr') {
            score += this.weights.m_having * this._expression(ast.having, 'having')
        }

        return score;
    }

    /**
     * @param {Sqomplexity.AST} ast
     * @returns {number}
     * @private
     */
    _calculateLimitOffset(ast) {
        if (_(ast, 'limit.separator') === 'offset') {
            // LIMIT and OFFSET provided.
            this.stats.expressions_per_clause.limit++;
            this.stats.expressions_per_clause.offset++;
            return this.weights.limit + this.weights.offset;
        }

        if (ast.limit) {
            this.stats.expressions_per_clause.limit++;
            return this.weights.limit;
        }

        return 0;
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
                score += this.weights.m_order_by * this._expression(el.expr, 'order_by');
            });
        }

        return score;
    }

    /**
     * @param {Sqomplexity.AST} ast
     * @returns {number}
     * @private
     */
    _calculateWhere(ast) {
        if (ast.where) {
            return this.weights.m_where * this._expression(ast.where, 'where');
        }

        return 0;
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
            return scores.hasOwnProperty(el.toLowerCase()) ? scores[el.toLowerCase()] : ifNoMap;
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

        let score = this.weights.expressions._base;

        // Add weight for specific operator.
        score += this._map(expr.operator, this.weights.expressions.operators, 0, this.weights.expressions.operators._base);

        this.stats.expressions_per_clause[clause]++;

        // Add base weight for the expression type (may fall back to _base if it is not set).
        score += _(this.weights.expressions, expr.type, _(this.weights.expressions, '_base', 0));

        if (['string', 'natural_string', 'single_quote_string', 'hex_string', 'full_hex_string', 'bit_string'].indexOf(expr.type) >= 0) {
            // Coerce to "string" type.
            this.stats.expressions_per_type.string++;
        } else {
            this.stats.expressions_per_type[expr.type]++;
        }

        // Add stats + recurring expressions.
        switch (expr.type) {
            case 'binary_expr':
                score += (this._expression(expr.left, clause) + this._expression(expr.right, clause));
                break;
            case 'number':
                this.stats.numbers.push(expr.value);
                break;
            case 'column_ref':
                this.stats.columns.push(expr.column);
                break;
            case 'aggr_func':
                break;
            case 'expr_list':
                score += (Array.isArray(expr.value) ? expr.value : [expr.value]).reduce((accumulator, i) => {
                    return this._expression(i, clause) + accumulator;
                }, 0);
                break;
            case 'star':
                break;
            case 'function':
                score += expr.args ? this._expression(expr.args, clause) : 0;
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

        if (expr.table != null) {
            // `null` values are pushed too (intended).
            this.stats.tables.push(expr.table);
        }

        if (expr.ast) {
            score += this._calculateNested(expr.ast);
        }

        if (expr.args && expr.args.expr) {
            score += expr.args.distinct ? this.weights.expressions.distinct : 0;
            score += this._expression(expr.args.expr, clause);
        }

        return score;
    }

    /**
     * Determines the casing (camelcase/snakecase/titlecase) for the input.
     * @param {string} str
     * @returns {string}
     * @private
     */
    _getStringCase(str) {
        if (str.match(/^[a-z]+(_[a-z]+)*$/)) {
            return 'snake_case';
        } else if (str.match(/^[a-z]+([A-Z][a-z0-9]+)*$/)) {
            return 'camelCase';
        } else if (str.match(/^[A-Z][a-zA-Z0-9]+$/)) {
            return 'PascalCase';
        } else if (str === str.toUpperCase()) {
            return 'UPPERCASE';
        } else if (str === str.toLowerCase()) {
            return 'lowercase';
        } else {
            return 'Unknown case';
        }
    }

    /**
     * Determine the case usage in an array of strings.
     * @param {string[]} arr
     * @returns {string[]}
     * @private
     */
    _calculateCaseUsage(arr) {
        return arr.map(c => this._getStringCase(c)).filter(this._unique);
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

        this.stats.expressions_per_clause.select += stats.expressions_per_clause.select;
        this.stats.expressions_per_clause.from += stats.expressions_per_clause.from;
        this.stats.expressions_per_clause.join += stats.expressions_per_clause.join;
        this.stats.expressions_per_clause.where += stats.expressions_per_clause.where;
        this.stats.expressions_per_clause.group_by += stats.expressions_per_clause.group_by;
        this.stats.expressions_per_clause.having += stats.expressions_per_clause.having;
        this.stats.expressions_per_clause.order_by += stats.expressions_per_clause.order_by;
        this.stats.expressions_per_clause.limit += stats.expressions_per_clause.limit;
        this.stats.expressions_per_clause.offset += stats.expressions_per_clause.offset;

        this.stats.expressions_per_type.binary_expr += stats.expressions_per_type.binary_expr;
        this.stats.expressions_per_type.unary_expr += stats.expressions_per_type.unary_expr;
        this.stats.expressions_per_type.column_ref += stats.expressions_per_type.column_ref;
        this.stats.expressions_per_type.number += stats.expressions_per_type.number;
        this.stats.expressions_per_type.aggr_func += stats.expressions_per_type.aggr_func;
        this.stats.expressions_per_type.expr_list += stats.expressions_per_type.expr_list;
        this.stats.expressions_per_type.star += stats.expressions_per_type.star;
        this.stats.expressions_per_type.function += stats.expressions_per_type.function;
        this.stats.expressions_per_type.string += stats.expressions_per_type.string;
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
}