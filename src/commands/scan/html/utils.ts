import type { Element } from 'hast'

import { toText as toText_ } from 'hast-util-to-text'

export function hasClass(name: string, node: Element) {
	const className = node.properties?.className
	return typeof className === 'object' && className?.includes(name)
}

export function getAttr(name: string, node: Element) {
	const value = node.properties[name]
	if (typeof value === 'string') return value
}

export function toText(node: Element) {
	return toText_(node)?.trim()
}
