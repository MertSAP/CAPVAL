module.exports = class TraceGenerator {
  constructor (data, entities, srvName) {
    this.data = data
    this.entities = entities
    this.srvName = srvName
  }

  getNameFromPathVal = function (pathVal) {
    return /^(.+?)\(/.exec(pathVal)?.[1] || ''
  }

  getKeysFrom = function (pathVal) {
    const regRes = /\((.+?)\)/.exec(pathVal)
    regRes ? regRes[1] : ''

    if (regRes === '' || regRes === null) return []
    const keys = String(regRes).split(',')
    const keyItems = []
    for (const key of keys) {
      const pair = key.split('=')
      keyItems.push(pair)
    }
    // somethjong dodfy
    return keyItems
  }

  findEntityFromAssociation (ParentEntityName, Association) {
    const entity = this.entities.find((item) => {
      return item.EntityName === ParentEntityName
    })

    const child = entity.Children.find((item) => {
      return item.AssociationName === Association
    })
    return child.ChildEntityName
  }

  addToTrace (currentNode, trace, EntityName) {
    const EntityNameNoSerice = EntityName.replace(this.srvName + '.', '')
    Object.entries(currentNode).forEach(([key, value]) => {
      if (!Array.isArray(value)) {
        trace[EntityNameNoSerice + '-' + key] = value
      }
    })
    return trace
  }

  performTrace (targetPath, root) {
    return this.getTrace(targetPath, this.data, root)
  }

  getTrace (targetPath, currentNode, EntityName) {
    const targets = targetPath.split('/')
    let trace = {}
    for (const target of targets) {
      if (target === 'in') continue
      let targetName = this.getNameFromPathVal(target)
      const targetKeys = this.getKeysFrom(target)

      if (targetName === '') targetName = target
      Object.entries(currentNode).forEach(([key, value]) => {
        if (key === targetName) {
          trace = this.addToTrace(currentNode, trace, EntityName)
          if (!Array.isArray(value)) {
            return trace
          } else {
            EntityName = this.findEntityFromAssociation(EntityName, key)
            currentNode = currentNode[key].find((item) => {
              for (const targetKey in targetKeys) {
                if (item[targetKey[0]] !== targetKey[1]) {
                  return false
                }
              }

              return true
            })
          }
        }
      })
    }
    return trace
  }
}
