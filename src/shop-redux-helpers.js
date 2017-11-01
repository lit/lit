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

export function findItem(category, itemName) {
  if (!category || !category.items || !itemName) {
    return;
  }
  for (let i = 0, item; item = category.items[i]; ++i) {
    if (item.name === itemName) {
      return item;
    }
  }
}
