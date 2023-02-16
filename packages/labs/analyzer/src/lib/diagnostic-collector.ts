import {Diagnostic} from 'typescript';

export class DiagnosticCollector {
  readonly parent?: DiagnosticCollector | undefined = undefined;
  private _diagnostics: Array<Diagnostic> = [];

  constructor(parent?: DiagnosticCollector) {
    this.parent = parent;
  }

  add(diagnostic: Diagnostic) {
    this._diagnostics.push(diagnostic);
    this.parent?.add(diagnostic);
  }

  get all(): IterableIterator<Diagnostic> {
    return this._diagnostics.values();
  }
}
