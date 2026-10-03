import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  PieChart,
  TrendingUp,
  Settings,
  BarChart2,
  Bell,
  Search,
  Brain,
  Menu,
  X,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Sparkles, label: 'Predict Churn', to: '/predict' },
  { icon: Users, label: 'Customer List', to: '/customers' },
  { icon: PieChart, label: 'Segmentation', to: '/segmentation' },
  { icon: TrendingUp, label: 'Predictions', to: '/predictions' },
  { icon: BarChart2, label: 'Reports', to: '/reports' },
  { icon: Settings, label: 'Settings', to: '/settings' },
]


const pageTitles = {
  '/': 'Customer Churn Dashboard',
  '/customers': 'Customer List',
  '/segmentation': 'Customer Segmentation',
  '/predictions': 'Prediction History',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/predict': 'Predict Churn',
}

export default function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith('/customers/') ? 'Customer Profile' : 'Predictive CRM')

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-[#1e293b] text-white flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0d9488' }}>
            <Brain size={18} className="text-white" />
          </div>
          <span className="font-bold text-base leading-tight" style={{ color: '#0d9488' }}>
            Predictive CRM
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
            Main Menu
          </p>
          <ul className="space-y-1">
            {navItems.map(({ icon: Icon, label, to }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive ? { backgroundColor: '#0d9488' } : {}
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="px-6 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
              A
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Admin</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white shadow-sm flex items-center px-4 md:px-6 gap-4 flex-shrink-0">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Page title / Welcome */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 hidden sm:block">Welcome back, Admin 👋</p>
            <h1 className="text-sm md:text-base font-semibold text-slate-800 truncate">
              {currentTitle}
            </h1>
          </div>

          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-48 md:w-64">
            <Search size={15} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search customers..."
              className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none w-full"
            />
          </div>

          {/* Icon buttons */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#f1f5f9] p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
