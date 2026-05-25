import { useState, useMemo } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash2, Target, TrendingDown, TrendingUp, Scale, ChevronDown, ChevronUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import {
  getMeasurements, addMeasurement, deleteMeasurement,
  getLatestMeasurement, calcBMI, bmiCategory, bodyFatCategory, weightProgress,
} from '../utils/bodyStorage'
import { useApp } from '../context/AppContext'
import ProgressBar from '../components/ui/ProgressBar'
import Modal from '../components/ui/Modal'

// ── Add measurement modal ──────────────────────────────────────────────────

function MeasurementModal({ open, onClose, onSave }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({ date: today, weight: '', bodyFat: '', muscleMass: '', waist: '', hip: '', notes: '' })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function handleSave() {
    if (!form.weight) return
    onSave({
      id: `bm_${Date.now()}`,
      date: form.date,
      weight:      parseFloat(form.weight)     || null,
      bodyFat:     parseFloat(form.bodyFat)    || null,
      muscleMass:  parseFloat(form.muscleMass) || null,
      waist:       parseFloat(form.waist)      || null,
      hip:         parseFloat(form.hip)        || null,
      notes:       form.notes.trim(),
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar medidas">
      <div className="space-y-4">
        <div>
          <label className="label">Data</label>
          <input className="input" type="date" value={form.date} onChange={e => f('date', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Peso (kg) *</label>
            <input className="input" type="number" step="0.1" value={form.weight}
              onChange={e => f('weight', e.target.value)} placeholder="72.5" autoFocus />
          </div>
          <div>
            <label className="label">% Gordura corporal</label>
            <input className="input" type="number" step="0.1" value={form.bodyFat}
              onChange={e => f('bodyFat', e.target.value)} placeholder="25" />
          </div>
          <div>
            <label className="label">Massa muscular (kg)</label>
            <input className="input" type="number" step="0.1" value={form.muscleMass}
              onChange={e => f('muscleMass', e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <label className="label">Cintura (cm)</label>
            <input className="input" type="number" step="0.5" value={form.waist}
              onChange={e => f('waist', e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <label className="label">Quadril (cm)</label>
            <input className="input" type="number" step="0.5" value={form.hip}
              onChange={e => f('hip', e.target.value)} placeholder="opcional" />
          </div>
        </div>
        <div>
          <label className="label">Observações</label>
          <input className="input" value={form.notes} onChange={e => f('notes', e.target.value)}
            placeholder="opcional" />
        </div>
        <button onClick={handleSave} disabled={!form.weight}
          className="btn-primary w-full disabled:opacity-40">
          Salvar medidas
        </button>
      </div>
    </Modal>
  )
}

// ── Goal editor modal ─────────────────────────────────────────────────────

function GoalModal({ open, onClose, profile, onSave }) {
  const current = profile?.bodyGoal
  const latest  = getLatestMeasurement()
  const [targetWeight, setTargetWeight] = useState(current?.targetWeight ?? '')
  const [targetBodyFat, setTargetBodyFat] = useState(current?.targetBodyFat ?? '')
  const [weeks, setWeeks] = useState(() => {
    if (!current?.targetDate) return '12'
    const d = differenceInDays(parseISO(current.targetDate), new Date())
    return Math.max(1, Math.round(d / 7)).toString()
  })

  function handleSave() {
    const tw = parseFloat(targetWeight)
    if (!tw) return
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + (parseInt(weeks) || 12) * 7)
    onSave({
      targetWeight: tw,
      targetBodyFat: parseFloat(targetBodyFat) || null,
      targetDate: format(targetDate, 'yyyy-MM-dd'),
      startWeight: latest?.weight ?? profile?.weight ?? tw,
      startDate: format(new Date(), 'yyyy-MM-dd'),
    })
    onClose()
  }

  const currentW = latest?.weight ?? profile?.weight
  const weeklyRate = currentW && targetWeight && weeks
    ? Math.abs((parseFloat(targetWeight) - currentW) / parseInt(weeks)).toFixed(2)
    : null

  return (
    <Modal open={open} onClose={onClose} title="Configurar meta corporal">
      <div className="space-y-4">
        <div>
          <label className="label">Peso alvo (kg)</label>
          <input className="input" type="number" step="0.5" value={targetWeight}
            onChange={e => setTargetWeight(e.target.value)} placeholder="Ex: 65" autoFocus />
        </div>
        <div>
          <label className="label">% Gordura alvo (opcional)</label>
          <input className="input" type="number" step="0.5" value={targetBodyFat}
            onChange={e => setTargetBodyFat(e.target.value)} placeholder="Ex: 20" />
        </div>
        <div>
          <label className="label">Prazo (semanas)</label>
          <input className="input" type="number" value={weeks}
            onChange={e => setWeeks(e.target.value)} min="1" />
        </div>

        {weeklyRate && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Ritmo necessário</p>
            <p className="text-violet-300 font-medium">{weeklyRate} kg/semana</p>
            {parseFloat(weeklyRate) > 1 && (
              <p className="text-xs text-amber-400 mt-1">⚠️ Acima de 1 kg/sem pode ser agressivo</p>
            )}
          </div>
        )}

        <button onClick={handleSave} disabled={!targetWeight}
          className="btn-primary w-full disabled:opacity-40">
          Salvar meta
        </button>
      </div>
    </Modal>
  )
}

// ── Stat chip ─────────────────────────────────────────────────────────────

function Chip({ label, value, unit, sub, color = '#8b5cf6' }) {
  return (
    <div className="card-sm text-center">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="font-bold text-white text-base leading-none">
        {value ?? '—'}{value != null && <span className="text-xs font-normal text-zinc-400 ml-0.5">{unit}</span>}
      </p>
      {sub && <p className="text-xs mt-1 font-medium" style={{ color }}>{sub}</p>}
    </div>
  )
}

// ── Chart tooltip ─────────────────────────────────────────────────────────

const ChartTip = ({ active, payload, label }) => {
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

// ── Main page ─────────────────────────────────────────────────────────────

const TABS = ['Atual', 'Histórico', 'Metas']

export default function Composicao() {
  const { profile, updateProfile } = useApp()
  const [tab, setTab] = useState('Atual')
  const [measureModal, setMeasureModal] = useState(false)
  const [goalModal, setGoalModal] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [measurements, setMeasurements] = useState(() => getMeasurements())

  const latest  = measurements[0] ?? null
  const goal    = profile?.bodyGoal ?? null
  const sex     = profile?.sex ?? 'female'
  const heightCm = profile?.height ?? 170

  function handleSaveMeasurement(entry) {
    addMeasurement(entry)
    setMeasurements(getMeasurements())
  }

  function handleDeleteMeasurement(id) {
    deleteMeasurement(id)
    setMeasurements(getMeasurements())
  }

  function handleSaveGoal(g) {
    updateProfile({ ...profile, bodyGoal: g })
  }

  // Derived values
  const bmi    = latest?.weight ? calcBMI(latest.weight, heightCm) : null
  const bmiCat = bmi ? bmiCategory(bmi) : null
  const bfCat  = latest?.bodyFat ? bodyFatCategory(latest.bodyFat, sex) : null

  const progress = goal && latest?.weight
    ? weightProgress(latest.weight, goal.startWeight, goal.targetWeight)
    : null

  const daysLeft = goal?.targetDate
    ? Math.max(0, differenceInDays(parseISO(goal.targetDate), new Date()))
    : null

  const remaining = goal && latest?.weight
    ? Math.abs(latest.weight - goal.targetWeight).toFixed(1)
    : null

  const isGain = goal && goal.targetWeight > goal.startWeight

  // Chart data
  const chartData = useMemo(() =>
    [...measurements].reverse().map(m => ({
      date:   format(parseISO(m.date), 'dd/MM', { locale: ptBR }),
      'Peso (kg)':           m.weight,
      '% Gordura':           m.bodyFat    ?? undefined,
      'Massa musc. (kg)':    m.muscleMass ?? undefined,
      'Cintura (cm)':        m.waist      ?? undefined,
      'Quadril (cm)':        m.hip        ?? undefined,
    })), [measurements])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Composição corporal</h1>
        <button onClick={() => setMeasureModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Registrar medidas
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Atual ────────────────────────────────────────────────────── */}
      {tab === 'Atual' && (
        <div className="space-y-4">
          {!latest ? (
            <div className="card flex flex-col items-center py-12 text-center">
              <Scale size={32} className="text-zinc-700 mb-3" />
              <p className="text-zinc-400 font-medium">Nenhuma medida registrada</p>
              <p className="text-zinc-600 text-sm mt-1">Clique em "Registrar medidas" para começar</p>
            </div>
          ) : (
            <>
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-zinc-300">Medidas atuais</p>
                  <p className="text-xs text-zinc-500">
                    {format(parseISO(latest.date), "dd 'de' MMMM yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Chip label="Peso" value={latest.weight} unit="kg" />
                  <Chip label="IMC" value={bmi} sub={bmiCat?.label} color={bmiCat?.color} />
                  {latest.bodyFat != null
                    ? <Chip label="% Gordura" value={latest.bodyFat} unit="%" sub={bfCat?.label} color={bfCat?.color} />
                    : <Chip label="% Gordura" value={null} unit="%" sub="não informado" />
                  }
                  {latest.muscleMass != null && <Chip label="Massa muscular" value={latest.muscleMass} unit="kg" />}
                  {latest.waist  != null && <Chip label="Cintura" value={latest.waist} unit="cm" />}
                  {latest.hip    != null && <Chip label="Quadril" value={latest.hip} unit="cm" />}
                </div>
              </div>

              {/* Goal progress */}
              {goal ? (
                <div className="card space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-300">Progresso da meta</p>
                    <button onClick={() => setGoalModal(true)}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      Editar meta
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-zinc-500">Início</p>
                      <p className="text-white font-semibold">{goal.startWeight} kg</p>
                    </div>
                    <div className="flex-1">
                      <ProgressBar
                        value={Math.abs(progress * 100)}
                        max={100}
                        color={progress >= 1 ? 'bg-emerald-500' : 'bg-violet-500'}
                      />
                      <p className="text-center text-xs text-zinc-500 mt-1">
                        {Math.round(Math.abs(progress * 100))}% concluído
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-zinc-500">Meta</p>
                      <p className="text-violet-300 font-semibold">{goal.targetWeight} kg</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-zinc-800/60 rounded-xl p-3">
                      <p className="text-xs text-zinc-500">Faltam</p>
                      <p className="text-white font-semibold text-sm">{remaining} kg</p>
                    </div>
                    <div className="bg-zinc-800/60 rounded-xl p-3">
                      <p className="text-xs text-zinc-500">Dias restantes</p>
                      <p className={`font-semibold text-sm ${daysLeft === 0 ? 'text-red-400' : 'text-white'}`}>
                        {daysLeft} dias
                      </p>
                    </div>
                    <div className="bg-zinc-800/60 rounded-xl p-3">
                      <p className="text-xs text-zinc-500">Ritmo necessário</p>
                      <p className="text-white font-semibold text-sm">
                        {daysLeft > 0
                          ? `${(parseFloat(remaining) / (daysLeft / 7)).toFixed(2)} kg/sem`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {goal.targetBodyFat && (
                    <div className="border-t border-zinc-800 pt-3">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-zinc-400">Meta de gordura</span>
                        <span>
                          <span className="text-white font-medium">{latest.bodyFat ?? '—'}%</span>
                          <span className="text-zinc-500"> → {goal.targetBodyFat}%</span>
                        </span>
                      </div>
                      {latest.bodyFat != null && (
                        <ProgressBar
                          value={Math.abs(latest.bodyFat - goal.targetBodyFat)}
                          max={Math.abs((goal.startBodyFat ?? latest.bodyFat) - goal.targetBodyFat) || 1}
                          color="bg-rose-500"
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Nenhuma meta definida</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Defina um peso-alvo e prazo para acompanhar seu progresso</p>
                  </div>
                  <button onClick={() => setGoalModal(true)} className="btn-primary flex items-center gap-1.5 flex-shrink-0">
                    <Target size={14} /> Definir meta
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Histórico ────────────────────────────────────────────────── */}
      {tab === 'Histórico' && (
        <div className="space-y-4">
          {chartData.length < 2 ? (
            <div className="card flex flex-col items-center py-10 text-center">
              <p className="text-zinc-400">Precisa de pelo menos 2 registros para ver o gráfico.</p>
            </div>
          ) : (
            <>
              <div className="card">
                <p className="text-sm font-medium text-zinc-300 mb-4">Peso ao longo do tempo</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<ChartTip />} />
                    {goal?.targetWeight && (
                      <ReferenceLine y={goal.targetWeight} stroke="#8b5cf6" strokeDasharray="4 4"
                        label={{ value: `Meta ${goal.targetWeight}kg`, fill: '#a78bfa', fontSize: 11 }} />
                    )}
                    <Line type="monotone" dataKey="Peso (kg)" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {chartData.some(d => d['% Gordura']) && (
                <div className="card">
                  <p className="text-sm font-medium text-zinc-300 mb-4">% Gordura corporal</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip content={<ChartTip />} />
                      {goal?.targetBodyFat && (
                        <ReferenceLine y={goal.targetBodyFat} stroke="#f43f5e" strokeDasharray="4 4" />
                      )}
                      <Line type="monotone" dataKey="% Gordura" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {chartData.some(d => d['Massa musc. (kg)']) && (
                <div className="card">
                  <p className="text-sm font-medium text-zinc-300 mb-4">Massa muscular (kg)</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip content={<ChartTip />} />
                      <Line type="monotone" dataKey="Massa musc. (kg)" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {chartData.some(d => d['Cintura (cm)'] || d['Quadril (cm)']) && (
                <div className="card">
                  <p className="text-sm font-medium text-zinc-300 mb-4">Medidas corporais (cm)</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip content={<ChartTip />} />
                      {chartData.some(d => d['Cintura (cm)']) && (
                        <Line type="monotone" dataKey="Cintura (cm)" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
                      )}
                      {chartData.some(d => d['Quadril (cm)']) && (
                        <Line type="monotone" dataKey="Quadril (cm)" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* Table */}
          <div className="card space-y-2">
            <p className="text-sm font-medium text-zinc-300 mb-1">Todos os registros</p>
            {measurements.length === 0
              ? <p className="text-zinc-600 text-sm">Nenhum registro ainda.</p>
              : measurements.map((m, i) => (
                <div key={m.id}>
                  <div
                    className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                    onClick={() => setExpanded(e => e === m.id ? null : m.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{m.weight} kg</p>
                        {i === 0 && <span className="text-xs bg-violet-600/20 text-violet-400 px-1.5 py-0.5 rounded-full">atual</span>}
                      </div>
                      <p className="text-xs text-zinc-500">
                        {format(parseISO(m.date), "dd 'de' MMMM yyyy", { locale: ptBR })}
                        {m.bodyFat != null ? ` · ${m.bodyFat}% gordura` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {i > 0 && measurements[i - 1]?.weight && (
                        <span className={`text-xs font-medium ${m.weight < measurements[i - 1].weight ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {m.weight < measurements[i - 1].weight ? '↓' : '↑'}{' '}
                          {Math.abs(m.weight - measurements[i - 1].weight).toFixed(1)} kg
                        </span>
                      )}
                      {expanded === m.id ? <ChevronUp size={13} className="text-zinc-600" /> : <ChevronDown size={13} className="text-zinc-600" />}
                    </div>
                  </div>

                  {expanded === m.id && (
                    <div className="px-3 pb-2 space-y-1.5">
                      <div className="grid grid-cols-3 gap-1.5 text-xs">
                        {[
                          ['IMC', calcBMI(m.weight, heightCm)],
                          ['% Gordura', m.bodyFat != null ? `${m.bodyFat}%` : null],
                          ['Massa musc.', m.muscleMass != null ? `${m.muscleMass} kg` : null],
                          ['Cintura', m.waist != null ? `${m.waist} cm` : null],
                          ['Quadril', m.hip != null ? `${m.hip} cm` : null],
                        ].filter(([, v]) => v != null).map(([l, v]) => (
                          <div key={l} className="bg-zinc-800/50 rounded-lg p-2 text-center">
                            <p className="text-zinc-500">{l}</p>
                            <p className="text-white font-medium">{v}</p>
                          </div>
                        ))}
                      </div>
                      {m.notes && <p className="text-xs text-zinc-500 italic px-1">"{m.notes}"</p>}
                      <div className="flex justify-end">
                        <button onClick={() => handleDeleteMeasurement(m.id)}
                          className="btn-danger text-xs flex items-center gap-1 py-1">
                          <Trash2 size={11} /> Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── Metas ────────────────────────────────────────────────────── */}
      {tab === 'Metas' && (
        <div className="space-y-4">
          {goal ? (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-300">Meta atual</p>
                <button onClick={() => setGoalModal(true)}
                  className="btn-ghost text-xs flex items-center gap-1">
                  <Target size={12} /> Alterar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Peso alvo',      `${goal.targetWeight} kg`, 'text-violet-400'],
                  ['% Gordura alvo', goal.targetBodyFat ? `${goal.targetBodyFat}%` : '—', 'text-rose-400'],
                  ['Data limite',    goal.targetDate ? format(parseISO(goal.targetDate), "dd/MM/yyyy") : '—', 'text-white'],
                  ['Prazo restante', goal.targetDate ? `${Math.max(0, differenceInDays(parseISO(goal.targetDate), new Date()))} dias` : '—', 'text-amber-400'],
                  ['Peso inicial',   `${goal.startWeight} kg`, 'text-white'],
                  ['Diferença total', `${Math.abs(goal.targetWeight - goal.startWeight).toFixed(1)} kg`, goal.targetWeight < goal.startWeight ? 'text-emerald-400' : 'text-blue-400'],
                ].map(([l, v, c]) => (
                  <div key={l} className="bg-zinc-800/60 rounded-xl p-3">
                    <p className="text-xs text-zinc-500">{l}</p>
                    <p className={`font-semibold text-sm mt-0.5 ${c}`}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center py-12 text-center">
              <Target size={32} className="text-zinc-700 mb-3" />
              <p className="text-zinc-400 font-medium">Nenhuma meta definida</p>
              <p className="text-zinc-600 text-sm mt-1 mb-4">Defina um peso-alvo e prazo para monitorar seu progresso</p>
              <button onClick={() => setGoalModal(true)} className="btn-primary">Definir meta</button>
            </div>
          )}
        </div>
      )}

      <MeasurementModal open={measureModal} onClose={() => setMeasureModal(false)} onSave={handleSaveMeasurement} />
      <GoalModal open={goalModal} onClose={() => setGoalModal(false)} profile={profile} onSave={handleSaveGoal} />
    </div>
  )
}
