const getExportsFromFile = require('@royriojas/get-exports-from-file')
const exportsMap = require('./exports-map')
const path = require('path')

module.exports = (absPath) => {
  const ext = path.extname(absPath)
  const pathToNonMinified = absPath.replace('.min.js', '.js')
  if (ext === '.js' || ext === '.jsx') {
    if (pathToNonMinified.indexOf('node_modules') !== -1
        || pathToNonMinified.indexOf('/dist/') !== -1
        || pathToNonMinified.indexOf('/predist/') !== -1
        || pathToNonMinified.indexOf('/cache') !== -1
        || pathToNonMinified.indexOf('/static') !== -1) {
      return false;
    }
    return getExportsFromFile.es6(pathToNonMinified).then(({exported}) => {
      if (exported.length > 0) {
        exportsMap.project.set(absPath, exported)
      }
    }, (err) => {
      console.warn(`Failed to parse ${pathToNonMinified}, error:`, err)
    })
  }
}
