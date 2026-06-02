import { useState } from 'react'
import { Plus, Trash2, BookOpen, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { RecipeModal } from '../components/recipes/RecipeModal'

export default function Receitas() {
  const { recipes, removeRecipe } = useApp()
  const [modalOpen, setModalOpen]   = useState(false)
  const [editingRecipe, setEditing] = useState(null)
  const [expanded, setExpanded]     = useState(null)

  function openNew()           { setEditing(null); setModalOpen(true) }
  function openEdit(recipe)    { setEditing(recipe); setModalOpen(true) }
  function handleClose()       { setModalOpen(false); setEditing(null) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Receitas</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
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
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/15 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={15} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(e => e === recipe.id ? null : recipe.id)}>
                  <p className="font-medium text-white text-sm">{recipe.name}</p>
                  <p className="text-xs text-zinc-500">
                    {Math.round(recipe.totalMacros.calories)} kcal · {recipe.totalWeight}g
                    {recipe.serving ? ` · ${recipe.serving.portions} porções` : ''}
                    {' '}· {recipe.ingredients.length} ingredientes
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(recipe)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-violet-400 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setExpanded(e => e === recipe.id ? null : recipe.id)}
                    className="p-1.5 rounded-lg text-zinc-500">
                    {expanded === recipe.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {expanded === recipe.id && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      ['Proteína', recipe.totalMacros.protein,  'g', 'text-blue-400'],
                      ['Carbs',    recipe.totalMacros.carbs,    'g', 'text-amber-400'],
                      ['Gordura',  recipe.totalMacros.fat,      'g', 'text-rose-400'],
                      ['Fibras',   recipe.totalMacros.fiber ?? 0,'g','text-emerald-400'],
                    ].map(([l, v, u, c]) => (
                      <div key={l} className="bg-zinc-800/60 rounded-lg p-2">
                        <p className="text-xs text-zinc-500">{l}</p>
                        <p className={`text-sm font-semibold ${c}`}>{Math.round(v ?? 0)}{u}</p>
                      </div>
                    ))}
                  </div>
                  {recipe.serving && (
                    <p className="text-xs text-zinc-500 px-1">
                      1 porção = ~{Math.round(recipe.totalWeight / recipe.serving.portions)}g ·{' '}
                      ~{Math.round(recipe.totalMacros.calories / recipe.serving.portions)} kcal
                    </p>
                  )}
                  <div className="space-y-1">
                    {recipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex justify-between text-xs px-1">
                        <span className="text-zinc-400">{ing.name}</span>
                        <span className="text-zinc-500">{ing.quantity}g</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-1">
                    <button onClick={() => removeRecipe(recipe.id)}
                      className="btn-danger text-xs flex items-center gap-1">
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <RecipeModal open={modalOpen} onClose={handleClose} existing={editingRecipe} />
    </div>
  )
}
