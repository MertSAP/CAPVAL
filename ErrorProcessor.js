const MessageGenerator = require("./MessageGenerator.js");
const TraceGenerator = require("./TraceGenerator.js");

module.exports = class HandlerProcessor {
  constructor(entity, validationElements, entities, serviceName) {
    this.entity = entity;
    this.validationElements = validationElements;
    this.entities = entities;
    this.serviceName = serviceName;
  }
  async generateErrors(data, locale, err) {
    let details = [];
    if (err.details !== undefined) {
      details = err.details;
    } else {
      details.push(err);
    }

    const messageGenerator = new MessageGenerator(locale);
    await messageGenerator.loadBundle();

    for (const detail of details) {
      let validationRule = this.validationElements.find(
        (item) =>
          this.entity.ServiceName === item.ServiceName &&
          this.entity.EntityName === item.EntityName &&
          (detail.target === item.FieldName ||
            detail.target === "in/" + item.FieldName)
      );

      if (validationRule !== undefined) {
        const dataTracer = new TraceGenerator(
          data,
          this.entities,
          this.serviceName
        );
        try {
          var trace = dataTracer.performTrace(
            detail.target,
            this.entity.EntityName
          );
        } catch (E) {}

        await messageGenerator.getMessage(
          validationRule.Message,
          trace,
          detail
        );
      }
    }
  }
};
