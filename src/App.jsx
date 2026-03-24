// src/App.jsx
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './components/Auth/Login'
import AppLayout from './components/Layout/AppLayout'
import Loading from './components/UI/Loading'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3] dark:bg-[#1f1f1f]">
        <Loading message="Initializing TaskFlow..." />
      </div>
    )
  }

  return user ? <AppLayout user={user} /> : <Login />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
              fontSize: '14px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}
