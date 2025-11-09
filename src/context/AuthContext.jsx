import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  const login = (email, password) => {
    // Simple authentication logic for testing
    if (email === 'test@test.pl' && password === 'test123') {
      setIsAuthenticated(true)
      setUser({ email, name: 'Test User' })
      return { success: true }
    }
    return { success: false, error: 'Invalid login credentials' }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  const value = {
    isAuthenticated,
    user,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
