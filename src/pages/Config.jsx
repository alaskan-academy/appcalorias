import { useState } from 'react'
import { Plus, Trash2, Save, User, Target, Utensils, FlaskConical, Droplets, BookOpen, ChevronDown, ChevronUp, Scale, Download, Activity } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { calculateDailyCalories, calculateMacros, calculateWaterIntake, calculateActivityGoals } from '../utils/calculations'
import { GOALS, ACTIVITY_LEVELS, DEFAULT_MEALS } from '../utils/constants'
import { exportLogsCSV } from '../utils/storage'
import Modal from '../components/ui/Modal'
import { RecipeModal } from '../components/recipes/RecipeModal'

function CustomFoodModal({ open, onClose, existing }) {
  const { addCustomFood } = useApp()
  const [form, setForm] = useState(existing ?? { name: '', per100g: { calories: '', protein: '', carbs: '', fat: '', fiber: '' } })

  function setField(field, val) {
    setForm(f => ({ ...f, per100g: { ...f.per100g, [field]: val } }))
  }

  function handleSave() {
    if (!form.name.trim()) return
    addCustomFood({
      id: existing?.id ?? `custom_${Date.now()}`,
      name: form.name.trim(),
      source: 'custom',
      per100g: {
        calories: parseFloat(form.per100g.calories) || 0,
        protein:  parseFloat(form.per100g.protein)  || 0,
        carbs:    parseFloat(form.per100g.carbs)    || 0,
        fat:      parseFloat(form.per100g.fat)      || 0,
        fiber:    parseFloat(form.per100g.fiber)    || 0,
      },
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Editar alimento' : 'Novo alimento'}>
      <div className="space-y-4">
        <div>
          <label className="label">Nome do alimento</label>
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Pão caseiro integral" autoFocus />
        </div>
        <p className="text-xs text-zinc-500 font-medium">Valores por 100g</p>
        <div className="grid grid-cols-2 gap-3">
          {[['calories', 'Calorias (kcal)'], ['protein', 'Proteína (g)'], ['carbs', 'Carboidratos (g)'], ['fat', 'Gordura (g)'], ['fiber', 'Fibra (g)']].map(([field, label]) => (
            <div key={field}>
              <label className="label">{label}</label>
              <input className="input" type="number" value={form.per100g[field]}
                onChange={e => setField(field, e.target.value)} placeholder="0" min="0" step="0.1" />
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={!form.name.trim()} className="btn-primary w-full disabled:opacity-40">
          Salvar alimento
        </button>
      </div>
    </Modal>
  )
}

function RecipesSection() {
  const { recipes, removeRecipe } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [expanded, setExpanded] = useState(null)

  function handleNew() { setEditTarget(null); setModalOpen(true) }
  function handleEdit(r) { setEditTarget(r); setModalOpen(true) }
  function handleClose() { setModalOpen(false); setEditTarget(null) }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-violet-400" />
          <p className="text-sm font-semibold text-white">Refeições personalizadas</p>
        </div>
        <button onClick={handleNew} className="btn-primary flex items-center gap-1.5 text-xs">
          <Plus size={12} /> Nova
        </button>
      </div>

      {recipes.length === 0 ? (
        <p className="text-sm text-zinc-600">Nenhuma refeição cadastrada ainda.</p>
      ) : (
        <div className="space-y-1.5">
          {recipes.map(r => (
            <div key={r.id} className="border border-zinc-800 rounded-xl overflow-hidden">
              {/* Header row */}
              <div
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-zinc-800/40 transition-colors"
                onClick={() => setExpanded(e => e === r.id ? null : r.id)}
              >
                <div className="w-8 h-8 rounded-lg bg-violet-600/15 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={13} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{r.name}</p>
                  <p className="text-xs text-zinc-500">
                    {Math.round(r.totalMacros.calories)} kcal · {r.totalWeight}g ·{' '}
                    P {Math.round(r.totalMacros.protein)}g · C {Math.round(r.totalMacros.carbs)}g · G {Math.round(r.totalMacros.fat)}g
                  </p>
                </div>
                {expanded === r.id
                  ? <ChevronUp size={14} className="text-zinc-500 flex-shrink-0" />
                  : <ChevronDown size={14} className="text-zinc-500 flex-shrink-0" />}
              </div>

              {/* Expanded detail */}
              {expanded === r.id && (
                <div className="px-3 pb-3 space-y-2 border-t border-zinc-800">
                  {/* Macros */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2">
                    {[
                      ['Calorias', r.totalMacros.calories, 'kcal', 'text-violet-400'],
                      ['Proteína', r.totalMacros.protein,  'g',    'text-blue-400'],
                      ['Carbs',    r.totalMacros.carbs,    'g',    'text-amber-400'],
                      ['Gordura',  r.totalMacros.fat,      'g',    'text-rose-400'],
                    ].map(([l, v, u, c]) => (
                      <div key={l} className="bg-zinc-800/60 rounded-lg p-2 text-center">
                        <p className="text-xs text-zinc-500">{l}</p>
                        <p className={`text-sm font-bold ${c}`}>
                          {Math.round(v ?? 0)}<span className="text-xs font-normal text-zinc-600 ml-0.5">{u}</span>
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Ingredients */}
                  <div className="space-y-0.5">
                    {r.ingredients.map((ing, i) => (
                      <div key={i} className="flex justify-between items-center text-xs px-1 py-0.5">
                        <span className="text-zinc-400">{ing.name}</span>
                        <span className="text-zinc-500 tabular-nums">{ing.quantity}g · {Math.round(ing.calories)} kcal</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleEdit(r)}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-600/10">
                      Editar
                    </button>
                    <button onClick={() => removeRecipe(r.id)}
                      className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 flex items-center gap-1">
                      <Trash2 size={11} /> Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <RecipeModal open={modalOpen} onClose={handleClose} existing={editTarget} />
    </div>
  )
}

export default function Config() {
  const { profile, updateProfile, customFoods, removeCustomFood } = useApp()
  const [foodModal, setFoodModal] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState(() => {
    const weeksLeft = profile?.bodyGoal?.targetDate
      ? Math.max(1, Math.round((new Date(profile.bodyGoal.targetDate) - new Date()) / (7 * 86400000)))
      : ''
    return {
      ...(profile ?? {
        name: '', age: '', height: '', weight: '', sex: 'female',
        activityLevel: 'moderate', goal: 'weight_loss',
        dailyCalorieGoal: '', macros: { protein: '', carbs: '', fat: '' },
        waterGoal: '', meals: DEFAULT_MEALS,
      }),
      targetWeight:    profile?.bodyGoal?.targetWeight    ?? '',
      targetBodyFat:   profile?.bodyGoal?.targetBodyFat   ?? '',
      weeksLeft,
      // Activity goals (null = use auto-calculated)
      stepsPerDay:             profile?.activityGoals?.stepsPerDay             ?? '',
      cardioSessionsPerWeek:   profile?.activityGoals?.cardioSessionsPerWeek   ?? '',
      cardioDurationMin:       profile?.activityGoals?.cardioDurationMin        ?? '',
      strengthSessionsPerWeek: profile?.activityGoals?.strengthSessionsPerWeek ?? '',
    }
  })

  const suggested = (form.age && form.height && form.weight)
    ? calculateDailyCalories(Number(form.weight), Number(form.height), Number(form.age), form.sex, form.activityLevel, form.goal)
    : null

  const suggestedMacros = suggested ? calculateMacros(suggested, form.goal) : null
  const waterInfo = form.weight ? calculateWaterIntake(Number(form.weight), form.goal) : null
  const suggestedActivity = calculateActivityGoals({ goal: form.goal, activityLevel: form.activityLevel })

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function setMacro(key, val) { setForm(f => ({ ...f, macros: { ...f.macros, [key]: val } })) }
  function setMealGoal(id, val) {
    setForm(f => ({ ...f, meals: f.meals.map(m => m.id === id ? { ...m, calorieGoal: Number(val) } : m) }))
  }
  function setMealName(id, val) {
    setForm(f => ({ ...f, meals: f.meals.map(m => m.id === id ? { ...m, name: val } : m) }))
  }
  function removeMeal(id) { setForm(f => ({ ...f, meals: f.meals.filter(m => m.id !== id) })) }
  function addMeal() {
    setForm(f => ({
      ...f, meals: [...f.meals, { id: `meal_${Date.now()}`, name: 'Nova refeição', calorieGoal: 300, icon: '🍽️' }]
    }))
  }

  function handleExport() {
    const csv = exportLogsCSV()
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nutritrack_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleSave() {
    const existingGoal = profile?.bodyGoal
    const bodyGoal = form.targetWeight
      ? {
          targetWeight:  Number(form.targetWeight),
          targetBodyFat: form.targetBodyFat ? Number(form.targetBodyFat) : null,
          startWeight:   existingGoal?.startWeight  ?? Number(form.weight),
          startDate:     existingGoal?.startDate    ?? new Date().toISOString().slice(0, 10),
          targetDate: form.weeksLeft
            ? (() => {
                const d = new Date()
                d.setDate(d.getDate() + Number(form.weeksLeft) * 7)
                return d.toISOString().slice(0, 10)
              })()
            : existingGoal?.targetDate ?? null,
        }
      : null

    const saved = {
      ...form,
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
      dailyCalorieGoal: Number(form.dailyCalorieGoal) || suggested || 2000,
      macros: {
        protein: Number(form.macros?.protein) || suggestedMacros?.protein || 150,
        carbs:   Number(form.macros?.carbs)   || suggestedMacros?.carbs   || 200,
        fat:     Number(form.macros?.fat)      || suggestedMacros?.fat     || 60,
      },
      waterGoal: Number(form.waterGoal) || 0,
      bodyGoal,
    }
    // Activity goals — only persist if user customized at least one value
    const hasCustomActivity = form.stepsPerDay || form.cardioSessionsPerWeek || form.cardioDurationMin || form.strengthSessionsPerWeek
    const activityGoals = hasCustomActivity ? {
      stepsPerDay:             Number(form.stepsPerDay)             || suggestedActivity.stepsPerDay,
      cardioSessionsPerWeek:   Number(form.cardioSessionsPerWeek)   || suggestedActivity.cardioSessionsPerWeek,
      cardioDurationMin:       Number(form.cardioDurationMin)        || suggestedActivity.cardioDurationMin,
      strengthSessionsPerWeek: Number(form.strengthSessionsPerWeek) || suggestedActivity.strengthSessionsPerWeek,
    } : null

    updateProfile({ ...saved, activityGoals })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-xl font-bold text-white">Configurações</h1>

      {/* Profile */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User size={15} className="text-violet-400" />
          <p className="text-sm font-semibold text-white">Perfil pessoal</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Nome</label>
            <input className="input" value={form.name ?? ''} onChange={e => setField('name', e.target.value)} placeholder="Seu nome" />
          </div>
          <div>
            <label className="label">Idade (anos)</label>
            <input className="input" type="number" value={form.age ?? ''} onChange={e => setField('age', e.target.value)} min="10" max="100" />
          </div>
          <div>
            <label className="label">Sexo</label>
            <select className="input" value={form.sex ?? 'female'} onChange={e => setField('sex', e.target.value)}>
              <option value="female">Feminino</option>
              <option value="male">Masculino</option>
            </select>
          </div>
          <div>
            <label className="label">Altura (cm)</label>
            <input className="input" type="number" value={form.height ?? ''} onChange={e => setField('height', e.target.value)} min="100" max="250" />
          </div>
          <div>
            <label className="label">Peso (kg)</label>
            <input className="input" type="number" value={form.weight ?? ''} onChange={e => setField('weight', e.target.value)} min="30" max="300" step="0.1" />
          </div>
        </div>
        {waterInfo && (
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 text-sm">
            <p className="text-zinc-400">💧 Água recomendada: <span className="text-cyan-400 font-medium">{waterInfo.ideal} ml/dia</span>
              <span className="text-zinc-600"> (mínimo: {waterInfo.minimum} ml)</span>
            </p>
          </div>
        )}
      </div>

      {/* Goal & activity */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Target size={15} className="text-violet-400" />
          <p className="text-sm font-semibold text-white">Meta e nível de atividade</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Objetivo</label>
            <select className="input" value={form.goal ?? 'weight_loss'} onChange={e => setField('goal', e.target.value)}>
              {Object.entries(GOALS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nível de atividade</label>
            <select className="input" value={form.activityLevel ?? 'moderate'} onChange={e => setField('activityLevel', e.target.value)}>
              {Object.entries(ACTIVITY_LEVELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        {suggested && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Sugestão calculada para você</p>
            <p className="text-violet-300 font-medium text-sm">{suggested} kcal/dia</p>
            {suggestedMacros && (
              <p className="text-xs text-zinc-500 mt-0.5">
                P {suggestedMacros.protein}g · C {suggestedMacros.carbs}g · G {suggestedMacros.fat}g
              </p>
            )}
            <button onClick={() => {
              setField('dailyCalorieGoal', String(suggested))
              setMacro('protein', String(suggestedMacros.protein))
              setMacro('carbs',   String(suggestedMacros.carbs))
              setMacro('fat',     String(suggestedMacros.fat))
            }} className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Usar sugestão →
            </button>
          </div>
        )}
        <div>
          <label className="label">Meta de calorias diária (kcal)</label>
          <input className="input" type="number" value={form.dailyCalorieGoal ?? ''} onChange={e => setField('dailyCalorieGoal', e.target.value)}
            placeholder={suggested ? `Sugerido: ${suggested}` : '2000'} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['protein', 'Proteína (g)'], ['carbs', 'Carboidratos (g)'], ['fat', 'Gordura (g)']].map(([key, label]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input className="input" type="number" value={form.macros?.[key] ?? ''}
                onChange={e => setMacro(key, e.target.value)}
                placeholder={suggestedMacros ? String(suggestedMacros[key]) : '0'} />
            </div>
          ))}
        </div>
        {form.weight && Number(form.weight) > 0 && (
          <p className="text-xs text-zinc-500">
            💡 Para <span className="text-white">{form.goal === 'muscle_gain' ? 'ganho de massa' : 'emagrecimento'}</span>, recomenda-se{' '}
            <span className="text-violet-400 font-medium">{form.goal === 'muscle_gain' ? '2.0' : '1.8'}g/kg</span>
            {' '}= <span className="text-violet-400 font-medium">{Math.round(Number(form.weight) * (form.goal === 'muscle_gain' ? 2.0 : 1.8))}g</span> de proteína para {form.weight} kg
          </p>
        )}
      </div>

      {/* Body goals */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Scale size={15} className="text-violet-400" />
          <p className="text-sm font-semibold text-white">Metas corporais</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Peso alvo (kg)</label>
            <input className="input" type="number" value={form.targetWeight ?? ''}
              onChange={e => setField('targetWeight', e.target.value)}
              placeholder={form.weight ? `Atual: ${form.weight} kg` : 'Ex: 60'}
              step="0.1" min="30" max="300" />
          </div>
          <div>
            <label className="label">% Gordura alvo (opcional)</label>
            <input className="input" type="number" value={form.targetBodyFat ?? ''}
              onChange={e => setField('targetBodyFat', e.target.value)}
              placeholder="Ex: 20" step="0.1" min="3" max="60" />
          </div>
        </div>

        <div>
          <label className="label">Prazo restante (semanas)</label>
          <input className="input" type="number" value={form.weeksLeft ?? ''}
            onChange={e => setField('weeksLeft', e.target.value)}
            placeholder="Ex: 12" min="1" max="104" />
          {form.weeksLeft && Number(form.weeksLeft) > 0 && (
            <p className="text-xs text-zinc-500 mt-1.5">
              Data alvo: {(() => {
                const d = new Date()
                d.setDate(d.getDate() + Number(form.weeksLeft) * 7)
                return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
              })()}
            </p>
          )}
        </div>

        {form.targetWeight && form.weight && form.weeksLeft && (() => {
          const diff = Number(form.targetWeight) - Number(form.weight)
          if (diff === 0) return null
          const rate = Math.abs(diff / Number(form.weeksLeft))
          return (
            <div className={`rounded-xl p-3 text-sm ${rate > 1 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-emerald-500/5 border border-emerald-500/20'}`}>
              <p className={rate > 1 ? 'text-amber-400' : 'text-emerald-400'}>
                {rate > 1
                  ? `⚠️ Ritmo de ${rate.toFixed(2)} kg/sem — considere aumentar o prazo`
                  : `✓ Ritmo de ${rate.toFixed(2)} kg/sem — realista e saudável`}
              </p>
              <p className="text-zinc-500 text-xs mt-0.5">
                {Math.abs(diff).toFixed(1)} kg para {diff < 0 ? 'perder' : 'ganhar'} em {form.weeksLeft} semanas
              </p>
            </div>
          )
        })()}

        {profile?.bodyGoal?.startWeight && (
          <p className="text-xs text-zinc-600">
            Peso inicial registrado: {profile.bodyGoal.startWeight} kg em {new Date(profile.bodyGoal.startDate + 'T12:00').toLocaleDateString('pt-BR')}
            {' · '}
            <button
              onClick={() => setForm(f => ({ ...f, targetWeight: '', targetBodyFat: '', weeksLeft: '' }))}
              className="text-red-500/70 hover:text-red-400 transition-colors"
            >
              Remover meta
            </button>
          </p>
        )}
      </div>

      {/* Activity goals */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={15} className="text-emerald-400" />
          <p className="text-sm font-semibold text-white">Metas de atividade</p>
        </div>

        {/* Auto-suggestion chip */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
          <p className="text-xs text-zinc-500 mb-2">Sugestão para <span className="text-white">{GOALS[form.goal]?.label}</span> · <span className="text-white">{ACTIVITY_LEVELS[form.activityLevel]?.label}</span></p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-zinc-400">🚶 Passos/dia: <span className="text-emerald-400 font-medium">{suggestedActivity.stepsPerDay.toLocaleString('pt-BR')}</span></span>
            <span className="text-zinc-400">🏃 Cardio: <span className="text-emerald-400 font-medium">{suggestedActivity.cardioSessionsPerWeek}×/sem · {suggestedActivity.cardioDurationMin} min</span></span>
            <span className="text-zinc-400">💪 Musculação: <span className="text-emerald-400 font-medium">{suggestedActivity.strengthSessionsPerWeek}×/sem</span></span>
          </div>
          <button onClick={() => {
            setField('stepsPerDay',             String(suggestedActivity.stepsPerDay))
            setField('cardioSessionsPerWeek',   String(suggestedActivity.cardioSessionsPerWeek))
            setField('cardioDurationMin',        String(suggestedActivity.cardioDurationMin))
            setField('strengthSessionsPerWeek', String(suggestedActivity.strengthSessionsPerWeek))
          }} className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            Usar sugestão →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Passos por dia</label>
            <input className="input" type="number" step="500" min="1000"
              value={form.stepsPerDay ?? ''}
              onChange={e => setField('stepsPerDay', e.target.value)}
              placeholder={String(suggestedActivity.stepsPerDay)} />
          </div>
          <div>
            <label className="label">Sessões de cardio/sem.</label>
            <input className="input" type="number" min="0" max="7"
              value={form.cardioSessionsPerWeek ?? ''}
              onChange={e => setField('cardioSessionsPerWeek', e.target.value)}
              placeholder={String(suggestedActivity.cardioSessionsPerWeek)} />
          </div>
          <div>
            <label className="label">Duração cardio (min)</label>
            <input className="input" type="number" min="10" max="180"
              value={form.cardioDurationMin ?? ''}
              onChange={e => setField('cardioDurationMin', e.target.value)}
              placeholder={String(suggestedActivity.cardioDurationMin)} />
          </div>
          <div className="col-span-2">
            <label className="label">Sessões de musculação/sem.</label>
            <input className="input" type="number" min="0" max="7"
              value={form.strengthSessionsPerWeek ?? ''}
              onChange={e => setField('strengthSessionsPerWeek', e.target.value)}
              placeholder={String(suggestedActivity.strengthSessionsPerWeek)} />
          </div>
        </div>
        <p className="text-xs text-zinc-600">Deixe em branco para usar os valores calculados automaticamente pelo perfil.</p>
      </div>

      {/* Water goal */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Droplets size={15} className="text-cyan-400" />
          <p className="text-sm font-semibold text-white">Meta de hidratação</p>
        </div>
        {waterInfo && (
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Sugestão calculada pelo seu peso e objetivo</p>
            <p className="text-cyan-300 font-medium text-sm">{waterInfo.ideal} ml/dia</p>
            <p className="text-xs text-zinc-600 mt-0.5">Mínimo recomendado: {waterInfo.minimum} ml/dia</p>
            <button
              onClick={() => setField('waterGoal', String(waterInfo.ideal))}
              className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Usar sugestão →
            </button>
          </div>
        )}
        <div>
          <label className="label">Meta de água diária (ml)</label>
          <input
            className="input"
            type="number"
            value={form.waterGoal ?? ''}
            onChange={e => setField('waterGoal', e.target.value)}
            placeholder={waterInfo ? `Sugerido: ${waterInfo.ideal}` : '2500'}
            min="500"
            step="50"
          />
          <p className="text-xs text-zinc-600 mt-1.5">
            {form.waterGoal && Number(form.waterGoal) > 0
              ? `Mínimo automático: ${Math.round(Number(form.waterGoal) * 0.8)} ml (80% da meta)`
              : 'Deixe em branco para usar o valor calculado automaticamente'}
          </p>
        </div>
      </div>

      {/* Meals */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Utensils size={15} className="text-violet-400" />
          <p className="text-sm font-semibold text-white">Refeições</p>
        </div>
        {(form.meals ?? DEFAULT_MEALS).map(meal => (
          <div key={meal.id} className="flex items-center gap-2">
            <span className="text-lg flex-shrink-0">{meal.icon}</span>
            <input className="input flex-1" value={meal.name} onChange={e => setMealName(meal.id, e.target.value)} />
            <input className="input w-24" type="number" value={meal.calorieGoal} onChange={e => setMealGoal(meal.id, e.target.value)} min="0" />
            <span className="text-xs text-zinc-600 flex-shrink-0">kcal</span>
            <button onClick={() => removeMeal(meal.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button onClick={addMeal} className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
          <Plus size={13} /> Adicionar refeição
        </button>
      </div>

      {/* Recipes */}
      <RecipesSection />

      {/* Custom foods */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical size={15} className="text-violet-400" />
            <p className="text-sm font-semibold text-white">Meus alimentos</p>
          </div>
          <button onClick={() => setFoodModal(true)} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={12} /> Novo
          </button>
        </div>
        {customFoods.length === 0 ? (
          <p className="text-sm text-zinc-600">Nenhum alimento cadastrado</p>
        ) : (
          <div className="space-y-1">
            {customFoods.map(food => (
              <div key={food.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-zinc-800/50 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200">{food.name}</p>
                  <p className="text-xs text-zinc-500">
                    {food.per100g.calories} kcal · P {food.per100g.protein}g · C {food.per100g.carbs}g · G {food.per100g.fat}g (por 100g)
                  </p>
                </div>
                <button onClick={() => removeCustomFood(food.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors text-sm">
        <Download size={15} /> Exportar dados (CSV)
      </button>

      <button onClick={handleSave} className={`btn-primary w-full flex items-center justify-center gap-2 py-3 text-base ${saved ? 'bg-emerald-600 hover:bg-emerald-500' : ''}`}>
        <Save size={16} /> {saved ? 'Salvo!' : 'Salvar configurações'}
      </button>

      <CustomFoodModal open={foodModal} onClose={() => setFoodModal(false)} />
    </div>
  )
}
