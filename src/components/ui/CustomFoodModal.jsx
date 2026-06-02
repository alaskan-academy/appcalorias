import { useState, useEffect } from 'react'
import Modal from './Modal'

// Preset units with default gram equivalents
const PRESET_UNITS = [
  { label: 'gramas (g)',             value: 'g',               defaultGrams: null },
  { label: 'mililitros (mL)',        value: 'mL',              defaultGrams: null },
  { label: 'unidade',                value: 'unidade',         defaultGrams: '' },
  { label: 'fatia',                  value: 'fatia',           defaultGrams: '' },
  { label: 'porção',                 value: 'porção',          defaultGrams: '' },
  { label: 'colher de sopa (~15g)',  value: 'colher de sopa',  defaultGrams: '15' },
  { label: 'colher de chá (~5g)',    value: 'colher de chá',   defaultGrams: '5' },
  { label: 'xícara (~240mL)',        value: 'xícara',          defaultGrams: '240' },
  { label: 'copo (~250mL)',          value: 'copo',            defaultGrams: '250' },
  { label: 'personalizado…',         value: '__custom__',      defaultGrams: '' },
]

const UNIT_WITHOUT_GRAMS = ['g', 'mL']

export default function CustomFoodModal({ open, onClose, existing, onSave }) {
  const [name, setName]         = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein]   = useState('')
  const [carbs, setCarbs]       = useState('')
  const [fat, setFat]           = useState('')
  const [fiber, setFiber]       = useState('')

  // Serving
  const [hasServing, setHasServing]     = useState(false)
  const [unitSelect, setUnitSelect]     = useState('unidade')
  const [customUnit, setCustomUnit]     = useState('')
  const [servingGrams, setServingGrams] = useState('')

  // Pre-fill on edit
  useEffect(() => {
    if (existing) {
      setName(existing.name ?? '')
      setCalories(String(existing.per100g?.calories ?? ''))
      setProtein(String(existing.per100g?.protein ?? ''))
      setCarbs(String(existing.per100g?.carbs ?? ''))
      setFat(String(existing.per100g?.fat ?? ''))
      setFiber(String(existing.per100g?.fiber ?? ''))
      if (existing.serving) {
        setHasServing(true)
        const preset = PRESET_UNITS.find(p => p.value === existing.serving.unit)
        if (preset) {
          setUnitSelect(preset.value)
        } else {
          setUnitSelect('__custom__')
          setCustomUnit(existing.serving.unit)
        }
        setServingGrams(String(existing.serving.grams ?? ''))
      } else {
        setHasServing(false)
        setUnitSelect('unidade')
        setServingGrams('')
        setCustomUnit('')
      }
    } else {
      // Reset
      setName(''); setCalories(''); setProtein(''); setCarbs('')
      setFat(''); setFiber(''); setHasServing(false)
      setUnitSelect('unidade'); setServingGrams(''); setCustomUnit('')
    }
  }, [existing, open])

  function handleUnitChange(val) {
    setUnitSelect(val)
    const preset = PRESET_UNITS.find(p => p.value === val)
    if (preset?.defaultGrams !== null) setServingGrams(preset.defaultGrams ?? '')
  }

  const finalUnit = unitSelect === '__custom__' ? customUnit.trim() : unitSelect
  const needsGrams = hasServing && !UNIT_WITHOUT_GRAMS.includes(finalUnit)

  function handleSave() {
    if (!name.trim() || !calories) return

    const food = {
      id: existing?.id ?? Date.now().toString(),
      name: name.trim(),
      source: 'custom',
      per100g: {
        calories: parseFloat(calories) || 0,
        protein:  parseFloat(protein)  || 0,
        carbs:    parseFloat(carbs)    || 0,
        fat:      parseFloat(fat)      || 0,
        fiber:    parseFloat(fiber)    || 0,
      },
    }

    if (hasServing && finalUnit) {
      const grams = needsGrams ? parseFloat(servingGrams) || 100 : null
      food.serving = {
        unit:  finalUnit,
        grams: UNIT_WITHOUT_GRAMS.includes(finalUnit) ? 1 : grams,
      }
    }

    onSave(food)
    onClose()
  }

  const isValid = name.trim() && calories

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Editar alimento' : 'Novo alimento'} size="md">
      <div className="space-y-4">

        <div>
          <label className="label">Nome do alimento</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)}
            placeholder="Ex: Banana prata, Whey protein…" autoFocus />
        </div>

        <div>
          <p className="label mb-2">Macros por 100g / 100mL</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label text-[11px]">Calorias (kcal) *</label>
              <input className="input" type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="0" min="0" />
            </div>
            <div>
              <label className="label text-[11px]">Proteína (g)</label>
              <input className="input" type="number" value={protein} onChange={e => setProtein(e.target.value)} placeholder="0" min="0" step="0.1" />
            </div>
            <div>
              <label className="label text-[11px]">Carboidratos (g)</label>
              <input className="input" type="number" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="0" min="0" step="0.1" />
            </div>
            <div>
              <label className="label text-[11px]">Gorduras (g)</label>
              <input className="input" type="number" value={fat} onChange={e => setFat(e.target.value)} placeholder="0" min="0" step="0.1" />
            </div>
            <div className="col-span-2">
              <label className="label text-[11px]">Fibras (g) — opcional</label>
              <input className="input" type="number" value={fiber} onChange={e => setFiber(e.target.value)} placeholder="0" min="0" step="0.1" />
            </div>
          </div>
        </div>

        {/* Serving unit */}
        <div className="border border-zinc-800 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Medida padrão</p>
              <p className="text-xs text-zinc-500">Permite adicionar por unidade, fatia, etc.</p>
            </div>
            <button
              type="button"
              onClick={() => setHasServing(s => !s)}
              className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${hasServing ? 'bg-violet-600' : 'bg-zinc-700'}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${hasServing ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          {hasServing && (
            <div className="space-y-2">
              <div>
                <label className="label">Unidade de medida</label>
                <select className="input" value={unitSelect} onChange={e => handleUnitChange(e.target.value)}>
                  {PRESET_UNITS.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>

              {unitSelect === '__custom__' && (
                <div>
                  <label className="label">Nome da unidade</label>
                  <input className="input" value={customUnit} onChange={e => setCustomUnit(e.target.value)}
                    placeholder="Ex: pote, sachê, barra…" />
                </div>
              )}

              {needsGrams && (
                <div>
                  <label className="label">
                    1 {finalUnit || 'unidade'} equivale a quantos gramas?
                  </label>
                  <div className="flex items-center gap-2">
                    <input className="input flex-1" type="number" value={servingGrams}
                      onChange={e => setServingGrams(e.target.value)}
                      placeholder="Ex: 120" min="0.1" step="0.1" />
                    <span className="text-sm text-zinc-400 flex-shrink-0">g</span>
                  </div>
                  {servingGrams && calories && (
                    <p className="text-xs text-zinc-500 mt-1">
                      → 1 {finalUnit} = ~{Math.round((parseFloat(calories) / 100) * parseFloat(servingGrams))} kcal
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!isValid}
          className="btn-primary w-full py-2.5 disabled:opacity-40"
        >
          {existing ? 'Salvar alterações' : 'Criar alimento'}
        </button>
      </div>
    </Modal>
  )
}
