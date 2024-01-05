const path = require('path')

module.exports = class ServiceParser {
  constructor (Services) {
    this.validationElements = []
    this.entities = []

    this.parseInput(Services)
  }

  getEntities () {
    return this.entities
  }

  getvalidationElements () {
    return this.validationElements
  }

  parseInput (Services) {
    const compositions = []
    for (const srv of Services) {
      // go through all entities
      if (srv instanceof cds.ApplicationService) {
        for (const entityKey in srv.entities) {
          const entity = srv.entities[entityKey]

          const entityRow = {
            EntityName: entityKey,
            isRoot: true,
            Children: [],
            Keys: [],
            ServiceName: srv.name,
            HasValidations: false,
            AncestorsHaveValidations: false,
            HasHandlers: false,
            AncestorsHaveHandlers: false
          }

          for (const key in entity.elements) {
            const element = entity.elements[key]

            if (element.type === 'cds.Composition') {
              if (
                key.search('DraftAdministrativeData', 0) > 0 ||
                key.search('SiblingEntity', 0) > 0
              ) {
                continue
              }

              const compositionRow = {
                ChildEntityName: element.target.replace(srv.name + '.', ''),
                ParentEntityName: entityKey,
                AssociationName: key
              }

              compositions.push(compositionRow)
            }

            if (element['@validation.message']) {
              entityRow.HasValidations = true
              let handler = ''
              if (element['@validation.handler'] !== undefined) {
                handler = path.join(
                  path.resolve('./'),
                  element['@validation.handler']
                )
                entityRow.HasHandlers = true
              }
              this.addValidationElement(
                srv.name,
                entityKey,
                key,
                element['@validation.message'],
                'Field',
                handler
              )
            }

            if (element.key) {
              entityRow.Keys.push({ key })
            }
          }
          
          this.entities.push(entityRow)
        }
      }

      for (const entity of this.entities) {
        for (const composition of compositions) {
          if (composition.ParentEntityName === entity.EntityName) {
            delete composition.ParentEntity
            entity.Children.push(composition)
          }
        }
      }
      this.getRoots(compositions)
      this.checkAncestorsHaveValidations()
      this.checkAncestorsHaveHandlers()
    }
  }

  checkAncestorsHaveValidations () {
    for (const entity of this.entities) {
      if (entity.isRoot) {
        entity.AncestorsHaveHandlers = this.traverseValidationTree(entity)
      }
    }
  }

  checkAncestorsHaveHandlers () {
    for (const entity of this.entities) {
      if (entity.isRoot) {
        entity.AncestorsHaveHandlers = this.traverseHandlerTree(entity)
      }
    }
  }

  traverseHandlerTree (entity) {
    if (entity.HasHandlers) {
      return true
    }

    let childrenHasHandlers = false
    for (const child of entity.Children) {
      const childEntity = this.entities.find(item => {
        return item.EntityName === child.ChildEntityName
      })
      childrenHasHandlers = this.traverseHandlerTree(childEntity)
      if (childrenHasHandlers) return true
    }

    return false
  }

  traverseValidationTree (entity) {
    if (entity.HasValidations) {
      return true
    }

    let childrenHasValidations = false
    for (const child of entity.Children) {
      const childEntity = this.entities.find(item => {
        return item.EntityName === child.ChildEntityName
      })
      childrenHasValidations = this.traverseValidationTree(childEntity)
      if (childrenHasValidations) return true
    }

    return false
  }

  getRoots (compositions) {
    for (const entity of this.entities) {
      for (const composition of compositions) {
        if (composition.ChildEntityName === entity.EntityName) {
          entity.isRoot = false
        }
      }
    }
  }

  checkAnsest

  addValidationElement (Service, Entity, Field, Message, Level, Handler, AssertUniqueRegex) {
    const element = {
      ServiceName: Service,
      EntityName: Entity,
      FieldName: Field,
      Message,
      Level,
      Handler,
      AssertUniqueRegex
    }
    this.validationElements.push(element)
  }
}
