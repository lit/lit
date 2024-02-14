import {startServer} from '../lib/project-server.js';
import {
  AbsolutePath,
  createPackageAnalyzer,
} from '@lit-labs/analyzer/package-analyzer.js';

const analyzer = createPackageAnalyzer(
  '/Users/justin/Projects/Web/chessboard-element/' as AbsolutePath
);

const server = await startServer(analyzer);
console.log(`server started at ${server.address()}`);
