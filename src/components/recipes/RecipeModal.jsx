import { useState } from 'react'
import { Trash2, Search } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { searchFoods } from '../../utils/usdaApi'
import { scaleMacros } from '../../utils/calculations'
import Modal from '../ui/Modal'

export function IngredientSearch({ onAdd }) {
  const { customFoods } = useApp()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [quantity, setQuantity] = useState('100')
  const [tab, setTab] = useState('search')

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      setResults(await searchFoods(query))
    } finally {
      setLoading(false)
    }
  }

  function handleAdd() {
    if (!selected) return
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) return
    const scaled = scaleMacros(selected.per100g, qty)
    onAdd({ foodId: selected.id, name: selected.name, quantity: qty, ...scaled })
    setSelected(null)
    setQuantity('100')
    setResults([])
    setQuery('')
  }

  const items = tab === 'search' ? results : customFoods

  return (
    <div className="space-y-3 border border-zinc-800 rounded-xl p-3">
      <div className="flex gap-2">
        {[['search', 'Buscar USDA'], ['custom', 'Meus alimentos']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${tab === t ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'search' && (
        <form onSubmit={handleSearch} className="flex gap-2">
          <input className="input flex-1" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar ingrediente..." autoFocus />
          <button type="submit" className="btn-primary px-3"><Search size={14} /></button>
        </form>
      )}
      {loading && <p className="text-zinc-500 text-xs">Buscando...</p>}
      {items.length > 0 && (
        <div className="max-h-36 overflow-y-auto space-y-0.5">
          {items.map(food => (
            <button key={food.id} onClick={() => setSelected(food)}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-sm transition-colors ${selected?.id === food.id ? 'bg-violet-600/20' : 'hover:bg-zinc-800'}`}>
              <span className="text-zinc-200">{food.name}</span>
              <span className="text-zinc-500 text-xs ml-2">{food.per100g.calories} kcal/100g</span>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="flex gap-2 items-end pt-1">
          <div className="flex-1">
            <label className="label">Quantidade (g)</label>
            <input className="input" type="number" value={quantity}
              onChange={e => setQuantity(e.target.value)} min="1" />
          </div>
          <button onClick={handleAdd} className="btn-primary text-xs">+ Ingrediente</button>
        </div>
      )}
    </div>
  )
}

export function RecipeModal({ open, onClose, existing }) {
  const { addRecipe } = useApp()
  const [name, setName]             = useState(existing?.name ?? '')
  const [totalWeight, setTotalWeight] = useState(existing?.totalWeight ? String(existing.totalWeight) : '')
  const [portions, setPortions]     = useState(existing?.serving?.portions ? String(existing.serving.portions) : '')
  const [ingredients, setIngredients] = useState(existing?.ingredients ?? [])
  const [showSearch, setShowSearch] = useState(false)

  const totalMacros = ingredients.reduce((acc, ing) => ({
    calories: acc.calories + (ing.calories ?? 0),
    protein:  acc.protein  + (ing.protein  ?? 0),
    carbs:    acc.carbs    + (ing.carbs    ?? 0),
    fat:      acc.fat      + (ing.fat      ?? 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const sumWeight = ingredients.reduce((s, i) => s + (i.quantity ?? 0), 0)

  const finalWeight = parseFloat(totalWeight) || sumWeight
  const numPortions = parseFloat(portions)
  const gramsPerPortion = numPortions > 0 ? Math.round(finalWeight / numPortions) : null

  function handleSave() {
    if (!name.trim() || ingredients.length === 0) return
    addRecipe({
      id: existing?.id ?? Date.now().toString(),
      name: name.trim(),
      totalWeight: finalWeight,
      ingredients,
      totalMacros: {
        calories: Math.round(totalMacros.calories * 10) / 10,
        protein:  Math.round(totalMacros.protein  * 10) / 10,
        carbs:    Math.round(totalMacros.carbs    * 10) / 10,
        fat:      Math.round(totalMacros.fat      * 10) / 10,
      },
      serving: numPortions > 0 ? { portions: numPortions } : undefined,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Editar refeição' : 'Nova refeição personalizada'} size="lg">
      <div className="space-y-4">
        <div>
          <label className="label">Nome</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)}
            placeholder="Ex: Frango com legumes" autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Rendimento total (g)</label>
            <input className="input" type="number" value={totalWeight}
              onChange={e => setTotalWeight(e.target.value)}
              placeholder={`${sumWeight || 0} g`} />
          </div>
          <div>
            <label className="label">Número de porções</label>
            <input className="input" type="number" value={portions}
              onChange={e => setPortions(e.target.value)}
              placeholder="Ex: 4" min="1" step="1" />
            {gramsPerPortion && (
              <p className="text-xs text-zinc-500 mt-0.5">1 porção ≈ {gramsPerPortion}g</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Ingredientes</label>
            <button onClick={() => setShowSearch(s => !s)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              {showSearch ? 'Fechar' : '+ Adicionar ingrediente'}
            </button>
          </div>
          {showSearch && <IngredientSearch onAdd={ing => setIngredients(prev => [...prev, ing])} />}
          {ingredients.length > 0 && (
            <div className="space-y-1 mt-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-zinc-800/40 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{ing.name}</p>
                    <p className="text-xs text-zinc-500">
                      {ing.quantity}g · {Math.round(ing.calories)} kcal ·
                      P {Math.round(ing.protein)}g · C {Math.round(ing.carbs)}g · G {Math.round(ing.fat)}g
                    </p>
                  </div>
                  <button onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Macros preview */}
        {ingredients.length > 0 && (
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-zinc-400">Total da refeição</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ['Calorias', totalMacros.calories, 'kcal', 'text-violet-400'],
                ['Proteína', totalMacros.protein,  'g',    'text-blue-400'],
                ['Carbs',    totalMacros.carbs,    'g',    'text-amber-400'],
                ['Gordura',  totalMacros.fat,      'g',    'text-rose-400'],
              ].map(([l, v, u, c]) => (
                <div key={l} className="bg-zinc-900 rounded-lg p-2">
                  <p className="text-xs text-zinc-500 mb-0.5">{l}</p>
                  <p className={`text-sm font-bold ${c}`}>
                    {Math.round(v)}<span className="text-xs font-normal text-zinc-600 ml-0.5">{u}</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-600 text-center">
              Peso total dos ingredientes: {sumWeight}g
              {totalWeight && parseFloat(totalWeight) !== sumWeight
                ? ` · Rendimento configurado: ${totalWeight}g`
                : ''}
            </p>
          </div>
        )}

        <button onClick={handleSave} disabled={!name.trim() || ingredients.length === 0}
          className="btn-primary w-full py-2.5 disabled:opacity-40 disabled:cursor-not-allowed">
          Salvar refeição
        </button>
      </div>
    </Modal>
  )
}
