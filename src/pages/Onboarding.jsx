import { useState } from 'react'
import { Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { calculateDailyCalories, calculateMacros, calculateWaterIntake } from '../utils/calculations'
import { GOALS, ACTIVITY_LEVELS, DEFAULT_MEALS } from '../utils/constants'

const STEPS = ['Perfil', 'Objetivo', 'Metas', 'Calorias']

export default function Onboarding() {
  const { updateProfile } = useApp()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', age: '', height: '', weight: '', sex: 'female',
    goal: 'weight_loss', activityLevel: 'moderate',
    targetWeight: '', weeks: '',
  })

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

  const suggested = (form.age && form.height && form.weight)
    ? calculateDailyCalories(Number(form.weight), Number(form.height), Number(form.age), form.sex, form.activityLevel, form.goal)
    : null

  const suggestedMacros = suggested ? calculateMacros(suggested, form.goal) : null
  const waterInfo = form.weight ? calculateWaterIntake(Number(form.weight), form.goal) : null

  function handleFinish() {
    const cal = suggested ?? 2000
    const macros = suggestedMacros ?? { protein: 150, carbs: 200, fat: 60 }
    const bodyGoal = form.targetWeight
      ? {
          targetWeight: Number(form.targetWeight),
          targetBodyFat: null,
          startWeight: Number(form.weight),
          startDate: new Date().toISOString().slice(0, 10),
          targetDate: form.weeks
            ? (() => {
                const d = new Date()
                d.setDate(d.getDate() + Number(form.weeks) * 7)
                return d.toISOString().slice(0, 10)
              })()
            : null,
        }
      : null
    updateProfile({
      ...form,
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
      dailyCalorieGoal: cal,
      macros,
      meals: DEFAULT_MEALS,
      ...(bodyGoal ? { bodyGoal } : {}),
    })
  }

  const canNext = [
    form.name && form.age && form.height && form.weight,
    form.goal && form.activityLevel,
    true,
    true,
  ][step]

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-white text-xl tracking-tight">NutriTrack</span>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-violet-600' : 'bg-zinc-800'}`} />
              <p className={`text-xs mt-1.5 text-center ${i <= step ? 'text-violet-400' : 'text-zinc-600'}`}>{s}</p>
            </div>
          ))}
        </div>

        <div className="card space-y-5">
          {step === 0 && (
            <>
              <h2 className="text-lg font-semibold text-white">Vamos te conhecer</h2>
              <div>
                <label className="label">Seu nome</label>
                <input className="input" value={form.name} onChange={e => setField('name', e.target.value)}
                  placeholder="Ex: Jessica" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Idade</label>
                  <input className="input" type="number" value={form.age} onChange={e => setField('age', e.target.value)} placeholder="30" />
                </div>
                <div>
                  <label className="label">Sexo</label>
                  <select className="input" value={form.sex} onChange={e => setField('sex', e.target.value)}>
                    <option value="female">Feminino</option>
                    <option value="male">Masculino</option>
                  </select>
                </div>
                <div>
                  <label className="label">Altura (cm)</label>
                  <input className="input" type="number" value={form.height} onChange={e => setField('height', e.target.value)} placeholder="165" />
                </div>
                <div>
                  <label className="label">Peso (kg)</label>
                  <input className="input" type="number" value={form.weight} onChange={e => setField('weight', e.target.value)} placeholder="65" step="0.1" />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold text-white">Qual é seu objetivo?</h2>
              <div className="space-y-2">
                {Object.entries(GOALS).map(([k, v]) => (
                  <button key={k} onClick={() => setField('goal', k)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${form.goal === k ? 'border-violet-500 bg-violet-600/15 text-white' : 'border-zinc-800 hover:border-zinc-700 text-zinc-300'}`}>
                    {v.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="label">Nível de atividade física</label>
                <select className="input" value={form.activityLevel} onChange={e => setField('activityLevel', e.target.value)}>
                  {Object.entries(ACTIVITY_LEVELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-white">Meta corporal</h2>
              <p className="text-sm text-zinc-500">Opcional — você pode definir isso depois em Composição.</p>
              <div>
                <label className="label">Peso alvo (kg)</label>
                <input className="input" type="number" value={form.targetWeight}
                  onChange={e => setField('targetWeight', e.target.value)}
                  placeholder={form.weight ? `Atual: ${form.weight} kg` : 'Ex: 60'} step="0.1" />
              </div>
              <div>
                <label className="label">Prazo para atingir (semanas)</label>
                <input className="input" type="number" value={form.weeks}
                  onChange={e => setField('weeks', e.target.value)}
                  placeholder="Ex: 16" min="1" max="104" />
                {form.targetWeight && form.weight && form.weeks && (() => {
                  const diff = Number(form.targetWeight) - Number(form.weight)
                  const rate = Math.abs(diff / Number(form.weeks))
                  return (
                    <p className={`text-xs mt-1.5 ${rate > 1 ? 'text-amber-400' : 'text-zinc-500'}`}>
                      {rate > 1
                        ? `⚠️ Ritmo de ${rate.toFixed(1)} kg/semana pode ser agressivo demais`
                        : `Ritmo de ${rate.toFixed(1)} kg/semana — realista e saudável`}
                    </p>
                  )
                })()}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold text-white">Suas metas calculadas</h2>
              {suggested ? (
                <div className="space-y-3">
                  <div className="bg-violet-600/10 border border-violet-500/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Meta calórica diária</p>
                    <p className="text-3xl font-bold text-violet-300">{suggested}</p>
                    <p className="text-sm text-zinc-400">kcal / dia</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[['Proteína', suggestedMacros.protein, 'text-blue-400'], ['Carbs', suggestedMacros.carbs, 'text-amber-400'], ['Gordura', suggestedMacros.fat, 'text-rose-400']].map(([l, v, c]) => (
                      <div key={l} className="bg-zinc-800/60 rounded-xl p-3">
                        <p className="text-xs text-zinc-500">{l}</p>
                        <p className={`font-bold ${c}`}>{v}g</p>
                      </div>
                    ))}
                  </div>
                  {waterInfo && (
                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-zinc-500">Água ideal por dia</p>
                      <p className="text-lg font-bold text-cyan-400">{waterInfo.ideal} ml</p>
                    </div>
                  )}
                  <p className="text-xs text-zinc-600 text-center">Você pode ajustar tudo isso depois em Configurações.</p>
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">Preencha os dados anteriores para ver sua meta calculada.</p>
              )}
            </>
          )}

          <div className="flex gap-2 pt-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex-1">Voltar</button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext}
                className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
                Continuar
              </button>
            ) : (
              <button onClick={handleFinish} className="btn-primary flex-1">
                Começar!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
