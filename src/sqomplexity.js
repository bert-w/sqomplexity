import parserMysql from './../build/pegjs-parser-mysql.cjs';
// import parserMariaDb from './../build/pegjs-parser-mariadb.cjs';
import {Calculator} from './calculator.js';
import {BinaryExpressionCycleDetection} from './hooks/binary-expression-cycle-detection.js';

export class Sqomplexity {
    /**
     * @param {string} query
     * @param {Sqomplexity.Weights} weights
     */
    constructor(query, weights) {
        this.dialect = 'mysql';
        this.weights = weights;
        this.query = query;
        this.parser = this._selectParser(this.dialect);
        this.maxNestingDepth = 16;
    }

    /**
     * Calculate the maximum nesting depth of parentheses.
     * @returns {number}
     */
    calculateNestingDepth() {
        let q = this.query;
        let stack = []
        let maxDepth = 0;
        for (let i = 0; i < q.length; i++) {
            if (q[i] === '(') {
                stack.push(q[i])
                maxDepth = Math.max(maxDepth, stack.length);
            } else if (q[i] === ')') {
                if (stack.length) {
                    stack.pop();
                }
            }
        }

        return maxDepth;
    }

    /**
     * @returns {object}
     */
    analyze() {
        let parsed;

        try {
            const depth = this.calculateNestingDepth();
            if (depth > this.maxNestingDepth) {
                throw new Error(`The nesting depth ${depth} surpasses the maximum of 10.`);
            }
            parsed = this.parser.parse(this.query);
        } catch (e) {
            return {
                error: e.message,
                complexity: -1
            }
        }

        const calculator = (new Calculator(parsed.ast || [], this.weights));

        calculator
            .addHook('expression', new BinaryExpressionCycleDetection())
            .calculate();

        return {
            dialect: this.dialect,
            query: this.query,
            stats: calculator.getStats(),
            ast: parsed.ast,
            // Round to 6 decimal places.
            complexity: Math.round(calculator.getScore() * 1000000) / 1000000,
        }
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