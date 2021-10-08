function makeProxy(virtualArray) {
    return new Proxy(virtualArray.array, {
        get: function(target, property, receiver) {
            if (property === 'length') {
                return virtualArray.length;
            }
            const n = Number(property);
            if (!isNaN(n) && Math.round(n) === n) {
                return target[n] || virtualArray.requestFetch(n);
            }
            return target[property];
        }
    });
}

export class VirtualArray {
    constructor(config) {
        const self = this;
        Object.assign(this, config);// {pageSize, fetchPage, placeholder, callback} = config;
        this.length = 10;
        this.array = new Array(this.length);
        this.pages = new Object();
        return makeProxy(this);
    }

    requestFetch(n) {
        const {pageSize, pages, array, placeholder, fetchPage, callback} = this;
        const pageNum = Math.ceil((n + 1) / this.pageSize);
        if (!pages[pageNum]) {
            pages[pageNum] = (async () => {
                const res = await fetchPage(pageSize, pageNum);
                if (res.totalItems !== undefined) {
                    this.length = Number(res.totalItems);
                }
                for (let i = 0; i < res.items.length; i++) {
                    this.array[pageSize * (pageNum - 1) + i] = res.items[i];
                }
                callback(makeProxy(this));
            })();
        }
        return array[n] = placeholder(n);
    }

}

window.VirtualArray = VirtualArray;
