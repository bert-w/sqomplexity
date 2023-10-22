import {Graph} from '../graph.js';
import {Hook} from './hook.js';

/**
 * Detect cycles in a query by putting the columns in an adjacency list and walking the graph.
 */
export class BinaryExpressionCycleDetection extends Hook {
    constructor() {
        super();

        this.graph = new Graph();

        this.aliases = {};
    }

    handle(expr, clause, self) {
        if (expr.type === 'table' && expr.table != null && expr.as != null) {
            // Keep track of aliases.
            this.aliases[expr.as] = expr.table;
        }

        if (expr.type === 'binary_expr') {
            if (expr.left.type === 'column_ref' && expr.right.type === 'column_ref') {
                // Create edges in our adjacency list.
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
     * Create a unique identifier for the used column including the table name.
     * @param {object} operand
     * @returns {string}
     * @private
     */
    _makeKeyForOperand(operand) {
        return [(this.aliases[operand.table] ?? operand.table) ?? '_', operand.column].join(':');
    }
}
