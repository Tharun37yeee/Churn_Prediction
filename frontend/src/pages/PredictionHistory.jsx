import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getCustomers } from '../api'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'

const PAGE_SIZE = 20

export default function PredictionHistory() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchData = useCallback(async (pageNum) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCustomers({ page: pageNum, page_size: PAGE_SIZE })
      const data = res.data
      if (Array.isArray(data)) {
        setCustomers(data)
        setTotal(data.length)
        setTotalPages(1)
      } else {
        setCustomers(data.customers || data.items || [])
        setTotal(data.total || 0)
        setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE) || 1)
      }
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to load prediction history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(page)
  }, [fetchData, page])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchData(newPage)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Prediction History</h1>
            {!loading && total > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{total} total records</p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            ⚠️ {error}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <p className="text-sm font-medium">No prediction history found</p>
            <p className="text-xs mt-1">Make predictions to see history here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">#</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">Customer</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">Churn Probability</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">Risk Level</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map((customer, idx) => {
                  const prob = customer.churn_probability ?? customer.latest_churn_probability ?? 0
                  const pct = (prob * 100).toFixed(1)

                  return (
                    <tr key={customer.id ?? customer.customer_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4 text-slate-400 text-xs">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
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
                              {customer.customer_id || customer.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(prob * 100, 100)}%`,
                                backgroundColor: '#0d9488',
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <RiskBadge level={customer.risk_level ?? customer.risk_category ?? 'Low'} />
                      </td>
                      <td className="py-3 text-xs text-slate-500">
                        {customer.date_added || customer.created_at
                          ? new Date(customer.date_added || customer.created_at).toLocaleString('en-US', {
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

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      pageNum === page
                        ? 'text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    style={pageNum === page ? { backgroundColor: '#0d9488' } : {}}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
