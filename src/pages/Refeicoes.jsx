import { useState } from 'react'
import { Plus, Trash2, Search, ChevronDown, ChevronUp, Copy, AlertTriangle, Pencil } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { useApp } from '../context/AppContext'
import { searchFoods, searchOpenFoodFacts } from '../utils/usdaApi'
import { scaleMacros, formatCalories } from '../utils/calculations'
import { DEFAULT_MEALS } from '../utils/constants'
import { getDayLog, getRecentFoods, saveRecentFood } from '../utils/storage'
import Modal from '../components/ui/Modal'
import ProgressBar from '../components/ui/ProgressBar'
import CustomFoodModal from '../components/ui/CustomFoodModal'

function FoodSearchModal({ open, onClose, onSelect }) {
  const { customFoods, recipes, addCustomFood, removeCustomFood } = useApp()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('recent') // recent | search | off | custom | recipes
  const [editingFood, setEditingFood] = useState(null)  // food being edited or true for new
  const [customModalOpen, setCustomModalOpen] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const foods = tab === 'off' ? await searchOpenFoodFacts(query) : await searchFoods(query)
      setResults(foods)
    } catch (err) {
      setError('Erro ao buscar. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setQuery(''); setResults([]); setError(null); onClose()
  }

  function handleSaveCustomFood(food) {
    addCustomFood(food)
    setCustomModalOpen(false)
    setEditingFood(null)
  }

  function handleDeleteCustomFood(id) {
    removeCustomFood(id)
  }

  const recentFoods = getRecentFoods()
  const displayedResults =
    tab === 'search' || tab === 'off' ? results :
    tab === 'recent'  ? recentFoods :
    []

  const TABS = [
    ['recent', 'Recentes'],
    ['search', 'USDA'],
    ['off',    'Open Foods'],
    ['custom', 'Meus alimentos'],
    ['recipes','Receitas'],
  ]

  return (
    <>
      <Modal open={open} onClose={handleClose} title="Adicionar alimento" size="lg">
        <div className="space-y-4">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {TABS.map(([t, l]) => (
              <button key={t} onClick={() => { setTab(t); setResults([]) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${tab === t ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>

          {(tab === 'search' || tab === 'off') && (
            <form onSubmit={handleSearch} className="flex gap-2">
              <input className="input flex-1" value={query} onChange={e => setQuery(e.target.value)}
                placeholder={tab === 'off' ? 'Ex: leite integral, feijão carioca...' : 'Ex: frango grelhado, arroz cozido...'}
                autoFocus />
              <button type="submit" className="btn-primary flex items-center gap-1.5">
                <Search size={14} /> Buscar
              </button>
            </form>
          )}

          {/* Meus alimentos: list + create/edit */}
          {tab === 'custom' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs text-zinc-500">{customFoods.length} alimentos cadastrados</p>
                <button onClick={() => { setEditingFood(null); setCustomModalOpen(true) }}
                  className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
                  <Plus size={12} /> Novo alimento
                </button>
              </div>
              {customFoods.length === 0
                ? <p className="text-zinc-500 text-sm text-center py-6">Nenhum alimento cadastrado ainda</p>
                : <div className="max-h-64 overflow-y-auto space-y-1">
                    {customFoods.map(food => (
                      <div key={food.id} className="flex items-center gap-1 group">
                        <button className="flex-1 text-left px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
                          onClick={() => {/* handled by FoodResults below */}}>
                          <p className="text-sm font-medium text-white truncate">{food.name}</p>
                          <p className="text-xs text-zinc-500">
                            {food.per100g.calories} kcal/100g
                            {food.serving && !['g','mL'].includes(food.serving.unit)
                              ? ` · 1 ${food.serving.unit} = ${food.serving.grams}g` : ''}
                          </p>
                        </button>
                        <button onClick={() => { setEditingFood(food); setCustomModalOpen(true) }}
                          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDeleteCustomFood(food.id)}
                          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
              }
              {/* FoodResults handles selection + quantity for custom tab */}
              <FoodResults items={customFoods} onSelect={onSelect} onClose={handleClose} />
            </div>
          )}

          {tab === 'recent' && recentFoods.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-6">Nenhum alimento recente ainda</p>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {loading && <p className="text-zinc-400 text-sm text-center py-4">Buscando...</p>}

          {tab === 'recipes' && <RecipeResults onSelect={onSelect} onClose={handleClose} />}
          {tab !== 'recipes' && tab !== 'custom' && (
            <FoodResults items={displayedResults} onSelect={onSelect} onClose={handleClose} />
          )}
        </div>
      </Modal>

      <CustomFoodModal
        open={customModalOpen}
        onClose={() => { setCustomModalOpen(false); setEditingFood(null) }}
        existing={editingFood}
        onSave={handleSaveCustomFood}
      />
    </>
  )
}

function FoodResults({ items, onSelect, onClose }) {
  const [selected, setSelected] = useState(null)
  const [quantity, setQuantity] = useState('100')
  const [byServing, setByServing] = useState(false)

  const serving = selected?.serving
  const canServing = serving && !['g', 'mL'].includes(serving.unit)

  // Reset serving toggle when selecting a new food
  function handleSelect(food) {
    setSelected(food)
    setByServing(false)
    setQuantity(food.serving && !['g','mL'].includes(food.serving?.unit) ? '1' : '100')
  }

  function handleAdd() {
    if (!selected) return
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) return

    let grams = qty
    let unit = 'g'

    if (byServing && serving) {
      grams = qty * serving.grams
      unit  = serving.unit
    }

    const scaled = scaleMacros(selected.per100g, grams)
    saveRecentFood(selected)
    onSelect({ ...scaled, name: selected.name, quantity: qty, unit, source: selected.source || 'usda', id: Date.now().toString() })
    onClose()
  }

  if (items.length === 0) return <p className="text-zinc-500 text-sm text-center py-6">Nenhum resultado</p>

  return (
    <div className="space-y-2">
      <div className="max-h-64 overflow-y-auto space-y-1">
        {items.map(food => (
          <button key={food.id} onClick={() => handleSelect(food)}
            className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${selected?.id === food.id ? 'bg-violet-600/20 border border-violet-500/30' : 'hover:bg-zinc-800'}`}>
            <p className="text-sm font-medium text-white truncate">{food.name}</p>
            <p className="text-xs text-zinc-500">
              {food.per100g.calories} kcal · P {food.per100g.protein}g · C {food.per100g.carbs}g · G {food.per100g.fat}g /100g
              {food.serving && !['g','mL'].includes(food.serving.unit)
                ? ` · 1 ${food.serving.unit} = ${food.serving.grams}g`
                : ''}
            </p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="border-t border-zinc-800 pt-3 space-y-2">
          {/* Toggle por porção / por peso */}
          {canServing && (
            <div className="flex gap-1.5">
              <button onClick={() => { setByServing(false); setQuantity('100') }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${!byServing ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                Por peso (g)
              </button>
              <button onClick={() => { setByServing(true); setQuantity('1') }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${byServing ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                Por {serving.unit}
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="label">
                {byServing ? `Quantidade (${serving.unit})` : 'Quantidade (g)'}
              </label>
              <input className="input" type="number" value={quantity}
                onChange={e => setQuantity(e.target.value)} min="0.1" step={byServing ? '0.5' : '1'} />
              {byServing && quantity && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  = {Math.round(parseFloat(quantity) * serving.grams)}g ·{' '}
                  ~{Math.round((selected.per100g.calories / 100) * parseFloat(quantity) * serving.grams)} kcal
                </p>
              )}
            </div>
            <button onClick={handleAdd} className="btn-primary">Adicionar</button>
          </div>
        </div>
      )}
    </div>
  )
}

function RecipeResults({ onSelect, onClose }) {
  const { recipes } = useApp()
  const [selected, setSelected] = useState(null)
  const [qty, setQty]           = useState('1')
  const [byPortion, setByPortion] = useState(true)

  const hasPortions = selected?.serving?.portions > 0
  const gramsPerPortion = hasPortions
    ? selected.totalWeight / selected.serving.portions
    : null

  function handleSelect(r) {
    setSelected(r)
    setByPortion(!!r.serving?.portions)
    setQty(r.serving?.portions ? '1' : '100')
  }

  function handleAdd() {
    if (!selected) return
    const q = parseFloat(qty)
    if (!q || q <= 0) return
    const portionGrams = byPortion && gramsPerPortion
      ? q * gramsPerPortion
      : q
    onSelect({ _recipe: selected, portionGrams })
    onClose()
  }

  if (recipes.length === 0) return <p className="text-zinc-500 text-sm text-center py-6">Nenhuma receita cadastrada</p>

  return (
    <div className="space-y-2">
      <div className="max-h-64 overflow-y-auto space-y-1">
        {recipes.map(r => (
          <button key={r.id} onClick={() => handleSelect(r)}
            className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${selected?.id === r.id ? 'bg-violet-600/20 border border-violet-500/30' : 'hover:bg-zinc-800'}`}>
            <p className="text-sm font-medium text-white">{r.name}</p>
            <p className="text-xs text-zinc-500">
              {r.totalMacros.calories} kcal total · {r.totalWeight}g
              {r.serving?.portions ? ` · ${r.serving.portions} porções` : ''}
            </p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="border-t border-zinc-800 pt-3 space-y-2">
          {hasPortions && (
            <div className="flex gap-1.5">
              <button onClick={() => { setByPortion(true); setQty('1') }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${byPortion ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                Por porção
              </button>
              <button onClick={() => { setByPortion(false); setQty('100') }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${!byPortion ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                Por peso (g)
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="label">
                {byPortion && hasPortions ? 'Número de porções' : 'Porção consumida (g)'}
              </label>
              <input className="input" type="number" value={qty}
                onChange={e => setQty(e.target.value)} min="0.5" step="0.5" />
              {byPortion && hasPortions && qty && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  = ~{Math.round(parseFloat(qty) * gramsPerPortion)}g ·{' '}
                  ~{Math.round((selected.totalMacros.calories / selected.serving.portions) * parseFloat(qty))} kcal
                </p>
              )}
            </div>
            <button onClick={handleAdd} className="btn-primary">Adicionar</button>
          </div>
        </div>
      )}
    </div>
  )
}

function MealCard({ meal }) {
  const { dayLog, addFoodToMeal, removeFoodFromMeal, addRecipeToMeal } = useApp()
  const [open, setOpen] = useState(false)
  const entries = dayLog.meals[meal.id] ?? []
  const [expanded, setExpanded] = useState(entries.length > 0)
  const totalCal = entries.reduce((s, e) => s + e.calories, 0)
  const pct = meal.calorieGoal > 0 ? Math.min((totalCal / meal.calorieGoal) * 100, 100) : 0

  function handleSelect(item) {
    if (item._recipe) {
      addRecipeToMeal(meal.id, item._recipe, item.portionGrams)
    } else {
      addFoodToMeal(meal.id, item)
    }
    setExpanded(true)
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <span className="text-xl">{meal.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-white text-sm">{meal.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">{Math.round(totalCal)} / {meal.calorieGoal} kcal</span>
              {expanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
            </div>
          </div>
          <ProgressBar value={totalCal} max={meal.calorieGoal} color="bg-violet-500" className="mt-1.5" />
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-1">
          {entries.map(entry => (
            <div key={entry.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/50 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{entry.name}</p>
                <p className="text-xs text-zinc-500">
                  {entry.quantity}{entry.unit} · {Math.round(entry.calories)} kcal · P {Math.round(entry.protein)}g · C {Math.round(entry.carbs)}g · G {Math.round(entry.fat)}g
                </p>
              </div>
              <button onClick={() => removeFoodFromMeal(meal.id, entry.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button onClick={() => setOpen(true)}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-zinc-500 hover:text-violet-400 hover:bg-violet-600/10 transition-colors text-sm">
            <Plus size={14} /> Adicionar alimento
          </button>
        </div>
      )}

      <FoodSearchModal open={open} onClose={() => setOpen(false)} onSelect={handleSelect} />
    </div>
  )
}

export default function Refeicoes() {
  const { profile, totalCaloriesConsumed, totalCaloriesBurned, addFoodToMeal } = useApp()
  const meals = profile?.meals ?? DEFAULT_MEALS
  const goalCal = profile?.dailyCalorieGoal ?? 2000
  const net = totalCaloriesConsumed - totalCaloriesBurned
  const remaining = goalCal - net
  const pct = Math.min(100, Math.round((net / goalCal) * 100))
  const over = remaining < 0
  const [copyDone, setCopyDone] = useState(false)

  function handleCopyYesterday() {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    const prevLog = getDayLog(yesterday)
    const allEntries = Object.values(prevLog.meals ?? {}).flat()
    if (allEntries.length === 0) return
    Object.entries(prevLog.meals ?? {}).forEach(([mealId, entries]) => {
      entries.forEach(entry => {
        addFoodToMeal(mealId, { ...entry, id: `copy_${Date.now()}_${Math.random().toString(36).slice(2)}` })
      })
    })
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 3000)
  }

  const showUnderEatingAlert = totalCaloriesConsumed > 0 && totalCaloriesConsumed < goalCal * 0.6

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Refeições</h1>
        <button
          onClick={handleCopyYesterday}
          title="Copiar refeições de ontem"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${copyDone ? 'bg-emerald-600/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
        >
          <Copy size={12} /> {copyDone ? 'Copiado!' : 'Copiar ontem'}
        </button>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Consumido hoje</p>
            <p className="text-lg font-bold text-white">
              {formatCalories(net)} <span className="text-sm font-normal text-zinc-500">/ {formatCalories(goalCal)} kcal</span>
            </p>
          </div>
          <div className={`text-right text-sm font-medium ${over ? 'text-red-400' : 'text-violet-300'}`}>
            {over
              ? `+${formatCalories(Math.abs(remaining))} acima`
              : `${formatCalories(remaining)} restantes`}
          </div>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${over ? 'bg-red-500' : 'bg-violet-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {showUnderEatingAlert && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 text-sm font-medium">Alimentação muito baixa</p>
            <p className="text-zinc-400 text-xs mt-0.5">
              Você consumiu apenas {Math.round((totalCaloriesConsumed / goalCal) * 100)}% da sua meta.
              Subnutrição pode dificultar resultados e causar perda de massa muscular.
            </p>
          </div>
        </div>
      )}

      {meals.map(meal => (
        <MealCard key={meal.id} meal={meal} />
      ))}
    </div>
  )
}
