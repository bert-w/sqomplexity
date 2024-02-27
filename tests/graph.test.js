import path from 'path';
import { fileURLToPath } from 'url';
import { expect } from '@jest/globals';
import { Graph } from '../src/graph.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.chdir(__dirname);

describe('src/hooks/graph.js', function() {
    it('should add vertices and edges and print output', function() {
        const graph = new Graph();
        graph.addVertex('a');
        graph.addVertex('b');
        graph.addEdge('a', 'b');
        graph.addEdge('b', 'a');

        expect(graph.toString()).toBe(`a -> b,
b -> a,`);
    });
});
