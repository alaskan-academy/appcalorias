import { GOALS, ACTIVITY_LEVELS } from './constants'

export function calculateBMR(weight, height, age, sex) {
  if (sex === 'female') {
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
  return 10 * weight + 6.25 * height - 5 * age + 5
}

export function calculateTDEE(weight, height, age, sex, activityLevel) {
  const bmr = calculateBMR(weight, height, age, sex)
  const multiplier = ACTIVITY_LEVELS[activityLevel]?.multiplier ?? 1.2
  return Math.round(bmr * multiplier)
}

export function calculateDailyCalories(weight, height, age, sex, activityLevel, goal) {
  const tdee = calculateTDEE(weight, height, age, sex, activityLevel)
  const adjust = GOALS[goal]?.calorieAdjust ?? 0
  return Math.max(1200, Math.round(tdee + adjust))
}

export function calculateMacros(calories, goal) {
  const macroProfiles = {
    weight_loss:  { protein: 0.35, carbs: 0.35, fat: 0.30 },
    maintenance:  { protein: 0.25, carbs: 0.50, fat: 0.25 },
    muscle_gain:  { protein: 0.30, carbs: 0.45, fat: 0.25 },
    weight_gain:  { protein: 0.25, carbs: 0.50, fat: 0.25 },
  }
  const profile = macroProfiles[goal] ?? macroProfiles.maintenance
  return {
    protein: Math.round((calories * profile.protein) / 4),
    carbs:   Math.round((calories * profile.carbs) / 4),
    fat:     Math.round((calories * profile.fat) / 9),
  }
}

// Returns { ideal, minimum } — respects manual override stored in profile.waterGoal
export function getWaterGoal(profile) {
  if (!profile) return { minimum: 1800, ideal: 2500 }
  if (profile.waterGoal && profile.waterGoal > 0) {
    return { ideal: profile.waterGoal, minimum: Math.round(profile.waterGoal * 0.8) }
  }
  return calculateWaterIntake(profile.weight, profile.goal)
}

export function calculateWaterIntake(weight, goal) {
  const base = weight * 35
  const adjustments = {
    weight_loss:  200,
    maintenance:  0,
    muscle_gain:  300,
    weight_gain:  100,
  }
  const minimum = Math.round(base * 0.8)
  const ideal = Math.round(base + (adjustments[goal] ?? 0))
  return { minimum, ideal }
}

export function calculateCaloriesBurned(met, weight, durationMinutes) {
  return Math.round((met * weight * durationMinutes) / 60)
}

export function calculateHeartRateZones(age) {
  const maxHR = 220 - age
  return {
    maxHR,
    zones: [
      { name: 'Aquecimento',     range: [Math.round(maxHR * 0.50), Math.round(maxHR * 0.60)], color: '#60a5fa', benefit: 'Recuperação ativa' },
      { name: 'Queima de gordura', range: [Math.round(maxHR * 0.60), Math.round(maxHR * 0.70)], color: '#34d399', benefit: 'Melhor zona para emagrecer' },
      { name: 'Aeróbico',        range: [Math.round(maxHR * 0.70), Math.round(maxHR * 0.80)], color: '#fbbf24', benefit: 'Resistência cardiovascular' },
      { name: 'Anaeróbico',      range: [Math.round(maxHR * 0.80), Math.round(maxHR * 0.90)], color: '#f97316', benefit: 'Velocidade e performance' },
      { name: 'Máximo',          range: [Math.round(maxHR * 0.90), maxHR],                    color: '#f43f5e', benefit: 'Esforço máximo — curto prazo' },
    ],
  }
}

export function getCardioBestZone(age) {
  const zones = calculateHeartRateZones(age)
  return zones.zones[1]
}

export function scaleMacros(macrosPer100g, quantityGrams) {
  const factor = quantityGrams / 100
  return {
    calories: Math.round((macrosPer100g.calories ?? 0) * factor * 10) / 10,
    protein:  Math.round((macrosPer100g.protein  ?? 0) * factor * 10) / 10,
    carbs:    Math.round((macrosPer100g.carbs    ?? 0) * factor * 10) / 10,
    fat:      Math.round((macrosPer100g.fat      ?? 0) * factor * 10) / 10,
    fiber:    Math.round((macrosPer100g.fiber    ?? 0) * factor * 10) / 10,
  }
}

export function sumMacros(entries) {
  return entries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories ?? 0),
    protein:  acc.protein  + (e.protein  ?? 0),
    carbs:    acc.carbs    + (e.carbs    ?? 0),
    fat:      acc.fat      + (e.fat      ?? 0),
    fiber:    acc.fiber    + (e.fiber    ?? 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
}

export function formatCalories(value) {
  return Math.round(value).toLocaleString('pt-BR')
}

// ── Activity goals ──────────────────────────────────────────────────────────
// Returns suggested { stepsPerDay, cardioSessionsPerWeek, cardioDurationMin, strengthSessionsPerWeek }
// based on goal and activity level. Respects profile.activityGoals override.

const ACTIVITY_GOAL_BASE = {
  weight_loss: { steps: 9000, cardio: 4, cardioDur: 50, strength: 2 },
  maintenance: { steps: 8000, cardio: 3, cardioDur: 45, strength: 2 },
  muscle_gain: { steps: 7000, cardio: 2, cardioDur: 35, strength: 3 },
  weight_gain: { steps: 6000, cardio: 2, cardioDur: 30, strength: 3 },
}

const ACTIVITY_LEVEL_ADJ = {
  sedentary:   { steps: +1000, cardio: +1, cardioDur: +10, strength:  0 },
  light:       { steps:  +500, cardio: +1, cardioDur:  +5, strength:  0 },
  moderate:    { steps:     0, cardio:  0, cardioDur:   0, strength:  0 },
  active:      { steps:  -500, cardio: -1, cardioDur:  -5, strength: +1 },
  very_active: { steps: -1000, cardio: -1, cardioDur: -10, strength: +1 },
}

export function calculateActivityGoals(profile) {
  const goal  = profile?.goal         ?? 'maintenance'
  const level = profile?.activityLevel ?? 'moderate'
  const base  = ACTIVITY_GOAL_BASE[goal]  ?? ACTIVITY_GOAL_BASE.maintenance
  const adj   = ACTIVITY_LEVEL_ADJ[level] ?? ACTIVITY_LEVEL_ADJ.moderate
  return {
    stepsPerDay:             Math.max(4000, base.steps    + adj.steps),
    cardioSessionsPerWeek:   Math.max(1,    base.cardio   + adj.cardio),
    cardioDurationMin:       Math.max(20,   base.cardioDur + adj.cardioDur),
    strengthSessionsPerWeek: Math.max(1,    base.strength  + adj.strength),
  }
}

// Returns the active goals — manual override takes precedence over suggestion
export function getActivityGoals(profile) {
  const suggested = calculateActivityGoals(profile)
  const manual    = profile?.activityGoals
  if (!manual) return suggested
  return {
    stepsPerDay:             manual.stepsPerDay             ?? suggested.stepsPerDay,
    cardioSessionsPerWeek:   manual.cardioSessionsPerWeek   ?? suggested.cardioSessionsPerWeek,
    cardioDurationMin:       manual.cardioDurationMin        ?? suggested.cardioDurationMin,
    strengthSessionsPerWeek: manual.strengthSessionsPerWeek ?? suggested.strengthSessionsPerWeek,
  }
}
