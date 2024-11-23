import path from 'path';
import { fileURLToPath } from 'url';
import { expect, jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.chdir(__dirname);

describe('src/sqomplexity.js', function() {
    let spy, program;

    beforeEach(async() => {
        program = (await import('./../src/cli.js')).default();
        program.configureOutput({
            writeOut: (str) => null,
            writeErr: (str) => null
        });
        spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('throws on passing no queries', async function() {
        expect(() => {
            program.exitOverride().parse([], { from: 'user' });
        }).toThrow('missing required argument \'queries\'');
    });

    it('accepts a single query', async function() {
        await program.parseAsync(['select * from users', '-s'], { from: 'user' });
        expect(spy).toHaveBeenCalledWith('[2.40625]');
    });

    it('accepts multiple queries', async function() {
        await program.parseAsync(['SELECT * FROM users', 'SELECT id FROM posts', '-s'], { from: 'user' });
        expect(spy).toHaveBeenCalledWith('[2.40625,2.65625]');
    });

    it('accepts base64-encoded queries', async function() {
        await program.parseAsync(['U0VMRUNUICogRlJPTSB1c2Vycw==', '-s', '-b'], { from: 'user' });

        expect(spy).toHaveBeenCalledWith('[2.40625]');
    });

    it('accepts queries in files', async function() {
        await program.parseAsync(['./../tests/data/sql/easy.sql', '-s', '-f'], { from: 'user' });
        expect(spy).toHaveBeenCalledWith('[2.40625]');
    });

    it('outputs score only', async function() {
        await program.parseAsync(['select * from users', '-s'], { from: 'user' });

        expect(spy).toHaveBeenCalledWith('[2.40625]');
    });

    it('accepts custom weights', async function() {
        await program.parseAsync(['select * from users', '-s', '--weights=./../tests/data/weights.js'], { from: 'user' });
        expect(spy).toHaveBeenCalledWith('[5000000]');
    });

    it('accepts custom weights json', async function() {
        await program.parseAsync(['select * from users', '-s', '--weights=./../tests/data/weights.json'], { from: 'user' });
        expect(spy).toHaveBeenCalledWith('[2000000]');
    });

    it('outputs all data', async function() {
        await program.parseAsync(['select * from users', '-a'], { from: 'user' });
        const output = JSON.parse(spy.mock.calls[0][0]);

        expect(Object.keys(output[0])).toEqual(
            expect.arrayContaining(['complexity', 'dialect', 'query', 'stats', 'ast'])
        );
    });

    it('outputs limited data', async function() {
        await program.parseAsync(['select * from users'], { from: 'user' });
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
