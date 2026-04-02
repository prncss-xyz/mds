/* eslint-disable @cspell/spellchecker */
import type { Element } from 'hast'

import { visit } from 'unist-util-visit'

import type { Citation } from '../../citation.ts'

import { setupAdapter } from './adapters.ts'
import { getAttr, hasClass, toText } from './utils.ts'

function IEPAuthors(tree: Element) {
	const ret: string[] = []
	let inp = false
	for (const children of tree.children) {
		if (children.type !== 'element') return
		const firstChild = children.children?.[0]
		if (!firstChild || !('value' in firstChild)) return
		const value = firstChild.value
		if (children.tagName === 'h3') {
			if (value === 'Author Information') {
				inp = true
			}
			continue
		}
		if (inp && children.tagName === 'p') {
			ret.push(value)
		}
	}
	if (ret.length > 0) return ret
}

export function setupAdapters() {
	setupAdapter({
		cb: (tree) => {
			const res: Partial<Citation> = {}
			visit(tree, (node) => {
				if (node.type !== 'element') return
				if (hasClass('entry-content', node)) {
					res.author = IEPAuthors(node)
				}
			})
			return res
		},
		citation: {
			publisher: 'Internet Encyclopedia of Philosophy',
			source: 'IEP',
			subtype: 'article',
		},
		pattern: 'iep.utm.edu',
		splitTitle: '|',
	})
	setupAdapter({
		citation: {
			language: 'fr',
			subtype: 'magazine',
		},
		pattern: 'histoireengagee.ca',
		tests: [
			{
				criteria: (node) => {
					if (node.tagName === 'a' && node.properties?.rel === 'category tag') {
						const href = getAttr('href', node)
						if (href && href.match(/collaborat/)) {
							return toText(node)
						}
					}
				},
				field: 'author',
			},
		],
	})
	setupAdapter({
		citation: {
			source: 'SEP',
			subtype: 'article',
		},
		pattern: 'plato.stanford.edu',
	})
	setupAdapter({
		citation: {
			language: 'fr',
			publisher: 'Signo',
			subtype: 'blog',
		},
		pattern: 'signosemio.com',
	})
	setupAdapter({
		citation: {
			language: 'fr',
			subtype: 'article',
		},
		pattern: 'cairn.info',
	})
	setupAdapter({
		citation: {
			language: 'fr',
			subtype: 'news',
		},
		pattern: 'radio-canada.ca',
	})
	setupAdapter({
		citation: {
			author: ['Wikipedia'],
			subtype: 'wiki',
		},
		pattern: 'wikipedia.org',
		splitTitle: '-',
	})
	setupAdapter({
		citation: {
			subtype: 'magazine',
		},
		pattern: 'psychologytoday.com',
	})
	setupAdapter({
		citation: {
			publisher: 'Oxford University Press',
			subtype: 'article',
		},
		pattern: 'academic.oup.com',
	})
}
