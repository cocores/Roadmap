import { CORE_VALUES, JOURNEYS, PMS, coreValueColor, journeyColor, pmColor } from './constants'

export const HEALTH_BAR = { Green: 'bg-green-500', Yellow: 'bg-yellow-400', Red: 'bg-red-500' }
export const HEALTH_DOT = { Green: 'bg-green-500', Yellow: 'bg-yellow-400', Red: 'bg-red-500' }

// How the timeline rows are grouped.
export const TIMELINE_GROUPS = {
  journey: { label: 'Journey', key: (i) => i.journey, order: JOURNEYS.map((j) => j.name), color: journeyColor },
  pm: { label: 'PM', key: (i) => i.pm, order: PMS.map((p) => p.name), color: pmColor },
  coreValue: {
    label: 'Core value',
    key: (i) => i.coreValue || 'No core value',
    order: [...CORE_VALUES.map((c) => c.name), 'No core value'],
    color: coreValueColor,
  },
}
