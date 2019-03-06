const babylon = require('@babel/parser')

module.exports = (text) => {
  return babylon.parse(text, {
    sourceType: 'module',
    plugins: ['*', 'decorators-legacy', 'optionalChaining', 'estree', 'jsx', 'typescript', 'classProperties', 'objectRestSpread']
  })
}
