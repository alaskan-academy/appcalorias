import { useState } from 'react'
import { Plus, Utensils, Droplets, X, Search, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { searchFoods } from '../../utils/usdaApi'
import { scaleMacros } from '../../utils/calculations'
import { DEFAULT_MEALS } from '../../utils/constants'

const QUICK_WATER = [150, 200, 250, 300, 500]

function QuickWater({ onClose }) {
  const { addWater } = useApp()
  const [custom, setCustom] = useState('')

  function handle(amount) {
    addWater(amount)
    onClose()
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-300">Quantidade de água</p>
      <div className="grid grid-cols-5 gap-1.5">
        {QUICK_WATER.map(a => (
          <button key={a} onClick={() => handle(a)}
            className="flex flex-col items-center py-2.5 rounded-xl bg-zinc-800 hover:bg-cyan-600/20 hover:border-cyan-500/40 border border-transparent transition-all">
            <Droplets size={13} className="text-cyan-400 mb-0.5" />
            <span className="text-xs font-medium text-white">{a}</span>
            <span className="text-xs text-zinc-600">ml</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1 text-sm py-2"
          type="number" value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="Outro valor (ml)"
          onKeyDown={e => e.key === 'Enter' && custom && handle(Number(custom))}
          autoFocus
        />
        <button
          onClick={() => custom && handle(Number(custom))}
          disabled={!custom}
          className="btn-primary px-3 disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

function QuickMeal({ onClose }) {
  const { addFoodToMeal, addRecipeToMeal, profile, customFoods, recipes, dayLog } = useApp()
  const meals = profile?.meals ?? DEFAULT_MEALS
  const [mealId, setMealId] = useState(meals[0]?.id ?? 'breakfast')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [quantity, setQuantity] = useState('100')
  const [tab, setTab] = useState('search')

  async function handleSearch(e) {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const foods = await searchFoods(query)
      setResults(foods)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleAdd() {
    if (!selected) return
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) return
    const scaled = scaleMacros(selected.per100g, qty)
    addFoodToMeal(mealId, {
      ...scaled,
      name: selected.name,
      quantity: qty,
      unit: 'g',
      source: selected.source || 'usda',
      id: Date.now().toString(),
    })
    onClose()
  }

  const displayItems = tab === 'search' ? results : tab === 'custom' ? customFoods : recipes

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-300">Adicionar à refeição</p>

      {/* Meal selector */}
      <select className="input text-sm py-2" value={mealId} onChange={e => setMealId(e.target.value)}>
        {meals.map(m => (
          <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
        ))}
      </select>

      {/* Source tabs */}
      <div className="flex gap-1.5">
        {[['search','Buscar'],['custom','Meus'],['recipes','Receitas']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${tab === t ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <form onSubmit={handleSearch} className="flex gap-1.5">
          <input className="input flex-1 text-sm py-2" value={query}
            onChange={e => setQuery(e.target.value)} placeholder="Buscar alimento..." autoFocus />
          <button type="submit" className="btn-primary px-3 py-2">
            <Search size={13} />
          </button>
        </form>
      )}

      {loading && <p className="text-zinc-500 text-xs text-center">Buscando...</p>}

      {/* Results */}
      {tab === 'recipes' ? (
        <div className="max-h-36 overflow-y-auto space-y-0.5">
          {recipes.length === 0
            ? <p className="text-zinc-600 text-xs text-center py-3">Nenhuma receita</p>
            : recipes.map(r => (
              <button key={r.id} onClick={() => setSelected(r)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${selected?.id === r.id ? 'bg-violet-600/20' : 'hover:bg-zinc-800'}`}>
                <span className="text-zinc-200">{r.name}</span>
                <span className="text-zinc-500 ml-2">{r.totalMacros.calories} kcal · {r.totalWeight}g</span>
              </button>
            ))
          }
        </div>
      ) : (
        <div className="max-h-36 overflow-y-auto space-y-0.5">
          {displayItems.length === 0
            ? <p className="text-zinc-600 text-xs text-center py-3">Nenhum resultado</p>
            : displayItems.map(food => (
              <button key={food.id} onClick={() => setSelected(food)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${selected?.id === food.id ? 'bg-violet-600/20' : 'hover:bg-zinc-800'}`}>
                <span className="text-zinc-200">{food.name}</span>
                <span className="text-zinc-500 ml-2">{food.per100g.calories} kcal/100g</span>
              </button>
            ))
          }
        </div>
      )}

      {selected && (
        <div className="flex gap-2 items-end border-t border-zinc-800 pt-3">
          <div className="flex-1">
            <label className="label text-xs">
              {tab === 'recipes' ? 'Porção (g)' : 'Quantidade (g)'}
            </label>
            <input className="input text-sm py-2" type="number" value={quantity}
              onChange={e => setQuantity(e.target.value)} min="1" />
          </div>
          <button onClick={handleAdd} className="btn-primary py-2">Adicionar</button>
        </div>
      )}
    </div>
  )
}

export default function FAB() {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState(null) // 'meal' | 'water'

  function openPanel(p) { setPanel(p) }
  function closeAll() { setOpen(false); setPanel(null) }

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex flex-col items-end gap-3">
      {/* Panel popup */}
      {panel && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 w-[calc(100vw-2rem)] max-w-sm md:w-80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {panel === 'meal'
                ? <Utensils size={14} className="text-violet-400" />
                : <Droplets size={14} className="text-cyan-400" />}
              <span className="text-sm font-semibold text-white">
                {panel === 'meal' ? 'Nova entrada de refeição' : 'Registrar água'}
              </span>
            </div>
            <button onClick={closeAll} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
          {panel === 'meal' ? <QuickMeal onClose={closeAll} /> : <QuickWater onClose={closeAll} />}
        </div>
      )}

      {/* Action buttons */}
      {open && !panel && (
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => openPanel('meal')}
            className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 hover:border-violet-500/50 hover:bg-violet-600/10 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg transition-all"
          >
            <Utensils size={15} className="text-violet-400" />
            Nova refeição
          </button>
          <button
            onClick={() => openPanel('water')}
            className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-600/10 text-white rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg transition-all"
          >
            <Droplets size={15} className="text-cyan-400" />
            Registrar água
          </button>
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => { setOpen(o => !o); setPanel(null) }}
        className={`w-13 h-13 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200 ${open ? 'bg-zinc-700 rotate-45' : 'bg-violet-600 hover:bg-violet-500'}`}
        style={{ width: 52, height: 52 }}
      >
        <Plus size={22} className="text-white" />
      </button>
    </div>
  )
}
