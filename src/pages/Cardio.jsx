import { useApp } from '../context/AppContext'
import { calculateHeartRateZones } from '../utils/calculations'
import { Heart, Zap } from 'lucide-react'

const ZONE_ICONS = ['🚶', '🔥', '🏃', '⚡', '💥']
const ZONE_BENEFITS_DETAIL = [
  'Ideal para aquecimento e desaquecimento. Melhora a circulação e prepara o corpo para exercícios mais intensos.',
  'Zona ideal para queima de gordura como combustível principal. Recomendada para sessões longas de cardio.',
  'Melhora resistência cardiovascular e capacidade aeróbica. Ótima para condicionamento geral.',
  'Aumenta velocidade, potência e performance. O corpo começa a usar mais carboidratos como energia.',
  'Esforço máximo. Usado em sprints e HIIT. Não sustentável por longos períodos.',
]

export default function Cardio() {
  const { profile } = useApp()

  if (!profile) {
    return (
      <div className="card flex flex-col items-center py-16 text-center">
        <Zap size={32} className="text-zinc-700 mb-3" />
        <p className="text-zinc-400 font-medium">Configure seu perfil primeiro</p>
        <p className="text-zinc-600 text-sm mt-1">Acesse Configurações e informe sua idade</p>
      </div>
    )
  }

  const { maxHR, zones } = calculateHeartRateZones(profile.age)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Zonas Cardíacas</h1>
        <p className="text-sm text-zinc-500">Com base na sua idade ({profile.age} anos)</p>
      </div>

      <div className="card flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
          <Heart size={20} className="text-red-400" />
        </div>
        <div>
          <p className="text-xs text-zinc-500">Frequência cardíaca máxima estimada</p>
          <p className="text-2xl font-bold text-white">{maxHR} <span className="text-sm font-normal text-zinc-400">bpm</span></p>
          <p className="text-xs text-zinc-500">Fórmula: 220 – {profile.age} anos</p>
        </div>
      </div>

      {/* Best zone highlight */}
      <div className="card border-emerald-500/30 bg-emerald-500/5">
        <p className="text-xs font-medium text-emerald-400 mb-2">🎯 Zona recomendada para emagrecimento</p>
        <p className="text-2xl font-bold text-white">{zones[1].range[0]} – {zones[1].range[1]} <span className="text-sm font-normal text-zinc-400">bpm</span></p>
        <p className="text-sm text-zinc-400 mt-1">{zones[1].benefit}</p>
        <p className="text-xs text-zinc-500 mt-2">{ZONE_BENEFITS_DETAIL[1]}</p>
      </div>

      {/* All zones */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-400 px-1">Todas as zonas</p>
        {zones.map((zone, i) => (
          <div key={zone.name} className="card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: zone.color + '22' }}>
                {ZONE_ICONS[i]}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white text-sm">Zona {i + 1}: {zone.name}</p>
                  <p className="font-bold text-base" style={{ color: zone.color }}>
                    {zone.range[0]}–{zone.range[1]} bpm
                  </p>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{zone.benefit}</p>
                <p className="text-xs text-zinc-600 mt-1">{ZONE_BENEFITS_DETAIL[i]}</p>
              </div>
            </div>
            {/* Zone bar */}
            <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{
                marginLeft: `${(zone.range[0] / maxHR) * 100}%`,
                width: `${((zone.range[1] - zone.range[0]) / maxHR) * 100}%`,
                backgroundColor: zone.color,
              }} />
            </div>
            <div className="flex justify-between mt-1 text-xs text-zinc-600">
              <span>0</span>
              <span>{maxHR} bpm</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-zinc-800/40">
        <p className="text-xs font-medium text-zinc-400 mb-1">Como usar</p>
        <p className="text-sm text-zinc-500">
          Monitore sua frequência cardíaca durante o exercício com um relógio ou monitor cardíaco. Para emagrecer, mantenha-se na zona 2 ({zones[1].range[0]}–{zones[1].range[1]} bpm) por pelo menos 30 minutos.
        </p>
      </div>
    </div>
  )
}
