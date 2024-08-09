const Mustache = require("mustache");
const { TextBundle } = require("@sap/textbundle");
const path = require("path");
const fs = require("fs");
module.exports = class MessageGenerator {
  constructor(locale) {
    this.locale = locale;
  }

  loadBundle() {
    return new Promise((resolve) => {
      let i18nPath = path.join(path.resolve("./"), "i18n", "i18n");
      if (!fs.existsSync(i18nPath)) {
        i18nPath = path.join(path.resolve("./"), "_i18n", "i18n");
      }
      this.bundle = new TextBundle(i18nPath, this.locale);
      resolve();
    });
  }

  getMessage(message, data, detail) {
    return new Promise((resolve) => {
      this.fetchMessageTextFromi18n(message, this.locale).then((message) => {
        this.message = message;
        let result = this.message;
        if (data !== undefined) {
          result = Mustache.render(this.message, data);
        }

        detail.message = result;
        resolve(result);
      });
    });
  }

  fetchMessageTextFromi18n(message) {
    return this.getText(message, this.bundle);
  }

  async getText(message, bundle) {
    if (message.indexOf("i18n>") === 0) {
      message = message.replace("i18n>", "");
      const text = await bundle.getText(message);
      return text;
    }
    return message;
  }
};
