import { Capacitor } from '@capacitor/core'

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function isLoopbackBaseUrl(baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl)
  if (!normalized) return false

  try {
    const url = new URL(normalized)
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1'
  } catch {
    return false
  }
}

function isNativePlatform() {
  try {
    return Boolean(Capacitor.isNativePlatform?.())
  } catch {
    return false
  }
}

export function isNativeApp() {
  return isNativePlatform()
}

export function getDefaultFetchCredentials() {
  // In an installed APK the origin is typically `capacitor://localhost`.
  // Using `credentials: 'include'` in cross-origin requests can trigger CORS
  // failures that surface as a generic "Network error" in fetch.
  return isNativePlatform() ? 'omit' : 'include'
}

function getPlatform() {
  try {
    return String(Capacitor.getPlatform?.() || 'web')
  } catch {
    return 'web'
  }
}

function resolveEnvBaseUrl({ webKey, nativeKey }) {
  const isNative = isNativePlatform()
  const raw = isNative
    ? (import.meta.env[nativeKey] || import.meta.env[webKey])
    : import.meta.env[webKey]

  const normalized = normalizeBaseUrl(raw)
  if (!normalized) return ''

  // Avoid a common footgun: in an installed APK, localhost points to the phone.
  if (isNative && isLoopbackBaseUrl(normalized)) return ''

  return normalized
}

export function getDevHost() {
  const fromEnv = String(import.meta.env.VITE_DEV_HOST || '').trim()
  if (fromEnv) return fromEnv

  // Android emulators cannot reach the host machine via localhost.
  // 10.0.2.2 is the special alias for "host loopback" in the Android emulator.
  if (getPlatform() === 'android') return '10.0.2.2'

  return 'localhost'
}

function defaultHttpBase(port) {
  return `http://${getDevHost()}:${port}`
}

export function getAuthBaseUrl() {
  const fromEnv = resolveEnvBaseUrl({ webKey: 'VITE_AUTH_URL', nativeKey: 'VITE_NATIVE_AUTH_URL' })
  if (fromEnv) return fromEnv

  if (isNativePlatform()) return defaultHttpBase(5001)
  // In web dev, prefer same-origin /api and let Vite proxy to the auth service.
  // This avoids CORS and allows session cookies for OTP flows.
  if (import.meta.env.DEV) return ''

  // Web production builds must provide VITE_AUTH_URL.
  return ''
}

export function getItineraryApiBaseUrl() {
  // Historical env var used by the itinerary generator page.
  const fromEnv = resolveEnvBaseUrl({ webKey: 'VITE_API_BASE_URL', nativeKey: 'VITE_NATIVE_API_BASE_URL' })
  if (fromEnv) return fromEnv

  if (isNativePlatform()) return `${defaultHttpBase(8001)}/api`

  // In web dev, allow Vite proxy /api -> backend.
  // In web prod, allow same-origin /api when hosted behind a rewrite.
  return '/api'
}

export function getRouteOptimizerBaseUrl() {
  const fromEnv = resolveEnvBaseUrl({ webKey: 'VITE_ROUTE_OPTIMIZER_BASE_URL', nativeKey: 'VITE_NATIVE_ROUTE_OPTIMIZER_BASE_URL' })
  if (fromEnv) return fromEnv

  if (isNativePlatform()) return defaultHttpBase(8002)

  // Web builds can use same-origin /api with a proxy/rewrite.
  return ''
}

export function getVoiceTranslationBaseUrl() {
  const fromEnv = resolveEnvBaseUrl({ webKey: 'VITE_API_URL', nativeKey: 'VITE_NATIVE_API_URL' })
  if (fromEnv) return fromEnv

  if (isNativePlatform()) return defaultHttpBase(8003)
  if (import.meta.env.DEV) return 'http://localhost:8003'

  return ''
}
