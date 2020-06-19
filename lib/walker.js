const klaw = require('klaw')
const path = require('path')

const processFile = require('./process-file')
const { workspace } = require('vscode')
const exportsMap = require('./exports-map')

const filterFunc = (absPath) => {
  const basename = path.basename(absPath)
  // TODO: read this from a configuration file
  if (absPath.indexOf('node_modules') !== -1 ||
      absPath.indexOf('/dist/') !== -1 ||
      absPath.indexOf('/predist/') !== -1 ||
      absPath.indexOf('/cache') !== -1 ||
      absPath.indexOf('/static') !== -1) {
    return false
  }

  return basename === '.' || basename[0] !== '.'
}

module.exports = () => {
  if (!workspace.rootPath) {
    return Promise.resolve(exportsMap)
  }
  return new Promise((resolve, reject) => {
    const parsingPromises = []
    klaw(workspace.rootPath, { filter: filterFunc })
      .on('data', (item) => {
        const absPath = item.path
        const promise = processFile(absPath)
        if (promise) {
          parsingPromises.push(promise)
        }
      })
      .on('end', () => {
        Promise.all(parsingPromises).then(() => {
          console.log(`found ${exportsMap.project.size} files with exports`)
          resolve()
          return exportsMap
        })
      })
  })
}
