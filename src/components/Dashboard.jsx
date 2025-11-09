import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState({
    totalTests: 42,
    passedTests: 38,
    failedTests: 4,
    lastRun: '2024-11-10 12:30:00'
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const testCategories = [
    { name: 'E2E Tests', count: 15, status: 'success', icon: '🧪' },
    { name: 'Unit Tests', count: 20, status: 'success', icon: '⚡' },
    { name: 'Integration Tests', count: 7, status: 'warning', icon: '🔗' },
    { name: 'Performance Tests', count: 0, status: 'error', icon: '📊' }
  ]

  const recentActivity = [
    { action: 'Test suite executed', time: '5 min ago', status: 'success' },
    { action: 'New test created', time: '15 min ago', status: 'info' },
    { action: 'Test failed', time: '1 hour ago', status: 'error' },
    { action: 'Configuration updated', time: '2 hours ago', status: 'info' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">Test Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {currentTime.toLocaleString('en-US')}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">T</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Tests
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalTests}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Passed Tests
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.passedTests}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">✗</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Failed Tests
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.failedTests}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">%</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Success Rate
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Math.round((stats.passedTests / stats.totalTests) * 100)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Test Categories */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Test Categories
                </h3>
                <div className="space-y-4">
                  {testCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{category.name}</p>
                          <p className="text-sm text-gray-500">{category.count} tests</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.status === 'success' ? 'bg-green-100 text-green-800' :
                        category.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {category.status === 'success' ? 'OK' :
                         category.status === 'warning' ? 'Warning' : 'Error'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-400' :
                        activity.status === 'error' ? 'bg-red-400' :
                        'bg-blue-400'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="mr-2">🚀</span>
                  Run Tests
                </button>
                <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="mr-2">📝</span>
                  New Test
                </button>
                <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="mr-2">📊</span>
                  Reports
                </button>
                <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="mr-2">⚙️</span>
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
