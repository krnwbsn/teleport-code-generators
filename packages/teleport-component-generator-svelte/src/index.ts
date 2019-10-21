import {
  createComponentGenerator,
  GeneratorFactoryParams,
} from '@teleporthq/teleport-component-generator'

import svelteComponentPlugin from '@teleporthq/teleport-plugin-svelte-base-component'
import { createCSSPlugin } from '@teleporthq/teleport-plugin-css'
import importStatementsPlugin from '@teleporthq/teleport-plugin-import-statements'

import SvelteMapping from './svelte-mapping.json'

import { ComponentGenerator } from '@teleporthq/teleport-types'

const createSvelteComponentGenerator = ({
  mappings = [],
  plugins = [],
  postprocessors = [],
}: GeneratorFactoryParams = {}): ComponentGenerator => {
  const generator = createComponentGenerator()
  const vueStylePlugin = createCSSPlugin({
    inlineStyleAttributeKey: 'style',
    forceScoping: true,
  })

  generator.addMapping(SvelteMapping)
  mappings.forEach((mapping) => generator.addMapping(mapping))

  generator.addPlugin(svelteComponentPlugin)
  generator.addPlugin(vueStylePlugin)
  plugins.forEach((plugin) => generator.addPlugin(plugin))
  generator.addPlugin(importStatementsPlugin)

  postprocessors.forEach((postprocessor) => generator.addPostProcessor(postprocessor))

  return generator
}

export { createSvelteComponentGenerator, SvelteMapping }
