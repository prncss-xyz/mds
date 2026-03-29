export function tag<const T, P>(type: T, payload: P) {
	return {
		payload,
		type,
	}
}

export function success<P>(payload: P) {
	return tag('success', payload)
}

export function failure<P>(payload: P) {
	return tag('failure', payload)
}
