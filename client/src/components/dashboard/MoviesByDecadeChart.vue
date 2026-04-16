<!--
  Movies by Decade dashboard chart.
  Redraws from props on data and container-size changes because D3 writes
  directly into the SVG instead of relying on Vue's template diff.
-->
<template>
  <div ref="containerRef" class="relative w-full">
    <svg ref="svgRef" class="block w-full" role="img" aria-label="Movies by decade bar chart" />
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
  const height = 300
  const margin = { ...DEFAULT_MARGIN, left: 48, right: 18, top: 20 }
  const innerWidth = Math.max(0, width - margin.left - margin.right)
  const innerHeight = Math.max(0, height - margin.top - margin.bottom)

  const selection = d3.select(svg)
  selection.selectAll('*').remove()
  selection
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  if (!props.data.length || innerWidth <= 0) return

  const group = selection.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)
  const xScale = d3.scaleBand()
    .domain(props.data.map((datum) => String(datum.decade)))
    .range([0, innerWidth])
    .padding(0.32)
  const maxCount = d3.max(props.data, (datum) => datum.count) || 1
  const yScale = d3.scaleLinear()
    .domain([0, maxCount])
    .nice()
    .range([innerHeight, 0])

  group
    .append('g')
    .call(d3.axisLeft(yScale).ticks(Math.min(5, maxCount)).tickSize(-innerWidth).tickFormat(() => ''))
    .call((axis) => axis.select('.domain').remove())
    .call((axis) => axis.selectAll('line').attr('stroke', 'rgba(255,255,255,0.08)').attr('stroke-dasharray', '3 5'))

  group
    .selectAll('rect.bar')
    .data(props.data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', (datum) => xScale(String(datum.decade)))
    .attr('y', (datum) => yScale(datum.count))
    .attr('width', xScale.bandwidth())
    .attr('height', (datum) => innerHeight - yScale(datum.count))
    .attr('rx', 10)
    .attr('fill', ACCENT)
    .attr('fill-opacity', 0.92)
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, datum) {
      d3.select(this).attr('fill-opacity', 1)
      tooltip?.show(
        `<div class="font-semibold text-amber-200">${datum.decade}s</div>
         <div>${datum.count} movie${datum.count === 1 ? '' : 's'} watched</div>`,
        event,
      )
    })
    .on('mousemove', (event) => tooltip?.move(event))
    .on('mouseleave', function () {
      d3.select(this).attr('fill-opacity', 0.92)
      tooltip?.hide()
    })

  group
    .selectAll('text.value')
    .data(props.data)
    .join('text')
    .attr('class', 'value')
    .attr('x', (datum) => xScale(String(datum.decade)) + xScale.bandwidth() / 2)
    .attr('y', (datum) => yScale(datum.count) - 10)
    .attr('text-anchor', 'middle')
    .attr('fill', 'rgba(255,255,255,0.75)')
    .style('font-family', FONT_FAMILY)
    .style('font-size', '11px')
    .style('font-weight', '600')
    .text((datum) => datum.count)

  const xAxis = d3.axisBottom(xScale).tickFormat((decade) => `${decade}s`).tickSizeOuter(0)
  const xAxisGroup = group.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(xAxis)
  styleAxis(xAxisGroup)

  const yAxis = d3.axisLeft(yScale).ticks(Math.min(5, maxCount)).tickFormat(d3.format('d')).tickSizeOuter(0)
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
