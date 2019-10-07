import {
  StringUtils,
  UIDLUtils,
  StyleUtils,
  StyleBuilders,
  HASTUtils,
  ASTUtils,
  ParsedASTNode,
} from '@teleporthq/teleport-shared'

import {
  ComponentPluginFactory,
  ComponentPlugin,
  UIDLDynamicReference,
  UIDLStyleDefinitions,
  ChunkType,
  FileType,
} from '@teleporthq/teleport-types'

interface CSSPluginConfig {
  chunkName: string
  templateChunkName: string
  componentDecoratorChunkName: string
  inlineStyleAttributeKey: string
  classAttributeName: string
  templateStyle: 'html' | 'jsx'
  declareDependency: 'import' | 'decorator' | 'none'
}

export const createCSSPlugin: ComponentPluginFactory<CSSPluginConfig> = (config) => {
  const {
    chunkName = 'style-chunk',
    templateChunkName = 'template-chunk',
    componentDecoratorChunkName = 'component-decorator',
    inlineStyleAttributeKey = 'style',
    classAttributeName = 'class',
    templateStyle = 'html',
    declareDependency = 'none',
  } = config || {}

  const cssPlugin: ComponentPlugin = async (structure) => {
    const { uidl, chunks, dependencies } = structure

    const { node } = uidl

    const templateChunk = chunks.find((chunk) => chunk.name === templateChunkName)
    const componentDecoratorChunk = chunks.find(
      (chunk) => chunk.name === componentDecoratorChunkName
    )

    const templateLookup = templateChunk.meta.nodesLookup

    // Only JSX based chunks have dynamicRefPrefix (eg: this.props. or props.)
    const propsPrefix: string = templateChunk.meta.dynamicRefPrefix
      ? templateChunk.meta.dynamicRefPrefix.prop
      : ''

    const jssStylesArray: string[] = []

    if (uidl.styleDefinitions) {
      Object.keys(uidl.styleDefinitions).forEach((className) => {
        const definitions = uidl.styleDefinitions[className]
        const styleObject = StyleUtils.convertStyleDefinitionsToStyleObject(definitions)
        jssStylesArray.push(StyleBuilders.createCSSClass(className, styleObject))
      })
    }

    UIDLUtils.traverseElements(node, (element) => {
      const { styleBlock, styleRefs = [], key } = element
      const root = templateLookup[key]

      styleRefs.forEach((ref) => {
        if (templateStyle === 'html') {
          HASTUtils.addClassToNode(root, ref)
        } else {
          ASTUtils.addClassStringOnJSXTag(root, ref, classAttributeName)
        }
      })

      if (styleBlock) {
        // TODO: Make sure className does not conflict with styleRefs
        const className = StringUtils.camelCaseToDashCase(key)
        const staticStyles = StyleUtils.convertStyleDefinitionsToStyleObject(styleBlock)
        const dynamicRootStyles = StyleUtils.extractDynamicStyles(styleBlock)

        if (Object.keys(staticStyles).length > 0) {
          jssStylesArray.push(StyleBuilders.createCSSClass(className, staticStyles))

          if (templateStyle === 'html') {
            HASTUtils.addClassToNode(root, className)
          } else {
            ASTUtils.addClassStringOnJSXTag(root, className, classAttributeName)
          }
        }

        if (Object.keys(dynamicRootStyles).length > 0) {
          if (templateStyle === 'html') {
            // simple string expression
            const inlineStyles = createDynamicInlineStyle(dynamicRootStyles)
            HASTUtils.addAttributeToNode(root, inlineStyleAttributeKey, `{${inlineStyles}}`)
          } else {
            // jsx object expression
            const inlineStyles = Object.keys(dynamicRootStyles).reduce(
              (acc: Record<string, ParsedASTNode>, styleKey: string) => {
                const styleValue = dynamicRootStyles[styleKey]
                acc[styleKey] = StyleBuilders.createDynamicStyleExpression(styleValue, propsPrefix)
                return acc
              },
              {}
            )
            ASTUtils.addAttributeToJSXTag(root, inlineStyleAttributeKey, inlineStyles)
          }
        }
      }
    })

    if (jssStylesArray.length > 0) {
      chunks.push({
        type: ChunkType.STRING,
        name: chunkName,
        fileType: FileType.CSS,
        content: jssStylesArray.join('\n'),
        linkAfter: [],
      })

      /**
       * Setup an import statement for the styles
       * The name of the file is either in the meta of the component generator
       * or we fallback to the name of the component
       */
      const cssFileName = UIDLUtils.getStyleFileName(uidl)

      if (declareDependency === 'decorator' && componentDecoratorChunk) {
        const decoratorAST = componentDecoratorChunk.content
        const decoratorParam = decoratorAST.expression.arguments[0]
        ASTUtils.addPropertyToASTObject(decoratorParam, 'styleUrls', [
          `${cssFileName}.${FileType.CSS}`,
        ])
      }

      if (declareDependency === 'import') {
        dependencies.styles = {
          // styles will not be used in this case as we have importJustPath flag set
          type: 'local',
          path: `./${cssFileName}.${FileType.CSS}`,
          meta: {
            importJustPath: true,
          },
        }
      }
    }

    return structure
  }

  return cssPlugin
}

export default createCSSPlugin()

const createDynamicInlineStyle = (styles: UIDLStyleDefinitions) => {
  return Object.keys(styles)
    .map((styleKey) => {
      return `${styleKey}: ${(styles[styleKey] as UIDLDynamicReference).content.id}`
    })
    .join(', ')
}
