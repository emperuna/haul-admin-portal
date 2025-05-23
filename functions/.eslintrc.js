module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "no-unused-vars": ["warn"],
    "no-trailing-spaces": ["warn"]
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
};
