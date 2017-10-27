import createStore from '../node_modules/@0xcda7a/redux-es6/es/createStore.js';

const store = createStore(
  (state, action) => {
    let result = state;

    switch (action.type) {
      case '_pathChanged':
        {
          const pathParts = action.path.slice(1).split('/');
          const page = pathParts[0];
          const categoryName = pathParts[1];
          const itemName = pathParts[2];
          const category = findCategory(state.categories, categoryName);
          if (category) {
            if (!category.items) {
              fetch(`data/${category.name}.json`)
              .then(res => res.json())
              .then(data => store.dispatch({
                type: '_categoryItemsChanged',
                categoryName,
                data
              }));
            }
          }
          result = {
            ...state,
            page,
            category,
            itemName,
            item: findItem(state.category, itemName)
          };
        }
        break;
      case '_categoryItemsChanged':
        {
          const categories = state.categories;
          const categoryIndex = findCategoryIndex(categories, action.categoryName);
          const category = {...categories[categoryIndex], items: action.data};
          categories[categoryIndex] = category;
          result = {
            ...state,
            categories: [...categories],
            category,
            item: findItem(category, state.itemName)
          };
        }
        break;
    }
    console.log('reducer', state.category, action, result.category)
    return result;
  },
  {
    categories: [
      {
        name: 'mens_outerwear',
        title: 'Men\'s Outerwear',
        image: 'images/mens_outerwear.jpg',
        placeholder: 'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAeAAD/7gAOQWRvYmUAZMAAAAAB/9sAhAAQCwsLDAsQDAwQFw8NDxcbFBAQFBsfFxcXFxcfHhcaGhoaFx4eIyUnJSMeLy8zMy8vQEBAQEBAQEBAQEBAQEBAAREPDxETERUSEhUUERQRFBoUFhYUGiYaGhwaGiYwIx4eHh4jMCsuJycnLis1NTAwNTVAQD9AQEBAQEBAQEBAQED/wAARCAADAA4DASIAAhEBAxEB/8QAXAABAQEAAAAAAAAAAAAAAAAAAAIEAQEAAAAAAAAAAAAAAAAAAAACEAAAAwYHAQAAAAAAAAAAAAAAERMBAhIyYhQhkaEDIwUVNREBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A3dkr5e8tfpwuneJITOzIcmQpit037Bw4mnCVNOpAAQv/2Q=='
      },
      {
        name: 'ladies_outerwear',
        title: 'Ladies Outerwear',
        image: 'images/ladies_outerwear.jpg',
        placeholder: 'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAeAAD/7gAOQWRvYmUAZMAAAAAB/9sAhAAQCwsLDAsQDAwQFw8NDxcbFBAQFBsfFxcXFxcfHhcaGhoaFx4eIyUnJSMeLy8zMy8vQEBAQEBAQEBAQEBAQEBAAREPDxETERUSEhUUERQRFBoUFhYUGiYaGhwaGiYwIx4eHh4jMCsuJycnLis1NTAwNTVAQD9AQEBAQEBAQEBAQED/wAARCAADAA4DASIAAhEBAxEB/8QAWQABAQAAAAAAAAAAAAAAAAAAAAEBAQEAAAAAAAAAAAAAAAAAAAIDEAABAwMFAQAAAAAAAAAAAAARAAEygRIDIlITMwUVEQEBAAAAAAAAAAAAAAAAAAAAQf/aAAwDAQACEQMRAD8Avqn5meQ0kwk1UyclmLtNj7L4PQoioFf/2Q=='
      },
      {
        name: 'mens_tshirts',
        title: 'Men\'s T-Shirts',
        image: 'images/mens_tshirts.jpg',
        placeholder: 'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAeAAD/7gAOQWRvYmUAZMAAAAAB/9sAhAAQCwsLDAsQDAwQFw8NDxcbFBAQFBsfFxcXFxcfHhcaGhoaFx4eIyUnJSMeLy8zMy8vQEBAQEBAQEBAQEBAQEBAAREPDxETERUSEhUUERQRFBoUFhYUGiYaGhwaGiYwIx4eHh4jMCsuJycnLis1NTAwNTVAQD9AQEBAQEBAQEBAQED/wAARCAADAA4DASIAAhEBAxEB/8QAWwABAQEAAAAAAAAAAAAAAAAAAAMEAQEAAAAAAAAAAAAAAAAAAAAAEAABAwEJAAAAAAAAAAAAAAARAAESEyFhodEygjMUBREAAwAAAAAAAAAAAAAAAAAAAEFC/9oADAMBAAIRAxEAPwDb7kupZU1MTGnvOCgxpvzEXTyRElCmf//Z'
      },
      {
        name: 'ladies_tshirts',
        title: 'Ladies T-Shirts',
        image: 'images/ladies_tshirts.jpg',
        placeholder: 'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAeAAD/7gAOQWRvYmUAZMAAAAAB/9sAhAAQCwsLDAsQDAwQFw8NDxcbFBAQFBsfFxcXFxcfHhcaGhoaFx4eIyUnJSMeLy8zMy8vQEBAQEBAQEBAQEBAQEBAAREPDxETERUSEhUUERQRFBoUFhYUGiYaGhwaGiYwIx4eHh4jMCsuJycnLis1NTAwNTVAQD9AQEBAQEBAQEBAQED/wAARCAADAA4DASIAAhEBAxEB/8QAXwABAQEAAAAAAAAAAAAAAAAAAAMFAQEBAAAAAAAAAAAAAAAAAAABAhAAAQIDCQAAAAAAAAAAAAAAEQABITETYZECEjJCAzMVEQACAwAAAAAAAAAAAAAAAAAAATFBgf/aAAwDAQACEQMRAD8AzeADAZiFc5J7BC9Scek3VrtooilSNaf/2Q=='
      }
    ]
  });

function findCategoryIndex(categories, categoryName) {
  for (let i = 0, c; c = categories[i]; ++i) {
    if (c.name === categoryName) {
      return i;
    }
  }
  return null;
}

function findCategory(categories, categoryName) {
  return categories[findCategoryIndex(categories, categoryName)] || null;
}

function findItem(category, itemName) {
  if (!category || !category.items || !itemName) {
    return;
  }
  for (let i = 0, item; item = category.items[i]; ++i) {
    if (item.name === itemName) {
      return item;
    }
  }
}

export { store };
