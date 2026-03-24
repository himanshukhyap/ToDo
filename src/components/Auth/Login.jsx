import { useState } from 'react'
import { signInWithGoogle } from '../../services/authService'
import toast from 'react-hot-toast'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

export default function Login() {
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    const { error } = await signInWithGoogle()
    if (error) toast.error('Sign-in failed. Please try again.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3] dark:bg-[#1f1f1f] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 0%, rgba(15,108,189,0.12), transparent 38%)' }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#0f6cbd] shadow-md mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-[#201f1e] dark:text-[#f3f2f1]">TaskFlow</h1>
          <p className="mt-1 text-sm text-[#605e5c] dark:text-[#a19f9d]">Organize your day with a clean Microsoft-style workspace</p>
        </div>

        <div className="fluent-panel rounded-2xl p-6 sm:p-7">
          <h2 className="text-xl font-semibold text-[#201f1e] dark:text-[#f3f2f1] text-center mb-5">Sign in</h2>

          <ul className="space-y-2 mb-6 text-sm text-[#605e5c] dark:text-[#c8c6c4]">
            <li>Real-time sync</li>
            <li>Quick add and subtasks</li>
            <li>Mobile-friendly task board</li>
          </ul>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full h-11 rounded-lg bg-white dark:bg-[#2a2a2a] border border-[#d2d0ce] dark:border-[#4a4847] text-[#201f1e] dark:text-[#f3f2f1] flex items-center justify-center gap-3 text-sm font-medium hover:bg-[#f8f8f8] dark:hover:bg-[#323130] transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#c8c6c4] border-t-[#605e5c] rounded-full animate-spin" />
                Signing in
              </>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          <p className="text-xs text-center text-[#8a8886] dark:text-[#a19f9d] mt-4">
            Your data is secured with Firebase authentication and Firestore.
          </p>
        </div>
      </div>
    </div>
  )
}
