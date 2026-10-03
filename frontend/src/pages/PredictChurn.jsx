import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { predictChurn } from '../api'
import LoadingSpinner from '../components/LoadingSpinner'
import RiskBadge from '../components/RiskBadge'
import { CheckCircle, AlertCircle, RotateCcw, ExternalLink } from 'lucide-react'

const FORM_FIELDS = {
  demographics: [
    { name: 'gender', label: 'Gender', options: ['Female', 'Male'] },
    { name: 'Partner', label: 'Partner', options: ['Yes', 'No'] },
    { name: 'Dependents', label: 'Dependents', options: ['Yes', 'No'] },
  ],
  services: [
    { name: 'PhoneService', label: 'Phone Service', options: ['Yes', 'No'] },
    { name: 'MultipleLines', label: 'Multiple Lines', options: ['Yes', 'No', 'No phone service'] },
    { name: 'InternetService', label: 'Internet Service', options: ['DSL', 'Fiber optic', 'No'] },
    { name: 'OnlineSecurity', label: 'Online Security', options: ['Yes', 'No', 'No internet service'] },
    { name: 'OnlineBackup', label: 'Online Backup', options: ['Yes', 'No', 'No internet service'] },
    { name: 'DeviceProtection', label: 'Device Protection', options: ['Yes', 'No', 'No internet service'] },
    { name: 'TechSupport', label: 'Tech Support', options: ['Yes', 'No', 'No internet service'] },
    { name: 'StreamingTV', label: 'Streaming TV', options: ['Yes', 'No', 'No internet service'] },
    { name: 'StreamingMovies', label: 'Streaming Movies', options: ['Yes', 'No', 'No internet service'] },
  ],
  billing: [
    { name: 'Contract', label: 'Contract', options: ['Month-to-month', 'One year', 'Two year'] },
    { name: 'PaperlessBilling', label: 'Paperless Billing', options: ['Yes', 'No'] },
    {
      name: 'PaymentMethod',
      label: 'Payment Method',
      options: [
        'Electronic check',
        'Mailed check',
        'Bank transfer (automatic)',
        'Credit card (automatic)',
      ],
    },
  ],
}

const ALL_FIELDS = [
  ...FORM_FIELDS.demographics,
  ...FORM_FIELDS.services,
  ...FORM_FIELDS.billing,
].map((f) => f.name)

const getInitialForm = () =>
  ALL_FIELDS.reduce(
    (acc, name) => {
      acc[name] = ''
      return acc
    },
    { customerName: '' }
  )

