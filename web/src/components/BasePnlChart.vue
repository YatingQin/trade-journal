/**
 * @file BasePnlChart.vue
 * @description 累计收益曲线图（TradingView 暗色风格）
 * @author QYT
 * @date 2026-09-04
 * @version 1.0.0
 */

<template>
  <div class="chart-wrap">
    <canvas ref="canvasRef" />
    <p v-if="!hasData" class="empty-state">暂无足够数据绘制曲线</p>
  </div>
</template>

<script setup>
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend } from 'chart.js'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
)

const props = defineProps({
  /** 曲线标题 */
  title: {
    type: String,
    default: ''
  },
  /** 数据点 [{ date, cumulative_pnl }] */
  points: {
    type: Array,
    default: () => []
  },
  /** 线颜色 */
  color: {
    type: String,
    default: '#2962ff'
  },
  /** Y 轴单位文案 */
  unit: {
    type: String,
    default: ''
  }
})

const canvasRef = ref(null)
const chartInstance = ref(null)

const hasData = computed(() => Array.isArray(props.points) && props.points.length > 0)

/**
 * @description 渲染或更新图表
 * @returns {void}
 */
function renderChart() {
  if (!canvasRef.value) {
    return
  }

  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }

  if (!hasData.value) {
    return
  }

  const labels = props.points.map((item) => item.date)
  const values = props.points.map((item) => item.cumulative_pnl)

  chartInstance.value = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: props.title || '累计盈亏',
          data: values,
          borderColor: props.color,
          backgroundColor: `${props.color}33`,
          borderWidth: 2,
          pointRadius: values.length > 40 ? 0 : 3,
          pointHoverRadius: 4,
          tension: 0.25,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: Boolean(props.title),
          labels: {
            color: '#d1d4dc'
          }
        },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.parsed.y
              const unitText = props.unit ? ` ${props.unit}` : ''
              return `${context.dataset.label}: ${Number(value).toFixed(2)}${unitText}`
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#787b86',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6
          },
          grid: {
            color: 'rgba(42, 46, 57, 0.8)'
          }
        },
        y: {
          ticks: {
            color: '#787b86',
            callback(value) {
              const unitText = props.unit ? ` ${props.unit}` : ''
              return `${value}${unitText}`
            }
          },
          grid: {
            color: 'rgba(42, 46, 57, 0.8)'
          }
        }
      }
    }
  })
}

watch(
  () => [props.points, props.color, props.title, props.unit],
  () => {
    renderChart()
  },
  { deep: true }
)

onMounted(() => {
  renderChart()
})

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})
</script>

<style scoped>
.chart-wrap {
  position: relative;
  height: 240px;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
}
</style>
