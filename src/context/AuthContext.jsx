import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { pullFromSupabase, pushAllToSupabase, clearLocalUserData } from '../utils/supabaseSync'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)  // checking initial session
  const [synced, setSynced]   = useState(false)  // data pulled to localStorage

  useEffect(() => {
    // 1. Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        await pullFromSupabase()
        setSynced(true)
      }
      setLoading(false)
    })

    // 2. Listen for auth events (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null
        setUser(u)

        if (event === 'SIGNED_IN' && u) {
          setLoading(true)
          await pullFromSupabase()
          setSynced(true)
          setLoading(false)
        }

        if (event === 'SIGNED_OUT') {
          clearLocalUserData()
          setSynced(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await pushAllToSupabase()   // ensure latest data is saved
    await supabase.auth.signOut()
    clearLocalUserData()
  }

  return (
    <AuthContext.Provider value={{ user, loading, synced, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
