import * as fs from 'node:fs'
import { visit } from 'unist-util-visit'
import * as unzipper from 'unzipper'
import { fromXml } from 'xast-util-from-xml'

import type { Citation } from '../citaion.ts'

interface XastElement {
	attributes?: Record<string, string>
	children: XastNode[]
	name: string
	type: 'element'
}

interface XastText {
	type: 'text'
	value: string
}

type XastNode = XastElement | XastText

function streamToString(filename: string) {
	let first = true
	const chunks: Buffer[] = []
	return new Promise<string>((resolve, reject) => {
		fs.createReadStream(filename)
			.pipe(unzipper.Parse())
			.on('entry', function (entry) {
				const filename_ = entry.path
				if (first && filename_.endsWith('.opf')) {
					first = false
					entry.on('data', (chunk: Buffer | string) => {
						chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
					})
					entry.on('error', (err: unknown) => reject(err))
					entry.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
				} else {
					entry.autodrain()
				}
			})
	})
}

const value = (node: XastElement) =>
	(node.children as XastNode[]).find((c): c is XastText => c.type === 'text')
		?.value ?? ''

export async function citationFromEPUB(source: string): Promise<Citation> {
	let citation: Citation = { subtype: 'book' }
	const raw = await streamToString(source)
	const tree = fromXml(raw)
	visit(tree, (node) => {
		if (node.type === 'element' && node.name === 'metadata') {
			for (const child of node.children as XastNode[]) {
				if (child.type !== 'element') continue
				const name = child.name as string
				if (name === 'dc:date') {
					citation.issued = value(child)
					continue
				}
				if (name === 'dc:title') {
					citation.title = value(child)
					continue
				}
				if (name === 'dc:language') {
					citation.language = value(child)
					continue
				}
				if (name === 'dc:publisher') {
					citation.publisher = value(child)
					continue
				}
				if (name === 'dc:creator') {
					citation.author ??= []
					citation.author.push(value(child))
					continue
				}
				if (name === 'description') {
					citation.description = value(child)
					continue
				}
			}
		}
	})
	return citation
}
