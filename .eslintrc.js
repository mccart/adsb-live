module.exports = {
  extends: ["prettier", "prettier/standard"],
  plugins: ["prettier"],
  parserOptions: {
    ecmaVersion: 8,
    sourceType: "module"
  },
  env: {
    es6: true,
    node: true
  },
  rules: {
    "prettier/prettier": "error"
  }
};
