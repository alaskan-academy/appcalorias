/**
 * Sync layer: mirrors localStorage keys to/from Supabase user_data table.
 * All writes are fire-and-forget (non-blocking).
 * The app keeps using localStorage as the fast, synchronous source of truth.
 */

import { supabase } from './supabase'

// Keys that are synced per-user to Supabase
export const SYNC_KEYS = [
  'nt_profile',
  'nt_logs',
  'nt_custom_foods',
  'nt_recipes',
  'nt_body_measurements',
  'nt_workout_logs',
  'nt_training_plan',
]
// NOT synced: 'nt_recent_foods' (ephemeral device cache)

async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

// ─── PULL ─────────────────────────────────────────────────────────────────────
// Called on login: loads all user data from Supabase into localStorage.
// If Supabase has no data yet (first login), migrates localStorage to Supabase.
export async function pullFromSupabase() {
  const userId = await getUserId()
  if (!userId) return

  const { data, error } = await supabase
    .from('user_data')
    .select('key, value')
    .eq('user_id', userId)

  if (error) {
    console.error('[sync] pull error:', error)
    return
  }

  if (data && data.length > 0) {
    // User has data in the cloud → restore to localStorage
    data.forEach(({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value))
    })
  } else {
    // First login on this account → migrate existing localStorage to Supabase
    await pushAllToSupabase()
  }
}

// ─── PUSH ALL ─────────────────────────────────────────────────────────────────
// Pushes all sync keys from localStorage to Supabase.
// Called on first login (migration) and before logout.
export async function pushAllToSupabase() {
  const userId = await getUserId()
  if (!userId) return

  const rows = SYNC_KEYS
    .filter(key => localStorage.getItem(key) !== null)
    .map(key => {
      try {
        return {
          user_id: userId,
          key,
          value: JSON.parse(localStorage.getItem(key)),
          updated_at: new Date().toISOString(),
        }
      } catch { return null }
    })
    .filter(Boolean)

  if (rows.length === 0) return

  const { error } = await supabase.from('user_data').upsert(rows)
  if (error) console.error('[sync] pushAll error:', error)
}

// ─── PUSH KEY ─────────────────────────────────────────────────────────────────
// Pushes a single key to Supabase. Called after every localStorage write.
export async function pushKey(key) {
  const userId = await getUserId()
  if (!userId) return // not logged in, skip

  const raw = localStorage.getItem(key)
  if (raw === null) return

  try {
    const value = JSON.parse(raw)
    const { error } = await supabase.from('user_data').upsert({
      user_id: userId,
      key,
      value,
      updated_at: new Date().toISOString(),
    })
    if (error) console.error(`[sync] push error (${key}):`, error)
  } catch (e) {
    console.error(`[sync] push parse error (${key}):`, e)
  }
}

// ─── CLEAR LOCAL ──────────────────────────────────────────────────────────────
// Clears user-specific data from localStorage on logout.
export function clearLocalUserData() {
  SYNC_KEYS.forEach(key => localStorage.removeItem(key))
  localStorage.removeItem('nt_recent_foods')
}
