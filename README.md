# SQompLexity
[![NPM Version](http://img.shields.io/npm/v/sqomplexity.svg?style=flat)](https://www.npmjs.org/package/sqomplexity)
[![NPM Downloads](https://img.shields.io/npm/dm/sqomplexity.svg?style=flat)](https://npmcharts.com/compare/sqomplexity?minimal=true)
[![Install Size](https://packagephobia.now.sh/badge?p=sqomplexity)](https://packagephobia.now.sh/result?p=sqomplexity)
```txt
   _____   ____                            _                  _  _          
  / ____| / __ \                          | |                (_)| |         
 | (___  | |  | |  ___   _ __ ___   _ __  | |      ___ __  __ _ | |_  _   _ 
  \___ \ | |  | | / _ \ | '_ ` _ \ | '_ \ | |     / _ \\ \/ /| || __|| | | |
  ____) || |__| || (_) || | | | | || |_) || |____|  __/ >  < | || |_ | |_| |
 |_____/  \___\_\ \___/ |_| |_| |_|| .__/ |______|\___|/_/\_\|_| \__| \__, |
                                   | |                                 __/ |
     Calculate complexity scores   |_|   for SQL queries              |___/ 
     
```

This is a product of my thesis on complexity progression and correlations on Stack Overflow.

SQompLexity is a Node.js program that assigns a complexity score to SELECT queries, based on a data and cognitive complexity score.
It is specifically made to work with MySQL queries, but other dialects of SQL will likely work as well.
## Execution from JavaScript
```js
import {Sqomplexity} from 'sqomplexity';

(async () => {
    // Provide one or multiple queries:
    const queries = [
        'SELECT id FROM users WHERE role = "admin"',
        'SELECT COUNT(*) FROM users WHERE creation_date > "2023-01-01 00:00:00" GROUP BY id',
    ];

    // Construct SQompLexity (passing `score` only outputs the complexity score):
    const command = (new Sqomplexity({score: true}, null, false));

    console.log(await command.run(queries));

    // Result: [ 7.876953, 10.001953 ]
})();
```

## Execution from CLI
Use the precompiled file in the `dist` directory:
```shell
node dist/sqomplexity.js --help

Arguments:
  queries                  one or multiple SQL queries (space separated or quoted)

Options:
  -V, --version            output the version number
  -f, --files              assumes the given arguments/queries are filepaths, and it will read the contents from them.
                           Every file is expected to contain 1 query; if not, their complexity is summed
  -b, --base64             assumes the given arguments/queries are base64 encoded
  -s, --score              output only the complexity score. -1 will be returned if an error occurs
  -w, --weights <weights>  takes a path to a json file that defines a custom set of weights
  -a, --all                returns all data including the AST
  -p, --pretty-print       output JSON with indentation and newlines (default: false)
  -h, --help               display help for command
```

```shell
node dist/sqomplexity.js "SELECT * FROM users"
```

```shell
node dist/sqomplexity.js -f "/some/path/to/file.sql"
```