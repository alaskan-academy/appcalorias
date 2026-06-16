export const MUSCLE_GROUPS = {
  chest:       { label: 'Peito',            color: '#f87171' },
  back:        { label: 'Costas',           color: '#60a5fa' },
  shoulders:   { label: 'Ombros',           color: '#a78bfa' },
  biceps:      { label: 'Bíceps',           color: '#34d399' },
  triceps:     { label: 'Tríceps',          color: '#fbbf24' },
  quadriceps:  { label: 'Quadríceps',       color: '#fb923c' },
  hamstrings:  { label: 'Posterior de coxa',color: '#f59e0b' },
  calves:      { label: 'Panturrilha',      color: '#eab308' },
  legs:        { label: 'Pernas (geral)',   color: '#fdba74' },
  glutes:      { label: 'Glúteos',          color: '#e879f9' },
  core:        { label: 'Core/Abdomen',     color: '#2dd4bf' },
  cardio:      { label: 'Cardio',           color: '#94a3b8' },
  full_body:   { label: 'Corpo todo',       color: '#8b5cf6' },
}

export const STRENGTH_EXERCISES = [
  // Peito
  { id: 'bench_press',        name: 'Supino reto',           muscle: 'chest',     unit: 'kg' },
  { id: 'incline_press',      name: 'Supino inclinado',      muscle: 'chest',     unit: 'kg' },
  { id: 'decline_press',      name: 'Supino declinado',      muscle: 'chest',     unit: 'kg' },
  { id: 'chest_fly',          name: 'Crucifixo',             muscle: 'chest',     unit: 'kg' },
  { id: 'cable_crossover',    name: 'Cross over',            muscle: 'chest',     unit: 'kg' },
  { id: 'dips',               name: 'Mergulho (paralelas)',  muscle: 'chest',     unit: 'peso_corporal' },
  { id: 'pushup',             name: 'Flexão de braços',      muscle: 'chest',     unit: 'peso_corporal' },
  // Costas
  { id: 'pullup',             name: 'Barra fixa',            muscle: 'back',      unit: 'peso_corporal' },
  { id: 'lat_pulldown',       name: 'Puxada alta',           muscle: 'back',      unit: 'kg' },
  { id: 'seated_row',         name: 'Remada sentada',        muscle: 'back',      unit: 'kg' },
  { id: 'bent_row',           name: 'Remada curvada',        muscle: 'back',      unit: 'kg' },
  { id: 'one_arm_row',        name: 'Remada unilateral',     muscle: 'back',      unit: 'kg' },
  { id: 'deadlift',           name: 'Levantamento terra',    muscle: 'back',      unit: 'kg' },
  { id: 'hyperextension',     name: 'Hiperextensão',         muscle: 'back',      unit: 'kg' },
  // Ombros
  { id: 'shoulder_press',     name: 'Desenvolvimento',       muscle: 'shoulders', unit: 'kg' },
  { id: 'lateral_raise',      name: 'Elevação lateral',      muscle: 'shoulders', unit: 'kg' },
  { id: 'front_raise',        name: 'Elevação frontal',      muscle: 'shoulders', unit: 'kg' },
  { id: 'face_pull',          name: 'Face pull',             muscle: 'shoulders', unit: 'kg' },
  { id: 'upright_row',        name: 'Remada alta',           muscle: 'shoulders', unit: 'kg' },
  // Bíceps
  { id: 'barbell_curl',       name: 'Rosca direta',          muscle: 'biceps',    unit: 'kg' },
  { id: 'hammer_curl',        name: 'Rosca martelo',         muscle: 'biceps',    unit: 'kg' },
  { id: 'concentration_curl', name: 'Rosca concentrada',     muscle: 'biceps',    unit: 'kg' },
  { id: 'incline_curl',       name: 'Rosca inclinada',       muscle: 'biceps',    unit: 'kg' },
  // Tríceps
  { id: 'tricep_pushdown',    name: 'Tríceps pulley',        muscle: 'triceps',   unit: 'kg' },
  { id: 'skull_crusher',      name: 'Tríceps testa',         muscle: 'triceps',   unit: 'kg' },
  { id: 'overhead_tricep',    name: 'Tríceps francês',       muscle: 'triceps',   unit: 'kg' },
  { id: 'tricep_kickback',    name: 'Tríceps coice',         muscle: 'triceps',   unit: 'kg' },
  // Pernas — Quadríceps
  { id: 'squat',              name: 'Agachamento',           muscle: 'quadriceps', unit: 'kg' },
  { id: 'leg_press',          name: 'Leg press',             muscle: 'quadriceps', unit: 'kg' },
  { id: 'leg_extension',      name: 'Extensão de joelho',    muscle: 'quadriceps', unit: 'kg' },
  { id: 'lunge',              name: 'Avanço',                muscle: 'quadriceps', unit: 'kg' },
  { id: 'bulgarian_split_squat', name: 'Agachamento búlgaro', muscle: 'quadriceps', unit: 'kg' },
  { id: 'hack_squat',         name: 'Hack squat',            muscle: 'quadriceps', unit: 'kg' },
  // Pernas — Posterior de coxa
  { id: 'leg_curl',           name: 'Flexão de joelho',      muscle: 'hamstrings', unit: 'kg' },
  { id: 'stiff',              name: 'Stiff',                 muscle: 'hamstrings', unit: 'kg' },
  { id: 'good_morning',       name: 'Good morning',          muscle: 'hamstrings', unit: 'kg' },
  // Pernas — Panturrilha
  { id: 'calf_raise',         name: 'Panturrilha em pé',     muscle: 'calves',    unit: 'kg' },
  { id: 'seated_calf_raise',  name: 'Panturrilha sentado',   muscle: 'calves',    unit: 'kg' },
  // Pernas — Glúteos (predominância de glúteo/adutores)
  { id: 'sumo_squat',         name: 'Agachamento sumô',      muscle: 'glutes',    unit: 'kg' },
  // Glúteos
  { id: 'hip_thrust',         name: 'Hip thrust',            muscle: 'glutes',    unit: 'kg' },
  { id: 'glute_bridge',       name: 'Ponte de glúteo',       muscle: 'glutes',    unit: 'kg' },
  { id: 'cable_kickback',     name: 'Coice no cabo',         muscle: 'glutes',    unit: 'kg' },
  { id: 'abduction',          name: 'Abdução de quadril',    muscle: 'glutes',    unit: 'kg' },
  // Core
  { id: 'crunch',             name: 'Abdominal crunch',      muscle: 'core',      unit: 'reps' },
  { id: 'plank',              name: 'Prancha',               muscle: 'core',      unit: 'seg' },
  { id: 'leg_raise',          name: 'Elevação de pernas',    muscle: 'core',      unit: 'reps' },
  { id: 'russian_twist',      name: 'Torção russa',          muscle: 'core',      unit: 'reps' },
  { id: 'cable_crunch',       name: 'Abdominal no cabo',     muscle: 'core',      unit: 'kg' },
  // Cardio / Bem-estar
  { id: 'cardio_general',     name: 'Cardio (geral)',        muscle: 'cardio',    unit: 'seg' },
  { id: 'hiit_plan',          name: 'HIIT',                  muscle: 'cardio',    unit: 'seg' },
  { id: 'walking_plan',       name: 'Caminhada',             muscle: 'cardio',    unit: 'seg' },
  { id: 'yoga_plan',          name: 'Yoga',                  muscle: 'cardio',    unit: 'seg' },
  { id: 'stretching_plan',    name: 'Alongamento',           muscle: 'cardio',    unit: 'seg' },
  { id: 'breathing_plan',     name: 'Respiração',            muscle: 'cardio',    unit: 'seg' },
  { id: 'guided_meditation_plan', name: 'Meditação guiada',  muscle: 'cardio',    unit: 'seg' },
]

// Formata uma duração em segundos para a unidade mais legível (s, min ou h)
export function formatDuration(totalSeconds) {
  const s = Math.round(Number(totalSeconds) || 0)
  if (s <= 0) return '0s'
  if (s < 60) return `${s}s`

  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const rem = s % 60

  if (h > 0) {
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }
  return rem > 0 ? `${m}min ${rem}s` : `${m}min`
}
