import { Sqomplexity } from 'sqomplexity';
import defaultWeights from 'sqomplexity/src/weights.js';

(async() => {
    const queries = [
        'SELECT id FROM users WHERE role = "admin"',
        'SELECT COUNT(*) FROM users WHERE creation_date > "2023-01-01 00:00:00" GROUP BY id'
    ];

    // Optional: assign your own weight scores:
    const weights = defaultWeights;

    // Create a new instance with the given queries:
    const sqomplexity = new Sqomplexity(queries, weights);

    // Calculate just the complexity score for each query:
    console.log(
        await sqomplexity.score()
    );

    // Result: [ 7.876953, 10.001953 ]

    // Calculate the complexity score and extra metadata:
    console.log(
        await sqomplexity.analyze()
    );

    // Result: [{
    //     complexity: 7.876953,
    //     dialect: string,
    //     query: string,
    //     stats: object,
    //     ast: object
    // }, {
    //     complexity: 10.001953,
    //     dialect: string,
    //     query: string,
    //     stats: object,
    //     ast: object
    // }]
})();
