import {Context, ContextType} from '../create-context.js';
import {
  ContextProvider,
  Options,
  ReactiveElementHost,
} from './context-provider.js';
type ElementOf<T> = T extends (infer E)[] ? E : never;

export class MultiContextProvider<
  T extends Context<unknown, unknown>[],
  HostElement extends ReactiveElementHost = ReactiveElementHost
> {
  private contextList = [] as ContextProvider<ElementOf<T>, HostElement>[];

  constructor(host: HostElement, contextOrOptions: Options<ElementOf<T>>[]) {
    contextOrOptions.forEach((option) => {
      this.contextList.push(new ContextProvider(host, option));
    });
  }

  setValueByContext(context: ElementOf<T>, value: ContextType<ElementOf<T>>) {
    const contextProvider = this.contextList.find((c) =>
      c.isSameContext(context)
    );
    contextProvider?.setValue(value);
  }
}
