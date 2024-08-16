const TraceGenerator = require("./TraceGenerator.js");
const MessageGenerator = require("./MessageGenerator.js");
module.exports = class HandlerProcessor {
  constructor(data, validationElements, entities, serviceName, locale) {
    // this.data = [];
    this.data = data;
    this.validationElements = validationElements;
    this.errors = [];
    this.entities = entities;
    this.locale = locale;
    this.serviceName = serviceName;
    this.traceGenerator = new TraceGenerator(this.data, entities, serviceName);
    this.errorPromises = [];
  }

  async prepareMessageGenerator() {
    this.messageGenerator = new MessageGenerator(this.locale);
    await this.messageGenerator.loadBundle();
  }

  async validateData(rootEntity) {
    await this.prepareMessageGenerator();
    await this.traverseTree(this.data, rootEntity, "", [], {});
    return this.getErrors();
  }

  async traverseTree(CurrentEntity, CurrentEntityName, path, trace) {
    for (const item of CurrentEntity) {
      const keys = this.getKeys(CurrentEntityName);
      var newPath = this.getPath(path, item, keys);

      Object.entries(item).forEach(([key, value]) => {
        if (!Array.isArray(value)) {
          trace[CurrentEntityName + "-" + key] = value;
        }
      });

      Object.entries(item).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          const ChildEntityName = this.traceGenerator.findEntityFromAssociation(
            CurrentEntityName,
            key
          );
          this.validateField(
            CurrentEntityName,
            key,
            value,
            newPath + key,
            CurrentEntity,
            trace
          );
          this.traverseTree(value, ChildEntityName, newPath + key, trace);
        } else {
          this.validateField(
            CurrentEntityName,
            key,
            value,
            newPath + key,
            CurrentEntity,
            trace
          );
        }
      });
    }
    if (this.errorPromises.length > 0) {
      await Promise.all(this.errorPromises);
    }
  }

  getKeys(ParentEntityName) {
    const entity = this.entities.find((item) => {
      return item.EntityName === ParentEntityName;
    });
    return entity.Keys;
  }

  getPath(CurrentPath, Node, keys) {
    if (CurrentPath === "") {
      return "in/";
    }

    let keyString = "";
    let separater = "";
    for (const key of keys) {
      let value = `'${Node[key.key]}'`;
      if (key.key === "IsActiveEntity") {
        value = false;
      }
      keyString = keyString + separater + key.key + "=" + value;
      separater = ",";
    }
    const newPath = CurrentPath + "(" + keyString + ")/";
    return newPath;
  }

  addCustomFieldsToTrace(data, trace) {
    Object.entries(data).forEach(([key, value]) => {
      if (!Array.isArray(value)) {
        trace["custom-" + key] = value;
      }
    });
    return trace;
  }

  validateField(EntityName, Field, value, path, Node, trace) {
    const validationRule = this.validationElements.find((item) => {
      return (
        item.FieldName === Field &&
        (item.EntityName === EntityName) & (item.handler !== "") &&
        item.ServiceName === this.serviceName
      );
    });

    if (validationRule === undefined) return;

    if (validationRule.handlerClass === undefined) return;

    const Validator = validationRule.handlerClass;
    const v = new Validator(
      Field,
      Node,
      trace,
      this.data,
      validationRule.Message,
      path
    );
    if (!v.isValid(value)) {
      const error = v.generateError();

      trace = this.addCustomFieldsToTrace(v.getCustomMessageVariables(), trace);
      /*  this.messageGenerator
        .getMessage(error.message, trace, error)
        .then((message) => {});
*/

      this.errorPromises.push(
        this.messageGenerator
          .getMessage(error.message, trace, error)
          .then((message) => {
            //   error.message = message;
            this.errors.push(error);
          })
      );
    }
  }

  getErrors() {
    return this.errors;
  }
};
