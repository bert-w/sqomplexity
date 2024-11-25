const webpack = require('webpack');

const nodeConfig = {
    entry: './app.js',
    mode: 'production',
    target: 'node',
    output: {
        filename: 'sqomplexity.js'
    },
    plugins: [
        new webpack.DefinePlugin({
            VERSION: JSON.stringify(process.env.npm_package_version)
        })
    ]
};

const webConfig = {
    entry: './src/sqomplexity.js',
    mode: 'production',
    target: 'web',
    output: {
        filename: 'sqomplexity.umd.js',
        globalObject: 'this',
        library: {
            name: '$sqomplexity',
            type: 'umd',
            export: 'Sqomplexity'
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            VERSION: JSON.stringify(process.env.npm_package_version)
        })
    ]
};

module.exports = [nodeConfig, webConfig];
