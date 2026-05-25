import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { format } from 'date-fns'
import { getProfile, saveProfile, getDayLog, saveDayLog, getCustomFoods, saveCustomFood, deleteCustomFood, getRecipes, saveRecipe, deleteRecipe } from '../utils/storage'
import { scaleMacros } from '../utils/calculations'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const today = format(new Date(), 'yyyy-MM-dd')

  const [profile, setProfileState] = useState(() => getProfile())
  const [dayLog, setDayLogState] = useState(() => getDayLog(today))
  const [currentDate, setCurrentDate] = useState(today)
  const [customFoods, setCustomFoods] = useState(() => getCustomFoods())
  const [recipes, setRecipes] = useState(() => getRecipes())

  useEffect(() => {
    const log = getDayLog(currentDate)
    setDayLogState(log)
  }, [currentDate])

  const updateProfile = useCallback((data) => {
    saveProfile(data)
    setProfileState(data)
  }, [])

  const updateDayLog = useCallback((updater) => {
    setDayLogState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveDayLog(next)
      return next
    })
  }, [])

  // Meals
  const addFoodToMeal = useCallback((mealId, foodEntry) => {
    updateDayLog(prev => {
      const mealEntries = [...(prev.meals[mealId] ?? []), foodEntry]
      return { ...prev, meals: { ...prev.meals, [mealId]: mealEntries } }
    })
  }, [updateDayLog])

  const removeFoodFromMeal = useCallback((mealId, entryId) => {
    updateDayLog(prev => {
      const mealEntries = (prev.meals[mealId] ?? []).filter(e => e.id !== entryId)
      return { ...prev, meals: { ...prev.meals, [mealId]: mealEntries } }
    })
  }, [updateDayLog])

  // Exercises
  const addExercise = useCallback((exercise) => {
    updateDayLog(prev => ({ ...prev, exercises: [...prev.exercises, exercise] }))
  }, [updateDayLog])

  const removeExercise = useCallback((exerciseId) => {
    updateDayLog(prev => ({ ...prev, exercises: prev.exercises.filter(e => e.id !== exerciseId) }))
  }, [updateDayLog])

  // Water
  const addWater = useCallback((amount) => {
    const entry = { id: Date.now().toString(), time: format(new Date(), 'HH:mm'), amount }
    updateDayLog(prev => ({ ...prev, water: [...prev.water, entry] }))
  }, [updateDayLog])

  const removeWater = useCallback((entryId) => {
    updateDayLog(prev => ({ ...prev, water: prev.water.filter(w => w.id !== entryId) }))
  }, [updateDayLog])

  // Steps
  const setSteps = useCallback((steps) => {
    updateDayLog(prev => ({ ...prev, steps: Math.max(0, Math.round(steps)) }))
  }, [updateDayLog])

  // Custom foods
  const addCustomFood = useCallback((food) => {
    saveCustomFood(food)
    setCustomFoods(getCustomFoods())
  }, [])

  const removeCustomFood = useCallback((id) => {
    deleteCustomFood(id)
    setCustomFoods(getCustomFoods())
  }, [])

  // Recipes
  const addRecipe = useCallback((recipe) => {
    saveRecipe(recipe)
    setRecipes(getRecipes())
  }, [])

  const removeRecipe = useCallback((id) => {
    deleteRecipe(id)
    setRecipes(getRecipes())
  }, [])

  const addRecipeToMeal = useCallback((mealId, recipe, portionGrams) => {
    const totalWeight = recipe.totalWeight || 100
    const factor = portionGrams / totalWeight
    const entry = {
      id: Date.now().toString(),
      name: recipe.name,
      quantity: portionGrams,
      unit: 'g',
      source: 'recipe',
      recipeId: recipe.id,
      calories: Math.round(recipe.totalMacros.calories * factor * 10) / 10,
      protein:  Math.round(recipe.totalMacros.protein  * factor * 10) / 10,
      carbs:    Math.round(recipe.totalMacros.carbs    * factor * 10) / 10,
      fat:      Math.round(recipe.totalMacros.fat      * factor * 10) / 10,
    }
    addFoodToMeal(mealId, entry)
  }, [addFoodToMeal])

  const totalCaloriesConsumed = Object.values(dayLog.meals ?? {})
    .flat()
    .reduce((s, e) => s + (e.calories ?? 0), 0)

  const totalCaloriesBurned = (dayLog.exercises ?? [])
    .reduce((s, e) => s + (e.caloriesBurned ?? 0), 0)

  const totalWater = (dayLog.water ?? [])
    .reduce((s, w) => s + (w.amount ?? 0), 0)

  const totalSteps = dayLog.steps ?? 0

  const totalMacros = Object.values(dayLog.meals ?? {})
    .flat()
    .reduce((acc, e) => ({
      protein: acc.protein + (e.protein ?? 0),
      carbs:   acc.carbs   + (e.carbs   ?? 0),
      fat:     acc.fat     + (e.fat     ?? 0),
    }), { protein: 0, carbs: 0, fat: 0 })

  return (
    <AppContext.Provider value={{
      profile,
      updateProfile,
      dayLog,
      currentDate,
      setCurrentDate,
      addFoodToMeal,
      removeFoodFromMeal,
      addExercise,
      removeExercise,
      addWater,
      removeWater,
      setSteps,
      totalSteps,
      customFoods,
      addCustomFood,
      removeCustomFood,
      recipes,
      addRecipe,
      removeRecipe,
      addRecipeToMeal,
      totalCaloriesConsumed,
      totalCaloriesBurned,
      totalWater,
      totalMacros,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
