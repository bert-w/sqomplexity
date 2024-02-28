import { Sqomplexity } from 'sqomplexity';

(async() => {
    // Provide one or multiple queries:
    const queries = [
        'SELECT id FROM users WHERE role = "admin"',
        'SELECT COUNT(*) FROM users WHERE creation_date > "2023-01-01 00:00:00" GROUP BY id'
    ];

    // Construct SQompLexity (passing `score` only outputs the complexity score):
    const command = new Sqomplexity({ score: true });

    console.log(await command.run(queries));

    // Result: [ 7.876953, 10.001953 ]
})();
