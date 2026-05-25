import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Scale, Flame, Footprints, Dumbbell, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getWaterGoal, calculateHeartRateZones, formatCalories, getActivityGoals } from '../utils/calculations'
import { GOALS } from '../utils/constants'
import { getLatestMeasurement, calcBMI, bmiCategory, weightProgress } from '../utils/bodyStorage'
import { getCalorieStreak, getWeeklyCardioCount, getCurrentWeekRange } from '../utils/storage'
import { getWorkoutLogs } from '../utils/trainingStorage'
import ProgressRing from '../components/ui/ProgressRing'
import ProgressBar from '../components/ui/ProgressBar'


function BodyWidget({ profile }) {
  const latest = getLatestMeasurement()
  const goal = profile?.bodyGoal
  if (!latest && !goal) return null

  const weight = latest?.weight ?? profile?.weight
  const bmi = weight && profile?.height ? calcBMI(weight, profile.height) : null
  const bmiCat = bmi ? bmiCategory(bmi) : null
  const progress = goal?.startWeight && goal?.targetWeight && weight
    ? weightProgress(weight, goal.startWeight, goal.targetWeight)
    : null
  const daysLeft = goal?.targetDate
    ? Math.max(0, Math.round((new Date(goal.targetDate) - new Date()) / 86400000))
    : null
  const remaining = goal?.targetWeight && weight ? Math.abs(goal.targetWeight - weight).toFixed(1) : null
  const direction = goal?.targetWeight && weight ? (goal.targetWeight < weight ? 'perder' : 'ganhar') : null

  return (
    <Link to="/composicao" className="card block hover:border-violet-500/40 transition-colors border border-transparent">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600/15 flex items-center justify-center">
            <Scale size={14} className="text-violet-400" />
          </div>
          <p className="text-sm font-medium text-zinc-300">Composição corporal</p>
        </div>
        <ChevronRight size={14} className="text-zinc-600" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-zinc-800/60 rounded-xl p-2 text-center">
          <p className="text-xs text-zinc-500">Peso</p>
          <p className="text-sm font-bold text-white">{weight ? `${weight} kg` : '—'}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-2 text-center">
          <p className="text-xs text-zinc-500">IMC</p>
          <p className="text-sm font-bold" style={{ color: bmiCat?.color ?? '#a1a1aa' }}>{bmi ?? '—'}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-2 text-center">
          <p className="text-xs text-zinc-500">Meta</p>
          <p className="text-sm font-bold text-white">{goal?.targetWeight ? `${goal.targetWeight} kg` : '—'}</p>
        </div>
      </div>
      {progress !== null && (
        <>
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>{goal.startWeight} kg</span>
            <span>{remaining && direction ? `${remaining} kg para ${direction}` : ''}</span>
            <span>{goal.targetWeight} kg</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-violet-500 transition-all"
              style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
            />
          </div>
          {daysLeft !== null && (
            <p className="text-xs text-zinc-500 mt-1.5 text-right">{daysLeft} dias restantes</p>
          )}
        </>
      )}
      {!goal && (
        <p className="text-xs text-zinc-500">Toque para definir sua meta corporal</p>
      )}
    </Link>
  )
}

