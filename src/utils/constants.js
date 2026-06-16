export const GOALS = {
  weight_loss: { label: 'Emagrecimento', calorieAdjust: -500 },
  maintenance: { label: 'Manutenção', calorieAdjust: 0 },
  muscle_gain: { label: 'Ganho de massa', calorieAdjust: 300 },
  weight_gain: { label: 'Ganho de peso', calorieAdjust: 500 },
}

export const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentário', multiplier: 1.2 },
  light: { label: 'Levemente ativo', multiplier: 1.375 },
  moderate: { label: 'Moderadamente ativo', multiplier: 1.55 },
  active: { label: 'Muito ativo', multiplier: 1.725 },
  very_active: { label: 'Extremamente ativo', multiplier: 1.9 },
}

export const EXERCISE_INTENSITIES = {
  light: { label: 'Leve', metMultiplier: 1 },
  moderate: { label: 'Moderado', metMultiplier: 1.5 },
  intense: { label: 'Intenso', metMultiplier: 2 },
  very_intense: { label: 'Muito intenso', metMultiplier: 2.5 },
}

export const EXERCISES = [
  { id: 'walking', name: 'Caminhada', met: 3.5 },
  { id: 'running', name: 'Corrida', met: 8 },
  { id: 'cycling', name: 'Ciclismo', met: 7 },
  { id: 'swimming', name: 'Natação', met: 6 },
  { id: 'weight_training', name: 'Musculação', met: 4 },
  { id: 'yoga', name: 'Yoga', met: 2.5 },
  { id: 'hiit', name: 'HIIT', met: 10 },
  { id: 'cardio', name: 'Cardio (geral)', met: 7 },
  { id: 'stretching', name: 'Alongamento', met: 2.3 },
  { id: 'breathing', name: 'Respiração', met: 1.3 },
  { id: 'guided_meditation', name: 'Meditação guiada', met: 1.2 },
  { id: 'jump_rope', name: 'Corda', met: 10 },
  { id: 'dance', name: 'Dança', met: 5 },
  { id: 'soccer', name: 'Futebol', met: 7 },
  { id: 'basketball', name: 'Basquete', met: 6.5 },
  { id: 'tennis', name: 'Tênis', met: 7 },
  { id: 'pilates', name: 'Pilates', met: 3 },
  { id: 'elliptical', name: 'Elíptico', met: 5 },
  { id: 'rowing', name: 'Remo', met: 7 },
  { id: 'stair_climbing', name: 'Escada', met: 8 },
  { id: 'boxing', name: 'Boxe', met: 9 },
  { id: 'crossfit', name: 'CrossFit', met: 11 },
]

export const DEFAULT_MEALS = [
  { id: 'breakfast', name: 'Café da manhã', calorieGoal: 400, icon: '🌅' },
  { id: 'morning_snack', name: 'Lanche da manhã', calorieGoal: 150, icon: '🍎' },
  { id: 'lunch', name: 'Almoço', calorieGoal: 600, icon: '☀️' },
  { id: 'afternoon_snack', name: 'Lanche da tarde', calorieGoal: 150, icon: '🍌' },
  { id: 'dinner', name: 'Jantar', calorieGoal: 500, icon: '🌙' },
]

export const USDA_API_KEY = 'DEMO_KEY'
export const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1'
