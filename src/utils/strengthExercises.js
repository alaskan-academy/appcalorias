export const MUSCLE_GROUPS = {
  chest:     { label: 'Peito',        color: '#f87171' },
  back:      { label: 'Costas',       color: '#60a5fa' },
  shoulders: { label: 'Ombros',       color: '#a78bfa' },
  biceps:    { label: 'Bíceps',       color: '#34d399' },
  triceps:   { label: 'Tríceps',      color: '#fbbf24' },
  legs:      { label: 'Pernas',       color: '#fb923c' },
  glutes:    { label: 'Glúteos',      color: '#e879f9' },
  core:      { label: 'Core/Abdomen', color: '#2dd4bf' },
  cardio:    { label: 'Cardio',       color: '#94a3b8' },
  full_body: { label: 'Corpo todo',   color: '#8b5cf6' },
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
  // Pernas
  { id: 'squat',              name: 'Agachamento',           muscle: 'legs',      unit: 'kg' },
  { id: 'leg_press',          name: 'Leg press',             muscle: 'legs',      unit: 'kg' },
  { id: 'leg_extension',      name: 'Extensão de joelho',    muscle: 'legs',      unit: 'kg' },
  { id: 'leg_curl',           name: 'Flexão de joelho',      muscle: 'legs',      unit: 'kg' },
  { id: 'calf_raise',         name: 'Panturrilha',           muscle: 'legs',      unit: 'kg' },
  { id: 'lunge',              name: 'Avanço',                muscle: 'legs',      unit: 'kg' },
  { id: 'sumo_squat',         name: 'Agachamento sumô',      muscle: 'legs',      unit: 'kg' },
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
]
