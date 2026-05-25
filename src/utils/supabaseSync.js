/**
 * Sync layer: mirrors localStorage keys to/from Supabase user_data table.
 * Writes are fire-and-forget. The app uses localStorage as fast local cache.
 */

import { supabase } from './supabase'

export const SYNC_KEYS = [
  'nt_profile',
  'nt_logs',
  'nt_custom_foods',
  'nt_recipes',
  'nt_body_measurements',
  'nt_workout_logs',
  'nt_training_plan',
]

// Cached user ID — set after login, cleared on logout.
// Avoids calling getSession() on every keystroke.
let _cachedUserId = null

export function setCachedUserId(id) { _cachedUserId = id }
export function clearCachedUserId() { _cachedUserId = null }

async function getUserId() {
  if (_cachedUserId) return _cachedUserId
  const { data: { session } } = await supabase.auth.getSession()
  _cachedUserId = session?.user?.id ?? null
  return _cachedUserId
}

// ─── PUSH ONE KEY ─────────────────────────────────────────────────────────────
export async function pushKey(key) {
  const userId = await getUserId()
  if (!userId) return

  const raw = localStorage.getItem(key)
  if (raw === null) return

  try {
    const value = JSON.parse(raw)
    await supabase.from('user_data').upsert({
      user_id: userId, key, value,
      updated_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error(`[sync] pushKey(${key}):`, e)
  }
}

// ─── PUSH ALL ─────────────────────────────────────────────────────────────────
export async function pushAllToSupabase() {
  const userId = await getUserId()
  if (!userId) return

  const rows = SYNC_KEYS
    .filter(k => localStorage.getItem(k) !== null)
    .map(k => {
      try { return { user_id: userId, key: k, value: JSON.parse(localStorage.getItem(k)), updated_at: new Date().toISOString() } }
      catch { return null }
    })
    .filter(Boolean)

  if (rows.length === 0) return
  await supabase.from('user_data').upsert(rows).catch(console.error)
}

// ─── CLEAR LOCAL ──────────────────────────────────────────────────────────────
export function clearLocalUserData() {
  clearCachedUserId()
  SYNC_KEYS.forEach(k => localStorage.removeItem(k))
  localStorage.removeItem('nt_recent_foods')
}
