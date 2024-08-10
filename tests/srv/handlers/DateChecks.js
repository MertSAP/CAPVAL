const BaseValidation = require("capval");
module.exports = class BeginDateChecks extends BaseValidation {
  isValid(InputValue) {
    let entity = this.getNode();
    let today = new Date().toISOString().slice(0, 10);
    if (entity.previewDate < today) {
      //this.seti18nMessage("dateToday-errorMessage");
      return false;
    }

    return true;
  }
};
