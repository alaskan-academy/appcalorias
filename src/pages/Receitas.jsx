import { useState } from 'react'
import { Plus, Trash2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { RecipeModal } from '../components/recipes/RecipeModal'

export default function Receitas() {
  const { recipes, removeRecipe } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Receitas</h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Nova receita
        </button>
      </div>

      {recipes.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <BookOpen size={32} className="text-zinc-700 mb-3" />
          <p className="text-zinc-400 font-medium">Nenhuma receita ainda</p>
          <p className="text-zinc-600 text-sm mt-1">Crie receitas e adicione-as às suas refeições</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recipes.map(recipe => (
            <div key={recipe.id} className="card">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(e => e === recipe.id ? null : recipe.id)}>
                <div className="w-9 h-9 rounded-xl bg-violet-600/15 flex items-center justify-center">
                  <BookOpen size={15} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{recipe.name}</p>
                  <p className="text-xs text-zinc-500">
                    {Math.round(recipe.totalMacros.calories)} kcal · {recipe.totalWeight}g · {recipe.ingredients.length} ingredientes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {expanded === recipe.id ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                </div>
              </div>

              {expanded === recipe.id && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[['Proteína', recipe.totalMacros.protein, 'g', 'text-blue-400'], ['Carbs', recipe.totalMacros.carbs, 'g', 'text-amber-400'], ['Gordura', recipe.totalMacros.fat, 'g', 'text-rose-400'], ['Fibras', recipe.totalMacros.fiber ?? 0, 'g', 'text-emerald-400']].map(([l, v, u, c]) => (
                      <div key={l} className="bg-zinc-800/60 rounded-lg p-2">
                        <p className="text-xs text-zinc-500">{l}</p>
                        <p className={`text-sm font-semibold ${c}`}>{Math.round(v ?? 0)}{u}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {recipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex justify-between text-xs px-1">
                        <span className="text-zinc-400">{ing.name}</span>
                        <span className="text-zinc-500">{ing.quantity}g</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-1">
                    <button onClick={() => removeRecipe(recipe.id)} className="btn-danger text-xs flex items-center gap-1">
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <RecipeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
