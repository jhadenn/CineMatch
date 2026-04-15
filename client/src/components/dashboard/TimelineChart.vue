<template>
  <div ref="containerRef" class="relative w-full">
    <svg ref="svgRef" class="block w-full" role="img" aria-label="Watch history timeline" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'
import {
  ACCENT,
  DEFAULT_MARGIN,
  FONT_FAMILY,
  createTooltip,
  formatMonth,
  observeSize,
  parseMonth,
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
  const height = 260
  const margin = { ...DEFAULT_MARGIN, right: 24 }
  const innerWidth = Math.max(0, width - margin.left - margin.right)
  const innerHeight = Math.max(0, height - margin.top - margin.bottom)

  const selection = d3.select(svg)
  selection.selectAll('*').remove()
  selection
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  if (!props.data.length || innerWidth <= 0) return

  const points = props.data.map((datum) => ({
    ...datum,
    date: parseMonth(datum.month),
  }))

  const group = selection.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

  const xScale = (points.length === 1
    ? d3.scaleTime().domain([
        new Date(points[0].date.getTime() - 1000 * 60 * 60 * 24 * 15),
        new Date(points[0].date.getTime() + 1000 * 60 * 60 * 24 * 15),
      ])
    : d3.scaleTime().domain(d3.extent(points, (datum) => datum.date))
  ).range([0, innerWidth])

  const maxCount = d3.max(points, (datum) => datum.count) || 1
  const yScale = d3.scaleLinear().domain([0, maxCount]).nice().range([innerHeight, 0])

  // Horizontal grid lines give the eye a baseline without competing with data.
  group
    .append('g')
    .call(d3.axisLeft(yScale).ticks(Math.min(5, maxCount)).tickSize(-innerWidth).tickFormat(() => ''))
    .call((g) => g.select('.domain').remove())
    .call((g) => g.selectAll('line').attr('stroke', 'rgba(148, 163, 184, 0.12)').attr('stroke-dasharray', '3 4'))

  // Cap ticks so dense histories don't produce an unreadable axis.
  const xAxis = d3.axisBottom(xScale)
    .ticks(Math.min(points.length, 6))
    .tickSizeOuter(0)
    .tickFormat((date) => d3.timeFormat('%b %Y')(date))
  const xAxisGroup = group.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(xAxis)
  styleAxis(xAxisGroup)

  const yAxis = d3.axisLeft(yScale).ticks(Math.min(5, maxCount)).tickFormat(d3.format('d')).tickSizeOuter(0)
  const yAxisGroup = group.append('g').call(yAxis)
  styleAxis(yAxisGroup)

  const area = d3.area()
    .curve(d3.curveMonotoneX)
    .x((datum) => xScale(datum.date))
    .y0(innerHeight)
    .y1((datum) => yScale(datum.count))

  const line = d3.line()
    .curve(d3.curveMonotoneX)
    .x((datum) => xScale(datum.date))
    .y((datum) => yScale(datum.count))

  // Gradient fill softens the area under the line so the chart reads as a
  // single gesture instead of competing with the axis labels.
  const gradientId = `timeline-gradient-${Math.random().toString(36).slice(2, 8)}`
  const defs = selection.append('defs')
  const gradient = defs.append('linearGradient')
    .attr('id', gradientId)
    .attr('x1', '0').attr('x2', '0')
    .attr('y1', '0').attr('y2', '1')
  gradient.append('stop').attr('offset', '0%').attr('stop-color', ACCENT).attr('stop-opacity', 0.35)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', ACCENT).attr('stop-opacity', 0)

  group.append('path')
    .datum(points)
    .attr('fill', `url(#${gradientId})`)
    .attr('d', area)

  group.append('path')
    .datum(points)
    .attr('fill', 'none')
    .attr('stroke', ACCENT)
    .attr('stroke-width', 2)
    .attr('d', line)

  // Invisible hit-targets layered beneath the visible dots so users can hover a
  // wider area and still get the tooltip.
  group
    .selectAll('.timeline-dot')
    .data(points)
    .join('circle')
    .attr('class', 'timeline-dot')
    .attr('cx', (datum) => xScale(datum.date))
    .attr('cy', (datum) => yScale(datum.count))
    .attr('r', 4)
    .attr('fill', '#0b0b14')
    .attr('stroke', ACCENT)
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, datum) {
      d3.select(this).transition().duration(120).attr('r', 6)
      tooltip?.show(
        `<div class="font-semibold text-amber-200">${formatMonth(datum.month)}</div>
         <div>${datum.count} movie${datum.count === 1 ? '' : 's'} watched</div>`,
        event,
      )
    })
    .on('mousemove', (event) => tooltip?.move(event))
    .on('mouseleave', function () {
      d3.select(this).transition().duration(120).attr('r', 4)
      tooltip?.hide()
    })

  // Font family hook for the axes.
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
