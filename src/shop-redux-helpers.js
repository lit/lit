export function findCategoryIndex(categories, categoryName) {
  for (let i = 0, c; c = categories[i]; ++i) {
    if (c.name === categoryName) {
      return i;
    }
  }
  return null;
}

export function findCategory(categories, categoryName) {
  return categories[findCategoryIndex(categories, categoryName)] || null;
}
