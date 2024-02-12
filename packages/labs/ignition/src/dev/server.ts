import {startServer} from '../lib/project-server.js';
import {
  AbsolutePath,
  createPackageAnalyzer,
} from '@lit-labs/analyzer/package-analyzer.js';

const analyzer = createPackageAnalyzer(
  '/Users/justin/Projects/Web/chessboard-element/' as AbsolutePath
);

await startServer(analyzer, 3335);
console.log('server started');
