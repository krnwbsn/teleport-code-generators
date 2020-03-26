import { insertLinks, createLinkNode } from '../../src/resolvers/abilities/utils'
import { elementNode } from '@teleporthq/teleport-uidl-builders'
import {
  urlMockedDefinition,
  navlinkMockedDefinition,
  phoneMockedDefinition,
  mailMockedDefinition,
} from './mocks'
import { UIDLElementNode, UIDLLinkURLDefinition } from '@teleporthq/teleport-types'

describe('insertLink', () => {
  it('wraps a simple element', () => {
    const node = elementNode('container')
    const link = urlMockedDefinition() as UIDLLinkURLDefinition
    node.content.abilities = { link }

    const result = insertLinks(node, {}, false)
    expect(result.content.elementType).toBe('link')
    expect(result.content.attrs.url.content).toBe(link.options.url.content)
  })

  it('replaces a child', () => {
    const node = elementNode('container', {}, [
      elementNode('container'),
      elementNode('container'),
      elementNode('container'),
    ])

    const secondChild = node.content.children[1] as UIDLElementNode

    const link = urlMockedDefinition() as UIDLLinkURLDefinition
    secondChild.content.abilities = { link }

    const result = insertLinks(node, {}, false)
    const secondChildAfterInsertLinks = result.content.children[1] as UIDLElementNode

    expect(secondChildAfterInsertLinks.content.elementType).toBe('link')
    expect(secondChildAfterInsertLinks.content.attrs.url.content).toBe(link.options.url.content)
  })

  it('works with a navlink without page settings', () => {
    const node = elementNode('container', {}, [
      elementNode('container'),
      elementNode('container'),
      elementNode('container'),
    ])

    const secondChild = node.content.children[1] as UIDLElementNode

    const navlink = navlinkMockedDefinition()
    secondChild.content.abilities = { link: navlink }

    const result = insertLinks(node, {}, false)
    const secondChildAfterInsertLinks = result.content.children[1] as UIDLElementNode

    expect(secondChildAfterInsertLinks.content.elementType).toBe('navlink')
    expect(secondChildAfterInsertLinks.content.attrs.transitionTo.content).toBe(
      `/${navlink.options.routeName}`
    )
  })

  it('works with a navlink with page settings', () => {
    const node = elementNode('container', {}, [
      elementNode('container'),
      elementNode('container'),
      elementNode('container'),
    ])

    const secondChild = node.content.children[1] as UIDLElementNode

    const navlink = navlinkMockedDefinition()
    secondChild.content.abilities = { link: navlink }

    const result = insertLinks(
      node,
      {
        projectRouteDefinition: {
          type: 'route',
          defaultValue: 'home',
          values: [
            {
              value: 'home',
              pageOptions: {
                navLink: '/main-page',
              },
            },
          ],
        },
      },
      false
    )
    const secondChildAfterInsertLinks = result.content.children[1] as UIDLElementNode

    expect(secondChildAfterInsertLinks.content.elementType).toBe('navlink')
    expect(secondChildAfterInsertLinks.content.attrs.transitionTo.content).toBe(`/main-page`)
  })
})

describe('createLink', () => {
  it('creates a phone link', () => {
    const link = phoneMockedDefinition()
    const result = createLinkNode(link, {})

    expect(result.content.elementType).toBe('link')
    expect(result.content.attrs.url.content).toBe(`tel:${link.options.phone}`)
  })

  it('creates a mail link', () => {
    const link = mailMockedDefinition()
    const result = createLinkNode(link, {})

    expect(result.content.elementType).toBe('link')
    expect(result.content.attrs.url.content).toBe(
      `mailto:${link.options.mail}?subject=${link.options.subject}&body=${link.options.body}`
    )
  })
})