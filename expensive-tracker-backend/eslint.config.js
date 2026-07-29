const js = require('@eslint/js');

/**
 * Flat config — required from ESLint 9 onwards, which the dependency audit
 * upgrade brought in. Replaces the previous .eslintrc.json with the same rules.
 */
module.exports = [
  {
    ignores: ['node_modules/**', 'coverage/**', 'logs/**', 'public/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        // Node
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        exports: 'writable',
        URL: 'readonly',
        URLSearchParams: 'readonly'
      }
    },
    rules: {
      // ignoreRestSiblings covers the omit-a-field-by-destructuring idiom
      // (`const { user: _user, ...rest } = input`), which is how services strip
      // caller-controlled fields before a write.
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_|^next$',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      'no-console': 'warn',
      eqeqeq: ['warn', 'smart'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-return-await': 'warn'
    }
  },
  {
    // The startup banner is deliberate chalk output; seeds and tests report progress.
    files: ['src/server.js', 'scripts/**', 'dummy-data/**', 'tests/**'],
    rules: { 'no-console': 'off' }
  },
  {
    files: ['tests/**'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly'
      }
    }
  }
];
