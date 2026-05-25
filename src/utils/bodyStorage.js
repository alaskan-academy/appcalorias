import { pushKey } from './supabaseSync'

const KEY = 'nt_body_measurements'

function get() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}
function set(v) {
  localStorage.setItem(KEY, JSON.stringify(v))
  pushKey(KEY).catch(() => {})
}

export function getMeasurements() {
  return get() ?? []
}

export function addMeasurement(entry) {
  const list = getMeasurements()
  // Replace if same date
  const idx = list.findIndex(m => m.date === entry.date)
  if (idx >= 0) list[idx] = entry
  else list.unshift(entry)
  // Sort descending
  list.sort((a, b) => b.date.localeCompare(a.date))
  set(list)
}

export function deleteMeasurement(id) {
  set(getMeasurements().filter(m => m.id !== id))
}

export function getLatestMeasurement() {
  return getMeasurements()[0] ?? null
}

// BMI helpers
export function calcBMI(weight, heightCm) {
  const h = heightCm / 100
  return Math.round((weight / (h * h)) * 10) / 10
}

export function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Abaixo do peso', color: '#60a5fa' }
  if (bmi < 25)   return { label: 'Peso normal',    color: '#34d399' }
  if (bmi < 30)   return { label: 'Sobrepeso',      color: '#fbbf24' }
  return                  { label: 'Obesidade',      color: '#f87171' }
}

// Body fat category
export function bodyFatCategory(pct, sex) {
  if (sex === 'female') {
    if (pct < 14) return { label: 'Gordura essencial', color: '#60a5fa' }
    if (pct < 21) return { label: 'Atlética',          color: '#34d399' }
    if (pct < 25) return { label: 'Fitness',           color: '#a3e635' }
    if (pct < 32) return { label: 'Média',             color: '#fbbf24' }
    return               { label: 'Acima do ideal',    color: '#f87171' }
  }
  if (pct < 6)  return { label: 'Gordura essencial', color: '#60a5fa' }
  if (pct < 14) return { label: 'Atlético',          color: '#34d399' }
  if (pct < 18) return { label: 'Fitness',           color: '#a3e635' }
  if (pct < 25) return { label: 'Médio',             color: '#fbbf24' }
  return               { label: 'Acima do ideal',    color: '#f87171' }
}

// Progress toward weight goal (0–1)
export function weightProgress(currentWeight, startWeight, targetWeight) {
  const totalChange = targetWeight - startWeight
  const achieved    = currentWeight - startWeight
  if (totalChange === 0) return 1
  return Math.max(0, Math.min(1, achieved / totalChange))
}
