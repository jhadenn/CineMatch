<!--
  Favorite Genres dashboard chart.
  Renders the backend genre breakdown as a donut chart with a compact legend.
-->
<template>
  <div ref="containerRef" class="relative w-full">
    <svg ref="svgRef" class="block w-full" role="img" aria-label="Genre breakdown donut chart" />
    <ul
      v-if="data.length"
      class="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-300"
    >
      <li
        v-for="(entry, index) in data"
        :key="entry.genre"
        class="inline-flex items-center gap-1.5"
      >
        <span
          class="inline-block w-2.5 h-2.5 rounded-full"
          :style="{ backgroundColor: colorFor(index) }"
        />
        <span>{{ entry.genre }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'
import {
  ACCENT,
  FONT_FAMILY,
  categoricalColor,
  createTooltip,
  observeSize,
} from './chartUtils.js'

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const containerRef = ref(null)
const svgRef = ref(null)
let tooltip = null
let disposeResize = null

function colorFor(index) {
  return categoricalColor(index)
}

function render() {
  const container = containerRef.value
  const svg = svgRef.value
  if (!container || !svg) return

  const width = container.clientWidth || 320
  // Square-ish donut keeps the card balanced on mobile and desktop alike.
  const height = Math.max(220, Math.min(320, width * 0.8))
  const radius = Math.min(width, height) / 2
  const innerRadius = radius * 0.58

  const selection = d3.select(svg)
  selection.selectAll('*').remove()
  selection
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  if (!props.data.length) return

  const group = selection.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`)
  const total = d3.sum(props.data, (datum) => datum.count) || 1
  const pie = d3.pie().value((datum) => datum.count).sort(null)
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius - 4)
  const hoverArc = d3.arc().innerRadius(innerRadius).outerRadius(radius)

  group
    .selectAll('path')
    .data(pie(props.data))
    .join('path')
    .attr('d', arc)
    .attr('fill', (_, index) => categoricalColor(index))
    .attr('stroke', '#09090b')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, datum) {
      d3.select(this).transition().duration(120).attr('d', hoverArc)
      const pct = ((datum.data.count / total) * 100).toFixed(1)
      tooltip?.show(
        `<div class="font-semibold text-amber-200">${datum.data.genre}</div>
         <div>${datum.data.count} movie${datum.data.count === 1 ? '' : 's'} · ${pct}%</div>`,
        event,
      )
    })
    .on('mousemove', (event) => tooltip?.move(event))
    .on('mouseleave', function () {
      d3.select(this).transition().duration(120).attr('d', arc)
      tooltip?.hide()
    })

  // Center label with the headline stat — reinforces what the donut is showing.
  const centerGroup = group.append('g').attr('text-anchor', 'middle')
  centerGroup
    .append('text')
    .attr('y', -6)
    .attr('fill', ACCENT)
    .style('font-family', FONT_FAMILY)
    .style('font-size', '28px')
    .style('font-weight', '700')
    .text(total)
  centerGroup
    .append('text')
    .attr('y', 16)
    .attr('fill', 'rgba(226, 232, 240, 0.6)')
    .style('font-family', FONT_FAMILY)
    .style('font-size', '11px')
    .style('letter-spacing', '0.15em')
    .style('text-transform', 'uppercase')
    .text('Genre tags')
}

onMounted(() => {
  tooltip = createTooltip(containerRef.value)
  render()
  disposeResize = observeSize(containerRef.value, render)
})

onBeforeUnmount(() => {
  disposeResize?.()
  tooltip?.destroy()
})

watch(() => props.data, render, { deep: true })
</script>
