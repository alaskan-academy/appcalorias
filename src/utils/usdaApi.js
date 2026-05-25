import { USDA_API_KEY, USDA_BASE_URL } from './constants'

function extractNutrient(nutrients, nutrientId) {
  const n = nutrients?.find(n => n.nutrientId === nutrientId || n.nutrientNumber === String(nutrientId))
  return n?.value ?? 0
}

function parseFoodItem(item) {
  const nutrients = item.foodNutrients ?? []
  return {
    id:       `usda_${item.fdcId}`,
    fdcId:    item.fdcId,
    name:     item.description,
    brand:    item.brandOwner ?? item.brandName ?? null,
    source:   'usda',
    per100g: {
      calories: Math.round(extractNutrient(nutrients, 1008) * 10) / 10,
      protein:  Math.round(extractNutrient(nutrients, 1003) * 10) / 10,
      carbs:    Math.round(extractNutrient(nutrients, 1005) * 10) / 10,
      fat:      Math.round(extractNutrient(nutrients, 1004) * 10) / 10,
      fiber:    Math.round(extractNutrient(nutrients, 1079) * 10) / 10,
    },
  }
}

export async function searchFoods(query, pageSize = 20) {
  const params = new URLSearchParams({
    query,
    api_key: USDA_API_KEY,
    pageSize,
    dataType: 'Foundation,SR Legacy,Branded',
  })
  const res = await fetch(`${USDA_BASE_URL}/foods/search?${params}`)
  if (!res.ok) throw new Error(`USDA API error: ${res.status}`)
  const data = await res.json()
  return (data.foods ?? []).map(parseFoodItem)
}

export async function getFoodDetails(fdcId) {
  const params = new URLSearchParams({ api_key: USDA_API_KEY })
  const res = await fetch(`${USDA_BASE_URL}/food/${fdcId}?${params}`)
  if (!res.ok) throw new Error(`USDA API error: ${res.status}`)
  const data = await res.json()
  return parseFoodItem(data)
}

export async function searchOpenFoodFacts(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&search_terms=${encodeURIComponent(query)}&fields=product_name,nutriments,_id&lc=pt&page_size=25`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open Food Facts error: ${res.status}`)
  const data = await res.json()
  return (data.products ?? [])
    .filter(p => p.product_name?.trim() && (p.nutriments?.['energy-kcal_100g'] ?? 0) > 0)
    .map(p => ({
      id:     `off_${p._id ?? Math.random().toString(36).slice(2)}`,
      name:   p.product_name.trim(),
      source: 'openfoodfacts',
      per100g: {
        calories: Math.round(p.nutriments['energy-kcal_100g'] ?? 0),
        protein:  Math.round((p.nutriments['proteins_100g']       ?? 0) * 10) / 10,
        carbs:    Math.round((p.nutriments['carbohydrates_100g']   ?? 0) * 10) / 10,
        fat:      Math.round((p.nutriments['fat_100g']             ?? 0) * 10) / 10,
        fiber:    Math.round((p.nutriments['fiber_100g']           ?? 0) * 10) / 10,
      },
    }))
}
