/**
 * @file BaseReasonTag.vue
 * @description 离场原因分类标签（止盈/止损/其他）
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

<template>
  <span
    class="reason-tag"
    :class="`reason-tag--${normalizedType}`"
  >
    {{ displayText }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { formatReasonType } from '@/utils/format'

const props = defineProps({
  /** 原因类型：take_profit / stop_loss / other */
  reasonType: {
    type: String,
    default: 'other'
  },
  /** 自定义展示文案；为空则显示类型名 */
  label: {
    type: String,
    default: ''
  }
})

const normalizedType = computed(() => {
  if (['take_profit', 'stop_loss', 'other'].includes(props.reasonType)) {
    return props.reasonType
  }
  return 'other'
})

const displayText = computed(() => {
  if (props.label) {
    return props.label
  }
  return formatReasonType(normalizedType.value)
})
</script>
