import {Diagnostic} from 'typescript';

export class DiagnosticCollector {
  private _parent?: DiagnosticCollector | undefined = undefined;
  private _diagnostics: Array<Diagnostic> = [];

  constructor(parent?: DiagnosticCollector) {
    this._parent = parent;
  }

  add(diagnostic: Diagnostic) {
    this._diagnostics.push(diagnostic);
    this._parent?.add(diagnostic);
  }

  get all(): IterableIterator<Diagnostic> {
    return this._diagnostics.values();
  }

  get parent(): DiagnosticCollector | undefined {
    return this._parent;
  }
}
