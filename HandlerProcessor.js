const TraceGenerator = require('./TraceGenerator.js')
const MessageGenerator = require('./MessageGenerator.js')
const path = require('path')
module.exports = class HandlerProcessor {
  constructor (data, validationElements, entities, serviceName, locale) {
    // this.data = [];
    this.data = data
    this.validationElements = validationElements
    this.errors = []
    this.entities = entities
    this.locale = locale
    this.serviceName = serviceName
    this.traceGenerator = new TraceGenerator(this.data, entities, serviceName)
  }

  async prepareMessageGenerator () {
    this.messageGenerator = new MessageGenerator(this.locale)
    await this.messageGenerator.loadBundle()
  }

  async validateData (rootEntity) {
    await this.prepareMessageGenerator()
    await this.traverseTree(this.data, rootEntity, '', [], {})
    return this.getErrors()
  }

  async traverseTree (CurrentEntity, CurrentEntityName, path, trace) {
    for (const item of CurrentEntity) {
      const keys = this.getKeys(CurrentEntityName)
      var newPath = this.getPath(path, item, keys)

      Object.entries(item).forEach(([key, value]) => {
        if (!Array.isArray(value)) {
          trace[CurrentEntityName + '-' + key] = value
        }
      })

      Object.entries(item).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          const ChildEntityName = this.traceGenerator.findEntityFromAssociation(CurrentEntityName, key)
          this.validateField(CurrentEntityName, key, value, newPath + key, CurrentEntity, trace)
          this.traverseTree(value, ChildEntityName, newPath + key, trace)
        } else {
          this.validateField(CurrentEntityName, key, value, newPath + key, CurrentEntity, trace)
        }
      })
    }
  }

  getKeys (ParentEntityName) {
    const entity = this.entities.find(item => {
      return item.EntityName === ParentEntityName
    })
    return entity.Keys
  }

  getPath (CurrentPath, Node, keys) {
    if (CurrentPath === '') {
      return 'in/'
    }

    let keyString = ''
    let separater = ''
    for (const key of keys) {
      let value = `'${Node[key.key]}'`
      if (key.key === 'IsActiveEntity') {
        value = false
      }
      keyString = keyString + separater + key.key + '=' + value
      separater = ','
    }
    const newPath = CurrentPath + '(' + keyString + ')/'
    return newPath
  }

  addCustomFieldsToTrace (data, trace) {
    Object.entries(data).forEach(([key, value]) => {
      if (!Array.isArray(value)) {
        trace['custom-' + key] = value
      }
    })
    return trace
  }

  validateField (EntityName, Field, value, fieldPath, Node, trace) {
    const validationRule = this.validationElements.find(item => {
      return item.name === Field && item['@validation.handler']
    })

    if (validationRule === undefined) return
    const validationHandlerpath = path.join(path.resolve('./'), validationRule['@validation.handler'])
    const Validator = require(validationHandlerpath);
    const v = new Validator(Field, Node, trace, this.data, validationRule["@validation.message"], fieldPath)
    if (!v.isValid(value)) {
      const error = v.generateError()

      trace = this.addCustomFieldsToTrace(v.getCustomMessageVariables(), trace)
      this.messageGenerator
        .getText(error.message)
        .then((message) => {error.message = message})

      this.errors.push(error)
    }
  }

  getErrors () {
    return this.errors
  }
}
