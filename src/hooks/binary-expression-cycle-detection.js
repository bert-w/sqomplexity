import {Graph} from '../graph.js';
import {Hook} from './hook.js';

/**
 * Detect cycles in a query by putting the columns in an adjacency list and walking the graph.
 */
export class BinaryExpressionCycleDetection extends Hook {
    constructor() {
        super();
        this.graph = new Graph();
    }

    /**
     * @param {Sqomplexity.Expression} expr
     * @param {string} clause
     * @param {Sqomplexity} self
     */
    handle(expr, clause, self) {
        if (expr.type === 'binary_expr') {
            if (expr.left.type === 'column_ref' && expr.right.type === 'column_ref') {
                this.graph.addEdge(
                    this._makeKeyForOperand(expr.left),
                    this._makeKeyForOperand(expr.right),
                );
            }
        }
    }

    /**
     * @returns {{is_cyclic: boolean}}
     */
    stats() {
        return {
            is_cyclic: this.graph.isCyclic(),
        }
    }

    /**
     * @param {object} operand
     * @returns {string}
     * @private
     */
    _makeKeyForOperand(operand) {
        return (operand.table ?? '_') + '.' + operand.column;
    }
}
