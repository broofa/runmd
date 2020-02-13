module.exports = {
  root: true,
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    mocha: true
  },
  extends: ['eslint:recommended'],
  parser: 'babel-eslint',
  parserOptions: {
    ignorePatterns: ['!**/.eslintrc.js'],
    ecmaVersion: 2019
  },
  plugins: ['import'],
  rules: {
    'array-bracket-spacing': ['warn', 'never'],
    'arrow-body-style': ['warn', 'as-needed'],
    'arrow-parens': ['warn', 'as-needed'],
    'arrow-spacing': 'warn',
    'brace-style': 'warn',
    camelcase: 'warn',
    'comma-spacing': ['warn', {after: true}],
    'comma-dangle': ['warn', 'only-multiline'],
    'dot-notation': 'warn',
    'func-call-spacing': ['warn', 'never'],
    'import/order': ['warn', {
      alphabetize: {order: 'asc'},
      'newlines-between': 'never'}
    ],
    indent: ['warn', 2, {
      SwitchCase: 1,
      FunctionDeclaration: {parameters: 1},
      MemberExpression: 1,
      CallExpression: {arguments: 1}
    }],
    'key-spacing': ['warn', {beforeColon: false, afterColon: true, mode: 'minimum'}],
    'keyword-spacing': 'warn',
    'linebreak-style': ['warn', 'unix'],
    'lines-around-directive': ['warn', {before: 'never', after: 'always'}],
    'max-len': ['off', {code: 120, tabWidth: 2, ignoreTrailingComments: true, ignoreTemplateLiterals: true}],
    'no-console': 'off',
    'no-constant-condition': 'off',
    'no-else-return': 'warn',
    'no-empty': 'off',
    'no-ex-assign': 'off',
    'no-extra-bind': 'warn',
    'no-extra-semi': 'warn',
    'no-floating-decimal': 'warn',
    'no-multi-spaces': ['warn', {ignoreEOLComments: true}],
    'no-multiple-empty-lines': ['warn', {max: 2, maxBOF: 0, maxEOF: 0}],
    'no-redeclare': 'off',
    'no-restricted-globals': ['warn'],
    'no-trailing-spaces': 'warn',
    'no-undef': 'error',
    'no-unused-vars': ['warn', {args: 'none'}],
    'no-useless-return': 'error',
    'no-var': 'warn',
    'no-whitespace-before-property': 'warn',
    'object-curly-spacing': ['warn', 'never'],
    'object-shorthand': 'warn',
    'prefer-const': 'warn',
    quotes: ['warn', 'single', {allowTemplateLiterals: true}],
    'quote-props': ['warn', 'as-needed'],
    'require-await': 'warn',
    semi: ['warn', 'always'],
    'semi-spacing': 'warn',
    'space-before-blocks': ['warn', 'always'],
    'space-before-function-paren': ['warn', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    }],
    'space-infix-ops': ['warn'],
    'space-in-parens': ['warn', 'never'],
    strict: ['warn', 'never']
  }
};
