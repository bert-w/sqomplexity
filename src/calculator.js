import _ from 'lodash.get';

/**
 * Calculate a complexity score based on an AST of the SQL query and meta properties.
 */
export class Calculator {
    /**
     * @param {object} ast
     * @param {Sqomplexity.Weights} weights
     * @param {int} nesting
     */
    constructor(ast, weights, nesting = 0) {
        /**
         * @type {Sqomplexity.Weights}
         * @private
         */
        this.weights = weights;

        /**
         * @type {number}
         * @private
         */
        this.nesting = nesting;

        /**
         * General stats that keeps a count of clauses and expressions.
         * @type {object}
         * @private
         */
        this.stats = {
            select: 0, // >= 0
            from: 0, // >= 0
            group_by: 0, // >= 0
            having: 0, // >= 0
            order_by: 0, // >= 0
            limit: 0, // 0 or 1
            offset: 0, // 0 or 1
            columns: [],
            numbers: [],
            strings: [],
            string_types: [],
            tables: [],
            databases: [],
            expressions_per_clause: {
                select: 0,
                from: 0,
                group_by: 0,
                having: 0,
                order_by: 0,
                where: 0,
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
         * @type {number}
         * @private
         */
        this.score = this.calculate(ast);

        /**
         * Stats that depend on the base stats and usually consist of filtered lists to indicate
         * different expression usage.
         * @type {object}
         * @private
         */
        this.meta_stats = {
            case_usage: this._calculateCaseUsage(this.stats.columns),
            quote_usage: this._calculateQuoteUsage(this.stats.string_types),
            table_usage: this.stats.tables.filter(this._unique),
            database_usage: this.stats.databases.filter(this._unique),
        }
    }

    getStats() {
        return {
            ...this.stats,
            ...{
                meta: this.meta_stats,
            }
        };
    }

    getScore() {
        return this.weights.m_score * this.score +
            this.weights.m_meta_score * this.getMetaScore();
    }

    getMetaScore() {
        let score = 0;
        score += this.meta_stats.case_usage.length > 1 ? this.weights.meta_score.case_usage * this.meta_stats.case_usage.length : 0;
        score += this.meta_stats.quote_usage.length > 1 ? this.weights.meta_score.quote_usage * this.meta_stats.quote_usage.length : 0;

        return score;
    }

    /**
     * @param {object|array} ast
     * @returns {number}
     */
    calculate(ast) {
        let score = 0;

        // Loop AST's. This property will be an array if a query is given
        // with a semicolon at the end.
        (Array.isArray(ast) ? ast : [ast]).forEach((el) => {
            score += this._calculateSelect(el);

            score += this._calculateFrom(el);

            score += this._calculateWhere(el);

            score += this._calculateGroupBy(el);

            score += this._calculateHaving(el);

            score += this._calculateLimitOffset(el);

            score += this._calculateOrderBy(el);
        });

        // Apply multiplier if nesting takes place.
        return score * Math.pow(this.weights.m_nesting, this.nesting);
    }

    /**
     * Apply a calculation to a nested expression, increasing the nesting level.
     * @param {object|array} ast
     * @param {this} parent Parent object to add the stats to.
     * @returns {number}
     */
    _calculateNested(ast, parent) {
        const calculator = (new Calculator(ast, this.weights, this.nesting + 1));
        parent._addStats(calculator.stats);

        return calculator.score;
    }

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
            // Star is not parsed as an expression so we manually create one.
            score += this._expression({
                type: 'star',
                value: '*'
            }, 'select');
        }

        return score;
    }

    _calculateFrom(ast) {
        let score = 0;
        (ast.from || []).forEach((i) => {
            score += this.weights.from._base;
            this.stats.from++;

            // JOIN type.
            score += this._map(i.join, {
                'left join': this.weights.from.left_join,
                'right join': this.weights.from.right_join,
                'inner join': this.weights.from.inner_join,
                'full outer join': this.weights.from.full_outer_join,
                'cross join': this.weights.from.cross_join,
            });

            if (i.db) {
                // Database prefix.
                score += this.weights.from.database_prefix;
                this.stats.databases.push(i.db);
            }

            if (i.expr) {
                // Subexpression.
                score += this._expression(i.expr, 'from');
            }

            if (_(i, 'on.type') === 'binary_expr') {
                // Conditions.
                score += this._expression(i.on, 'from');
            }
        });

        return score;
    }

    _calculateGroupBy(ast) {
        let score = 0;
        (ast.groupby || []).forEach((el) => {
            this.stats.group_by++;
            score += this.weights.m_group_by * this._expression(el, 'group_by');
        });

        return score;
    }

    _calculateHaving(ast) {
        let score = 0;
        if (_(ast, 'having.type') === 'binary_expr') {
            this.stats.having++;
            score += this.weights.m_having * this._expression(ast.having, 'having')
        }

        return score;
    }

