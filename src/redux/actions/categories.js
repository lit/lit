import { getLocationPathPart } from '../helpers/location.js';
import { updateNetworkFailure } from './network.js';

export const RECEIVE_CATEGORIES = 'RECEIVE_CATEGORIES';
export const RECEIVE_ITEMS = 'RECEIVE_ITEMS';

export const getAllCategories = () => {
  return {
    type: RECEIVE_CATEGORIES,
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
  };
};

export const getCategoryItems = () => (dispatch, getState) => {
  const state = getState();
  const categoryId = getLocationPathPart(state, 1);
  if (categoryId) {
    const category = state.categories[categoryId];
    if (category) {
      if (category.items) {
        dispatch(updateNetworkFailure(false));
      } else {
        fetch(`data/${categoryId}.json`)
        .then(res => res.json())
        .then(items => {
          dispatch(receiveCategoryItems(categoryId, items));
          dispatch(updateNetworkFailure(false));
        })
        .catch(() => dispatch(updateNetworkFailure(true)));
      }
    }
  }
}

export const receiveCategoryItems = (categoryId, items) => {
  return {
    type: RECEIVE_ITEMS,
    categoryId,
    items
  };
};
