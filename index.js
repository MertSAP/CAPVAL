module.exports = class ValidationBase {
  constructor (Field, Node, DataToRoot, Data, Message, Target) {
    this.Field = Field
    this.Node = Node
    this.DataToRoot = DataToRoot
    this.Data = Data
    this.setMessage(Message)
    this.setTarget(Target)
    this.customMessageVariables = {}
  }

  isValid (InputValue) {

  }

  setCustomMessageVariables (data) {
    this.customMessageVariables = data
  }

  getCustomMessageVariables () {
    return this.customMessageVariables
  }

  getNode () {
    return this.Node[0]
  }

  getField () {
    return this.Field
  }

  setMessage (Message) {
    this.Message = Message
  }

  seti18nMessage (Message) {
    this.Message = 'i18n>' + Message
  }

  getMessage () {
    return this.Message
  }

  setTarget (Target) {
    this.Target = Target
  }

  getTarget () {
    return this.Target
  }

  getDataToRoot () {
    return this.DataToRoot
  }

  getData () {
    return this.Data
  }

  generateError () {
    return {
      target: this.getTarget(),
      message: this.getMessage()
    }
  }
}
