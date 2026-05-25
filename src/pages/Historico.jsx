import { useState, useMemo } from 'react'
import { subDays, format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getLogsRange } from '../utils/storage'
import { useApp } from '../context/AppContext'

const RANGES = [
  { label: '7 dias', days: 7 },
  { label: '14 dias', days: 14 },
  { label: '30 dias', days: 30 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {Math.round(p.value)}</p>
      ))}
    </div>
  )
}

export default function Historico() {
  const { profile } = useApp()
  const [rangeDays, setRangeDays] = useState(7)
  const goalCal = profile?.dailyCalorieGoal ?? 2000
  const goalMacros = profile?.macros ?? { protein: 150, carbs: 200, fat: 60 }

  const data = useMemo(() => {
    const end = new Date()
    const start = subDays(end, rangeDays - 1)
    const logs = getLogsRange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'))
    return logs.map(log => {
      const cal = Object.values(log.meals ?? {}).flat().reduce((s, e) => s + (e.calories ?? 0), 0)
      const burned = (log.exercises ?? []).reduce((s, e) => s + (e.caloriesBurned ?? 0), 0)
      const water = (log.water ?? []).reduce((s, w) => s + (w.amount ?? 0), 0)
      const macros = Object.values(log.meals ?? {}).flat().reduce((acc, e) => ({
        protein: acc.protein + (e.protein ?? 0),
        carbs:   acc.carbs   + (e.carbs   ?? 0),
        fat:     acc.fat     + (e.fat     ?? 0),
      }), { protein: 0, carbs: 0, fat: 0 })
      return {
        date: format(new Date(log.date + 'T12:00:00'), 'dd/MM', { locale: ptBR }),
        Consumido: Math.round(cal),
        Queimado: Math.round(burned),
        Meta: goalCal,
        Água: Math.round(water),
        Proteína: Math.round(macros.protein),
        Carbs: Math.round(macros.carbs),
        Gordura: Math.round(macros.fat),
      }
    })
  }, [rangeDays, goalCal])

  const avg = {
    cal: Math.round(data.reduce((s, d) => s + d.Consumido, 0) / data.length),
    burned: Math.round(data.reduce((s, d) => s + d.Queimado, 0) / data.length),
    water: Math.round(data.reduce((s, d) => s + d.Água, 0) / data.length),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Histórico</h1>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button key={r.days} onClick={() => setRangeDays(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${rangeDays === r.days ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Média consumido', value: avg.cal, unit: 'kcal/dia', color: 'text-violet-400' },
          { label: 'Média queimado', value: avg.burned, unit: 'kcal/dia', color: 'text-emerald-400' },
          { label: 'Média água', value: avg.water, unit: 'ml/dia', color: 'text-cyan-400' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="card text-center">
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{value.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-zinc-600">{unit}</p>
          </div>
        ))}
      </div>

      {/* Calorie chart */}
      {data.some(d => d.Consumido > 0 || d.Queimado > 0) ? (
        <div className="card">
          <p className="text-sm font-medium text-zinc-300 mb-4">Calorias consumidas x queimadas</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradViolet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
              <Area type="monotone" dataKey="Consumido" stroke="#8b5cf6" fill="url(#gradViolet)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Queimado" stroke="#10b981" fill="url(#gradEmerald)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Meta" stroke="#52525b" fill="none" strokeWidth={1} strokeDasharray="4 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card flex flex-col items-center py-10 text-center">
          <p className="text-zinc-400 font-medium text-sm">Sem dados de calorias neste período</p>
          <p className="text-zinc-600 text-xs mt-1">Registre refeições e exercícios para ver o gráfico</p>
        </div>
      )}

      {/* Macros chart */}
      {data.some(d => d.Proteína > 0) ? (
        <div className="card">
          <p className="text-sm font-medium text-zinc-300 mb-4">Macronutrientes diários (g)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
              <Bar dataKey="Proteína" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Carbs" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Gordura" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* Water chart */}
      {data.some(d => d.Água > 0) ? (
        <div className="card">
          <p className="text-sm font-medium text-zinc-300 mb-4">Consumo de água (ml)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Água" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  )
}
