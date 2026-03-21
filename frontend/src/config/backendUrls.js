import { Capacitor } from '@capacitor/core'

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function isNativePlatform() {
  try {
    return Boolean(Capacitor.isNativePlatform?.())
  } catch {
    return false
  }
}

function getPlatform() {
  try {
    return String(Capacitor.getPlatform?.() || 'web')
  } catch {
    return 'web'
  }
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
  const fromEnv = normalizeBaseUrl(import.meta.env.VITE_AUTH_URL)
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
  const fromEnv = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
  if (fromEnv) return fromEnv

  if (isNativePlatform()) return `${defaultHttpBase(8001)}/api`

  // In web dev, allow Vite proxy /api -> backend.
  // In web prod, allow same-origin /api when hosted behind a rewrite.
  return '/api'
}

export function getRouteOptimizerBaseUrl() {
  const fromEnv = normalizeBaseUrl(import.meta.env.VITE_ROUTE_OPTIMIZER_BASE_URL)
  if (fromEnv) return fromEnv

  if (isNativePlatform()) return defaultHttpBase(8002)

  // Web builds can use same-origin /api with a proxy/rewrite.
  return ''
}

export function getVoiceTranslationBaseUrl() {
  const fromEnv = normalizeBaseUrl(import.meta.env.VITE_API_URL)
  if (fromEnv) return fromEnv

  if (isNativePlatform()) return defaultHttpBase(8003)
  if (import.meta.env.DEV) return 'http://localhost:8003'

  return ''
}
