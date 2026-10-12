// Exercise named imports through the project's real webpack/Babel rule, not Node's loader.
module.exports = function () {
  const assert = require('assert')
  const fs = require('fs')
  const os = require('os')
  const Module = require('module')
  const path = require('path')
  const webpack = require('webpack')
  const base = require('../build/webpack.base.conf')
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'bian-i18n-webpack-'))
  const entry = path.join(temporary, 'entry.js')
  const core = path.resolve(__dirname, '../src/i18n/locale.js')
  fs.writeFileSync(entry, 'import { detectLocale, normalizeLocale } from ' + JSON.stringify(core) + ';\nexport const selected = detectLocale(null, ["ko-KR"]);\nexport const traditional = normalizeLocale("zh-Hant-HK");\n')
  return new Promise((resolve, reject) => {
    webpack({
      context: path.resolve(__dirname, '..'),
      entry,
      output: { path: temporary, filename: 'bundle.js', libraryTarget: 'commonjs2' },
      module: { rules: base.module.rules.filter(rule => rule.loader === 'babel-loader') }
    }, (error, stats) => {
      try {
        if (error) throw error
        assert(!stats.hasErrors(), stats.toString({ all: false, errors: true }))
        assert(!stats.hasWarnings(), stats.toString({ all: false, warnings: true }))
        const compiled = new Module(path.join(temporary, 'bundle.js'), module)
        compiled.filename = path.join(temporary, 'bundle.js')
        compiled.paths = Module._nodeModulePaths(path.resolve(__dirname, '..'))
        compiled._compile(fs.readFileSync(compiled.filename, 'utf8'), compiled.filename)
        const actual = compiled.exports
        assert.strictEqual(actual.selected, 'ko', 'Bundled named export failed')
        assert.strictEqual(actual.traditional, 'zh-TW', 'Bundled locale normalization failed')
        resolve()
      } catch (failure) { reject(failure) }
      finally { fs.rmSync(temporary, { recursive: true, force: true }) }
    })
  })
}
