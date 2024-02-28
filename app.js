import { program } from 'commander';
import { Sqomplexity } from './src/sqomplexity.js';
import path from 'path';
import { fileURLToPath } from 'url';

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
program
    .name('SQompLexity')
    // .description('Determine the SQL complexity score for a single SQL SELECT-query.')
    .description(art + '\nAuthor:\n  BertW')
    .version('0.1.0')
    .argument('[queries...]', 'one or multiple SQL queries (space separated or quoted)')
    .option('-f, --files', 'assumes the given arguments/queries are filepaths, and it will read the contents from them. Every file is expected to contain 1 query; if not, their complexity is summed')
    .option('-b, --base64', 'assumes the given arguments/queries are base64 encoded')
    .option('-s, --score', 'output only the complexity score. -1 will be returned if an error occurs')
    .option('-w, --weights <weights>', 'takes a path to a json file that defines a custom set of weights')
    .option('-a, --all', 'returns all data including the AST')
    .option('-p, --pretty-print', 'output JSON with indentation and newlines', false)
    .action(async(queries, options) => {
        try {
            await (new Sqomplexity(options, process.cwd(), true)).run(queries);
        } catch (e) {
            program.addHelpText('after', '\n' + e.stack);
            program.help();
            process.exitCode = 1;
        }
    });

program.parse();
