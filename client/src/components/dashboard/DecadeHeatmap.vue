<template>
  <div ref="containerRef" class="relative w-full">
    <svg ref="svgRef" class="block w-full" role="img" aria-label="Decade by genre heatmap" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'
import {
  FONT_FAMILY,
  createTooltip,
  observeSize,
  styleAxis,
} from './chartUtils.js'

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const containerRef = ref(null)
const svgRef = ref(null)
let tooltip = null
let disposeResize = null

function render() {
  const container = containerRef.value
  const svg = svgRef.value
  if (!container || !svg) return

  const width = container.clientWidth || 320
  const margin = { top: 16, right: 16, bottom: 36, left: 100 }

  const selection = d3.select(svg)
  selection.selectAll('*').remove()

  if (!props.data.length) {
    // Keep a minimum height so the card doesn't collapse on empty data.
    selection.attr('width', width).attr('height', 160).attr('viewBox', `0 0 ${width} 160`)
    return
  }

  const decades = Array.from(new Set(props.data.map((datum) => datum.decade))).sort((a, b) => a - b)
  // Genres ordered by total movies so the densest rows sit at the top.
  const totalsByGenre = d3.rollup(props.data, (values) => d3.sum(values, (datum) => datum.count), (datum) => datum.genre)
  const genres = [...totalsByGenre.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre)

  const rowHeight = 28
  const innerHeight = genres.length * rowHeight
  const height = innerHeight + margin.top + margin.bottom
  const innerWidth = Math.max(0, width - margin.left - margin.right)

  selection
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  const xScale = d3.scaleBand().domain(decades).range([0, innerWidth]).padding(0.08)
  const yScale = d3.scaleBand().domain(genres).range([0, innerHeight]).padding(0.12)
  const maxCount = d3.max(props.data, (datum) => datum.count) || 1
  // Start the color domain slightly below zero so even count=1 cells stay
  // visible against the dark card background.
  const color = d3.scaleSequential(d3.interpolatePurples).domain([-maxCount * 0.25, maxCount])

  const group = selection.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

  group
    .selectAll('rect.heat-cell')
    .data(props.data)
    .join('rect')
    .attr('class', 'heat-cell')
    .attr('x', (datum) => xScale(datum.decade))
    .attr('y', (datum) => yScale(datum.genre))
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .attr('rx', 4)
    .attr('fill', (datum) => color(datum.count))
    .attr('stroke', 'rgba(148, 163, 184, 0.15)')
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, datum) {
      d3.select(this).attr('stroke', '#a78bfa').attr('stroke-width', 2)
      tooltip?.show(
        `<div class="font-semibold text-violet-200">${datum.decade}s · ${datum.genre}</div>
         <div>${datum.count} movie${datum.count === 1 ? '' : 's'}</div>`,
        event,
      )
    })
    .on('mousemove', (event) => tooltip?.move(event))
    .on('mouseleave', function () {
      d3.select(this).attr('stroke', 'rgba(148, 163, 184, 0.15)').attr('stroke-width', 1)
      tooltip?.hide()
    })

  const xAxis = d3.axisBottom(xScale).tickFormat((decade) => `${decade}s`).tickSizeOuter(0)
  const xAxisGroup = group.append('g').attr('transform', `translate(0, ${innerHeight})`).call(xAxis)
  styleAxis(xAxisGroup)

  const yAxis = d3.axisLeft(yScale).tickSizeOuter(0)
  const yAxisGroup = group.append('g').call(yAxis)
  styleAxis(yAxisGroup)

  selection.selectAll('text').style('font-family', FONT_FAMILY)
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
