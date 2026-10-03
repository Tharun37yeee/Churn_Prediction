import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from 'recharts'
import {
  TrendingDown,
  Users,
  AlertTriangle,
  DollarSign,
  Plus,
} from 'lucide-react'
import {
  getDashboardSummary,
  getDashboardTrend,
  getRiskDistribution,
  getCustomers,
} from '../api'
import KPICard from '../components/KPICard'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'

const RISK_COLORS = {
  High: '#ef4444',
  Medium: '#f97316',
  Low: '#22c55e',
}

// Custom active shape for Donut
const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props

  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#1e293b" className="text-base font-bold" style={{ fontSize: 22, fontWeight: 700 }}>
        {value}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#64748b" style={{ fontSize: 12 }}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  )
}

// Custom tooltip for line chart
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

// Table skeleton
function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3 mt-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <div className="h-4 bg-slate-200 rounded w-36" />
          <div className="h-4 bg-slate-200 rounded flex-1" />
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-8 bg-slate-200 rounded w-20" />
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [riskDist, setRiskDist] = useState([])
  const [atRisk, setAtRisk] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)

  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingTrend, setLoadingTrend] = useState(true)
  const [loadingRisk, setLoadingRisk] = useState(true)
  const [loadingTable, setLoadingTable] = useState(true)

  const [errorSummary, setErrorSummary] = useState(null)
  const [errorTrend, setErrorTrend] = useState(null)
  const [errorRisk, setErrorRisk] = useState(null)
  const [errorTable, setErrorTable] = useState(null)

  const fetchAll = useCallback(async () => {
    // Summary
    setLoadingSummary(true)
    setErrorSummary(null)
    try {
      const res = await getDashboardSummary()
      setSummary(res.data)
    } catch (e) {
      setErrorSummary(e.response?.data?.detail || e.message || 'Failed to load summary')
    } finally {
      setLoadingSummary(false)
    }

    // Trend
    setLoadingTrend(true)
    setErrorTrend(null)
    try {
      const res = await getDashboardTrend()
      setTrend(res.data)
    } catch (e) {
      setErrorTrend(e.response?.data?.detail || e.message || 'Failed to load trend data')
    } finally {
      setLoadingTrend(false)
    }

    // Risk distribution
    setLoadingRisk(true)
    setErrorRisk(null)
    try {
      const res = await getRiskDistribution()
      // Expect [{name, value}] or {High: n, Medium: n, Low: n}
      const data = res.data
      if (Array.isArray(data)) {
        setRiskDist(data)
      } else {
        setRiskDist(
          Object.entries(data).map(([name, value]) => ({ name, value }))
        )
      }
    } catch (e) {
      setErrorRisk(e.response?.data?.detail || e.message || 'Failed to load risk distribution')
    } finally {
      setLoadingRisk(false)
    }

    // At-risk customers
    setLoadingTable(true)
    setErrorTable(null)
    try {
      const res = await getCustomers({ risk_filter: 'High', page_size: 5, page: 1 })
      const data = res.data
      // Support both {customers: [...]} and direct array
      if (Array.isArray(data)) {
        setAtRisk(data)
      } else if (data.customers) {
        setAtRisk(data.customers)
      } else if (data.items) {
        setAtRisk(data.items)
      } else {
        setAtRisk([])
      }
    } catch (e) {
      setErrorTable(e.response?.data?.detail || e.message || 'Failed to load at-risk customers')
    } finally {
      setLoadingTable(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Compute average churn for reference line
  const avgChurn =
    trend.length > 0
      ? trend.reduce((sum, d) => sum + (d.churn_rate ?? d.value ?? 0), 0) / trend.length
      : null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            Customer Churn Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Monitor real-time churn risk metrics, trends, and high-risk accounts.
          </p>
        </div>
        <Link
          to="/predict"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 self-start sm:self-auto"
          style={{ backgroundColor: '#0d9488' }}
        >
          <Plus size={16} />
          New Prediction
        </Link>
      </div>

      {/* KPI Cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-4" />
              <div className="h-8 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : errorSummary ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          ⚠️ {errorSummary}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Predicted Churn Rate"
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
            title="High Risk Customers"
            value={Number(summary.high_risk_count ?? summary.high_risk_customers ?? 0).toLocaleString()}
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
      ) : null}

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Month-by-month Churn %</h2>
              <p className="text-xs text-slate-400 mt-0.5">Monthly churn rate trend</p>
            </div>
            {avgChurn !== null && (
              <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
                Avg: {avgChurn.toFixed(2)}%
              </span>
            )}
          </div>

          {loadingTrend ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : errorTrend ? (
            <div className="flex items-center justify-center h-64 text-red-500 text-sm">
              ⚠️ {errorTrend}
            </div>
          ) : trend.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <TrendingDown size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">No trend data available yet</p>
              <p className="text-xs mt-1">Make some predictions to see data here</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="churnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  formatter={(value) => (
                    <span style={{ color: '#64748b' }}>{value}</span>
                  )}
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

        {/* Donut Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-800">At-Risk Customers Overview</h2>
            <p className="text-xs text-slate-400 mt-0.5">Distribution by risk level</p>
          </div>

          {loadingRisk ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : errorRisk ? (
            <div className="flex items-center justify-center h-64 text-red-500 text-sm">
              ⚠️ {errorRisk}
            </div>
          ) : riskDist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <p className="text-sm">No risk data available</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={riskDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                  >
                    {riskDist.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={RISK_COLORS[entry.name] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} customers`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Custom legend */}
              <div className="flex flex-col gap-2 mt-2">
                {riskDist.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: RISK_COLORS[entry.name] || '#94a3b8' }}
                      />
                      <span className="text-slate-600">{entry.name} Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{entry.value}</span>
                      {riskDist.reduce((s, d) => s + d.value, 0) > 0 && (
                        <span className="text-xs text-slate-400">
                          ({((entry.value / riskDist.reduce((s, d) => s + d.value, 0)) * 100).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* At-Risk Customers Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Recent High-Risk Customers</h2>
            <p className="text-xs text-slate-400 mt-0.5">Customers with highest churn probability</p>
          </div>
          <Link
            to="/customers?risk_filter=High"
            className="text-sm font-medium hover:underline"
            style={{ color: '#0d9488' }}
          >
            View all →
          </Link>
        </div>

        {loadingTable ? (
          <TableSkeleton />
        ) : errorTable ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            ⚠️ {errorTable}
          </div>
        ) : atRisk.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Users size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">No high-risk customers found</p>
            <p className="text-xs mt-1">Make predictions to see at-risk customers here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                    Customer Name
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                    Churn Score
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                    Risk Level
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                    Joined Date
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {atRisk.map((customer) => {
                  const prob =
                    customer.churn_probability ?? customer.latest_churn_probability ?? 0
                  const pct = (prob * 100).toFixed(1)

                  return (
                    <tr key={customer.id ?? customer.customer_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                            {(customer.name || customer.customer_id || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {customer.name || customer.customer_id || `Customer ${customer.id}`}
                            </p>
                            <p className="text-xs text-slate-400">
                              ID: {customer.customer_id || customer.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-24">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(prob * 100, 100)}%`,
                                backgroundColor: '#0d9488',
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 w-10">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <RiskBadge level={customer.risk_level ?? customer.risk_category ?? 'High'} />
                      </td>
                      <td className="py-3 pr-4 text-slate-500 text-xs">
                        {customer.date_added || customer.created_at
                          ? new Date(customer.date_added || customer.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3">
                        <Link
                          to={`/customers/${customer.id ?? customer.customer_id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors hover:opacity-80"
                          style={{ backgroundColor: '#1e293b' }}
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
