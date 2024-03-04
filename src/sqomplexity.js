import { Program } from './program.js';
import weights from './weights.js';
import * as fs from 'node:fs/promises';
import packageJson from './../package.json' assert { 'type': 'json' };

export class Sqomplexity {
    /**
     * @param {object} options
     * @param {boolean} [options.files]
     * @param {boolean} [options.base64]
     * @param {boolean} [options.score]
     * @param {string|object} [options.weights]
     * @param {boolean} [options.all]
     * @param {boolean} [options.prettyPrint]
     * @param {string|null} cwd Used for determining the correct path when using a file path for the weights.
     * @param {boolean} console Pass true to echo the values instead of returning them.
     */
    constructor(options = {}, cwd = null, console = false) {
        this.options = options || {};
        this.cwd = cwd;
        this.console = console;
    }

    /**
     * Get the current version of SQompLexity.
     * @returns {string}
     */
    static version() {
        return packageJson.version;
    }

    /**
     * @param {string[]|string} queries
     * @returns {void|array}
     */
    async run(queries) {
        queries = Array.isArray(queries) ? queries : [queries];

        if (!queries.length) {
            throw new Error('You need to provide one or more queries.');
        }

        if (this.options.files) {
            queries = await Promise.all(queries.map(async(path) => (await fs.readFile(path)).toString()));
        }

        if (this.options.base64) {
            queries = queries.map((query) => this._decode(query));
        }

        const results = this._analyze(queries, await this._weights());

        if (this.options.score) {
            return this._output(results.map(r => r.complexity || -1));
        }

        if (!this.options.all) {
            results.map((result) => {
                for (const [key] of Object.entries(result)) {
                    if (['stats', 'complexity'].indexOf(key) === -1) {
                        delete result[key];
                    }
                }
                return result;
            });
        }

        return this._output(results);
    }

    /**
     * @param {string[]}queries
     * @param {undefined|object} weights
     * @returns {array}
     */
    _analyze(queries, weights) {
        return queries.map((query) => {
            return (new Program(query, weights)).analyze();
        });
    }

    /**
     * @param {array} results
     * @returns {void|array}
     */
    async _output(results) {
        if (!this.console) {
            return results;
        }
        console.log(JSON.stringify(results, null, this.options.prettyPrint ? 4 : undefined));
    }

    /**
     * Decodes a base64 encoded string.
     * @param {string} str
     * @returns {string}
     */
    _decode(str) {
        return Buffer.from(str, 'base64').toString('utf8');
    }

    /**
     * Get the weights.
     * @returns {Sqomplexity.Weights}
     */
    async _weights() {
        switch (typeof this.options.weights) {
        case 'object':
            return this.options.weights;
        case 'string':
            if (this.options.weights.endsWith('.json')) {
                return JSON.parse(await fs.readFile(this.options.weights, { encoding: 'utf8' }));
            } if (this.options.weights.endsWith('.js')) {
                const { default: weights } = await import(
                    /* webpackIgnore: true */
                    this.options.weights
                );
                return weights;
            }
            throw new Error('Weights should be a .js or .json file.');

        default:
            return weights;
        }
    }
}
