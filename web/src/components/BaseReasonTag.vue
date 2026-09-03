/**
 * @file BaseReasonTag.vue
 * @description 离场原因分类标签（止盈/止损/其他）
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */
<template>
  <span class="reason-tag" :class="`reason-tag--${normalizedType}`">{{ displayText }}</span>
</template>
<script setup>
import { computed } from 'vue'
import { formatReasonType } from '@/utils/format'
const props = defineProps({ reasonType: { type: String, default: 'other' }, label: { type: String, default: '' } })
const normalizedType = computed(() => ['take_profit','stop_loss','other'].includes(props.reasonType) ? props.reasonType : 'other')
const displayText = computed(() => props.label || formatReasonType(normalizedType.value))
</script>