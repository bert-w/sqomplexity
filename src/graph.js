export class Graph {
    constructor() {
        this.map = new Map();
    }

    /**
     * @param {string} v
     * @returns {this}
     */
    addVertex(v) {
        this.map.set(v, []);

        return this;
    }

    /**
     * @param {string} v
     * @param {string} w
     * @returns {this}
     */
    addEdge(v, w) {
        if (!this.map.has(v)) {
            this.addVertex(v);
        }

        if (!this.map.has(w)) {
            this.addVertex(w);
        }

        const vEdges = this.map.get(v);
        const wEdges = this.map.get(w);

        if (vEdges.indexOf(w) < 0) {
            vEdges.push(w);
        }

        if (wEdges.indexOf(v) < 0) {
            wEdges.push(v);
        }

        return this;
    }

    /**
     * @returns {string}
     */
    toString() {
        return Array.from(this.map.keys()).map((key) => {
            return `${key} -> \n    ${Array.from(this.map.get(key)).join('\n    ')}`;
        }).join('\n');
    }

    /**
     * @returns {boolean}
     */
    isCyclic() {
        const visited = {};
        for (const key of this.map.keys()) {
            visited[key] = false;
        }

        for (const vertex of this.map.keys()) {
            if (!visited[vertex]) {
                if (this._isCyclicFrom(vertex, visited, null)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     *
     * @param {string} vertex
     * @param {string} visited
     * @param {string|null} parent
     * @returns {boolean}
     * @private
     */
    _isCyclicFrom(vertex, visited, parent) {
        visited[vertex] = true;

        for (const adjacent of this.map.get(vertex)) {
            if (!visited[adjacent]) {
                if (this._isCyclicFrom(adjacent, visited, vertex)) {
                    return true;
                }
            } else if (adjacent !== parent) {
                return true;
            }
        }

        return false;
    }
}