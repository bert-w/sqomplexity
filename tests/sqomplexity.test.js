import path from 'path';
import { Sqomplexity } from './../src/sqomplexity.js';
import { fileURLToPath } from 'url';
import { expect } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.chdir(__dirname);

describe('src/sqomplexity.js', function() {
    it('accepts a single query', async function() {
        const result = await (new Sqomplexity([
            'SELECT * FROM users'
        ])).analyze();

        expect(result[0].complexity).toBeGreaterThan(0);
        expect(result[1]).toBeUndefined();
    });

    it('accepts multiple queries', async function() {
        const result = await (new Sqomplexity([
            'SELECT * FROM users',
            'SELECT id FROM posts'
        ])).analyze();

        expect(result[0].complexity).toBeGreaterThan(0);
        expect(result[1].complexity).toBeGreaterThan(0);
    });

    it('outputs score only', async function() {
        const sqomplexity = new Sqomplexity(['SELECT * FROM users']);

        const results = await sqomplexity.score();

        expect(results[0]).toBeGreaterThan(0);
    });

    it('accepts custom weights', async function() {
        const sqomplexity = new Sqomplexity(['SELECT * FROM users'], {
            clauses: {
                select: 1,
                from: 1,
                join: 1,
                where: 1,
                group_by: 1,
                having: 1,
                order_by: 1,
                limit: 1,
                offset: 1
            },
            expressions: {
                _base: 1,
                table: 1,
                column: 1,
                string: 1,
                number: 1,
                star: 1,
                unary: 1,
                binary: 1,
                function: 1,
                list: 1,
                aggregation_function: 1,
                null: 1
            },
            operator: 1,
            emergent: {
                cycle: 1,
                mixed_style: 1,
                subquery: 1,
                variety: 1
            }
        });

        const results = await sqomplexity.score();

        expect(results[0]).toBeGreaterThan(0);
    });
});
