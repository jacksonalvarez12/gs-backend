module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'google',
        'plugin:@typescript-eslint/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: ['tsconfig.json', 'tsconfig.dev.json'],
        sourceType: 'module',
    },
    ignorePatterns: [
        '/bin/**/*', // Ignore built files.
        '/generated/**/*', // Ignore generated files.
        '.eslintrc.js',
    ],
    plugins: ['@typescript-eslint', 'import'],
    rules: {
        'import/no-unresolved': 0,
        indent: ['error', 4],
        '@typescript-eslint/no-inferrable-types': 0,
        'max-len': 0,
        'require-jsdoc': 0,
        '@typescript-eslint/no-explicit-any': ['error'],
        'arrow-parens': ['error', 'as-needed'],
    },
};
