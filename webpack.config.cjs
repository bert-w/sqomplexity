const cliConfig = {
    entry: './app.js',
    mode: 'production',
    target: 'node',
    output: {
        filename: 'sqomplexity.js',
    },
};

const appConfig = {
    entry: './src/sqomplexity.js',
    mode: 'production',
    target: 'web',
    output: {
        filename: 'sqomplexity-browser.js',
        library: {
            name: '$sqomplexity',
            type: 'umd',
            export: 'Sqomplexity',
        },
    },
    externals: {
        'node:fs/promises': 'document',
    }
};

module.exports = [cliConfig, appConfig];
