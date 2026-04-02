import type { Nodes } from 'hast'

import type { Citation } from '../../citation.ts'
import type { ITest } from './testers.ts'

export interface Adapter {
	cb?: (tree: Nodes) => Partial<Citation>
	citation?: Partial<Citation>
	pattern: string
	splitTitle?: string
	tests?: ITest[]
}

const adapters: Adapter[] = []

export function setupAdapter(adapter: Adapter) {
	adapters.push(adapter)
}

export function getAdapter(url: string) {
	const { hostname } = new URL(url)
	for (const adapter of adapters)
		if (hostname.endsWith(adapter.pattern)) return adapter
}

export function applyAdapters(
	citation: Partial<Citation>,
	adapter: Adapter | undefined,
	tree: Nodes,
) {
	if (adapter) {
		if (adapter.citation) citation = { ...citation, ...adapter.citation }
		if (adapter.cb) citation = { ...citation, ...adapter.cb(tree) }
	}
	if (citation.title) {
		if (adapter?.splitTitle) {
			citation.title = citation.title.split(adapter.splitTitle)[0]
		}
		citation.title = citation.title.trim()
	}
	return citation
}
