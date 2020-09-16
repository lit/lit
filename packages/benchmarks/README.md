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
# Choose a benchmark to run
npm run benchmark:lit-html:kitchen-sink
npm run benchmark:lit-html:kitchen-sink-render
npm run benchmark:lit-html:kitchen-sink-update
npm run benchmark:lit-html:kitchen-sink-nop-update
npm run benchmark:lit-element:stub1
```
