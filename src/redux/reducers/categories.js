import { RECEIVE_CATEGORIES, RECEIVE_ITEMS } from '../actions/categories.js';

const categories = (state = {}, action) => {
  switch (action.type) {
    case RECEIVE_CATEGORIES:
      return {
        ...state,
        ...action.categories.reduce((obj, category) => {
          obj[category.name] = category;
          return obj;
        }, {})
      };
    case RECEIVE_ITEMS:
      const categoryId = action.categoryId;
      return {
        ...state,
        [categoryId]: {
          ...state[categoryId],
          items: {
            ...action.items.reduce((obj, item) => {
              obj[item.name] = item;
              return obj;
            }, {})
          }
        }
      };
    default:
      return state;
  }
}

export default categories;
