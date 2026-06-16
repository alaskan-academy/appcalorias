import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash2, ChevronDown, ChevronUp, Check, Dumbbell, BarChart2, Calendar, Play, X, TrendingUp, Clock, Heart, Pencil, ArrowUp, ArrowDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  WEEK_DAYS, getTrainingPlan, saveTrainingPlan,
  getWorkoutLogs, saveWorkoutLog, deleteWorkoutLog,
  getExerciseHistory, getTodayDayId,
} from '../utils/trainingStorage'
import { STRENGTH_EXERCISES, MUSCLE_GROUPS } from '../utils/strengthExercises'
import { calculateHeartRateZones } from '../utils/calculations'
import { useApp } from '../context/AppContext'
import Modal from '../components/ui/Modal'

// ─── helpers ────────────────────────────────────────────────────────────────

function muscleTag(muscle) {
  const g = MUSCLE_GROUPS[muscle]
  if (!g) return null
  return (
    <span className="badge text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: g.color + '22', color: g.color }}>
      {g.label}
    </span>
  )
}

const TABS = [
  { id: 'plan',    label: 'Plano semanal', icon: Calendar },
  { id: 'today',  label: 'Treinar hoje',  icon: Play },
  { id: 'history',label: 'Histórico',     icon: BarChart2 },
  { id: 'zones',  label: 'Zonas FC',      icon: Heart },
]

// ─── Add exercise to day modal ───────────────────────────────────────────────

