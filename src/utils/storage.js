// Abstraction layer — localStorage as local cache, synced to Supabase on every write

import { pushKey, pushSharedItem, deleteSharedItem } from './supabaseSync'

const KEYS = {
  profile:     'nt_profile',
  customFoods: 'nt_custom_foods',
  recipes:     'nt_recipes',
  logs:        'nt_logs',       // keyed by date string YYYY-MM-DD
  recentFoods: 'nt_recent_foods',
}

function get(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  pushKey(key).catch(() => {}) // fire-and-forget sync to Supabase
}

// --- Profile ---
export function getProfile() {
  return get(KEYS.profile)
}

export function saveProfile(profile) {
  set(KEYS.profile, profile)
}

// --- Custom foods ---
export function getCustomFoods() {
  return get(KEYS.customFoods) ?? []
}

export function saveCustomFood(food) {
  const foods = getCustomFoods()
  const idx = foods.findIndex(f => f.id === food.id)
  if (idx >= 0) foods[idx] = food
  else foods.push(food)
  set(KEYS.customFoods, foods)
  pushSharedItem('custom_food', food).catch(() => {}) // share with all users
}

export function deleteCustomFood(id) {
  const foods = getCustomFoods().filter(f => f.id !== id)
  set(KEYS.customFoods, foods)
  deleteSharedItem(id).catch(() => {})
}

// --- Recipes ---
export function getRecipes() {
  return get(KEYS.recipes) ?? []
}

export function saveRecipe(recipe) {
  const recipes = getRecipes()
  const idx = recipes.findIndex(r => r.id === recipe.id)
  if (idx >= 0) recipes[idx] = recipe
  else recipes.push(recipe)
  set(KEYS.recipes, recipes)
  pushSharedItem('recipe', recipe).catch(() => {}) // share with all users
}

export function deleteRecipe(id) {
  const recipes = getRecipes().filter(r => r.id !== id)
  set(KEYS.recipes, recipes)
  deleteSharedItem(id).catch(() => {})
}

// --- Daily logs ---
function getLogsMap() {
  return get(KEYS.logs) ?? {}
}

export function getDayLog(dateStr) {
  const map = getLogsMap()
  return map[dateStr] ?? createEmptyLog(dateStr)
}

export function saveDayLog(log) {
  const map = getLogsMap()
  map[log.date] = log
  set(KEYS.logs, map)
}

export function getLogsRange(startDate, endDate) {
  const map = getLogsMap()
  const result = []
  const cur = new Date(startDate)
  const end = new Date(endDate)
  while (cur <= end) {
    const key = cur.toISOString().split('T')[0]
    result.push(map[key] ?? createEmptyLog(key))
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

export function createEmptyLog(dateStr) {
  return {
    date: dateStr,
    meals: {},       // { mealId: [entry, ...] }
    exercises: [],
    water: [],       // [{ time, amount }]
    steps: 0,
  }
}

// Returns { start, end } as 'yyyy-MM-dd' for the current Mon–Sun week
export function getCurrentWeekRange() {
  const today = new Date()
  const dow   = today.getDay()               // 0 = Sun
  const mon   = new Date(today)
  mon.setDate(today.getDate() - ((dow + 6) % 7))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return {
    start: mon.toISOString().split('T')[0],
    end:   sun.toISOString().split('T')[0],
  }
}

// Count days this week with at least one cardio exercise logged
export function getWeeklyCardioCount() {
  const { start, end } = getCurrentWeekRange()
  return getLogsRange(start, end).filter(log => (log.exercises ?? []).length > 0).length
}

// --- Recent foods ---
export function getRecentFoods() {
  return get(KEYS.recentFoods) ?? []
}

export function saveRecentFood(food) {
  const recent = getRecentFoods().filter(f => f.id !== food.id)
  recent.unshift(food)
  set(KEYS.recentFoods, recent.slice(0, 15))
}

// --- Calorie streak (consecutive days hitting 80–115% of goal) ---
export function getCalorieStreak(goalCal) {
  if (!goalCal) return 0
  let streak = 0
  const d = new Date()
  for (let i = 0; i < 365; i++) {
    const str = d.toISOString().split('T')[0]
    const log = getDayLog(str)
    const cal = Object.values(log.meals ?? {}).flat().reduce((s, e) => s + (e.calories ?? 0), 0)
    const ratio = cal / goalCal
    if (cal > 0 && ratio >= 0.8 && ratio <= 1.15) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

// --- Export all data as CSV ---
export function exportLogsCSV() {
  const map = getLogsMap()
  const rows = [['Data', 'Calorias (kcal)', 'Proteína (g)', 'Carboidratos (g)', 'Gordura (g)', 'Água (ml)', 'Gasto (kcal)']]
  Object.entries(map).sort().forEach(([date, log]) => {
    const entries = Object.values(log.meals ?? {}).flat()
    const cal   = Math.round(entries.reduce((s, e) => s + (e.calories ?? 0), 0))
    const prot  = Math.round(entries.reduce((s, e) => s + (e.protein  ?? 0), 0))
    const carbs = Math.round(entries.reduce((s, e) => s + (e.carbs    ?? 0), 0))
    const fat   = Math.round(entries.reduce((s, e) => s + (e.fat      ?? 0), 0))
    const water = Math.round((log.water ?? []).reduce((s, w) => s + (w.amount ?? 0), 0))
    const burned = Math.round((log.exercises ?? []).reduce((s, e) => s + (e.caloriesBurned ?? 0), 0))
    rows.push([date, cal, prot, carbs, fat, water, burned])
  })
  return rows.map(r => r.join(',')).join('\n')
}
