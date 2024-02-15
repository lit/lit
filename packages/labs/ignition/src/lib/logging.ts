import {createRequire} from 'module';

const require = createRequire(import.meta.url);
import vscode = require('vscode');

export const logChannel = vscode.window.createOutputChannel('Ignition');