function AddExerciseModal({ open, onClose, onSave, existing }) {
  const [muscle, setMuscle] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [sets, setSets]       = useState('3')
  const [reps, setReps]       = useState('12')
  const [weight, setWeight]   = useState('')
  const [duration, setDuration] = useState('')
  const [customName, setCustomName] = useState('')
  const [customMuscle, setCustomMuscle] = useState('full_body')
  const [useCustom, setUseCustom] = useState(false)

  // Pre-fill when editing an existing exercise
  useEffect(() => {
    if (!open) return
    if (existing) {
      const fromList = STRENGTH_EXERCISES.find(e => e.id === existing.exerciseId)
      const isCustomEx = !fromList
      setUseCustom(isCustomEx)
      if (isCustomEx) {
        setCustomName(existing.name ?? '')
        setCustomMuscle(existing.muscle ?? 'full_body')
        setSelected(null)
      } else {
        setSelected(existing.exerciseId)
      }
      setSets(String(existing.targetSets ?? 3))
      setReps(String(existing.targetReps ?? 12))
      setWeight(existing.targetWeight != null ? String(existing.targetWeight) : '')
      setDuration(existing.targetDuration != null ? String(existing.targetDuration) : '')
    } else {
      setUseCustom(false); setSelected(null); setCustomName(''); setCustomMuscle('full_body')
      setSets('3'); setReps('12'); setWeight(''); setDuration(''); setSearch(''); setMuscle('all')
    }
  }, [existing, open])

  const filtered = STRENGTH_EXERCISES.filter(e =>
    (muscle === 'all' || e.muscle === muscle) &&
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const ex = useCustom ? null : selected ? STRENGTH_EXERCISES.find(e => e.id === selected) : null
  const unit = ex?.unit ?? 'kg'

  function handleSave() {
    const name = useCustom ? customName.trim() : ex?.name
    if (!name) return
    onSave({
      exerciseId: existing?.exerciseId ?? (useCustom ? `custom_${Date.now()}` : selected),
      name,
      muscle: useCustom ? customMuscle : (ex?.muscle ?? 'full_body'),
      unit: ex?.unit ?? 'kg',
      targetSets:   parseInt(sets)   || 3,
      targetReps:   parseInt(reps)   || 12,
      targetWeight: parseFloat(weight)   || null,
      targetDuration: parseFloat(duration) || null,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Editar exercício' : 'Adicionar exercício ao dia'} size="lg">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setUseCustom(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!useCustom ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
            Lista
          </button>
          <button onClick={() => setUseCustom(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${useCustom ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
            Personalizado
          </button>
        </div>

        {useCustom ? (
          <div className="space-y-3">
            <div>
              <label className="label">Nome do exercício</label>
              <input className="input" value={customName} onChange={e => setCustomName(e.target.value)}
                placeholder="Ex: Agachamento búlgaro" autoFocus />
            </div>
            <div>
              <label className="label">Grupo muscular</label>
              <select className="input" value={customMuscle} onChange={e => setCustomMuscle(e.target.value)}>
                {Object.entries(MUSCLE_GROUPS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input className="input flex-1" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar exercício..." autoFocus />
              <select className="input w-36" value={muscle} onChange={e => setMuscle(e.target.value)}>
                <option value="all">Todos</option>
                {Object.entries(MUSCLE_GROUPS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="max-h-44 overflow-y-auto space-y-0.5">
              {filtered.map(e => (
                <button key={e.id} onClick={() => setSelected(e.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between ${selected === e.id ? 'bg-violet-600/20 border border-violet-500/30' : 'hover:bg-zinc-800'}`}>
                  <span className="text-zinc-200">{e.name}</span>
                  {muscleTag(e.muscle)}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className="label">Séries</label>
            <input className="input" type="number" value={sets} onChange={e => setSets(e.target.value)} min="1" />
          </div>
          <div>
            <label className="label">Reps</label>
            <input className="input" type="number" value={reps} onChange={e => setReps(e.target.value)} min="1" />
          </div>
          {(unit === 'kg') && (
            <div className="col-span-2">
              <label className="label">Carga alvo (kg)</label>
              <input className="input" type="number" value={weight} onChange={e => setWeight(e.target.value)} min="0" step="0.5" placeholder="opcional" />
            </div>
          )}
          {(unit === 'seg' || unit === 'reps') && (
            <div className="col-span-2">
              <label className="label">{unit === 'seg' ? 'Duração alvo (seg)' : 'Reps alvo'}</label>
              <input className="input" type="number" value={duration} onChange={e => setDuration(e.target.value)} min="1" placeholder="opcional" />
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={useCustom ? !customName.trim() : !selected} className="btn-primary w-full disabled:opacity-40">
          {existing ? 'Salvar alterações' : 'Adicionar ao dia'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Plan tab ────────────────────────────────────────────────────────────────

function PlanTab() {
  const [plan, setPlan] = useState(() => getTrainingPlan())
  const [activeDay, setActiveDay] = useState(null)
  const [addModal, setAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // { dayId, idx, exercise }
  const todayId = getTodayDayId()

  function addExercise(dayId, ex) {
    const updated = { ...plan, [dayId]: [...(plan[dayId] ?? []), ex] }
    setPlan(updated)
    saveTrainingPlan(updated)
  }

  function updateExercise(dayId, idx, ex) {
    const list = [...plan[dayId]]
    list[idx] = ex
    const updated = { ...plan, [dayId]: list }
    setPlan(updated)
    saveTrainingPlan(updated)
  }

  function removeExercise(dayId, idx) {
    const updated = { ...plan, [dayId]: plan[dayId].filter((_, i) => i !== idx) }
    setPlan(updated)
    saveTrainingPlan(updated)
  }

  function moveExercise(dayId, idx, dir) {
    const list = [...plan[dayId]]
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= list.length) return
    ;[list[idx], list[newIdx]] = [list[newIdx], list[idx]]
    const updated = { ...plan, [dayId]: list }
    setPlan(updated)
    saveTrainingPlan(updated)
  }

  function clearDay(dayId) {
    const updated = { ...plan, [dayId]: [] }
    setPlan(updated)
    saveTrainingPlan(updated)
  }

  function closeModal() { setAddModal(false); setEditTarget(null) }
  function handleSave(ex) {
    if (editTarget) updateExercise(editTarget.dayId, editTarget.idx, ex)
    else addExercise(addModal, ex)
  }

  return (
    <div className="space-y-3">
      {WEEK_DAYS.map(day => {
        const exercises = plan[day.id] ?? []
        const isToday = day.id === todayId
        const isOpen = activeDay === day.id

        return (
          <div key={day.id} className={`card border ${isToday ? 'border-violet-500/40' : 'border-zinc-800'}`}>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveDay(isOpen ? null : day.id)}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${isToday ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                {day.label.slice(0, 3).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${isToday ? 'text-violet-300' : 'text-white'}`}>{day.label}</p>
                  {isToday && <span className="text-xs bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded-full">hoje</span>}
                </div>
                <p className="text-xs text-zinc-500">
                  {exercises.length === 0 ? 'Descanso' : `${exercises.length} exercício${exercises.length > 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {exercises.length > 0 && (
                  <div className="flex gap-1 flex-wrap justify-end max-w-40 hidden sm:flex">
                    {[...new Set(exercises.map(e => e.muscle))].slice(0, 3).map(m => (
                      <span key={m} className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: (MUSCLE_GROUPS[m]?.color ?? '#8b5cf6') + '22', color: MUSCLE_GROUPS[m]?.color ?? '#8b5cf6' }}>
                        {MUSCLE_GROUPS[m]?.label ?? m}
                      </span>
                    ))}
                  </div>
                )}
                {isOpen ? <ChevronUp size={15} className="text-zinc-500" /> : <ChevronDown size={15} className="text-zinc-500" />}
              </div>
            </div>

            {isOpen && (
              <div className="mt-3 space-y-2">
                {exercises.length === 0 && (
                  <p className="text-zinc-600 text-sm text-center py-3">Nenhum exercício — dia de descanso</p>
                )}
                {exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-xl bg-zinc-800/40 group">
                    <div className="flex flex-col flex-shrink-0">
                      <button onClick={() => moveExercise(day.id, i, -1)} disabled={i === 0}
                        className="p-0.5 rounded text-zinc-600 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <ArrowUp size={12} />
                      </button>
                      <button onClick={() => moveExercise(day.id, i, 1)} disabled={i === exercises.length - 1}
                        className="p-0.5 rounded text-zinc-600 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <ArrowDown size={12} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white font-medium">{ex.name}</p>
                        {muscleTag(ex.muscle)}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {ex.targetSets}×{ex.targetReps}
                        {ex.targetWeight ? ` · ${ex.targetWeight}kg` : ''}
                        {ex.targetDuration ? ` · ${ex.targetDuration}${ex.unit}` : ''}
                      </p>
                    </div>
                    <button onClick={() => setEditTarget({ dayId: day.id, idx: i, exercise: ex })}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-violet-600/20 text-zinc-600 hover:text-violet-400 transition-all flex-shrink-0">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => removeExercise(day.id, i)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-all flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <button onClick={() => { setActiveDay(day.id); setAddModal(day.id) }}
                    className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                    <Plus size={14} /> Adicionar exercício
                  </button>
                  {exercises.length > 0 && (
                    <button onClick={() => clearDay(day.id)}
                      className="text-xs text-zinc-600 hover:text-red-400 transition-colors">
                      Limpar dia
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <AddExerciseModal
        open={!!addModal || !!editTarget}
        onClose={closeModal}
        existing={editTarget?.exercise}
        onSave={handleSave}
      />
    </div>
  )
}

// ─── Active workout session ──────────────────────────────────────────────────

function SetRow({ set, onChange }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${set.completed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-800/50'}`}>
      <span className="text-xs text-zinc-500 w-6 text-center font-mono">{set.number}</span>
      <div className="flex gap-2 flex-1">
        {set.unit !== 'seg' && (
          <div className="flex-1">
            <input className="input py-1.5 text-sm text-center" type="number"
              value={set.weight ?? ''} placeholder="kg" min="0" step="0.5"
              onChange={e => onChange({ ...set, weight: parseFloat(e.target.value) || 0 })} />
          </div>
        )}
        <div className="flex-1">
          <input className="input py-1.5 text-sm text-center" type="number"
            value={set.reps ?? ''} placeholder={set.unit === 'seg' ? 'seg' : 'reps'} min="0"
            onChange={e => onChange({ ...set, reps: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <button onClick={() => onChange({ ...set, completed: !set.completed })}
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${set.completed ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-500 hover:bg-zinc-600'}`}>
        <Check size={14} />
      </button>
    </div>
  )
}

function WorkoutExerciseCard({ ex, sessionEx, onChange }) {
  const [expanded, setExpanded] = useState(true)
  const completedSets = sessionEx.sets.filter(s => s.completed).length

  function updateSet(idx, updated) {
    const sets = [...sessionEx.sets]
    sets[idx] = updated
    onChange({ ...sessionEx, sets })
  }

  function addSet() {
    const last = sessionEx.sets[sessionEx.sets.length - 1]
    onChange({
      ...sessionEx,
      sets: [...sessionEx.sets, {
        number: sessionEx.sets.length + 1,
        weight: last?.weight ?? ex.targetWeight ?? 0,
        reps: last?.reps ?? ex.targetReps ?? 0,
        unit: ex.unit,
        completed: false,
      }],
    })
  }

  function removeLastSet() {
    if (sessionEx.sets.length <= 1) return
    onChange({ ...sessionEx, sets: sessionEx.sets.slice(0, -1) })
  }

  const allDone = sessionEx.sets.length > 0 && sessionEx.sets.every(s => s.completed)

  return (
    <div className={`card border ${allDone ? 'border-emerald-500/30' : 'border-zinc-800'}`}>
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${allDone ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
          {allDone ? <Check size={15} className="text-emerald-400" /> : <Dumbbell size={15} className="text-zinc-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white">{ex.name}</p>
            {muscleTag(ex.muscle)}
          </div>
          <p className="text-xs text-zinc-500">
            {completedSets}/{sessionEx.sets.length} séries concluídas
            {ex.targetWeight ? ` · alvo: ${ex.targetWeight}kg` : ''}
          </p>
        </div>
        {expanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
      </div>

      {expanded && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 px-3 mb-1">
            <span className="text-xs text-zinc-600 w-6 text-center">#</span>
            {ex.unit !== 'seg' && <span className="text-xs text-zinc-500 flex-1 text-center">Carga (kg)</span>}
            <span className="text-xs text-zinc-500 flex-1 text-center">{ex.unit === 'seg' ? 'Seg' : 'Reps'}</span>
            <span className="w-8" />
          </div>
          {sessionEx.sets.map((set, i) => (
            <SetRow key={i} set={set} onChange={updated => updateSet(i, updated)} />
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={addSet} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors px-2">
              <Plus size={12} /> Série
            </button>
            {sessionEx.sets.length > 1 && (
              <button onClick={removeLastSet} className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2">
                Remover última
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TodayTab() {
  const [plan] = useState(() => getTrainingPlan())
  const todayId = getTodayDayId()
  const dayLabel = WEEK_DAYS.find(d => d.id === todayId)?.label ?? ''
  const dayExercises = plan[todayId] ?? []

  const [session, setSession] = useState(null) // null = not started
  const [done, setDone] = useState(false)

  function startSession() {
    const exercises = dayExercises.map(ex => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      muscle: ex.muscle,
      unit: ex.unit,
      sets: Array.from({ length: ex.targetSets ?? 3 }, (_, i) => ({
        number: i + 1,
        weight: ex.targetWeight ?? 0,
        reps: ex.targetReps ?? 0,
        unit: ex.unit,
        completed: false,
      })),
    }))
    setSession(exercises)
    setDone(false)
  }

  function updateExercise(idx, updated) {
    setSession(prev => prev.map((e, i) => i === idx ? updated : e))
  }

  function finishSession() {
    const log = {
      id: `wl_${Date.now()}`,
      date: format(new Date(), 'yyyy-MM-dd'),
      dayId: todayId,
      dayLabel,
      exercises: session,
    }
    saveWorkoutLog(log)
    setDone(true)
    setSession(null)
  }

  const completedCount = session?.reduce((s, ex) => s + ex.sets.filter(st => st.completed).length, 0) ?? 0
  const totalCount = session?.reduce((s, ex) => s + ex.sets.length, 0) ?? 0

  if (done) {
    return (
      <div className="card flex flex-col items-center py-12 text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
          <Check size={28} className="text-emerald-400" />
        </div>
        <p className="text-white font-semibold text-lg">Treino concluído!</p>
        <p className="text-zinc-400 text-sm">Salvo no histórico.</p>
        <button onClick={() => setDone(false)} className="btn-ghost mt-2">Treinar novamente</button>
      </div>
    )
  }

  if (dayExercises.length === 0) {
    return (
      <div className="card flex flex-col items-center py-12 text-center gap-3">
        <Calendar size={32} className="text-zinc-700" />
        <p className="text-zinc-400 font-medium">Nenhum exercício para {dayLabel}</p>
        <p className="text-zinc-600 text-sm">Configure o plano semanal na aba "Plano semanal".</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <div className="card">
          <p className="text-sm text-zinc-500 mb-1">{dayLabel}</p>
          <p className="text-white font-semibold text-lg mb-3">{dayExercises.length} exercício{dayExercises.length > 1 ? 's' : ''} no plano</p>
          <div className="space-y-2 mb-4">
            {dayExercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2 rounded-xl bg-zinc-800/40">
                <Dumbbell size={14} className="text-zinc-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{ex.name}</span>
                    {muscleTag(ex.muscle)}
                  </div>
                  <span className="text-xs text-zinc-500">{ex.targetSets}×{ex.targetReps}{ex.targetWeight ? ` · ${ex.targetWeight}kg` : ''}</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={startSession} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            <Play size={15} /> Iniciar treino
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="card py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-zinc-400">{completedCount} / {totalCount} séries concluídas</p>
          <button onClick={() => setSession(null)} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Cancelar
          </button>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-violet-600 rounded-full transition-all duration-500"
            style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }} />
        </div>
      </div>

      {session.map((ex, i) => (
        <WorkoutExerciseCard
          key={ex.exerciseId + i}
          ex={dayExercises[i] ?? ex}
          sessionEx={ex}
          onChange={updated => updateExercise(i, updated)}
        />
      ))}

      <button onClick={finishSession}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 sticky bottom-20">
        <Check size={16} /> Finalizar e salvar treino
      </button>
    </div>
  )
}

// ─── History tab ─────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

function ExerciseProgressModal({ open, onClose, exerciseId, exerciseName }) {
  const history = useMemo(() => getExerciseHistory(exerciseId), [exerciseId, open])
  const chartData = history.map(p => ({
    date: format(new Date(p.date + 'T12:00:00'), 'dd/MM', { locale: ptBR }),
    'Carga máx (kg)': p.maxWeight,
    'Volume total': Math.round(p.totalVol),
  }))

  return (
    <Modal open={open} onClose={onClose} title={`Progressão — ${exerciseName}`} size="lg">
      <div className="space-y-4">
        {history.length < 2 ? (
          <p className="text-zinc-500 text-sm text-center py-6">Precisa de pelo menos 2 registros para mostrar o gráfico.</p>
        ) : (
          <>
            <div>
              <p className="text-xs text-zinc-500 mb-3">Carga máxima por sessão (kg)</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="Carga máx (kg)" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-3">Volume total por sessão (kg × reps)</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="Volume total" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        <div className="space-y-2 max-h-48 overflow-y-auto">
          <p className="text-xs font-medium text-zinc-400">Todas as sessões</p>
          {history.length === 0
            ? <p className="text-zinc-600 text-sm">Nenhum registro ainda.</p>
            : [...history].reverse().map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-zinc-800/40 text-sm">
                <span className="text-zinc-400 w-16 flex-shrink-0">
                  {format(new Date(p.date + 'T12:00:00'), 'dd/MM/yy')}
                </span>
                <span className="text-white font-medium">{p.maxWeight}kg</span>
                <span className="text-zinc-500">máx · {p.sets.length} séries</span>
              </div>
            ))
          }
        </div>
      </div>
    </Modal>
  )
}

function HistoryTab() {
  const [logs, setLogs] = useState(() => getWorkoutLogs())
  const [expandedId, setExpandedId] = useState(null)
  const [progressEx, setProgressEx] = useState(null) // { id, name }

  function handleDelete(id) {
    deleteWorkoutLog(id)
    setLogs(getWorkoutLogs())
  }

  // Unique exercises across all logs for quick access
  const allExercises = useMemo(() => {
    const map = new Map()
    logs.forEach(log => {
      log.exercises?.forEach(ex => {
        if (!map.has(ex.exerciseId)) map.set(ex.exerciseId, ex.name)
      })
    })
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [logs])

  return (
    <div className="space-y-4">
      {/* Quick progression access */}
      {allExercises.length > 0 && (
        <div className="card">
          <p className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-violet-400" /> Ver progressão por exercício
          </p>
          <div className="flex flex-wrap gap-2">
            {allExercises.map(ex => (
              <button key={ex.id} onClick={() => setProgressEx(ex)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-violet-600/20 hover:text-violet-300 text-zinc-400 transition-colors border border-zinc-700 hover:border-violet-500/40">
                {ex.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <BarChart2 size={32} className="text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-medium">Nenhum treino registrado</p>
          <p className="text-zinc-600 text-sm mt-1">Seus treinos concluídos aparecem aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const totalSets = log.exercises?.reduce((s, e) => s + (e.sets?.length ?? 0), 0) ?? 0
            const doneSets  = log.exercises?.reduce((s, e) => s + (e.sets?.filter(st => st.completed).length ?? 0), 0) ?? 0
            const isOpen = expandedId === log.id

            return (
              <div key={log.id} className="card">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : log.id)}>
                  <div className="w-10 h-10 rounded-xl bg-violet-600/15 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={16} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{log.dayLabel}</p>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {format(new Date(log.date + 'T12:00:00'), "dd 'de' MMMM yyyy", { locale: ptBR })}
                      {' · '}{log.exercises?.length ?? 0} exercícios · {doneSets}/{totalSets} séries
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                </div>

                {isOpen && (
                  <div className="mt-3 space-y-2">
                    {log.exercises?.map((ex, i) => {
                      const done = ex.sets?.filter(s => s.completed) ?? []
                      const maxW = done.length > 0 ? Math.max(...done.map(s => s.weight ?? 0)) : null
                      return (
                        <div key={i} className="px-3 py-2.5 rounded-xl bg-zinc-800/40">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-white">{ex.name}</p>
                              {muscleTag(ex.muscle)}
                            </div>
                            <button onClick={() => setProgressEx({ id: ex.exerciseId, name: ex.name })}
                              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                              <TrendingUp size={11} /> ver evolução
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {ex.sets?.map((s, j) => (
                              <span key={j}
                                className={`text-xs px-2 py-0.5 rounded-lg font-mono ${s.completed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}>
                                {s.weight ? `${s.weight}kg×` : ''}{s.reps}{ex.unit === 'seg' ? 's' : ''}
                              </span>
                            ))}
                          </div>
                          {maxW !== null && maxW > 0 && (
                            <p className="text-xs text-zinc-600 mt-1">Carga máx: {maxW}kg</p>
                          )}
                        </div>
                      )
                    })}
                    <div className="flex justify-end pt-1">
                      <button onClick={() => handleDelete(log.id)} className="btn-danger text-xs flex items-center gap-1">
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {progressEx && (
        <ExerciseProgressModal
          open={!!progressEx}
          onClose={() => setProgressEx(null)}
          exerciseId={progressEx.id}
          exerciseName={progressEx.name}
        />
      )}
    </div>
  )
}

// ─── Zones tab ───────────────────────────────────────────────────────────────

const ZONE_ICONS = ['🚶', '🔥', '🏃', '⚡', '💥']
const ZONE_DETAILS = [
  'Ideal para aquecimento e desaquecimento. Melhora a circulação e prepara o corpo para exercícios mais intensos.',
  'Zona ideal para queima de gordura como combustível principal. Recomendada para sessões longas de cardio.',
  'Melhora resistência cardiovascular e capacidade aeróbica. Ótima para condicionamento geral.',
  'Aumenta velocidade, potência e performance. O corpo começa a usar mais carboidratos como energia.',
  'Esforço máximo. Usado em sprints e HIIT. Não sustentável por longos períodos.',
]

function ZonesTab({ profile }) {
  if (!profile) return (
    <div className="card flex flex-col items-center py-12 text-center">
      <Heart size={28} className="text-zinc-700 mb-3" />
      <p className="text-zinc-400 font-medium">Configure seu perfil primeiro</p>
      <p className="text-zinc-600 text-sm mt-1">Acesse Configurações e informe sua idade</p>
    </div>
  )

  const { maxHR, zones } = calculateHeartRateZones(profile.age)

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
          <Heart size={18} className="text-red-400" />
        </div>
        <div>
          <p className="text-xs text-zinc-500">FC máxima estimada · {profile.age} anos</p>
          <p className="text-xl font-bold text-white">{maxHR} <span className="text-sm font-normal text-zinc-400">bpm</span></p>
        </div>
      </div>

      <div className="card border border-emerald-500/20 bg-emerald-500/5">
        <p className="text-xs font-medium text-emerald-400 mb-1">🎯 Zona recomendada para emagrecimento</p>
        <p className="text-xl font-bold text-white">{zones[1].range[0]}–{zones[1].range[1]} <span className="text-sm font-normal text-zinc-400">bpm</span></p>
        <p className="text-xs text-zinc-500 mt-1">{ZONE_DETAILS[1]}</p>
      </div>

      <div className="space-y-2">
        {zones.map((zone, i) => (
          <div key={zone.name} className="card">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ backgroundColor: zone.color + '22' }}>
                {ZONE_ICONS[i]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-medium text-white">Zona {i + 1}: {zone.name}</p>
                  <p className="text-sm font-bold tabular-nums" style={{ color: zone.color }}>{zone.range[0]}–{zone.range[1]} bpm</p>
                </div>
                <p className="text-xs text-zinc-500">{zone.benefit}</p>
                <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    marginLeft: `${(zone.range[0] / maxHR) * 100}%`,
                    width: `${((zone.range[1] - zone.range[0]) / maxHR) * 100}%`,
                    backgroundColor: zone.color,
                  }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Treinos() {
  const [tab, setTab] = useState('plan')
  const { profile } = useApp()

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Treinos</h1>

      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}>
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'plan'    && <PlanTab />}
      {tab === 'today'   && <TodayTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'zones'   && <ZonesTab profile={profile} />}
    </div>
  )
}
