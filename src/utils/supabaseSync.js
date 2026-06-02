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

// ─── SHARED ITEMS (custom foods + recipes visible to all users) ───────────────

export async function pushSharedItem(type, item) {
  const userId = await getUserId()
  if (!userId) return
  await supabase.from('shared_items').upsert({
    id: item.id, type, created_by: userId,
    data: item, updated_at: new Date().toISOString(),
  }).catch(e => console.error('[sync] pushSharedItem:', e))
}

export async function deleteSharedItem(id) {
  await supabase.from('shared_items').delete().eq('id', id)
    .catch(e => console.error('[sync] deleteSharedItem:', e))
}

// Pull all shared custom foods + recipes and merge into localStorage
export async function pullSharedItems() {
  const { data, error } = await supabase
    .from('shared_items').select('id, type, data')
  if (error || !data || data.length === 0) return

  const sharedFoods   = data.filter(r => r.type === 'custom_food').map(r => r.data)
  const sharedRecipes = data.filter(r => r.type === 'recipe').map(r => r.data)

  // Merge: shared items are the source of truth; add any local-only items on top
  function mergeById(shared, localRaw) {
    const local = (() => { try { return JSON.parse(localRaw || '[]') } catch { return [] } })()
    const map = new Map(shared.map(i => [i.id, i]))
    local.forEach(i => { if (!map.has(i.id)) map.set(i.id, i) })
    return [...map.values()]
  }

  if (sharedFoods.length > 0) {
    const merged = mergeById(sharedFoods, localStorage.getItem('nt_custom_foods'))
    localStorage.setItem('nt_custom_foods', JSON.stringify(merged))
  }
  if (sharedRecipes.length > 0) {
    const merged = mergeById(sharedRecipes, localStorage.getItem('nt_recipes'))
    localStorage.setItem('nt_recipes', JSON.stringify(merged))
  }
}

// ─── CLEAR LOCAL ──────────────────────────────────────────────────────────────
export function clearLocalUserData() {
  clearCachedUserId()
  SYNC_KEYS.forEach(k => localStorage.removeItem(k))
  localStorage.removeItem('nt_recent_foods')
}
