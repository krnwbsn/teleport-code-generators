import {
  ComponentPluginFactory,
  ComponentPlugin,
  FileType,
  ChunkType,
} from '@teleporthq/teleport-types'
import { createHTMLTemplateSyntax } from '@teleporthq/teleport-plugin-common'

import { DEFAULT_SVELTE_TEMPLATE_CHUNK_NAME } from './constants'

interface SvelteComponentConfig {
  svelteTemplateChunkName: string
}

export const createSvelteComponentPlugin: ComponentPluginFactory<SvelteComponentConfig> = (
  config
) => {
  const { svelteTemplateChunkName = DEFAULT_SVELTE_TEMPLATE_CHUNK_NAME } = config || {}

  const svelteComponentPlugin: ComponentPlugin = async (structure) => {
    const { uidl, chunks, dependencies } = structure

    const templateLookup: { [key: string]: any } = {}
    const dataObject: Record<string, any> = {}
    const methodsObject: Record<string, any> = {}

    const templateContent = createHTMLTemplateSyntax(
      uidl.node,
      {
        templateLookup,
        dependencies,
        dataObject,
        methodsObject,
      },
      {
        interpolation: (value) => `{${value}}`,
        eventBinding: (value) => `on:${value}`,
        valueBinding: (value) => `bind:value=${value}`,
        eventEmmitter: (value) => `this.$emit('${value}')`,
        eventHandlersBindingMode: (value) => `{${value}}`,
        conditionalAttr: 'v-if',
        repeatAttr: 'v-for',
        repeatIterator: (iteratorName, iteratedCollection, useIndex) => {
          const iterator = useIndex ? `(${iteratorName}, index)` : iteratorName
          return `${iterator} in ${iteratedCollection}`
        },
        customElementTagName: (value) => value,
      }
    )

    chunks.push({
      type: ChunkType.HAST,
      name: svelteTemplateChunkName,
      fileType: FileType.SVELTE,
      meta: {
        nodesLookup: templateLookup,
      },
      content: templateContent,
      linkAfter: [],
    })

    return structure
  }

  return svelteComponentPlugin
}

export default createSvelteComponentPlugin()
