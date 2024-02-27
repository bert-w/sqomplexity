import path from 'path';
import { fileURLToPath } from 'url';
import { expect } from '@jest/globals';
import { Calculator } from '../src/calculator.js';
import { BinaryExpressionCycleDetection } from '../src/hooks/binary-expression-cycle-detection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.chdir(__dirname);

describe('src/calculator.js', function() {
    it('should add hooks and get nesting level', function() {
        const calculator = (new Calculator([]));

        calculator
            .setHooks([])
            .addHook('expression', new BinaryExpressionCycleDetection());

        expect(calculator.getNestingLevel()).toBe(0);
    });
});
