export function computeNumItems(state) {
  if (state.cart) {
    return Object.values(state.cart).reduce((total, entry) => {
      return total + entry.quantity;
    }, 0);
  }

  return 0;
}

export function computeTotal(state) {
  if (state.cart) {
    return Object.values(state.cart).reduce((total, entry) => {
      return total + entry.quantity * entry.item.price;
    }, 0);
  }

  return 0;
}

export function getEntryId(categoryId, itemId, size) {
  return `${categoryId}_$$$_${itemId}_$$$_${size}`;
}
