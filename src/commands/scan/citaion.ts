const sgFields = [
	'URL',
	'issued',
	'modified',
	'archived',
	'title',
	'language',
	'publisher',
	'description',
	'subtype',
	'firstPage',
	'lastPage',
	'doi',
	'source',
	'journalAbbrev',
] as const
const plFields = ['author'] as const

type PlCitation = Record<(typeof plFields)[number], string[]>
type SgCitation = Record<(typeof sgFields)[number], string>
export type Citation = Partial<PlCitation & SgCitation>
export type Field = keyof Citation

export function isSgField(field: Field) {
	return sgFields.includes(field as any)
}

export function isPlField(field: Field) {
	return plFields.includes(field as any)
}
