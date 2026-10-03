import React from 'react'

const riskConfig = {
  High: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  Medium: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  Low: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
}

export default function RiskBadge({ level }) {
  const config = riskConfig[level] || riskConfig['Low']

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {level}
    </span>
  )
}
