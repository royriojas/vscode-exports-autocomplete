// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode, {
  // TextDocument,
  Position,
  // CancellationToken,
  CompletionItem,
  workspace,
  TextEdit } from 'vscode'
import getExportsFromFile from 'get-exports-from-file'
import walk from 'walk'
import path from 'path'
const exportsInProject = new Map()

class ExportersCompletionItemProvider {
  provideCompletionItems (document, position, token) {
    const editorText = document.getText()
    const completions = []
    const thisDocumentFileName = document.fileName
    exportsInProject.forEach((fileExports, fileName) => {
      if (thisDocumentFileName !== fileName) {
        fileExports.forEach((ex) => {
          if (editorText.indexOf(ex.name) !== -1) {
            return
          }
          const ci = new CompletionItem(ex.name)
          let relPath = path.relative(path.dirname(thisDocumentFileName), fileName)
          const lastDot = relPath.lastIndexOf('.')
          relPath = relPath.substr(0, lastDot)
          if (relPath.indexOf('.') === -1) {
            relPath = './' + relPath
          }
          ci.additionalTextEdits = [TextEdit.insert(new Position(0, 0), `import ${ex.name} from '${relPath}'\n`)]
          completions.push(ci)
        })
      }
    })

    return completions
  }
}

const walker = walk.walk(workspace.rootPath, {
  followLinks: false,
  filters: ['node_modules']
})
walker.on('file', (root, fileStats, next) => {
  const {name} = fileStats
  if (name.endsWith('.js') || name.endsWith('.jsx')) {
    const filePath = path.join(root, name)

    getExportsFromFile(filePath).then((exp) => {
      if (exp.length > 0) {
        exportsInProject.set(filePath, exp)
      }
      next()
    })
  } else {
    next()
  }
})

const jsWatcher = workspace.createFileSystemWatcher('**/*.js')
const jsxWatcher = workspace.createFileSystemWatcher('**/*.jsx')

const checkForNewExports = (file) => {
  getExportsFromFile(file.path).then((exp) => {
    if (exp.length > 0) {
      exportsInProject.set(file.path, exp)
    }
  })
}

function reactToWatcher (watcher) {
  watcher.onDidChange(checkForNewExports)
  watcher.onDidCreate(checkForNewExports)
  watcher.onDidDelete((file) => {
    exportsInProject.delete(file.path)
  })
}
reactToWatcher(jsWatcher)
reactToWatcher(jsxWatcher)

export function activate (context) {
  const dispAutocomplete = vscode.languages.registerCompletionItemProvider(['javascript', 'javascriptreact'], new ExportersCompletionItemProvider())

  context.subscriptions.push(dispAutocomplete)
}
exports.activate = activate

export function deactivate () {
  jsWatcher.dispose()
  jsxWatcher.dispose()
}
