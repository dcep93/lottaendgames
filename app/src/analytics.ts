export type AnalyticsParameters = Record<string, string | number | boolean>
export type AnalyticsEvent = 'training_started' | 'training_completed' | 'training_info_opened' | 'reason_hints_enabled' | 'exercise_started' | 'exercise_completed'
type Send = (...args: unknown[]) => void

const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content']

export function analyticsUrl(href: string, campaigns = false): string {
  try {
    const url = new URL(href)
    const query = new URLSearchParams()
    if (campaigns) {
      for (const key of CAMPAIGN_KEYS) {
        const value = url.searchParams.get(key)
        if (value) query.set(key, value)
      }
    }
    return `${url.origin}${url.pathname}${query.size ? `?${query}` : ''}`
  } catch {
    return ''
  }
}

export function createAnalytics(options: {
  measurementId: string
  enabled: boolean
  initialUrl: string
  referrer: string
  send: Send
  load: () => void
}) {
  const initial = new URL(options.initialUrl)
  const enabled = options.enabled && /^G-[A-Z0-9]+$/.test(options.measurementId)
    && !['localhost', '127.0.0.1', '[::1]'].includes(initial.hostname)
    && !initial.hostname.endsWith('.localhost')
  let ready = false
  let lastPath = ''
  let location = analyticsUrl(options.initialUrl, true)
  let referrer = analyticsUrl(options.referrer)
  let title = 'Lotta Endgames'

  function send(...args: unknown[]) {
    // Analytics must never interrupt navigation or chess play.
    try { options.send(...args) } catch { /* unavailable or blocked */ }
  }
  function initialize() {
    if (!enabled || ready) return
    ready = true
    send('js', new Date())
    send('config', options.measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location,
      page_referrer: referrer,
      page_title: title,
    })
    try { options.load() } catch { /* unavailable or blocked */ }
  }

  return {
    page(path: string, pageTitle: string) {
      if (!enabled) return
      const cleanPath = new URL(path, initial.origin).pathname
      if (cleanPath === lastPath) return
      if (lastPath) referrer = analyticsUrl(location)
      location = `${initial.origin}${cleanPath}${lastPath ? '' : new URL(location).search}`
      lastPath = cleanPath
      title = pageTitle
      initialize()
      send('set', { page_location: location, page_referrer: referrer, page_title: title })
      send('event', 'page_view', { page_location: location, page_referrer: referrer, page_title: title })
    },
    event(name: AnalyticsEvent, parameters: AnalyticsParameters) {
      if (!enabled) return
      initialize()
      send('event', name, { ...parameters, page_location: location, page_referrer: referrer, page_title: title })
    },
  }
}

let analytics: ReturnType<typeof createAnalytics> | undefined

export function initializeAnalytics() {
  if (analytics || typeof window === 'undefined' || !import.meta.env?.PROD) return
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID ?? ''
  const host = window as Window & { dataLayer?: unknown[] }
  analytics = createAnalytics({
    measurementId,
    enabled: true,
    initialUrl: window.location.href,
    referrer: document.referrer,
    send: function () {
      host.dataLayer ??= []
      // The Google tag consumes arguments objects in its command queue.
      host.dataLayer.push(arguments)
    },
    load: () => {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
      document.head.appendChild(script)
    },
  })
}

export function trackPage(path: string, title: string) {
  analytics?.page(path, title)
}

export function trackEvent(name: AnalyticsEvent, parameters: AnalyticsParameters) {
  analytics?.event(name, parameters)
}
