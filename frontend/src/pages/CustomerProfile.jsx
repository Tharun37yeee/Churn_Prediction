import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  User,
  CreditCard,
  Shield,
  TrendingUp,
  RotateCcw,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { getCustomer, deleteCustomer } from '../api'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'

function DetailItem({ label, value }) {
  const displayVal =
    value !== undefined && value !== null && value !== '' ? String(value) : 'N/A'

  return (
    <div className="py-2.5 flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-800">{displayVal}</span>
    </div>
  )
}

export default function CustomerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isNotFound, setIsNotFound] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchCustomer = useCallback(async () => {
    setLoading(true)
    setError(null)
    setIsNotFound(false)
    try {
      const res = await getCustomer(id)
      setCustomer(res.data)
    } catch (e) {
      console.error(`Error loading customer profile for ID ${id}:`, e)
      if (e.response?.status === 404) {
        setIsNotFound(true)
      } else {
        setError(e.response?.data?.detail || e.message || 'Failed to load customer profile')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete customer #${id}? This will permanently remove their profile and all prediction history.`
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      await deleteCustomer(id)
      navigate('/customers')
    } catch (e) {
      console.error(`Failed to delete customer #${id}:`, e)
      alert(e.response?.data?.detail || 'Failed to delete customer. Please try again.')
      setDeleting(false)
    }
  }

  const handleRerunPrediction = () => {
    if (!customer) return
    navigate('/predict', {
      state: {
        prefill: {
          name: customer.name || '',
          gender: customer.gender || '',
          Partner: customer.Partner || '',
          Dependents: customer.Dependents || '',
          PhoneService: customer.PhoneService || '',
          MultipleLines: customer.MultipleLines || '',
          InternetService: customer.InternetService || '',
          OnlineSecurity: customer.OnlineSecurity || '',
          OnlineBackup: customer.OnlineBackup || '',
          DeviceProtection: customer.DeviceProtection || '',
          TechSupport: customer.TechSupport || '',
          StreamingTV: customer.StreamingTV || '',
          StreamingMovies: customer.StreamingMovies || '',
          Contract: customer.Contract || '',
          PaperlessBilling: customer.PaperlessBilling || '',
          PaymentMethod: customer.PaymentMethod || '',
        },
      },
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-slate-500 font-medium">Loading customer profile...</p>
      </div>
    )
  }

  if (isNotFound) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Customer List
        </Link>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Customer Not Found</h2>
          <p className="text-sm text-slate-500">
            Customer #{id} does not exist or may have been deleted.
          </p>
          <Link
            to="/customers"
            className="inline-block mt-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0d9488' }}
          >
            Return to Customer List
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Customer List
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error loading customer details</p>
            <p className="mt-1">{error}</p>
            <button
              onClick={fetchCustomer}
              className="mt-3 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded font-semibold text-xs transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) return null

  // Process predictions
  const predictions = customer.predictions || []
  const sortedPredictions = [...predictions].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )
  const latestPrediction = sortedPredictions[0] || null

  const latestProb = latestPrediction ? latestPrediction.churn_probability : 0
  const pct = (latestProb * 100).toFixed(1)
  const riskLevel = latestPrediction ? latestPrediction.risk_level : 'Low'
  const willChurn = latestPrediction ? latestPrediction.will_churn : latestProb >= 0.5

  // History chart data (chronological order)
  const chartHistory = [...predictions]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((p, index) => ({
      index: `#${index + 1}`,
      date: new Date(p.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      probability: Number((p.churn_probability * 100).toFixed(1)),
      risk: p.risk_level,
    }))

  const customerDisplayName = customer.name?.trim()
    ? customer.name.trim()
    : `Customer #${customer.id}`

  const createdFormatted = customer.created_at
    ? new Date(customer.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors self-start"
        >
          <ChevronLeft size={16} />
          Back to Customer List
        </Link>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleRerunPrediction}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: '#0d9488' }}
          >
            <RotateCcw size={15} />
            Re-run Prediction
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 size={15} />
            {deleting ? 'Deleting...' : 'Delete Customer'}
          </button>
        </div>
      </div>

      {/* 1. Header Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-sm"
              style={{ backgroundColor: '#1e293b' }}
            >
              {customerDisplayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                  {customerDisplayName}
                </h1>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-mono font-medium">
                  ID: #{customer.id}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Joined: <span className="text-slate-600 font-medium">{createdFormatted}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-start md:self-auto bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-semibold">Latest Churn Risk</p>
              <p className="text-3xl font-extrabold text-slate-800">{pct}%</p>
            </div>
            <div className="flex flex-col gap-1.5 items-start">
              <RiskBadge level={riskLevel} />
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold ${
                  willChurn ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {willChurn ? (
                  <>
                    <AlertCircle size={13} /> Likely to churn
                  </>
                ) : (
                  <>
                    <CheckCircle size={13} /> Likely to stay
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Churn score progress bar for latest prediction */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
            <span>Churn Score Indicator</span>
            <span className="font-semibold text-slate-700">{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(latestProb * 100, 100)}%`,
                backgroundColor:
                  riskLevel === 'High'
                    ? '#ef4444'
                    : riskLevel === 'Medium'
                    ? '#f97316'
                    : '#22c55e',
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Customer Details in Three Cards (2-column grid pairs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Demographics */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-slate-700">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <User size={15} />
            </div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Demographics
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 divide-y divide-slate-50">
            <DetailItem label="Gender" value={customer.gender} />
            <DetailItem label="Partner" value={customer.Partner} />
            <DetailItem label="Dependents" value={customer.Dependents} />
          </div>
        </div>

        {/* Card 2: Services */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-teal-600">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Shield size={15} />
            </div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Subscribed Services
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 divide-y divide-slate-50">
            <DetailItem label="Phone Service" value={customer.PhoneService} />
            <DetailItem label="Multiple Lines" value={customer.MultipleLines} />
            <DetailItem label="Internet Service" value={customer.InternetService} />
            <DetailItem label="Online Security" value={customer.OnlineSecurity} />
            <DetailItem label="Online Backup" value={customer.OnlineBackup} />
            <DetailItem label="Device Protection" value={customer.DeviceProtection} />
            <DetailItem label="Tech Support" value={customer.TechSupport} />
            <DetailItem label="Streaming TV" value={customer.StreamingTV} />
            <DetailItem label="Streaming Movies" value={customer.StreamingMovies} />
          </div>
        </div>

        {/* Card 3: Billing & Contract */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-slate-800">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard size={15} />
            </div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Billing &amp; Contract
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 divide-y divide-slate-50">
            <DetailItem label="Contract" value={customer.Contract} />
            <DetailItem label="Paperless Billing" value={customer.PaperlessBilling} />
            <DetailItem label="Payment Method" value={customer.PaymentMethod} />
          </div>
        </div>
      </div>

      {/* 4. Prediction History */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: '#0d9488' }}
            >
              <TrendingUp size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-800">Prediction History</h2>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
            {predictions.length} {predictions.length === 1 ? 'Run' : 'Runs'}
          </span>
        </div>

        {/* Small line chart over time if more than 1 prediction */}
        {predictions.length > 1 && (
          <div className="mb-8 p-4 bg-slate-50/80 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Churn Probability Trend Over Time
            </p>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartHistory} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#94a3b8"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    unit="%"
                  />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Churn Probability']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="probability"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ fill: '#0d9488', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Prediction history table */}
        {sortedPredictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <TrendingUp size={36} className="mb-2 opacity-30" />
            <p className="text-sm font-medium">No prediction history recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-semibold">
                  <th className="text-left pb-3 pr-4">#</th>
                  <th className="text-left pb-3 pr-4">Churn Probability</th>
                  <th className="text-left pb-3 pr-4">Risk Level</th>
                  <th className="text-left pb-3 pr-4">Result</th>
                  <th className="text-left pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPredictions.map((pred, idx) => {
                  const prob = pred.churn_probability ?? 0
                  const isLatest = idx === 0

                  return (
                    <tr
                      key={pred.id}
                      className={`transition-colors ${
                        isLatest ? 'bg-teal-50/40 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 pr-4 text-xs text-slate-400">
                        <span className="flex items-center gap-2">
                          <span>{sortedPredictions.length - idx}</span>
                          {isLatest && (
                            <span
                              className="text-[10px] uppercase font-bold text-white px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: '#0d9488' }}
                            >
                              Latest
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${Math.min(prob * 100, 100)}%`,
                                backgroundColor:
                                  pred.risk_level === 'High'
                                    ? '#ef4444'
                                    : pred.risk_level === 'Medium'
                                    ? '#f97316'
                                    : '#22c55e',
                              }}
                            />
                          </div>
                          <span className="font-semibold text-slate-800">
                            {(prob * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <RiskBadge level={pred.risk_level} />
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            pred.will_churn ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {pred.will_churn ? (
                            <>
                              <AlertCircle size={13} /> Likely to churn
                            </>
                          ) : (
                            <>
                              <CheckCircle size={13} /> Likely to stay
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-slate-500">
                        {pred.created_at
                          ? new Date(pred.created_at).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
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
