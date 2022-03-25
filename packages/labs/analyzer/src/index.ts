import {Analyzer} from './lib/analyzer.js';

console.log('analyzer');
const analyzer = new Analyzer(process.cwd());
analyzer.analyzePackage();
