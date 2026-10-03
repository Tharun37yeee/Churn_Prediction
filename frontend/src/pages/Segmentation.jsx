import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { getRiskDistribution } from '../api'
import LoadingSpinner from '../components/LoadingSpinner'
import RiskBadge from '../components/RiskBadge'
import { Info } from 'lucide-react'

const RISK_COLORS = {
  High: '#ef4444',
  Medium: '#f97316',
  Low: '#22c55e',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700">{label} Risk</p>
        <p className="text-slate-600">
          Customers: <span className="font-bold">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

export default function Segmentation() {
  const [riskDist, setRiskDist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getRiskDistribution()
      const data = res.data
      if (Array.isArray(data)) {
        setRiskDist(data)
      } else {
        setRiskDist(
          Object.entries(data).map(([name, value]) => ({ name, value }))
        )
      }
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to load segmentation data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const total = riskDist.reduce((s, d) => s + (d.value || 0), 0)

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4 text-sm">
        <Info size={16} className="flex-shrink-0 mt-0.5" />
        <span>Segments are computed from latest predictions per customer.</span>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-800">Risk Segment Distribution</h2>
          <p className="text-xs text-slate-400 mt-0.5">Number of customers per risk segment</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            ⚠️ {error}
          </div>
        ) : riskDist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <p className="text-sm">No segmentation data available yet</p>
            <p className="text-xs mt-1">Make predictions to see segments</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskDist} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                {riskDist.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={RISK_COLORS[entry.name] || '#94a3b8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Breakdown table */}
      {!loading && !error && riskDist.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Segment Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">Risk Segment</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">Customers</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">Percentage</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {riskDist.map((segment) => {
                  const pct = total > 0 ? ((segment.value / total) * 100).toFixed(1) : 0
                  return (
                    <tr key={segment.name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4">
                        <RiskBadge level={segment.name} />
                      </td>
                      <td className="py-3 pr-4 font-semibold text-slate-800">
                        {segment.value.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{pct}%</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[200px]">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: RISK_COLORS[segment.name] || '#94a3b8',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {total > 0 && (
                  <tr className="border-t-2 border-slate-200">
                    <td className="py-3 pr-4 font-semibold text-slate-700">Total</td>
                    <td className="py-3 pr-4 font-bold text-slate-800">{total.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-slate-600">100%</td>
                    <td className="py-3" />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
