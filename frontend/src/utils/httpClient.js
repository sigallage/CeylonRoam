import { Capacitor, CapacitorHttp } from '@capacitor/core'

function isNative() {
	try {
		return Boolean(Capacitor.isNativePlatform?.())
	} catch {
		return false
	}
}

async function readFetchPayload(response) {
	const contentType = response.headers.get('content-type') || ''
	if (contentType.includes('application/json')) {
		try {
			return await response.json()
		} catch {
			return null
		}
	}
	try {
		return await response.text()
	} catch {
		return null
	}
}

/**
 * POST JSON using fetch on web, and CapacitorHttp on native.
 * Returns { ok, status, data }.
 */
export async function postJson(url, body, { headers = {} } = {}) {
	const normalizedHeaders = {
		'Content-Type': 'application/json',
		...headers,
	}

	if (isNative()) {
		const resp = await CapacitorHttp.post({
			url,
			headers: normalizedHeaders,
			data: body,
		})

		const status = Number(resp?.status || 0)
		return {
			ok: status >= 200 && status < 300,
			status,
			data: resp?.data,
		}
	}

	const response = await fetch(url, {
		method: 'POST',
		headers: normalizedHeaders,
		body: JSON.stringify(body ?? {}),
	})

	return {
		ok: response.ok,
		status: response.status,
		data: await readFetchPayload(response),
	}
}
