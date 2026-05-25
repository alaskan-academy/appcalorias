import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { pushAllToSupabase, clearLocalUserData, setCachedUserId, SYNC_KEYS } from '../utils/supabaseSync'

const AuthContext = createContext(null)

// Pull user data from Supabase directly into localStorage.
// userId comes from the session — avoids double getSession() calls.
// Timeout of 6s so a slow connection never freezes the loading screen.
async function pullForUser(userId) {
  const query = supabase.from('user_data').select('key, value').eq('user_id', userId)
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('pull timeout')), 6000)
  )

  let data, error
  try {
    ;({ data, error } = await Promise.race([query, timeout]))
  } catch (e) {
    console.warn('[sync] pull timed out — using local cache:', e.message)
    return // proceed with whatever is in localStorage
  }

  if (error) {
    console.error('[sync] pull error:', error)
    return // fail gracefully — app works with whatever is in localStorage
  }

  if (data && data.length > 0) {
    // Restore cloud data to localStorage
    data.forEach(({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value))
    })
  } else {
    // First login — migrate any existing localStorage data to Supabase
    const rows = SYNC_KEYS
      .filter(k => localStorage.getItem(k) !== null)
      .map(k => {
        try { return { user_id: userId, key: k, value: JSON.parse(localStorage.getItem(k)), updated_at: new Date().toISOString() } }
        catch { return null }
      })
      .filter(Boolean)
    if (rows.length > 0) {
      await supabase.from('user_data').upsert(rows).catch(console.error)
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [synced, setSynced]   = useState(false)

  useEffect(() => {
    // Supabase v2: onAuthStateChange fires INITIAL_SESSION on mount.
    // Using it as the single source of truth avoids race conditions.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null
        setUser(u)

        if (event === 'INITIAL_SESSION') {
          if (u) {
            setCachedUserId(u.id)
            try { await pullForUser(u.id) } catch (e) { console.error(e) }
            setSynced(true)
          }
          setLoading(false)
        }

        if (event === 'SIGNED_IN') {
          // Triggered after magic link redirect — always pull fresh data
          setCachedUserId(u.id)
          try { await pullForUser(u.id) } catch (e) { console.error(e) }
          setSynced(true)
          setLoading(false)
        }

        if (event === 'TOKEN_REFRESHED') {
          // Token silently refreshed — just update the cached user, no re-pull needed
          if (u) setCachedUserId(u.id)
          return
        }

        if (event === 'SIGNED_OUT') {
          clearLocalUserData()
          setSynced(false)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    try { await pushAllToSupabase() } catch (e) { console.error(e) }
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
