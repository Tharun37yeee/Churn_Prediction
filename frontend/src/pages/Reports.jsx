import React, { useState, useEffect, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { getDashboardSummary, getDashboardTrend, getRiskDistribution } from '../api'
import KPICard from '../components/KPICard'
import LoadingSpinner from '../components/LoadingSpinner'
import { TrendingDown, Users, AlertTriangle, DollarSign, FileText } from 'lucide-react'

const ChurnTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color }} className="text-xs">
            {entry.name}: <span className="font-bold">{Number(entry.value).toFixed(2)}%</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Reports() {
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [riskDist, setRiskDist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryRes, trendRes, riskRes] = await Promise.all([
        getDashboardSummary(),
        getDashboardTrend(),
        getRiskDistribution(),
      ])
      setSummary(summaryRes.data)
      setTrend(trendRes.data)
      const riskData = riskRes.data
      if (Array.isArray(riskData)) {
        setRiskDist(riskData)
      } else {
        setRiskDist(Object.entries(riskData).map(([name, value]) => ({ name, value })))
      }
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const avgChurn =
    trend.length > 0
      ? trend.reduce((sum, d) => sum + (d.churn_rate ?? d.value ?? 0), 0) / trend.length
      : null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">
        ⚠️ {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Churn Rate"
            value={`${Number(summary.churn_rate ?? 0).toFixed(1)}%`}
            icon={TrendingDown}
            iconColor="bg-red-100 text-red-600"
            trend="vs last month"
            trendUp={true}
          />
          <KPICard
            title="Active Customers"
            value={Number(summary.active_customers ?? 0).toLocaleString()}
            icon={Users}
            iconColor="bg-blue-100 text-blue-600"
            trend="stable"
            trendUp={false}
          />
          <KPICard
            title="High Risk"
            value={Number(summary.high_risk_customers ?? 0).toLocaleString()}
            icon={AlertTriangle}
            iconColor="bg-orange-100 text-orange-600"
            trend="needs attention"
            trendUp={true}
          />
          <KPICard
            title="Revenue at Risk"
            value={`$${((summary.revenue_at_risk ?? 0) / 1000).toFixed(0)}K`}
            icon={DollarSign}
            iconColor="bg-red-100 text-red-600"
            trend="critical"
            trendUp={true}
          />
        </div>
      )}

      {/* Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Churn Trend Report</h2>
            <p className="text-xs text-slate-400 mt-0.5">Month-by-month churn rate</p>
          </div>
          {avgChurn !== null && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
              Avg: {avgChurn.toFixed(2)}%
            </span>
          )}
        </div>

        {trend.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <TrendingDown size={40} className="mb-3 opacity-40" />
            <p className="text-sm">No trend data available yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<ChurnTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={(value) => <span style={{ color: '#64748b' }}>{value}</span>}
              />
              {avgChurn !== null && (
                <ReferenceLine
                  y={avgChurn}
                  stroke="#94a3b8"
                  strokeDasharray="6 3"
                  label={{
                    value: `Average ${avgChurn.toFixed(1)}%`,
                    position: 'insideTopRight',
                    fontSize: 10,
                    fill: '#94a3b8',
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey={trend[0]?.churn_rate !== undefined ? 'churn_rate' : 'value'}
                name="Churn %"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#0d9488', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#0d9488' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <FileText size={24} className="text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-700 mb-2">Full Reports Coming Soon</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Detailed PDF reports, export functionality, and advanced analytics will be available in the next version.
        </p>
      </div>
    </div>
  )
}
