import type { Element } from 'hast'

import { toText } from 'hast-util-to-text'

import type { Field } from '../../citation.ts'
import type { Acc } from './rules.ts'

import { getLog } from '../../../../log.ts'
import { applyRules, register } from './rules.ts'
import { getAttr, hasClass } from './utils.ts'

interface Select {
	attr?: string
	className?: string
	tagName?: string
	value?: string
}

type Test =
	| ((node: Element) => string | undefined)
	| {
			extract?: string
			select: Select
	  }

function applyTest(criteria: Test, node: Element): string | undefined {
	if (typeof criteria === 'function') {
		return criteria(node)
	}
	const { extract, select } = criteria
	if (select.tagName && node.tagName !== select.tagName) return ''
	if (select.attr) {
		const p = getAttr(select.attr, node)
		if (!p) return ''
		if (select.value && p !== select.value) return ''
	}
	if (select.className) {
		if (!hasClass(select.className, node)) return ''
	}
	if (extract) {
		const res = node.properties?.[extract]
		if (typeof res === 'string') return res
		return undefined
	}
	return toText(node)
}

export function test(
	field: Field,
	priority: number,
	criteria: Test,
	acc: Acc,
	node: Element,
) {
	const value = applyTest(criteria, node)
	if (value) {
		if (getLog()) console.log(field, priority, criteria, value)
		register(acc, field, priority, value)
		return true
	}
	return false
}

export interface ITest {
	criteria: Test
	field: Field
}

export function registerTests(priority: number, acc: Acc, node: Element) {
	const tests = acc.adapter?.tests
	if (!tests) return false
	for (const { criteria, field } of tests) {
		if (test(field, priority, criteria, acc, node)) return true
	}
}

function registerLDgraph(priority: number, acc: Acc, raw: string) {
	try {
		const parsed = JSON.parse(raw)
		const items = Array.isArray(parsed)
			? parsed
			: Array.isArray(parsed?.['@graph'])
				? parsed['@graph']
				: [parsed]
		const graph = items.find((item: unknown) => {
			if (!item || typeof item !== 'object') return false
			const obj = item as { [key: string]: unknown }
			return !!(obj.url || obj.headline || obj.name || obj.author)
		}) as undefined | { [key: string]: unknown }
		if (!graph) return
		const author = graph.author
		const authors = Array.isArray(author)
			? author
					.map((entry) => {
						if (typeof entry === 'string') return entry
						if (!entry || typeof entry !== 'object') return
						const mapped = entry as { [key: string]: unknown }
						const name = mapped.name
						return typeof name === 'string' ? name : undefined
					})
					.filter((entry): entry is string => typeof entry === 'string')
			: typeof author === 'string'
				? [author]
				: author && typeof author === 'object'
					? (() => {
							const mapped = author as { [key: string]: unknown }
							const name = mapped.name
							return typeof name === 'string' ? [name] : []
						})()
					: []
		const title =
			typeof graph.headline === 'string'
				? graph.headline
				: typeof graph.name === 'string'
					? graph.name
					: undefined
		if (getLog()) {
			if (typeof graph.url === 'string')
				console.log('URL', priority, 'LDGraph', graph.url)
			if (authors.length > 0)
				console.log('authors', 'LDGraph', priority, authors.join(', '))
			if (typeof graph.datePublished === 'string')
				console.log('issued', 'LDGraph', priority, graph.datePublished)
			if (typeof graph.dateModified === 'string')
				console.log('modified', 'LDGraph', priority, graph.dateModified)
		}
		register(acc, 'URL', priority, graph.url)
		for (const name of authors) register(acc, 'author', priority, name)
		register(acc, 'issued', priority, graph.datePublished)
		register(acc, 'modified', priority, graph.dateModified)
		register(acc, 'title', priority, title)
	} catch {
		// do nothing
	}
}

export function testLDgraph(priority: number, acc: Acc, node: Element) {
	const LDgraph = applyTest(
		{
			select: {
				attr: 'type',
				tagName: 'script',
				value: 'application/ld+json',
			},
		},
		node,
	)
	if (LDgraph) {
		registerLDgraph(priority, acc, LDgraph)
		return true
	}
	return false
}

export function testMeta(acc: Acc, node: Element) {
	if (node.tagName !== 'meta') return
	let key = node.properties.name ?? node.properties.property
	const value = node.properties.content
	if (typeof key === 'string' && typeof value === 'string') {
		key = key.toLowerCase()
		applyRules(acc, key, value)
	}
	return true
}
