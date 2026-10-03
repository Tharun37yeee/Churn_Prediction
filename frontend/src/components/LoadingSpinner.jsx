import React from 'react'

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-slate-200 border-t-teal`}
        style={{ borderTopColor: '#0d9488' }}
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}
