// Shared helpers for the Taste Dashboard D3 charts so each component can focus
// on its own drawing logic without duplicating tooltip/layout boilerplate.

// Categorical palette for genres and directors. Hand-picked to sit well on the
// app's dark violet canvas while giving neighboring slices/bars enough contrast
// to be distinguishable at a glance.
export const CATEGORICAL_PALETTE = [
  '#f2a81d', // amber
  '#06b6d4', // cyan
  '#65a30d', // lime
  '#a855f7', // violet
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
  '#84cc16', // green
  '#f43f5e', // rose
  '#38bdf8', // sky
  '#eab308', // yellow
  '#c084fc', // purple
]

// Primary accent used by single-series charts (timeline line, director bars).
export const ACCENT = '#f2a81d'

// Axis/label defaults — kept in one place so every chart shares the same look.
export const AXIS_COLOR = 'rgba(226, 232, 240, 0.55)'
export const GRID_COLOR = 'rgba(148, 163, 184, 0.15)'
export const FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

export const DEFAULT_MARGIN = { top: 16, right: 20, bottom: 36, left: 44 }

/**
 * Pick a color from the categorical palette, cycling when the index exceeds
 * the palette length so large genre/director lists stay colorful.
 */
export function categoricalColor(index) {
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]
}

/**
 * Build the absolutely-positioned tooltip div used by every chart. Returning
 * an object with show/hide/move keeps call sites tiny and consistent.
 *
 * The container must be `position: relative` for the tooltip to anchor
 * correctly against its bounding box.
 */
export function createTooltip(container) {
  const el = document.createElement('div')
  el.className =
    'pointer-events-none absolute z-10 rounded-lg border border-amber-400/25 bg-[#080808]/95 px-3 py-2 text-xs text-gray-100 shadow-lg shadow-black/40 backdrop-blur-sm transition-opacity duration-150'
  el.style.opacity = '0'
  el.style.left = '0'
  el.style.top = '0'
  el.style.whiteSpace = 'nowrap'
  container.appendChild(el)

  return {
    el,
    show(html, event) {
      el.innerHTML = html
      el.style.opacity = '1'
      this.move(event)
    },
    move(event) {
      const rect = container.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const width = el.offsetWidth
      const height = el.offsetHeight
      // Offset from cursor and clamp to container so the tooltip never clips.
      const nextLeft = Math.min(Math.max(x + 12, 8), rect.width - width - 8)
      const nextTop = Math.min(Math.max(y - height - 12, 8), rect.height - height - 8)
      el.style.left = `${nextLeft}px`
      el.style.top = `${nextTop}px`
    },
    hide() {
      el.style.opacity = '0'
    },
    destroy() {
      el.remove()
    },
  }
}

/**
 * Observe a container element for width/height changes and run `callback`
 * whenever the measured size updates. Returns a disposer so callers can clean
 * up in `onBeforeUnmount` without tracking the observer by hand.
 */
export function observeSize(container, callback) {
  if (typeof ResizeObserver === 'undefined') {
    const handler = () => callback(container.getBoundingClientRect())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      callback(entry.contentRect)
    }
  })
  observer.observe(container)
  return () => observer.disconnect()
}

/**
 * Format a YYYY-MM key (e.g. "2025-04") into a human label ("Apr 2025").
 * Parsing with `Date.UTC` avoids timezone drift that would otherwise push the
 * month boundary around.
 */
export function formatMonth(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}$/.test(key)) return key
  const [year, month] = key.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))
  return date.toLocaleString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/**
 * Parse a YYYY-MM key into a JS Date anchored to UTC midnight of the first of
 * the month. Used for d3 time scales so ordering is unambiguous.
 */
export function parseMonth(key) {
  const [year, month] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1))
}

/**
 * Style a d3 axis selection so every chart's axes look identical: muted
 * labels, no domain line, and consistent typography.
 */
export function styleAxis(selection) {
  selection.selectAll('text')
    .attr('fill', AXIS_COLOR)
    .style('font-family', FONT_FAMILY)
    .style('font-size', '11px')
  selection.selectAll('line').attr('stroke', GRID_COLOR)
  selection.selectAll('path.domain').attr('stroke', GRID_COLOR)
}
