import parserMysql from './../build/pegjs-parser-mysql.cjs';
// import parserMariaDb from './../build/pegjs-parser-mariadb.cjs';
import { Calculator } from './calculator.js';
import { BinaryExpressionCycleDetection } from './hooks/binary-expression-cycle-detection.js';
import defaultWeights from './weights.js';

export class Sqomplexity {
    /**
     * @param {string[]|string} queries
     * @param {Sqomplexity.Weights} [weights]
     */
    constructor(queries, weights = undefined) {
        this.dialect = 'mysql';
        this.weights = weights ?? defaultWeights;
        this.queries = Array.isArray(queries) ? queries : [queries];
        this.parser = this._selectParser(this.dialect);
        this.maxNestingDepth = 16;
    }

    /**
     * Get the current version of SQompLexity.
     * @returns {string}
     */
    static version() {
        return typeof VERSION !== 'undefined' ? VERSION : '0';
    }

    /**
     * Analyze the queries and calculate their complexity scores.
     * @returns {object[]}
     */
    analyze() {
        return this.queries.map((query) => {
            let parsed;

            try {
                const depth = this._calculateNestingDepth(query);
                if (depth > this.maxNestingDepth) {
                    throw new Error(`The nesting depth ${depth} surpasses the maximum of 10.`);
                }
                parsed = this.parser.parse(query);
            } catch (e) {
                return {
                    error: e.message,
                    complexity: e.message
                };
            }

            const calculator = (new Calculator(parsed.ast || [], this.weights));

            calculator
                .addHook('expression', new BinaryExpressionCycleDetection())
                .calculate();

            return {
                // Round to 6 decimal places.
                complexity: Math.round(calculator.getScore() * 1000000) / 1000000,
                dialect: this.dialect,
                query,
                stats: calculator.getStats(),
                ast: parsed.ast
            };
        });
    }

    /**
     * Shorthand function to only return the complexity score for each query.
     * @returns {number[]}
     */
    score() {
        return this.analyze().map(r => r.complexity || -1);
    }

    /**
     * Calculate the maximum nesting depth of parentheses.
     * @param {string} query
     * @returns {number}
     */
    _calculateNestingDepth(query) {
        const stack = [];
        let maxDepth = 0;
        for (let i = 0; i < query.length; i++) {
            if (query[i] === '(') {
                stack.push(query[i]);
                maxDepth = Math.max(maxDepth, stack.length);
            } else if (query[i] === ')') {
                if (stack.length) {
                    stack.pop();
                }
            }
        }

        return maxDepth;
    }

    /**
     * @param {string} dialect
     * @returns {*}
     */
    _selectParser(dialect) {
        switch (dialect.toLowerCase()) {
        case 'mysql':
            return parserMysql;
            // case 'mariadb':
            //     return parserMariaDb;
        default:
            throw new Error(`Unknown SQL parser "${dialect}".`);
        }
    }
}
