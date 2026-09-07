'use strict'

const prettyMs = ms => {
  if (!Number.isFinite(ms)) return 'unknown'
  const sign = ms < 0 ? '-' : ''
  let n = Math.abs(ms)
  if (n < 1000) return `${sign}${Math.round(n)}ms`
  n /= 1000
  if (n < 60) return `${sign}${n.toFixed(1).replace(/\.0$/, '')}s`
  const hours = Math.floor(n / 3600)
  n %= 3600
  const mins = Math.floor(n / 60)
  const secs = (n % 60).toFixed(1).replace(/\.0$/, '')
  if (hours) return `${sign}${hours}h ${mins}m ${secs}s`
  return secs === '0' ? `${sign}${mins}m` : `${sign}${mins}m ${secs}s`
}

const prettyBytes = n => {
  if (!Number.isFinite(n) || n < 1000) return `${Math.round(n || 0)} B`
  if (n < 1e6) {
    const val = n / 1000
    return `${
      val >= 100 ? Math.round(val) : val.toFixed(1).replace(/\.0$/, '')
    } kB`
  }
  return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')} MB`
}

module.exports = { prettyMs, prettyBytes }