    _calculateLimitOffset(ast) {
        if (_(ast, 'limit.separator') === 'offset') {
            // LIMIT and OFFSET provided.
            this.stats.limit++;
            this.stats.offset++;
            return this.weights.limit + this.weights.offset;
        }

        if (ast.limit) {
            this.stats.limit++;
            return this.weights.limit;
        }

        return 0;
    }

    _calculateOrderBy(ast) {
        let score = 0;
        if (ast.orderby) {
            ast.orderby.forEach((el) => {
                this.stats.order_by++;
                score += this.weights.m_order_by * this._expression(el.expr, 'order_by');
            });
        }

        return score;
    }

    _calculateWhere(ast) {
        if (ast.where) {
            this.stats.where++;
            return this.weights.m_where * this._expression(ast.where, 'where');
        }

        return 0;
    }

    _map(el, map, ifNull = 0, ifNoMap = 0) {
        if (el == null) {
            return ifNull;
        }

        return map[el.toLowerCase()] || ifNoMap;
    }

    /**
     * @param {object} expr
     * @param {string} clause
     * @returns {number}
     * @private
     */
    _expression(expr, clause) {
        let score = this.weights.expressions._base;
        score += this._map(expr.operator, {
            or: this.weights.expressions.operators.or,
            in: this.weights.expressions.operators.in,
            and: this.weights.expressions.operators.and,
            '=': this.weights.expressions.operators['='],
            '>': this.weights.expressions.operators['>'],
            '<': this.weights.expressions.operators['<'],
            '>=': this.weights.expressions.operators['>='],
            '<=': this.weights.expressions.operators['<='],
        }, 0, this.weights.expressions.operators._base);

        this.stats.expressions_per_clause[clause]++;

        // Add base weight for the expression type (may fall back to _base if it is not set.
        score += _(this.weights.expressions, expr.type, _(this.weights.expressions, '_base', 0));
        console.log(_(this.weights.expressions, expr.type));
        console.log(_(this.weights.expressions, '_base'));
        console.log(_(this.weights.expressions, expr.type, _(this.weights.expressions, '_base', 0)));

        if(['string', 'natural_string', 'single_quote_string', 'hex_string', 'bit_string'].indexOf(expr.type) >= 0) {
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
            case 'bit_string':
                this.stats.strings.push(expr.value);
                this.stats.string_types.push(expr.type);
                break;
            case 'unary_expr':
                break;
        }

        if (expr.table !== undefined) {
            // `null` values are pushed too (intended).
            this.stats.tables.push(expr.table);
        }

        if (expr.ast) {
            score += this._calculateNested(expr.ast, this);
        }

        if (expr.args && expr.args.expr) {
            score += expr.args.distinct ? this.weights.expressions.distinct : 0;
            score += this._expression(expr.args.expr, clause);
        }

        return score;
    }

    /**
     * Determines the casing (camelcase/snakecase/titlecase) for the input.
     * @param str
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

    _addStats(stats) {
        this.stats.from += stats.from;
        this.stats.group_by += stats.group_by;
        this.stats.having += stats.having;
        this.stats.order_by += stats.order_by;
        this.stats.limit += stats.limit;
        this.stats.offset += stats.offset;
        this.stats.strings = this.stats.strings.concat(stats.strings);
        this.stats.string_types = this.stats.string_types.concat(stats.string_types);
        this.stats.columns = this.stats.columns.concat(stats.columns);
        this.stats.tables = this.stats.columns.concat(stats.tables);
        this.stats.databases = this.stats.columns.concat(stats.databases);

        this.stats.expressions_per_clause.select += stats.expressions_per_clause.select;
        this.stats.expressions_per_clause.from += stats.expressions_per_clause.from;
        this.stats.expressions_per_clause.group_by += stats.expressions_per_clause.group_by;
        this.stats.expressions_per_clause.having += stats.expressions_per_clause.having;
        this.stats.expressions_per_clause.order_by += stats.expressions_per_clause.order_by;
        this.stats.expressions_per_clause.where += stats.expressions_per_clause.where;

        this.stats.expressions_per_type.binary += stats.expressions_per_type.binary;
        this.stats.expressions_per_type.unary += stats.expressions_per_type.unary;
        this.stats.expressions_per_type.column += stats.expressions_per_type.column;
        this.stats.expressions_per_type.aggregation += stats.expressions_per_type.aggregation;
        this.stats.expressions_per_type.list += stats.expressions_per_type.list;
        this.stats.expressions_per_type.star += stats.expressions_per_type.star;
        this.stats.expressions_per_type.function += stats.expressions_per_type.function;
        this.stats.expressions_per_type.string += stats.expressions_per_type.string;
    }

    _unique(value, index, array) {
        return array.indexOf(value) === index;
    }
}