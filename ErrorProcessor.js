const MessageGenerator = require("./MessageGenerator.js");
const TraceGenerator = require("./TraceGenerator.js");

module.exports = class HandlerProcessor {
  constructor(entity, validationElements, entities, serviceName) {
    this.entity = entity;
    this.validationElements = validationElements;
    this.entities = entities;
    this.serviceName = serviceName;
  }

  getErrorDetails(root, target) {
    let result = {
      entityName: "",
      fieldName: "",
    };
    if (target === undefined) return result;
    try {
      if (target.startsWith("in/")) {
        target = target.replace("in/", "");
      }
      target = target.replace("(", "[");
      target = target.replace(")", "]");
      let reg = /\[.+?]/;

      let targetPath = target.replace(reg, "");

      if (targetPath === targetPath.replace("/", "")) {
        result.entityName = root.EntityName;
        result.fieldName = targetPath;
        return result;
      }
      let path = targetPath.split("/");
      result.fieldName = path.pop();

      let searchTarget = path.join("/") + "/";
      let childEntity = this.entities.find(
        (item) =>
          searchTarget === item.target && root.ServiceName === item.ServiceName
      );

      result.entityName = childEntity.EntityName;
    } catch (e) {
      console.log(e);
    }

    return result;
  }
  async generateErrors(data, locale, err) {
    let errorPromises = [];
    let details = [];
    if (err.details !== undefined) {
      details = err.details;
    } else {
      details.push(err);
    }

    const messageGenerator = new MessageGenerator(locale);
    await messageGenerator.loadBundle();

    for (const detail of details) {
      //status code of 444 came from the save handler and don't need more processing
      if (detail.statusCode === 444) {
        detail.statusCode = 400;
        continue;
      } else if (detail.code === 444) {
        detail.code = 400;
        continue;
      }
      let errorDetails = this.getErrorDetails(this.entity, detail.target);
      let validationRule = this.validationElements.find(
        (item) =>
          this.entity.ServiceName === item.ServiceName &&
          errorDetails.entityName === item.EntityName &&
          (errorDetails.fieldName === item.FieldName ||
            errorDetails.fieldName === "in/" + item.FieldName)
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
        errorPromises.push(
          messageGenerator.getMessage(validationRule.Message, trace, detail)
        );
      }
    }

    await Promise.all(errorPromises);
  }
};
