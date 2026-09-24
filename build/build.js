'use strict'
require('./check-versions')()

process.env.NODE_ENV = 'production'

const ora = require('ora')
const rm = require('rimraf')
const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const config = require('../config')
const webpackConfig = require('./webpack.prod.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin');

const spinner = ora('building for production...')
spinner.start()

// 整个 dist 都重建：以前只清 dist/bian-mobile/dist，根目录会积下历次构建的
// 旧 chunk（0.js、1.js…），copy-web.sh 又会把它们一起拷进 App 资源包。
rm(config.build.assetsRoot, err => {
  if (err) throw err
  webpack(webpackConfig, function (err, stats) {
    spinner.stop()
    if (err) throw err
    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }) + '\n\n')

    let root = path.resolve(__dirname, '../');
    console.log("----->", [{
      from: root + '/static',
      to: root + '/dist',
    }]);

    if (stats.hasErrors()) {
      console.log(chalk.red('  Build failed with errors.\n'))
      process.exit(1)
    }

    console.log(chalk.cyan('  Build complete.\n'))
    console.log(chalk.yellow(
      '  Tip: built files are meant to be served over an HTTP server.\n' +
      '  Opening index.html over file:// won\'t work.\n'
    ))
  })
})
