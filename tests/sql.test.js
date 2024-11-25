import fs from 'fs';
import path from 'path';
import { Sqomplexity } from './../src/sqomplexity.js';
import { fileURLToPath } from 'url';
import { expect } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PATH_TESTS = 'data/sql';

process.chdir(__dirname);

const files = fs.readdirSync(PATH_TESTS).filter(f => f.endsWith('.sql'));
describe('SQL tests', function() {
    for (const file of files) {
        it(`"${file}" should return a valid complexity score`, async function() {
            const query = fs.readFileSync(path.join(PATH_TESTS, file)).toString('utf-8');
            const result = await (new Sqomplexity(query)).analyze();

            expect(result[0].complexity).toBeGreaterThan(0);

            await fs.promises.writeFile(
                path.join(PATH_TESTS, file.substring(0, file.length - 4) + '.json'),
                JSON.stringify(result, null, 4)
            );
        });
    }
});
