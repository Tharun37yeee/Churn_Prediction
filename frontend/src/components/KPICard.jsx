import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function KPICard({ title, value, icon: Icon, iconColor, trend, trendUp }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}
        >
          {Icon && <Icon size={20} />}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              trendUp ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {trendUp ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  )
}
