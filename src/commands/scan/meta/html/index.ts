import type { Comment, Nodes } from 'hast'

import { fromParse5 } from 'hast-util-from-parse5'
import { readFile } from 'node:fs/promises'
import { parse } from 'parse5'
import { visit } from 'unist-util-visit'

import type { Citation } from '../../citation.ts'
import type { Acc } from './rules.ts'

import { getLog } from '../../../../log.ts'
import { applyAdapters } from './adapters.ts'
import { fromAcc, register } from './rules.ts'
import { setupAdapters } from './setupAdapters.ts'
import { setupRules } from './setupRules.ts'
import { registerTests, test, testLDgraph, testMeta } from './testers.ts'

const priority = setupRules(4)
setupAdapters()

function parseComment(strings: string[]) {
	let acc: { [key: string]: string } = {}
	for (let str of strings) {
		const ndx = str.indexOf(':')
		if (ndx >= 0) {
			const key = str.slice(0, ndx)
			const value = str.slice(ndx + 2)
			if (value) acc[key] = value
		}
	}
	return acc
}

function singleFile(priority: number, acc: Acc, node: Comment) {
	const value = node.value
		.split('\n')
		.map((s) => s.trim())
		.filter(Boolean)
	const first = value.shift()
	if (first === 'Page saved with SingleFile') {
		const parsed = parseComment(value)
		if (getLog())
			console.log('URL', priority, { singleFile: 'url' }, parsed['url'])
		register(acc, 'URL', priority + 1, parsed['url'])
		if (getLog())
			console.log(
				'archived',
				priority,
				{ singleFile: 'saved date' },
				parsed['saved date'],
			)
		register(acc, 'archived', priority + 1, parsed['saved date'])
		return true
	}
}

function readMeta(tree: Nodes): Partial<Citation> {
	const acc: Acc = { citation: {} }
	visit(tree, (node) => {
		if (node.type === 'comment') {
			singleFile(priority + 1, acc, node)
			return
		}
		if (node.type === 'element') {
			if (registerTests(priority + 1, acc, node)) return
			if (test('title', 0, { select: { tagName: 'h1' } }, acc, node)) return
			testMeta(acc, node)
			if (
				test(
					'URL',
					1,
					{
						extract: 'href',
						select: {
							attr: 'rel',
							tagName: 'link',
							value: 'canonical',
						},
					},
					acc,
					node,
				)
			)
				return
			if (test('URL', 2, { select: { tagName: 'base' } }, acc, node)) return
			if (
				test(
					'URL',
					2,
					{ extract: 'href', select: { tagName: 'base' } },
					acc,
					node,
				)
			)
				return
			if (test('title', 3, { select: { tagName: 'title' } }, acc, node)) return
			if (testLDgraph(priority, acc, node)) return
			return
		}
	})
	const citation = applyAdapters(fromAcc(acc), acc.adapter, tree)
	if (!citation.source && citation.URL) {
		const { hostname } = new URL(citation.URL)
		const i = hostname.endsWith('.qc.ca') ? 3 : 2
		citation.source = hostname.split('.').at(-i)
	}
	if (getLog()) {
		console.log(citation)
	}
	return citation
}

function parseTree(raw: string) {
	const ast = parse(raw)
	const tree = fromParse5(ast)
	return tree
}

export async function citationFromHTML(
	filename: string,
): Promise<Partial<Citation>> {
	const raw = await readFile(filename, 'utf-8')
	const tree = parseTree(raw)
	return readMeta(tree)
}
