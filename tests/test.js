import fs from 'fs';
import path from 'path';
import { Sqomplexity } from './../src/sqomplexity.js';
import { fileURLToPath } from 'url';
import {expect} from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PATH_TESTS = 'data';

process.chdir(__dirname);

const files = fs.readdirSync(PATH_TESTS).filter(f => f.endsWith('.sql'));
describe('SQL tests', function() {
    for (const file of files) {
        it(`"${file}" should return a valid complexity score`, async function() {
            const result = await (new Sqomplexity({
                all: true,
                files: true
            }, null, false)).run([path.join(PATH_TESTS, file)]);

            expect(result[0].complexity).not.toBe(-1);

            await fs.promises.writeFile(
                path.join(PATH_TESTS, file.substring(0, file.length - 4) + '.json'),
                JSON.stringify(result, null, 4)
            );
        });
    }
});
