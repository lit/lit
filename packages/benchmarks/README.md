# lit benchmarks

Benchmarks for lit-html and LitElement.

```bash
git clone git@github.com:Polymer/lit-html.git
cd lit-html
git checkout lit-next

npm install
npm run bootstrap
npm run build

cd packages/benchmarks
npx tachometer lit-html/stub1/stub1.html
npx tachometer lit-element/stub1/stub1.html
```