export default function Dashboard() {
  const { profile, totalCaloriesConsumed, totalCaloriesBurned, totalWater, totalMacros, totalSteps, setSteps, currentDate, setCurrentDate } = useApp()

  const goalCal = profile?.dailyCalorieGoal ?? 2000
  const goalMacros = profile?.macros ?? { protein: 150, carbs: 200, fat: 60 }
  const waterGoal = getWaterGoal(profile)
  const net = totalCaloriesConsumed - totalCaloriesBurned
  const remaining = goalCal - net

  const hrZones = profile ? calculateHeartRateZones(profile.age) : null
  const bestZone = hrZones?.zones[1]
  const streak = getCalorieStreak(goalCal)

  // Activity goals
  const activityGoals = getActivityGoals(profile)
  const cardioThisWeek = getWeeklyCardioCount()
  const { start: wStart, end: wEnd } = getCurrentWeekRange()
  const strengthThisWeek = getWorkoutLogs().filter(l => l.date >= wStart && l.date <= wEnd).length
  const [stepsInput, setStepsInput] = useState(String(totalSteps || ''))

  function handleStepsBlur() {
    const n = parseInt(stepsInput, 10)
    if (!isNaN(n) && n >= 0) setSteps(n)
    else setStepsInput(String(totalSteps))
  }

  function changeDate(delta) {
    const d = new Date(currentDate + 'T12:00:00') // noon = safe from UTC timezone shift
    d.setDate(d.getDate() + delta)
    setCurrentDate(format(d, 'yyyy-MM-dd'))
  }

  const isToday = currentDate === format(new Date(), 'yyyy-MM-dd')
  const dateLabel = isToday ? 'Hoje' : format(new Date(currentDate + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })

  const ringColor = remaining < 0 ? '#f43f5e' : '#8b5cf6'

  return (
    <div className="space-y-6">
      {/* Date nav */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 capitalize">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => changeDate(-1)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(format(new Date(), 'yyyy-MM-dd'))}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isToday ? 'bg-violet-600/20 text-violet-300' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
          >
            Hoje
          </button>
          <button onClick={() => changeDate(1)} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" disabled={isToday}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main calorie ring + macros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card flex flex-col items-center gap-3 lg:col-span-1">
          <p className="text-sm font-medium text-zinc-400 self-start w-full">Calorias do dia</p>
          <ProgressRing value={net} max={goalCal} size={140} strokeWidth={12} color={ringColor}>
            <div className="text-center">
              <p className="text-2xl font-bold text-white leading-none">{formatCalories(net)}</p>
              <p className="text-xs text-zinc-500 mt-1">de {formatCalories(goalCal)} kcal</p>
            </div>
          </ProgressRing>
          <div className="grid grid-cols-2 gap-2 w-full text-center">
            <div className="bg-zinc-800/60 rounded-xl p-2">
              <p className="text-xs text-zinc-500">Consumido</p>
              <p className="text-sm font-semibold text-white">{formatCalories(totalCaloriesConsumed)}</p>
            </div>
            <div className="bg-zinc-800/60 rounded-xl p-2">
              <p className="text-xs text-zinc-500">Gasto</p>
              <p className="text-sm font-semibold text-emerald-400">{formatCalories(totalCaloriesBurned)}</p>
            </div>
          </div>
          <div className={`w-full text-center py-2 rounded-xl text-sm font-medium ${remaining >= 0 ? 'bg-violet-600/10 text-violet-300' : 'bg-red-500/10 text-red-400'}`}>
            {remaining >= 0 ? `${formatCalories(remaining)} kcal restantes` : `${formatCalories(Math.abs(remaining))} kcal acima da meta`}
          </div>
        </div>

        <div className="card lg:col-span-2 space-y-4">
          <p className="text-sm font-medium text-zinc-400">Macronutrientes</p>
          {[
            { label: 'Proteína', value: totalMacros.protein, goal: goalMacros.protein, color: 'bg-blue-500', unit: 'g' },
            { label: 'Carboidratos', value: totalMacros.carbs, goal: goalMacros.carbs, color: 'bg-amber-500', unit: 'g' },
            { label: 'Gorduras', value: totalMacros.fat, goal: goalMacros.fat, color: 'bg-rose-500', unit: 'g' },
          ].map(({ label, value, goal, color, unit }) => (
            <div key={label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-zinc-300">{label}</span>
                <span className="text-sm">
                  <span className="text-white font-medium">{Math.round(value)}</span>
                  <span className="text-zinc-500"> / {goal}{unit}</span>
                </span>
              </div>
              <ProgressBar value={value} max={goal} color={color} />
            </div>
          ))}
        </div>
      </div>


      {/* Water progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-zinc-300">Hidratação</p>
          <span className="text-xs text-zinc-500">Meta ideal: {waterGoal.ideal} ml</span>
        </div>
        <ProgressBar value={totalWater} max={waterGoal.ideal} color="bg-cyan-500" showLabel />
        <p className="text-xs text-zinc-500 mt-2">Mínimo recomendado: {waterGoal.minimum} ml</p>
      </div>

      {/* Activity widget */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-300">Atividade</p>
          <Link to="/config" className="text-xs text-zinc-500 hover:text-violet-400 transition-colors">configurar</Link>
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Footprints size={13} className="text-violet-400" />
              <span className="text-sm text-zinc-300">Passos hoje</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                value={stepsInput}
                onChange={e => setStepsInput(e.target.value)}
                onBlur={handleStepsBlur}
                onKeyDown={e => e.key === 'Enter' && handleStepsBlur()}
                className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-right text-white focus:outline-none focus:border-violet-500"
                placeholder="0"
              />
              <span className="text-xs text-zinc-500">/ {activityGoals.stepsPerDay.toLocaleString('pt-BR')}</span>
            </div>
          </div>
          <ProgressBar value={totalSteps} max={activityGoals.stepsPerDay} color="bg-violet-500" />
        </div>

        {/* Cardio + Strength */}
        <div className="grid grid-cols-2 gap-3">
          {/* Cardio */}
          <div className="bg-zinc-800/60 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity size={12} className="text-emerald-400" />
              <p className="text-xs text-zinc-400">Cardio esta semana</p>
            </div>
            <div className="flex gap-1 mb-1.5">
              {Array.from({ length: activityGoals.cardioSessionsPerWeek }).map((_, i) => (
                <div key={i} className={`h-2.5 flex-1 rounded-full ${i < cardioThisWeek ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
              ))}
            </div>
            <p className="text-xs text-zinc-400">
              <span className="text-white font-medium">{cardioThisWeek}</span>/{activityGoals.cardioSessionsPerWeek} sessões
              <span className="text-zinc-600"> · {activityGoals.cardioDurationMin} min</span>
            </p>
          </div>

          {/* Strength */}
          <div className="bg-zinc-800/60 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Dumbbell size={12} className="text-blue-400" />
              <p className="text-xs text-zinc-400">Musculação esta semana</p>
            </div>
            <div className="flex gap-1 mb-1.5">
              {Array.from({ length: activityGoals.strengthSessionsPerWeek }).map((_, i) => (
                <div key={i} className={`h-2.5 flex-1 rounded-full ${i < strengthThisWeek ? 'bg-blue-500' : 'bg-zinc-700'}`} />
              ))}
            </div>
            <p className="text-xs text-zinc-400">
              <span className="text-white font-medium">{strengthThisWeek}</span>/{activityGoals.strengthSessionsPerWeek} sessões
            </p>
          </div>
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="card flex items-center gap-3 py-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
            <Flame size={18} className="text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              {streak} {streak === 1 ? 'dia' : 'dias'} seguidos na meta!
            </p>
            <p className="text-xs text-zinc-500">Calorias dentro de 80–115% do objetivo. Continue assim!</p>
          </div>
          <span className="text-2xl">{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '✨'}</span>
        </div>
      )}

      {/* Body composition */}
      <BodyWidget profile={profile} />

      {/* Heart rate best zone */}
      {bestZone && (
        <div className="card">
          <p className="text-sm font-medium text-zinc-400 mb-3">Zona ideal para cárdio (queima de gordura)</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: bestZone.color + '33' }}>
              <span className="text-xl">❤️</span>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                {bestZone.range[0]} – {bestZone.range[1]} <span className="text-sm font-normal text-zinc-400">bpm</span>
              </p>
              <p className="text-sm text-zinc-400">{bestZone.benefit}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-zinc-500">FC máxima estimada</p>
              <p className="text-white font-semibold">{hrZones.maxHR} bpm</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
