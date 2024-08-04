const Mustache = require('mustache')
const { TextBundle } = require('@sap/textbundle')
const path = require('path')
const fs = require("fs")
module.exports = class MessageGenerator {
  constructor (locale) {
    this.locale = locale
  }

  loadBundle () {
    return new Promise(resolve => {
      let i18nPath = path.join(path.resolve('./'), 'i18n', 'i18n')
      if (!fs.existsSync(i18nPath)) {
        i18nPath = path.join(path.resolve('./'), '_i18n', 'i18n')
    }
      this.bundle = new TextBundle(i18nPath, this.locale)
      resolve()
    })
  }
  async getText (message) {
    if (message.indexOf('i18n>') === 0) {
      message = message.replace('i18n>', '')
      const text = this.bundle.getText(message)
      return text
    }
    return message
  }
}
