import { useState, useMemo } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isToday, isSameMonth, subDays, isFuture,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Droplets, Trophy } from 'lucide-react'
import { getLogsRange } from '../utils/storage'
import { getWorkoutLogs } from '../utils/trainingStorage'
import { getWaterGoal } from '../utils/calculations'
import { useApp } from '../context/AppContext'

// ── helpers ─────────────────────────────────────────────────────────────────

function buildMonthData(year, month, profile) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = endOfMonth(firstDay)
  const startStr = format(firstDay, 'yyyy-MM-dd')
  const endStr   = format(lastDay,  'yyyy-MM-dd')

  const nutritionLogs = getLogsRange(startStr, endStr)         // daily nutrition + exercises
  const workoutLogs   = getWorkoutLogs()                       // strength training sessions

  const goalCal   = profile?.dailyCalorieGoal ?? 2000
  const waterInfo = profile ? getWaterGoal(profile) : { minimum: 1800, ideal: 2500 }

  const workoutDates = new Set(workoutLogs.map(l => l.date))

  return Object.fromEntries(
    nutritionLogs.map(log => {
      const cal   = Object.values(log.meals ?? {}).flat().reduce((s, e) => s + (e.calories ?? 0), 0)
      const water = (log.water ?? []).reduce((s, w) => s + (w.amount ?? 0), 0)

      const hasCardio   = (log.exercises ?? []).length > 0
      const hasWorkout  = workoutDates.has(log.date)
      const hasExercise = hasCardio || hasWorkout

      // Calorie goal: consumed between 80 % and 115 % of target
      const calRatio     = goalCal > 0 ? cal / goalCal : 0
      const hitCalories  = cal > 0 && calRatio >= 0.80 && calRatio <= 1.15

      // Water goal: reached at least the minimum recommended
      const hitWater = water >= waterInfo.minimum

      return [log.date, { cal, water, hasExercise, hitCalories, hitWater, hasData: cal > 0 || water > 0 || hasExercise }]
    })
  )
}

function calcStreak(data, key) {
  const today = format(new Date(), 'yyyy-MM-dd')
  let streak = 0
  let d = new Date()
  while (true) {
    const str = format(d, 'yyyy-MM-dd')
    if (str > today) { d = subDays(d, 1); continue }
    if (data[str]?.[key]) { streak++; d = subDays(d, 1) }
    else break
  }
  return streak
}

// ── Legend dot ───────────────────────────────────────────────────────────────

const INDICATORS = [
  { key: 'hasExercise', color: '#8b5cf6', icon: Dumbbell, label: 'Exercício' },
  { key: 'hitCalories', color: '#10b981', icon: Flame,    label: 'Meta calórica' },
  { key: 'hitWater',    color: '#06b6d4', icon: Droplets, label: 'Meta de água' },
]

// ── Day cell ─────────────────────────────────────────────────────────────────

function DayCell({ date, info, isCurrentMonth, onSelect, selected }) {
  const today = isToday(date)
  const hasAny = info?.hasData
  const dots = INDICATORS.filter(ind => info?.[ind.key])

  return (
    <button
      onClick={() => onSelect(date)}
      className={`
        relative flex flex-col items-center pt-1.5 pb-1 rounded-xl transition-all min-h-[58px]
        ${!isCurrentMonth ? 'opacity-25 pointer-events-none' : ''}
        ${selected ? 'bg-violet-600/25 ring-1 ring-violet-500/60' : today ? 'bg-zinc-800 ring-1 ring-violet-500/40' : 'hover:bg-zinc-800/60'}
      `}
    >
      <span className={`text-sm font-medium leading-none mb-1.5 ${today ? 'text-violet-300' : 'text-zinc-300'}`}>
        {format(date, 'd')}
      </span>
      <div className="flex gap-0.5">
        {dots.length > 0
          ? dots.map(ind => (
              <span key={ind.key} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ind.color }} />
            ))
          : isCurrentMonth && <span className="w-1.5 h-1.5" />
        }
      </div>
    </button>
  )
}

// ── Day detail panel ─────────────────────────────────────────────────────────

