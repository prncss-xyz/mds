import type { Adapter } from './adapters.ts'

import { getLog } from '../../../../log.ts'
import { type Citation, type Field, isPlField, isSgField } from '../../citation.ts'
import { getAdapter } from './adapters.ts'

export type Acc = {
	adapter?: Adapter
	citation: Partial<CitationAcc>
}

type SgFieldAcc =
	| undefined
	| {
			priority: number
			value: string
	  }

type PlFieldAcc =
	| undefined
	| {
			priority: number
			values: string[]
	  }

export type CitationAcc = {
	[K in keyof Citation]: Citation[K] extends string | undefined
		? SgFieldAcc
		: PlFieldAcc
}

let counter: number

const rules = new Map<string, { field: Field; priority: number }>()

export function initCounter(value: number) {
	counter = value
}

export function getCounter() {
	return counter
}

export function setupRule(field: Field, key: string) {
	const priority = ++counter
	rules.set(key, {
		field,
		priority,
	})
}

export function applyRules(acc: Acc, key: string, value: string) {
	const rule = rules.get(key)
	if (!rule) return
	const { field, priority } = rule
	if (getLog()) console.log(field, priority, { meta: key }, value)
	register(acc, field, priority, value)
}

export function register(
	acc: Acc,
	field: Field,
	priority: number,
	value: unknown,
) {
	if (typeof value !== 'string') return
	if (!value) return
	if (isSgField(field)) {
		const f = acc.citation[field] as SgFieldAcc
		if (f && f.priority >= priority) return
		;(acc.citation as Record<string, SgFieldAcc>)[field] = { priority, value }
		if (field === 'URL') {
			acc.adapter = getAdapter(value)
		}
		return
	}
	if (isPlField(field)) {
		const f = acc.citation[field] as PlFieldAcc
		if (f && f.priority > priority) return
		const values = f && f.priority === priority ? f.values : []
		values.push(value)
		;(acc.citation as Record<string, PlFieldAcc>)[field] = { priority, values }
		return
	}
	throw new Error('unexpected field name: ' + field)
}

export function fromAcc(acc: Acc): Partial<Citation> {
	return {
		archived: acc.citation.archived?.value,
		author: acc.citation.author?.values,
		description: acc.citation.description?.value,
		doi: acc.citation.doi?.value,
		firstPage: acc.citation.firstPage?.value,
		issued: acc.citation.issued?.value,
		journalAbbrev: acc.citation.journalAbbrev?.value,
		language: acc.citation.language?.value,
		lastPage: acc.citation.lastPage?.value,
		modified: acc.citation.modified?.value,
		publisher: acc.citation.publisher?.value,
		source: acc.citation.source?.value,
		subtype: acc.citation.subtype?.value,
		title: acc.citation.title?.value,
		URL: acc.citation.URL?.value,
	}
}
