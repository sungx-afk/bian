// Shared copy rules ensure the standalone pages use the same five catalogs as Vue.
const path = require('path')
module.exports = [
  { from: path.resolve(__dirname, '../src/i18n/locale.js'), to: 'bian-mobile/i18n/locale.js' },
  { from: path.resolve(__dirname, '../src/i18n/standalone.js'), to: 'bian-mobile/i18n/standalone.js' },
  { from: path.resolve(__dirname, '../src/i18n/locales'), to: 'bian-mobile/i18n/locales' },
  { from: path.resolve(__dirname, '../src/modules/images/index_header.jpg'), to: 'bian-mobile/i18n/brand.jpg' }
]