function SelectField({ label, name, value, onChange, error }) {
  const field = [
    ...FORM_FIELDS.demographics,
    ...FORM_FIELDS.services,
    ...FORM_FIELDS.billing,
  ].find((f) => f.name === name)

  if (!field) return null

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
        {label} <span className="text-red-500">*</span>
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full border rounded-lg px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none transition-all ${
          error
            ? 'border-red-400 ring-2 ring-red-100 bg-red-50/20'
            : 'border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100'
        }`}
      >
        <option value="" disabled>
          Select an option
        </option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
      {children}
    </h3>
  )
}

export default function PredictChurn() {
  const location = useLocation()
  const [form, setForm] = useState(getInitialForm())
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [apiError, setApiError] = useState(null)

  // Handle prefill from "Re-run Prediction"
  useEffect(() => {
    if (location.state?.prefill) {
      const p = location.state.prefill
      setForm({
        customerName: p.name || '',
        gender: p.gender || '',
        Partner: p.Partner || '',
        Dependents: p.Dependents || '',
        PhoneService: p.PhoneService || '',
        MultipleLines: p.MultipleLines || '',
        InternetService: p.InternetService || '',
        OnlineSecurity: p.OnlineSecurity || '',
        OnlineBackup: p.OnlineBackup || '',
        DeviceProtection: p.DeviceProtection || '',
        TechSupport: p.TechSupport || '',
        StreamingTV: p.StreamingTV || '',
        StreamingMovies: p.StreamingMovies || '',
        Contract: p.Contract || '',
        PaperlessBilling: p.PaperlessBilling || '',
        PaymentMethod: p.PaymentMethod || '',
      })
      setResult(null)
      setErrors({})
    }
  }, [location.state])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  // Check if every dropdown is selected
  const allSelected = ALL_FIELDS.every((name) => form[name] !== '')

  const validate = () => {
    const newErrors = {}
    ALL_FIELDS.forEach((name) => {
      if (!form[name]) {
        newErrors[name] = 'Please select an option'
      }
    })
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setApiError(null)

    // Build payload matching CustomerInput schema
    const payload = {
      name: form.customerName ? form.customerName.trim() : undefined,
      gender: form.gender,
      Partner: form.Partner,
      Dependents: form.Dependents,
      PhoneService: form.PhoneService,
      MultipleLines: form.MultipleLines,
      InternetService: form.InternetService,
      OnlineSecurity: form.OnlineSecurity,
      OnlineBackup: form.OnlineBackup,
      DeviceProtection: form.DeviceProtection,
      TechSupport: form.TechSupport,
      StreamingTV: form.StreamingTV,
      StreamingMovies: form.StreamingMovies,
      Contract: form.Contract,
      PaperlessBilling: form.PaperlessBilling,
      PaymentMethod: form.PaymentMethod,
    }

    try {
      const res = await predictChurn(payload)
      setResult(res.data)
      setErrors({})
    } catch (err) {
      console.error('Prediction API error:', err)
      setApiError(
        err.response?.data?.detail || err.message || 'Prediction failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm(getInitialForm())
    setErrors({})
    setResult(null)
    setApiError(null)
  }

  const prob = result ? result.churn_probability ?? 0 : 0
  const pct = (prob * 100).toFixed(1)
  const riskLevel = result?.risk_level ?? (prob >= 0.6 ? 'High' : prob >= 0.35 ? 'Medium' : 'Low')
  const willChurn = result?.will_churn ?? prob >= 0.5

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Form card */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            Predict Customer Churn
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Select the customer details below
          </p>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm mb-6 flex items-start gap-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Prediction Error</p>
              <p>{apiError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* Optional customer name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Customer Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              placeholder="e.g. Acme Corp / Jane Doe"
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all bg-white"
            />
          </div>

          {/* Demographics Section - 2 columns */}
          <div>
            <SectionTitle>Demographics</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {FORM_FIELDS.demographics.map((field) => (
                <SelectField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  error={errors[field.name]}
                />
              ))}
            </div>
          </div>

          {/* Services Section - 2 columns */}
          <div>
            <SectionTitle>Services</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {FORM_FIELDS.services.map((field) => (
                <SelectField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  error={errors[field.name]}
                />
              ))}
            </div>
          </div>

          {/* Billing & Contract Section - 2 columns */}
          <div>
            <SectionTitle>Billing &amp; Contract</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {FORM_FIELDS.billing.map((field) => (
                <SelectField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  error={errors[field.name]}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !allSelected}
              className="flex-1 py-3 px-6 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              style={{ backgroundColor: '#0d9488' }}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="!block" />
                  Calculating Prediction...
                </>
              ) : (
                'Predict Churn'
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="py-3 px-6 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Result card beneath the form */}
      {result && (
        <div
          className="bg-white rounded-xl shadow-sm p-6 md:p-8 border-l-4 transition-all"
          style={{
            borderLeftColor:
              riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f97316' : '#22c55e',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Score display */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center border-8 transition-colors"
                style={{
                  borderColor:
                    riskLevel === 'High'
                      ? '#ef4444'
                      : riskLevel === 'Medium'
                      ? '#f97316'
                      : '#22c55e',
                }}
              >
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-slate-800">{pct}%</div>
                  <div className="text-xs text-slate-400 font-medium">Churn Score</div>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <RiskBadge level={riskLevel} />
                <span
                  className={`flex items-center gap-1.5 text-sm font-semibold ${
                    willChurn ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {willChurn ? (
                    <>
                      <AlertCircle size={16} /> Likely to churn
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Likely to stay
                    </>
                  )}
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Churn Probability</span>
                  <span className="font-semibold">{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(prob * 100, 100)}%`,
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

              {result.customer_id && (
                <p className="text-xs text-slate-500">
                  Customer ID:{' '}
                  <span className="font-semibold text-slate-700">#{result.customer_id}</span>
                  {form.customerName && (
                    <span className="ml-2 text-slate-600">({form.customerName})</span>
                  )}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                {result.customer_id && (
                  <Link
                    to={`/customers/${result.customer_id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 shadow-sm"
                    style={{ backgroundColor: '#1e293b' }}
                  >
                    <ExternalLink size={14} />
                    View Customer Profile
                  </Link>
                )}
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw size={14} />
                  Make Another Prediction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
