import { pushKey } from './supabaseSync'

const KEYS = {
  plan:    'nt_training_plan',
  logs:    'nt_workout_logs',
}

function get(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}
function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  pushKey(key).catch(() => {})
}

// --- Weekly plan ---
export const WEEK_DAYS = [
  { id: 'monday',    label: 'Segunda' },
  { id: 'tuesday',   label: 'Terça'   },
  { id: 'wednesday', label: 'Quarta'  },
  { id: 'thursday',  label: 'Quinta'  },
  { id: 'friday',    label: 'Sexta'   },
  { id: 'saturday',  label: 'Sábado'  },
  { id: 'sunday',    label: 'Domingo' },
]

export function getTrainingPlan() {
  return get(KEYS.plan) ?? {}
}

export function saveTrainingPlan(plan) {
  set(KEYS.plan, plan)
}

// --- Workout logs ---
export function getWorkoutLogs() {
  return get(KEYS.logs) ?? []
}

export function saveWorkoutLog(log) {
  const logs = getWorkoutLogs()
  const idx = logs.findIndex(l => l.id === log.id)
  if (idx >= 0) logs[idx] = log
  else logs.unshift(log)
  set(KEYS.logs, logs)
}

export function deleteWorkoutLog(id) {
  set(KEYS.logs, getWorkoutLogs().filter(l => l.id !== id))
}

// Returns all logged sets for a given exerciseId, sorted by date asc
export function getExerciseHistory(exerciseId) {
  const logs = getWorkoutLogs()
  const points = []
  ;[...logs].reverse().forEach(log => {
    const ex = log.exercises?.find(e => e.exerciseId === exerciseId)
    if (!ex) return
    const sets = ex.sets?.filter(s => s.completed) ?? []
    if (sets.length === 0) return
    const maxWeight = Math.max(...sets.map(s => s.weight ?? 0))
    const totalVol = sets.reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0)
    points.push({ date: log.date, maxWeight, totalVol, sets })
  })
  return points
}

export function getTodayDayId() {
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  return days[new Date().getDay()]
}
