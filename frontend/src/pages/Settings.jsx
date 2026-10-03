import React from 'react'
import { Settings as SettingsIcon, Info } from 'lucide-react'

function ReadonlyField({ label, value }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 font-medium">
        {value}
      </div>
    </div>
  )
}

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Model Configuration */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#ccfbf1' }}
          >
            <SettingsIcon size={18} style={{ color: '#0d9488' }} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Model Configuration</h2>
            <p className="text-xs text-slate-400">Current prediction model settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <ReadonlyField label="Model Type" value="Ensemble (LightGBM + CatBoost)" />
          <ReadonlyField label="Decision Threshold" value="0.5" />
          <ReadonlyField label="Version" value="1.0.0" />
          <ReadonlyField label="Status" value="Active" />
        </div>

        <div className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-4 text-sm">
          <Info size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            Model settings are managed through the backend configuration. Contact your administrator to update model parameters.
          </span>
        </div>
      </div>

      {/* App info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Application Info</h2>
        <div className="space-y-4">
          <ReadonlyField label="Application" value="Predictive CRM" />
          <ReadonlyField label="Version" value="0.1.0" />
          <ReadonlyField label="API URL" value="http://localhost:8000" />
          <ReadonlyField label="Environment" value="Development" />
        </div>
      </div>
    </div>
  )
}
