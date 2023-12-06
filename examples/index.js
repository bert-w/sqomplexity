import {Sqomplexity} from 'sqomplexity';

(async () => {
    const queries = [
        'SELECT id FROM users WHERE role = "admin"',
        'SELECT COUNT(*) FROM users WHERE creation_date > "2023-01-01 00:00:00" GROUP BY id',
    ]

    const result = (new Sqomplexity({score: true}, null, false));

    console.log(await result.run(queries));
})();
