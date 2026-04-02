import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import { extname } from 'node:path'

import type { Citation } from '../citation.ts'

import { citationFromHTML } from './html/index.ts'

async function fetchSpecificMeta(
	ext: string,
	filename: string,
): Promise<Citation> {
	if (ext === '.html') return await citationFromHTML(filename)
	return {}
}

export async function fetchMeta(
	filename: string,
): Promise<Record<string, unknown>> {
	const ext = extname(filename)
	const stats = await fs.stat(filename)
	const checksum = await fetchChecksum(filename)
	const meta = await fetchSpecificMeta(ext, filename)
	return {
		checksum,
		format: ext.slice(1),
		mtime: stats.mtimeMs,
		path: filename,
		type: 'source',
		...meta,
	}
}

function fetchChecksum(filename: string) {
	return new Promise<string>((resolve, reject) => {
		const hash = createHash('md5')
		const stream = createReadStream(filename)
		stream.on('error', (err) => {
			reject(err)
		})
		stream.on('data', (chunk) => {
			hash.update(chunk)
		})
		stream.on('end', () => {
			const checksum = hash.digest('base64')
			resolve(checksum)
		})
	})
}
