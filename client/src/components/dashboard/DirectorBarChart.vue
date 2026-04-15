<template>
  <div ref="containerRef" class="relative w-full">
    <svg ref="svgRef" class="block w-full" role="img" aria-label="Top watched directors bar chart" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'
import {
  ACCENT,
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
  // Longer names need more left-side room; 140px fits "Christopher Nolan" style.
  const margin = { top: 8, right: 28, bottom: 28, left: 140 }

  const selection = d3.select(svg)
  selection.selectAll('*').remove()

  if (!props.data.length) {
    selection.attr('width', width).attr('height', 160).attr('viewBox', `0 0 ${width} 160`)
    return
  }

  const sorted = [...props.data].sort((a, b) => b.count - a.count)
  const barHeight = 26
  const innerHeight = sorted.length * barHeight
  const height = innerHeight + margin.top + margin.bottom
  const innerWidth = Math.max(0, width - margin.left - margin.right)

  selection
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  const yScale = d3.scaleBand()
    .domain(sorted.map((datum) => datum.director))
    .range([0, innerHeight])
    .padding(0.25)

  const maxCount = d3.max(sorted, (datum) => datum.count) || 1
  const xScale = d3.scaleLinear().domain([0, maxCount]).nice().range([0, innerWidth])

  const group = selection.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

  // Subtle track behind each bar helps the eye follow rows across the chart.
  group
    .selectAll('rect.bar-track')
    .data(sorted)
    .join('rect')
    .attr('class', 'bar-track')
    .attr('x', 0)
    .attr('y', (datum) => yScale(datum.director))
    .attr('width', innerWidth)
    .attr('height', yScale.bandwidth())
    .attr('rx', 6)
    .attr('fill', 'rgba(148, 163, 184, 0.07)')

  group
    .selectAll('rect.bar')
    .data(sorted)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', (datum) => yScale(datum.director))
    .attr('width', (datum) => xScale(datum.count))
    .attr('height', yScale.bandwidth())
    .attr('rx', 6)
    .attr('fill', ACCENT)
    .attr('fill-opacity', 0.85)
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, datum) {
      d3.select(this).attr('fill-opacity', 1)
      tooltip?.show(
        `<div class="font-semibold text-violet-200">${datum.director}</div>
         <div>${datum.count} movie${datum.count === 1 ? '' : 's'} watched</div>`,
        event,
      )
    })
    .on('mousemove', (event) => tooltip?.move(event))
    .on('mouseleave', function () {
      d3.select(this).attr('fill-opacity', 0.85)
      tooltip?.hide()
    })

  // Count label at the end of each bar — easier to read than reading off the axis.
  group
    .selectAll('text.bar-value')
    .data(sorted)
    .join('text')
    .attr('class', 'bar-value')
    .attr('x', (datum) => xScale(datum.count) + 8)
    .attr('y', (datum) => yScale(datum.director) + yScale.bandwidth() / 2 + 4)
    .attr('fill', 'rgba(226, 232, 240, 0.85)')
    .style('font-family', FONT_FAMILY)
    .style('font-size', '11px')
    .style('font-weight', '600')
    .text((datum) => datum.count)

  const yAxis = d3.axisLeft(yScale).tickSize(0).tickPadding(12)
  const yAxisGroup = group.append('g').call(yAxis)
  yAxisGroup.select('.domain').remove()
  styleAxis(yAxisGroup)

  const xAxis = d3.axisBottom(xScale).ticks(Math.min(5, maxCount)).tickFormat(d3.format('d')).tickSizeOuter(0)
  const xAxisGroup = group.append('g').attr('transform', `translate(0, ${innerHeight})`).call(xAxis)
  styleAxis(xAxisGroup)

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
