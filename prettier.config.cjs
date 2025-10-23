/** @type {import("prettier").Config} */
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  bracketSpacing: true,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: ['^@abcp/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true
};
