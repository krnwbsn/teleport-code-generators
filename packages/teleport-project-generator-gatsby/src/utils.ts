import {
  ProjectUIDL,
  EntryFileOptions,
  ChunkDefinition,
  FileType,
  ChunkType,
} from '@teleporthq/teleport-types'
import { ASTBuilders, ASTUtils } from '@teleporthq/teleport-shared'

import * as types from '@babel/types'

export const createCustomHTMLEntryFile = (
  uidl: ProjectUIDL,
  options: EntryFileOptions,
  t = types
) => {
  const reactImport = createImportAST('React', 'react')
  const propTypesImport = createImportAST('PropTypes', 'prop-types')

  const exportBody = t.exportDefaultDeclaration(
    t.functionDeclaration(
      t.identifier('HTML'),
      [t.identifier('props')],
      t.blockStatement([t.returnStatement(generateHTMLNode(uidl))])
    )
  )

  const chunks: Record<string, ChunkDefinition[]> = {
    [FileType.JS]: [
      {
        name: 'import-chunks',
        type: ChunkType.AST,
        fileType: FileType.JS,
        content: [reactImport, propTypesImport],
        linkAfter: [],
      },
      {
        name: 'jsx-body',
        type: ChunkType.AST,
        fileType: FileType.JS,
        content: [exportBody],
        linkAfter: ['import-chunk'],
      },
      {
        name: 'prop-types',
        type: ChunkType.AST,
        fileType: FileType.JS,
        content: [createPropTypesChunk()],
        linkAfter: ['import-chunks', 'jsx-body'],
      },
    ],
  }

  return chunks
}

const createImportAST = (specifier: string, target: string, t = types) => {
  return t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier(specifier))],
    t.stringLiteral(target)
  )
}

const generateHTMLNode = (uidl: ProjectUIDL, t = types) => {
  const htmlNode = ASTBuilders.createJSXTag('html')
  const headNode = ASTBuilders.createJSXTag('head')
  const bodyNode = ASTBuilders.createJSXTag('body')
  const noScriptNode = ASTBuilders.createJSXTag('noscript')

  addJSXExpressionContainer(bodyNode, 'props', 'preBodyComponents')

  ASTUtils.addChildJSXText(noScriptNode, 'This app works best with JavaScript enabled.')
  ASTUtils.addAttributeToJSXTag(noScriptNode, 'key', 'noscript')
  ASTUtils.addAttributeToJSXTag(noScriptNode, 'id', 'gatsby-noscript')
  ASTUtils.addChildJSXTag(bodyNode, noScriptNode)

  addSpreadAttributes(htmlNode, 'props', 'htmlAttributes')
  addSpreadAttributes(bodyNode, 'props', 'bodyAttributes')
  addJSXExpressionContainer(headNode, 'props', 'headComponents')

  const bodyDiv = ASTBuilders.createJSXTag('div')
  bodyDiv.openingElement.selfClosing = true
  ASTUtils.addAttributeToJSXTag(bodyDiv, 'id', '___gatsby')
  bodyDiv.openingElement.attributes.push(
    t.jsxAttribute(
      t.jsxIdentifier('key'),
      t.jsxExpressionContainer(
        t.templateLiteral([t.templateElement({ raw: 'body', cooked: 'body' })], [])
      )
    )
  )
  bodyDiv.openingElement.attributes.push(
    t.jsxAttribute(
      t.jsxIdentifier('dangerouslySetInnerHTML'),
      t.jsxExpressionContainer(
        t.objectExpression([
          t.objectProperty(
            t.identifier('__html'),
            t.memberExpression(t.identifier('props'), t.identifier('body'))
          ),
        ])
      )
    )
  )

  ASTUtils.addChildJSXTag(bodyNode, bodyDiv)

  addJSXExpressionContainer(bodyNode, 'props', 'postBodyComponents')

  ASTUtils.addChildJSXTag(htmlNode, headNode)
  ASTUtils.addChildJSXTag(htmlNode, bodyNode)

  return htmlNode
}

const addJSXExpressionContainer = (
  jsxElement: types.JSXElement,
  propPrefix: string,
  propName: string,
  t = types
) => {
  return jsxElement.children.push(
    t.jsxExpressionContainer(t.memberExpression(t.identifier(propPrefix), t.identifier(propName)))
  )
}

const addSpreadAttributes = (
  jsxElement: types.JSXElement,
  propPrefix: string,
  propName: string,
  t = types
) => {
  return jsxElement.openingElement.attributes.push(
    t.jsxSpreadAttribute(t.memberExpression(t.identifier(propPrefix), t.identifier(propName)))
  )
}

const createPropTypesChunk = (t = types) => {
  return t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(t.identifier('HTML'), t.identifier('propTypes')),
      t.objectExpression([
        createObjectpropertyAST('htmlAttributes', 'PropTypes', 'object'),
        createObjectpropertyAST('headComponents', 'PropTypes', 'array'),
        createObjectpropertyAST('bodyAttributes', 'PropTypes', 'object'),
        createObjectpropertyAST('preBodyComponents', 'PropTypes', 'array'),
        createObjectpropertyAST('body', 'PropTypes', 'string'),
        createObjectpropertyAST('postBodyComponents', 'PropTypes', 'array'),
      ])
    )
  )
}

const createObjectpropertyAST = (
  attributeName: string,
  prefix: string,
  attributeType: string,
  t = types
) => {
  return t.objectProperty(
    t.identifier(attributeName),
    t.memberExpression(t.identifier(prefix), t.identifier(attributeType))
  )
}
