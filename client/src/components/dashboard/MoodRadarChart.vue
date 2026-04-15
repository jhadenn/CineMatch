<template>
  <div ref="containerRef" class="relative w-full">
    <svg ref="svgRef" class="block w-full" role="img" aria-label="Mood preferences radar chart" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'
import { ACCENT, FONT_FAMILY, createTooltip, observeSize } from './chartUtils.js'

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const containerRef = ref(null)
const svgRef = ref(null)
let tooltip = null
let disposeResize = null

function pointFor(angle, radius) {
  return [Math.cos(angle) * radius, Math.sin(angle) * radius]
}

function render() {
  const container = containerRef.value
  const svg = svgRef.value
  if (!container || !svg) return

  const width = container.clientWidth || 320
  const height = Math.max(280, Math.min(360, width * 0.8))
  const size = Math.min(width, height)
  const radius = Math.max(0, size / 2 - 56)
  const centerX = width / 2
  const centerY = height / 2 + 6
  const selection = d3.select(svg)

  selection.selectAll('*').remove()
  selection
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  if (!props.data.length || radius <= 0) return

  const group = selection.append('g').attr('transform', `translate(${centerX}, ${centerY})`)
  const totalAxes = props.data.length
  const angleStep = (Math.PI * 2) / totalAxes
  const levels = [20, 40, 60, 80, 100]
  const radarLine = d3.line().curve(d3.curveLinearClosed)

  group
    .selectAll('path.grid')
    .data(levels)
    .join('path')
    .attr('class', 'grid')
    .attr('d', (level) => radarLine(props.data.map((_, index) => {
      const angle = -Math.PI / 2 + index * angleStep
      return pointFor(angle, (radius * level) / 100)
    })))
    .attr('fill', 'none')
    .attr('stroke', 'rgba(255,255,255,0.08)')
    .attr('stroke-width', 1)

  group
    .selectAll('line.axis')
    .data(props.data)
    .join('line')
    .attr('class', 'axis')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', (_, index) => {
      const [x] = pointFor(-Math.PI / 2 + index * angleStep, radius)
      return x
    })
    .attr('y2', (_, index) => {
      const [, y] = pointFor(-Math.PI / 2 + index * angleStep, radius)
      return y
    })
    .attr('stroke', 'rgba(255,255,255,0.12)')
    .attr('stroke-width', 1)

  group
    .selectAll('text.level')
    .data(levels)
    .join('text')
    .attr('class', 'level')
    .attr('x', 0)
    .attr('y', (level) => -((radius * level) / 100) + 4)
    .attr('text-anchor', 'middle')
    .attr('fill', 'rgba(255,255,255,0.35)')
    .style('font-family', FONT_FAMILY)
    .style('font-size', '10px')
    .text((level) => `${level}`)

  const polygonPoints = props.data.map((datum, index) => {
    const angle = -Math.PI / 2 + index * angleStep
    const scoreRadius = (radius * datum.score) / 100
    const [x, y] = pointFor(angle, scoreRadius)
    return { ...datum, x, y }
  })

  group.append('path')
    .datum(polygonPoints)
    .attr('d', radarLine(polygonPoints.map((point) => [point.x, point.y])))
    .attr('fill', ACCENT)
    .attr('fill-opacity', 0.22)
    .attr('stroke', ACCENT)
    .attr('stroke-width', 2)

  group
    .selectAll('circle.point')
    .data(polygonPoints)
    .join('circle')
    .attr('class', 'point')
    .attr('cx', (datum) => datum.x)
    .attr('cy', (datum) => datum.y)
    .attr('r', 4.5)
    .attr('fill', ACCENT)
    .attr('stroke', '#111111')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, datum) {
      d3.select(this).attr('r', 6)
      tooltip?.show(
        `<div class="font-semibold text-amber-200">${datum.mood}</div>
         <div>${datum.score}% strength</div>
         <div>${datum.rawCount} tagged genre${datum.rawCount === 1 ? '' : 's'}</div>`,
        event,
      )
    })
    .on('mousemove', (event) => tooltip?.move(event))
    .on('mouseleave', function () {
      d3.select(this).attr('r', 4.5)
      tooltip?.hide()
    })

  group
    .selectAll('text.label')
    .data(props.data)
    .join('text')
    .attr('class', 'label')
    .attr('x', (_, index) => {
      const [x] = pointFor(-Math.PI / 2 + index * angleStep, radius + 18)
      return x
    })
    .attr('y', (_, index) => {
      const [, y] = pointFor(-Math.PI / 2 + index * angleStep, radius + 18)
      return y
    })
    .attr('text-anchor', (_, index) => {
      const angle = -Math.PI / 2 + index * angleStep
      const cos = Math.cos(angle)
      if (cos > 0.25) return 'start'
      if (cos < -0.25) return 'end'
      return 'middle'
    })
    .attr('dominant-baseline', 'middle')
    .attr('fill', 'rgba(255,255,255,0.72)')
    .style('font-family', FONT_FAMILY)
    .style('font-size', '12px')
    .text((datum) => datum.mood)
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
