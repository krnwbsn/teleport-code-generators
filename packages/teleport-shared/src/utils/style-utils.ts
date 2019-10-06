import {
  UIDLStyleDefinitions,
  UIDLStyleDefinition,
  UIDLStyleValue,
  UIDLStyleRules,
} from '@teleporthq/teleport-types'

const getContentOfStyleKey = (styleValue: UIDLStyleValue) => {
  switch (styleValue.type) {
    case 'static':
      return styleValue.content
    case 'nested-style':
      return getContentOfStyleObject(styleValue.content)
    default:
      throw new Error(
        `getContentOfStyleKey received unsupported ${JSON.stringify(
          styleValue,
          null,
          2
        )} UIDLNodeStyleValue value`
      )
  }
}

export const getContentOfStyleObject = (styleObject: UIDLStyleDefinitions) => {
  return Object.keys(styleObject).reduce((acc: Record<string, unknown>, key) => {
    acc[key] = getContentOfStyleKey(styleObject[key])
    return acc
  }, {})
}

export const convertRulesToStyleObject = (styleRules: UIDLStyleRules) => {
  return Object.keys(styleRules).reduce((result: Record<string, unknown>, key) => {
    result[key] = styleRules[key].content
    return result
  }, {})
}

export const convertStyleDefinitionsToStyleObject = (styleDefinitions: UIDLStyleDefinition[]) => {
  return styleDefinitions.reduce((result: Record<string, unknown>, styleDef) => {
    const styleObj = convertRulesToStyleObject(styleDef.rules)
    if (!styleDef.mediaQuery) {
      result = { ...result, ...styleObj }
      if (styleDef.modifiers) {
        Object.keys(styleDef.modifiers).forEach((modifier) => {
          const rules = styleDef.modifiers[modifier]
          const subStyleObj = convertRulesToStyleObject(rules)
          const key = `&:${modifier}`
          result[key] = subStyleObj
        })
      }
    } else {
      result[styleDef.mediaQuery] = styleObj
      if (styleDef.modifiers) {
        Object.keys(styleDef.modifiers).forEach((modifier) => {
          const rules = styleDef.modifiers[modifier]
          const subStyleObj = convertRulesToStyleObject(rules)
          const key = `&:${modifier}`
          result[styleDef.mediaQuery] = {
            ...result[styleDef.mediaQuery],
            [key]: subStyleObj,
          }
        })
      }
    }
    return result
  }, {})
}
