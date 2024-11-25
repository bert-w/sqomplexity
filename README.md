# SQompLexity
[![Build Status](https://github.com/bert-w/sqomplexity/actions/workflows/tests.yml/badge.svg)](https://github.com/bert-w/sqomplexity/actions)
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
SQompLexity is a metric that assigns a complexity score to SQL queries. It is specifically tailored to work with
MySQL queries, but other dialects of SQL will likely work as well. It needs no knowledge of the database schema and
quantifies each query in a vacuum.

## Installation
```shell
npm i sqomplexity
```

## Demo
https://bert-w.github.io/sqomplexity/

## Usage instructions
### Execution in Node (v16, v18, v20)
```js
import { Sqomplexity } from 'sqomplexity';

(async () => {
    const sqomplexity = new Sqomplexity([
        "SELECT * FROM users",
    ]);
    
    console.log(
        await sqomplexity.score()
    );
    
    // Result: [ 2.40625 ]
})();
```
See [examples/node.js](examples/node.js) for a full example.

### Execution in a browser
Use the precompiled [dist/sqomplexity.umd.js](dist/sqomplexity.umd.js) file:
```html
<script src="sqomplexity.umd.js"></script>
<script>
    (async() => {
        // The UMD build exposes the `$sqomplexity` global constructor.

        console.log(
            await (new window.$sqomplexity('SELECT * FROM users')).score()
        )

        // Result: [ 7.876953 ]
    })();
</script>
```
See [examples/browser.html](examples/browser.html) for a full example.

### Execution as a Stand-alone CLI application
Use the precompiled [dist/sqomplexity.js](dist/sqomplexity.js) containing all required code in a single file.

Options:
```shell
node sqomplexity.js --help

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
See [examples/cli.sh](examples/cli.sh) for various examples.

## Explanation of the complexity metric

The scoring of an SQL query is based on 2 major components, being:

**Data complexity** (see prefix **D** in the table below), also called [_Computational complexity_](https://en.wikipedia.org/wiki/Computational_complexity), which takes into account elements like the _amount of rows_
that a query operates on (relatively speaking), the _computation paths_ a query may take, and the usage of
_table indexes_ (_indices_). All of these determine the computational cost of a certain component.

**Cognitive complexity** (see prefix **C** in the table below), which describes the mental effort and the concepts a
person must understand in order to parse the query. This includes components like understanding of [_First-order logic_](https://en.wikipedia.org/wiki/First-order_logic),
understanding of _grouping_, _filtering_ and _sorting_ (common SQL concepts), and [_Domain knowledge_](https://en.wikipedia.org/wiki/Domain_knowledge)
like the context of the query compared to its database schema.

### Complexity indicators
| Code                 | Explanation                                                                                    |
|----------------------|------------------------------------------------------------------------------------------------|
| *Indexing behavior*  |                                                                                                |
| D1-A                 | No possibility to affect the chosen index                                                      |
| D1-B                 | Low possibility to affect the chosen index                                                     |
| D1-C                 | High possibility to affect the chosen index                                                    |
|                      |                                                                                                |
| *Running time*       |                                                                                                |
| D2-A                 | $O(0)$ (negligible) running time w.r.t. the number of rows                                     |
| D2-B                 | $O(1)$ (constant) running time w.r.t. the number of rows                                       |
| D2-C                 | $O(\log n)$ (logarithmic) running time w.r.t. the number of rows                               |
| D2-D                 | $O(n)$ (linear) running time w.r.t. the number of rows                                         |
| D2-E                 | $O(n \log n)$ (linearithmic) running time w.r.t. the number of rows                            |
| D2-F                 | $O(x)$ (highly variable) running time w.r.t. the number of rows                                |
|                      |                                                                                                |
| *Relational algebra* |                                                                                                |
| C1                   | Requires understanding of *projection* (selection of columns)                                  |
| C2                   | Requires understanding of *selection* (e.g. boolean logic like (in)equalities and comparisons) |
| C3                   | Requires understanding of *composition* (multiple tables, column relations, set theory)        |
| C4                   | Requires understanding of *grouping*                                                           |
| C5                   | Requires understanding of *aggregation*                                                        |
|                      |                                                                                                |
| *Programming*        |                                                                                                |
| C6                   | Requires understanding of *data types* (e.g. integers, decimals, booleans, dates, times)       |
| C7                   | Requires understanding of variable *scopes*                                                    |
| C8                   | Requires understanding of *nesting*                                                            |
|                      |                                                                                                |
| *Usage*              |                                                                                                |
| C9-A                 | One parameter                                                                                  |
| C9-B                 | Low amount of parameters                                                                       |
| C9-C                 | High amount of parameters                                                                      |
| C10                  | Requires understanding of the *database schema*                                                |
| C11                  | Requires understanding of the *RDBMS* toolset (e.g. function support and differences)          |

What follows is the assignment of each of these indicators to components of an SQL query. The table below shows the
result of this process. The combination and presence of these indicators are combined into a final weighting for each
component, namely **Low**, **Medium** or **High**.

### Complexity scoring
| Component                   | Data Complexity | By            | Cognitive Complexity | By                            |
|-----------------------------|-----------------|---------------|----------------------|-------------------------------|
| **Clause:SELECT**           | Low             | D1-A, D2-D    | Low                  | C1, C6, C9-B, C10             |
| **Clause:FROM**             | Medium          | D1-B, D2-D    | Low                  | C3, C7, C9-A, C10             |
| **Clause:JOIN**             | Medium          | D1-C, D2-F    | Medium               | C2, C3, C7, C9-B, C10         |
| **Clause:WHERE**            | High            | D1-C, D2-C/D  | Medium               | C2, C6, C9-B, C10             |
| **Clause:GROUP BY**         | High            | D1-C, D2-D/E  | High                 | C2, C4, C5, C9-B, C10         |
| **Clause:HAVING**           | Medium          | D1-A, D2-D    | High                 | C2, C4, C5, C9-C, C10         |
| **Clause:ORDER BY**         | Low             | D1-C, D2-D/E  | Medium               | C6, C9-B, C10                 |
| **Clause:LIMIT**            | Low             | D1-A, D2-B    | Low                  | C9-A                          |
| **Clause:OFFSET**           | Low             | D1-A, D2-B    | Low                  | C9-A                          |
| **Expression:Table**        | Medium          | D1-B, D2-A    | Medium               | C9-A, C10                     |
| **Expression:Column**       | Medium          | D1-B, D2-A    | Medium               | C6, C9-A, C10                 |
| **Expression:String**       | Low             | D1-A, D2-A    | Low                  | C6, C9-A                      |
| **Expression:Number**       | Low             | D1-A, D2-A    | Low                  | C6, C9-A                      |
| **Expression:Null**         | Low             | D1-A, D2-A    | Low                  | C6, C9-A                      |
| **Expression:Star**         | Low             | D1-A, D2-A    | Low                  | C1, C9-A                      |
| **Expression:Unary**        | Low             | D1-A, D2-A    | Medium               | C2, C6, C9-A                  |
| **Expression:Binary**       | Low             | D1-A, D2-A    | Medium               | C2, C6, C9-B                  |
| **Expression:Function**     | High            | D1-B, D2-D    | Medium               | C6, C9-A, C11                 |
| **Expression:List**         | Low             | D1-C, D2-A    | Low                  | C6, C9-C                      |
| **Expression:Agg-Function** | High            | D1-B, D2-F    | High                 | C4, C5, C9-A, C10, C11        |
| **Operator**                | Low             | D1-C, D2-A    | Medium               | C2, C6, C9-B                  |
| **Emergent:Cycle**          | Medium          | D1-B, D2-F    | High                 | C2, C3, C9-C, C10             |
| **Emergent:Mixed-Style**    | None            | D1-A, D2-A    | Medium               | C9-C                          |
| **Emergent:Subquery**       | High            | D1-C, D2-F    | High                 | C1, C2, C3, C7, C8, C9-C, C10 |
| **Emergent:Variety**        | None            | D1-A, D2-A    | Medium               | C9-C                          |

### Calculation
Each query that passes through SQompLexity is parsed into an Abstract Syntax Tree (AST), which provides the backbone of
the algorithm that sums up the weights. Each query is traversed fully (including subqueries), and the scores are summed
to result in a final SQompLexity score for any given SQL query.

The numerical weights for each of groups are like so:

| **Category**         | **Numerical Score** |
|----------------------|---------------------|
| Data Complexity      | 50%                 |
| Cognitive Complexity | 50%                 |
|                      |                     |
| Low                  | 1.0                 |
| Medium               | 1.25                |
| High                 | 1.5                 |

The equal contribution of both _Data Complexity_ and _Cognitive Complexity_ is arbitrary, and research could still be done
to develop a distribution that more fairly approaches a general sense of _complexity_.

Similarly, the weights of _Low_, _Medium_ and _High_ are set to some sensible defaults. It is necessary though for all
weights to be greater than or equal to 1, since multiplication may take place during the algorithm.

## Project Origin
This is a product of my master's thesis on complexity progression and correlations on Stack Overflow. For this study, I have developed an SQL complexity metric to be used on question and answer data from Stack Overflow.