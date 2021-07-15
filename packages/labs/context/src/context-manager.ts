import { UnknownContext, IContextEvent, Context , ContextCallback, ContextType} from './api'
import type { LitElement } from 'lit-element'

export interface UpdatableHonk<T extends UnknownContext> extends IContextEvent<T> {
  readonly target: EventTarget
}

export class StatefulContextManager {
  contexts = new Map<string, Set<UpdatableHonk<Context<unknown>>>>()

  // packages/web-components/fast-foundation/src/utilities/match-media-stylesheet-behavior.ts
  private listenerMap = new WeakMap<EventTarget, ContextCallback<unknown>>()

  constructor() {
    console.log('StatefulContextManager ctor')
  }

  respondFor(name: string, data: unknown) {
    console.log('StatefulContextManager respondFor 1/2', { name, data })
    const contexts = this.contexts
    if (contexts) {
      if (contexts.has(name) === false) {
        throw new Error(`StatefulContextManager respondFor: There is no context on the name ${name}`)
      }
      const entries = contexts.get(name)
      for (const { context, target, ...rest } of entries) {
        const callback = this.listenerMap.has(target) ? this.listenerMap.get(target) : void 0
        console.log('StatefulContextManager respondFor 2/2', { name, data, context, callback, ...rest })
        const payload = data ?? context.initialValue
        callback(payload)
      }
    }
  }

  protected keepTrackContextRequest<T extends UnknownContext>(event: ContextEvent<T>) {
    const { context } = event
    const { name } = context
    const contexts = this.contexts
    console.log('StatefulContextManager keepTrackContextRequest 1/2', { name, context, event, contexts })
    const callback: ContextCallback<ContextType<T>> = (value, dispose) => {
      console.log('StatefulContextManager keepTrackContextRequest callback')
      event.callback(value, dispose)
      ;(event.target as LitElement).requestUpdate()
    }
    const honk: UpdatableHonk<T> = {
      multiple: false,
      ...event,
      callback,
      context,
      target: event.target,
    }
    this.listenerMap.set(event.target, callback)
    if (contexts) {
      if (contexts.has(name)) {
        contexts.get(name).add(honk)
      } else {
        contexts.set(name, new Set([honk]))
      }
    }
    event.stopPropagation()
    console.log('StatefulContextManager keepTrackContextRequest 2/2', { name, context, event, contexts })
  }

  addEventListenerTo(host: HTMLElement) {
    host.addEventListener('context-request', this.keepTrackContextRequest.bind(this))
  }
  removeEventListenerTo(host: HTMLElement) {
    host.addEventListener('context-request', this.keepTrackContextRequest.bind(this))
  }
}