function DayDetail({ date, info, profile, onClose }) {
  if (!date) return null
  const waterInfo = profile ? getWaterGoal(profile) : { minimum: 1800, ideal: 2500 }
  const goalCal   = profile?.dailyCalorieGoal ?? 2000
  const label     = format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })

  const rows = [
    {
      icon: Dumbbell, color: '#8b5cf6', label: 'Exercício',
      value: info?.hasExercise ? 'Realizado ✓' : 'Nenhum registro',
      hit: info?.hasExercise,
    },
    {
      icon: Flame, color: '#10b981', label: 'Calorias',
      value: info?.cal > 0 ? `${Math.round(info.cal)} / ${goalCal} kcal` : 'Sem registro',
      hit: info?.hitCalories,
      sub: info?.cal > 0 ? `${Math.round((info.cal / goalCal) * 100)}% da meta` : null,
    },
    {
      icon: Droplets, color: '#06b6d4', label: 'Água',
      value: info?.water > 0 ? `${info.water} / ${waterInfo.minimum} ml` : 'Sem registro',
      hit: info?.hitWater,
      sub: info?.water > 0 ? `Mínimo: ${waterInfo.minimum} ml` : null,
    },
  ]

  return (
    <div className="card border border-zinc-700 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white capitalize">{label}</p>
        <button onClick={onClose} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">fechar</button>
      </div>
      {rows.map(row => (
        <div key={row.label} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${row.hit ? 'bg-zinc-800/60' : 'bg-zinc-900'}`}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: row.hit ? row.color + '22' : '#27272a' }}>
            <row.icon size={14} style={{ color: row.hit ? row.color : '#52525b' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500">{row.label}</p>
            <p className={`text-sm font-medium ${row.hit ? 'text-white' : 'text-zinc-600'}`}>{row.value}</p>
            {row.sub && <p className="text-xs text-zinc-600">{row.sub}</p>}
          </div>
          {row.hit && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: row.color + '22', color: row.color }}>
              Meta ✓
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

const WEEK_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function Calendario() {
  const { profile } = useApp()
  const [current, setCurrent] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(null)

  const monthData = useMemo(
    () => buildMonthData(current.getFullYear(), current.getMonth(), profile),
    [current, profile]
  )

  // Build calendar grid (pad start with empty slots)
  const days = eachDayOfInterval({ start: current, end: endOfMonth(current) })
  const startPad = getDay(current) // 0 = Sun
  const grid = [...Array(startPad).fill(null), ...days]

  // Month stats — for current month only count days up to today
  const pastDays = isSameMonth(current, new Date())
    ? days.filter(d => !isFuture(d))
    : days
  const daysCount = pastDays.length

  const stats = useMemo(() => {
    let exercise = 0, calories = 0, water = 0, perfect = 0
    pastDays.forEach(d => {
      const info = monthData[format(d, 'yyyy-MM-dd')]
      if (!info) return
      if (info.hasExercise) exercise++
      if (info.hitCalories) calories++
      if (info.hitWater) water++
      if (info.hasExercise && info.hitCalories && info.hitWater) perfect++
    })
    return { exercise, calories, water, perfect }
  }, [monthData, pastDays])

  // Streaks (from today backwards)
  const streaks = useMemo(() => ({
    exercise: calcStreak(monthData, 'hasExercise'),
    calories: calcStreak(monthData, 'hitCalories'),
    water:    calcStreak(monthData, 'hitWater'),
  }), [monthData])

  function handleSelect(date) {
    const key = format(date, 'yyyy-MM-dd')
    setSelected(prev => prev === key ? null : key)
  }

  const selectedDate = selected ? new Date(selected + 'T12:00:00') : null
  const selectedInfo = selected ? monthData[selected] : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Calendário</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => { setCurrent(subMonths(current, 1)); setSelected(null) }}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-white w-32 text-center capitalize">
            {format(current, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={() => { setCurrent(addMonths(current, 1)); setSelected(null) }}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            disabled={isSameMonth(current, new Date()) && current >= startOfMonth(new Date())}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Exercícios', value: stats.exercise, total: daysCount, color: '#8b5cf6', icon: Dumbbell },
          { label: 'Meta calórica', value: stats.calories, total: daysCount, color: '#10b981', icon: Flame },
          { label: 'Meta de água', value: stats.water, total: daysCount, color: '#06b6d4', icon: Droplets },
          { label: 'Dias perfeitos', value: stats.perfect, total: daysCount, color: '#f59e0b', icon: Trophy },
        ].map(({ label, value, total, color, icon: Icon }) => (
          <div key={label} className="card text-center py-3">
            <div className="w-7 h-7 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: color + '22' }}>
              <Icon size={13} style={{ color }} />
            </div>
            <p className="text-lg font-bold text-white leading-none">{value}</p>
            <p className="text-xs text-zinc-600 mt-0.5">/{total} dias</p>
            <p className="text-xs text-zinc-500 mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Streaks */}
      {(streaks.exercise > 0 || streaks.calories > 0 || streaks.water > 0) && (
        <div className="card flex items-center gap-4 py-3">
          <span className="text-sm text-zinc-400 flex-shrink-0">Sequências atuais</span>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Exercício', value: streaks.exercise, color: '#8b5cf6' },
              { label: 'Calorias',  value: streaks.calories, color: '#10b981' },
              { label: 'Água',      value: streaks.water,    color: '#06b6d4' },
            ].filter(s => s.value > 0).map(s => (
              <span key={s.label} className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: s.color + '20', color: s.color }}>
                🔥 {s.value}d {s.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="card">
        {/* Week day labels */}
        <div className="grid grid-cols-7 mb-2">
          {WEEK_LABELS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-zinc-600 py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {grid.map((date, i) =>
            date ? (
              <DayCell
                key={i}
                date={date}
                info={monthData[format(date, 'yyyy-MM-dd')]}
                isCurrentMonth={isSameMonth(date, current)}
                onSelect={handleSelect}
                selected={selected === format(date, 'yyyy-MM-dd')}
              />
            ) : (
              <div key={i} />
            )
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-zinc-800">
          {INDICATORS.map(ind => (
            <div key={ind.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ind.color }} />
              <span className="text-xs text-zinc-500">{ind.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day detail */}
      {selectedDate && (
        <DayDetail
          date={selectedDate}
          info={selectedInfo}
          profile={profile}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
