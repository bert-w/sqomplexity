import { Command, program } from 'commander';
import { Sqomplexity } from './sqomplexity.js';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

const art = `
   _____   ____                            _                  _  _          
  / ____| / __ \\                          | |                (_)| |         
 | (___  | |  | |  ___   _ __ ___   _ __  | |      ___ __  __ _ | |_  _   _ 
  \\___ \\ | |  | | / _ \\ | '_ \` _ \\ | '_ \\ | |     / _ \\\\ \\/ /| || __|| | | |
  ____) || |__| || (_) || | | | | || |_) || |____|  __/ >  < | || |_ | |_| |
 |_____/  \\___\\_\\ \\___/ |_| |_| |_|| .__/ |______|\\___|/_/\\_\\|_| \\__| \\__, |
                                   | |                                 __/ |
     Calculate complexity scores   |_|   for SQL queries              |___/ 
                     
`;

export default function() {
    return (new Command())
        .name('SQompLexity')
        // .description('Determine the SQL complexity score for a single SQL SELECT-query.')
        .description(art + '\nAuthor:\n  BertW')
        .version(typeof VERSION !== 'undefined' ? VERSION : '0')
        .argument('queries...', 'one or multiple SQL queries (space separated or quoted)')
        .option('-f, --files', 'assumes the given arguments/queries are filepaths, and it will read the contents from them. Every file is expected to contain 1 query; if not, their complexity is summed')
        .option('-b, --base64', 'assumes the given arguments/queries are base64 encoded')
        .option('-s, --score', 'output only the complexity score. -1 will be returned if an error occurs')
        .option('-w, --weights <weights>', 'takes a path to a json file that defines a custom set of weights')
        .option('-a, --all', 'returns all data including the AST')
        .option('-p, --pretty-print', 'output JSON with indentation and newlines', false)
        .showHelpAfterError()
        .action(async(queries, options) => {
            if (options.files) {
                queries = await Promise.all(queries.map(async(path) => (await fs.readFile(path)).toString()));
            }

            if (options.base64) {
                queries = queries.map((query) => Buffer.from(query, 'base64').toString('utf8'));
            }

            const fn = options.score ? 'score' : 'analyze';

            const weights = await (async function() {
                if (!options.weights) {
                    return;
                }
                if (options.weights.endsWith('.json')) {
                    return JSON.parse(await fs.readFile(options.weights, { encoding: 'utf8' }));
                }
                if (options.weights.endsWith('.js')) {
                    const { default: weights } = await import(
                        /* webpackIgnore: true */
                        options.weights
                    );
                    return weights;
                }

                throw program.error('Weights should be a .js or .json file.');
            })();

            /** @var {number[]|object[]} results */
            const results = await (new Sqomplexity(queries, weights))[fn]();

            if (!options.all) {
                results.map((result) => {
                    if (typeof result === 'object') {
                        for (const [key] of Object.entries(result)) {
                            if (['stats', 'complexity'].indexOf(key) === -1) {
                                delete result[key];
                            }
                        }
                    }
                    return result;
                });
            }

            process.stdout.write(JSON.stringify(results, null, options.prettyPrint ? 4 : undefined));
        });
}
