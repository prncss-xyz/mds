let value = false

export function getLog() {
	return value
}

export function setLog(log?: boolean) {
	value = !!log
}
