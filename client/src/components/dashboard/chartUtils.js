// Shared helpers for the Taste Dashboard D3 charts so each component can focus
// on its own drawing logic without duplicating tooltip/layout boilerplate.

// Categorical palette for genres and directors, re-tuned for the amber glass
// retheme while keeping enough contrast between neighboring series.
export const CATEGORICAL_PALETTE = [
  '#f5b44f',
  '#f59e0b',
  '#d97706',
  '#f97316',
  '#fb7185',
  '#38bdf8',
  '#2dd4bf',
  '#6ee7b7',
  '#a3e635',
  '#facc15',
  '#c084fc',
  '#93c5fd',
]

export const ACCENT = '#f5b44f'
export const AXIS_COLOR = 'rgba(236, 229, 218, 0.58)'
export const GRID_COLOR = 'rgba(255, 255, 255, 0.08)'
export const FONT_FAMILY =
  '"Manrope", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'

export const DEFAULT_MARGIN = { top: 16, right: 20, bottom: 36, left: 44 }

export function categoricalColor(index) {
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]
}

export function createTooltip(container) {
  const el = document.createElement('div')
  el.className =
    'glass-panel-soft pointer-events-none absolute z-10 px-3 py-2 text-xs text-[#fff6e7] shadow-[0_18px_48px_rgba(0,0,0,0.32)] transition-opacity duration-150'
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

export function formatMonth(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}$/.test(key)) return key
  const [year, month] = key.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))
  return date.toLocaleString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function parseMonth(key) {
  const [year, month] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1))
}

export function styleAxis(selection) {
  selection.selectAll('text')
    .attr('fill', AXIS_COLOR)
    .style('font-family', FONT_FAMILY)
    .style('font-size', '11px')
  selection.selectAll('line').attr('stroke', GRID_COLOR)
  selection.selectAll('path.domain').attr('stroke', GRID_COLOR)
}
