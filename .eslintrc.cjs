const javascriptSettings = {
    files: ['*.js', '*.mjs'],
    extends: [
        'standard',
        'plugin:jest/recommended'
    ],
    rules: {
        'no-else-return': ['error', { allowElseIf: false }],
        'space-before-function-paren': ['error', 'never'],
        // manual 'semistandard' settings
        semi: ['error', 'always'],
        'no-extra-semi': 'error',
        'indent': ['error', 4],
    }
};

module.exports = {
    plugins: ['jest'],
    parserOptions: {
        ecmaVersion: 8
    },
    overrides: [
        javascriptSettings,
        {
            files: ['*.mjs'],
            parserOptions: {
                sourceType: 'module'
            }
        },
    ]
};