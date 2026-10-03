import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { getCustomers } from '../api'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-100">
          <div className="h-4 bg-slate-200 rounded w-8" />
          <div className="h-4 bg-slate-200 rounded w-40" />
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="h-6 bg-slate-200 rounded-full w-16" />
          <div className="h-4 bg-slate-200 rounded flex-1" />
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-8 bg-slate-200 rounded w-20" />
        </div>
      ))}
    </div>
  )
}

export default function CustomerList() {
  const [searchParams] = useSearchParams()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState(searchParams.get('risk_filter') || '')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 10

  const debounceRef = useRef(null)

  const fetchCustomers = useCallback(async (searchVal, risk, pageNum) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page: pageNum, page_size: PAGE_SIZE }
      if (searchVal) params.search = searchVal
      if (risk) params.risk_filter = risk
      const res = await getCustomers(params)
      const data = res.data
      if (Array.isArray(data)) {
        setCustomers(data)
        setTotalPages(1)
        setTotal(data.length)
      } else {
        setCustomers(data.customers || data.items || [])
        setTotal(data.total || 0)
        setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE) || 1)
      }
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearch(val)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchCustomers(val, riskFilter, 1)
    }, 300)
  }

  const handleRiskChange = (e) => {
    const val = e.target.value
    setRiskFilter(val)
    setPage(1)
    fetchCustomers(search, val, 1)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchCustomers(search, riskFilter, newPage)
  }

  useEffect(() => {
    fetchCustomers(search, riskFilter, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">All Customers</h1>
            {!loading && total > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{total} customers total</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-teal focus-within:border-transparent">
              <Search size={15} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={search}
                onChange={handleSearchChange}
                className="text-sm outline-none text-slate-700 placeholder-slate-400 w-48"
              />
            </div>

            {/* Risk filter */}
            <select
              value={riskFilter}
              onChange={handleRiskChange}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-none focus:ring-2 bg-white"
              style={{ '--tw-ring-color': '#0d9488' }}
            >
              <option value="">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            ⚠️ {error}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No customers found</p>
            <p className="text-xs mt-1">
              {search || riskFilter ? 'Try adjusting your filters' : 'Add predictions to see customers here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">#</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">Name</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">Contract</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">Payment Method</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">Risk Level</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">Churn Score</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 pr-4">Date Added</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">Actions</th>
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
                      <td className="py-3 pr-4 text-slate-600">
                        {customer.Contract || customer.contract || '—'}
                      </td>
                      <td className="py-3 pr-4 text-slate-600 text-xs">
                        {customer.PaymentMethod || customer.payment_method || '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <RiskBadge level={customer.risk_level ?? customer.risk_category ?? 'Low'} />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5">
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
