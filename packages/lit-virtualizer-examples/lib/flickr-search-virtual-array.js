import { searchFlickr } from './flickr.js';

export async function getPhotos(query, placeholder, callback, mock=false) {
    return new VirtualArray({
        pageSize: 5,
        fetchPage: async (pageSize, pageNum) => {
            const resp = await searchFlickr(query, pageSize, pageNum, mock);
            return {
                // items: resp.photo.map(p => Object.assign({}, {width_o: 1920, height_o: 1080}, p)),
                items: resp.photo,
                totalItems: resp.total
            };
            // return resp.photo.filter(p => p.width_o);
        },
        placeholder: () => {
            // return {"id":"TEMP","height_o":769,"width_o":1024};
            return {id: "TEMP"};
        },
        callback: items => {
            setState({ items });
        }
    });
    // const resp = await searchFlickr(query, 500, 1, mock);
    // return resp.photo.filter(p => p.width_o);
}

