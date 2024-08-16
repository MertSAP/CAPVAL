const BaseValidation = require("capval");
module.exports = class BeginDateChecks extends BaseValidation {
  isValid(InputValue) {
    let entity = this.getNode();
    let stock = entity["stock"];
    //Can't cancel a Book if it has stock
    if (InputValue === "C" && stock > 0) {
      this.seti18nMessage("statusCheck-Cancelled");
      return false;
    }

    if (InputValue === "R" && entity["releaseDate"] !== today) {
      var today = new Date().toISOString().slice(0, 10);
      this.setCustomMessageVariables({ today: today });
      this.seti18nMessage("statusCheck-Released");
      return false;
    }

    return true;
  }
};
