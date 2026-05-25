import { useState } from 'react'
import { Plus, Trash2, Dumbbell } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { calculateCaloriesBurned } from '../utils/calculations'
import { EXERCISES, EXERCISE_INTENSITIES } from '../utils/constants'
import Modal from '../components/ui/Modal'

function ExerciseModal({ open, onClose, onAdd }) {
  const { profile } = useApp()
  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id)
  const [duration, setDuration] = useState('30')
  const [intensity, setIntensity] = useState('moderate')
  const [customName, setCustomName] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  function handleAdd() {
    const weight = profile?.weight ?? 70
    const exercise = EXERCISES.find(e => e.id === exerciseId)
    const metMultiplier = EXERCISE_INTENSITIES[intensity].metMultiplier
    const met = (exercise?.met ?? 5) * metMultiplier
    const dur = parseFloat(duration)
    const burned = calculateCaloriesBurned(met, weight, dur)
    onAdd({
      id: Date.now().toString(),
      name: isCustom ? customName : exercise.name,
      duration: dur,
      intensity,
      caloriesBurned: burned,
      met,
    })
    onClose()
  }

  const preview = (() => {
    const weight = profile?.weight ?? 70
    const exercise = EXERCISES.find(e => e.id === exerciseId)
    const metMultiplier = EXERCISE_INTENSITIES[intensity].metMultiplier
    const met = (exercise?.met ?? 5) * metMultiplier
    return calculateCaloriesBurned(met, weight, parseFloat(duration) || 0)
  })()

  return (
    <Modal open={open} onClose={onClose} title="Adicionar exercício">
      <div className="space-y-4">
        <div className="flex gap-2 mb-2">
          <button onClick={() => setIsCustom(false)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!isCustom ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
            Lista
          </button>
          <button onClick={() => setIsCustom(true)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isCustom ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
            Personalizado
          </button>
        </div>

        {!isCustom ? (
          <div>
            <label className="label">Exercício</label>
            <select className="input" value={exerciseId} onChange={e => setExerciseId(e.target.value)}>
              {EXERCISES.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="label">Nome do exercício</label>
            <input className="input" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Ex: Treino funcional" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Duração (min)</label>
            <input className="input" type="number" value={duration} onChange={e => setDuration(e.target.value)} min="1" />
          </div>
          <div>
            <label className="label">Intensidade</label>
            <select className="input" value={intensity} onChange={e => setIntensity(e.target.value)}>
              {Object.entries(EXERCISE_INTENSITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
          <p className="text-emerald-400 text-xl font-bold">{preview} kcal</p>
          <p className="text-xs text-zinc-500 mt-0.5">estimativa de gasto calórico</p>
        </div>

        <button onClick={handleAdd} className="btn-primary w-full">Adicionar exercício</button>
      </div>
    </Modal>
  )
}

export default function Exercicios() {
  const { dayLog, addExercise, removeExercise } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const exercises = dayLog.exercises ?? []
  const totalBurned = exercises.reduce((s, e) => s + e.caloriesBurned, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Cardio</h1>
          <p className="text-sm text-zinc-500">
            {exercises.length === 0 ? 'Nenhum exercício hoje' : exercises.length === 1 ? '1 exercício hoje' : `${exercises.length} exercícios hoje`}
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {totalBurned > 0 && (
        <div className="card bg-emerald-500/5 border-emerald-500/20">
          <p className="text-xs text-zinc-500 mb-1">Total queimado hoje</p>
          <p className="text-2xl font-bold text-emerald-400">{totalBurned} <span className="text-sm font-normal text-zinc-400">kcal</span></p>
        </div>
      )}

      {exercises.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <Dumbbell size={32} className="text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-medium">Nenhum exercício registrado</p>
          <p className="text-zinc-600 text-sm mt-1">Adicione seus treinos para calcular o gasto calórico</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map(ex => (
            <div key={ex.id} className="card flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Dumbbell size={16} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{ex.name}</p>
                <p className="text-xs text-zinc-500">
                  {ex.duration} min · {EXERCISE_INTENSITIES[ex.intensity]?.label ?? ex.intensity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-400 text-sm">{ex.caloriesBurned} kcal</p>
              </div>
              <button onClick={() => removeExercise(ex.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ExerciseModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={addExercise} />
    </div>
  )
}
