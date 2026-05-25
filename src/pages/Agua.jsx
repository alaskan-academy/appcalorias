import { useState } from 'react'
import { Plus, Trash2, Droplets } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getWaterGoal } from '../utils/calculations'
import { GOALS } from '../utils/constants'
import ProgressRing from '../components/ui/ProgressRing'

const QUICK_AMOUNTS = [150, 200, 250, 300, 350, 500]

export default function Agua() {
  const { dayLog, addWater, removeWater, profile, totalWater } = useApp()
  const [custom, setCustom] = useState('')
  const waterInfo = getWaterGoal(profile)
  const entries = dayLog.water ?? []
  const pct = Math.round((totalWater / waterInfo.ideal) * 100)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Hidratação</h1>

      <div className="card flex flex-col items-center gap-4">
        <ProgressRing value={totalWater} max={waterInfo.ideal} size={160} strokeWidth={14} color="#06b6d4">
          <div className="text-center">
            <p className="text-3xl font-bold text-white leading-none">{(totalWater / 1000).toFixed(1)}</p>
            <p className="text-xs text-zinc-500 mt-1">litros</p>
          </div>
        </ProgressRing>

        <div className="grid grid-cols-3 gap-3 w-full text-center">
          <div className="bg-zinc-800/60 rounded-xl p-3">
            <p className="text-xs text-zinc-500">Consumido</p>
            <p className="text-base font-semibold text-white">{totalWater} ml</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
            <p className="text-xs text-zinc-500">Meta ideal</p>
            <p className="text-base font-semibold text-cyan-400">{waterInfo.ideal} ml</p>
          </div>
          <div className="bg-zinc-800/60 rounded-xl p-3">
            <p className="text-xs text-zinc-500">Mínimo</p>
            <p className="text-base font-semibold text-zinc-300">{waterInfo.minimum} ml</p>
          </div>
        </div>

        <div className={`w-full text-center py-2 rounded-xl text-sm font-medium ${pct >= 100 ? 'bg-cyan-500/10 text-cyan-300' : 'bg-zinc-800 text-zinc-400'}`}>
          {pct >= 100 ? '🎉 Meta atingida!' : `Faltam ${waterInfo.ideal - totalWater} ml para a meta`}
        </div>
      </div>

      {/* Quick add */}
      <div className="card space-y-3">
        <p className="text-sm font-medium text-zinc-300">Adicionar rápido</p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_AMOUNTS.map(amount => (
            <button key={amount} onClick={() => addWater(amount)}
              className="flex flex-col items-center py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
              <Droplets size={16} className="text-cyan-400 mb-1" />
              <span className="text-sm font-medium text-white">{amount} ml</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input flex-1" type="number" value={custom}
            onChange={e => setCustom(e.target.value)} placeholder="Quantidade personalizada (ml)" min="1" />
          <button onClick={() => { if (custom) { addWater(Number(custom)); setCustom('') } }} className="btn-primary">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* History */}
      {entries.length > 0 && (
        <div className="card space-y-2">
          <p className="text-sm font-medium text-zinc-300">Registros de hoje</p>
          {[...entries].reverse().map(entry => (
            <div key={entry.id} className="flex items-center gap-3 group px-1">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                <Droplets size={12} className="text-cyan-400" />
              </div>
              <p className="text-sm text-zinc-300 flex-1">{entry.amount} ml</p>
              <p className="text-xs text-zinc-600">{entry.time}</p>
              <button onClick={() => removeWater(entry.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {profile && (
        <div className="card bg-zinc-800/40">
          <p className="text-xs font-medium text-zinc-400 mb-2">Como sua meta foi calculada</p>
          <p className="text-sm text-zinc-400">
            Base: {profile.weight} kg × 35 ml = <span className="text-white">{profile.weight * 35} ml</span>
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            Ajuste para <span className="text-white">{GOALS[profile.goal]?.label ?? profile.goal}</span>: +{profile.goal === 'weight_loss' ? 200 : profile.goal === 'muscle_gain' ? 300 : 0} ml
          </p>
        </div>
      )}
    </div>
  )
}
