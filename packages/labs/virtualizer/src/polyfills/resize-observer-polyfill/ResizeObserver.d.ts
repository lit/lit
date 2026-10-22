export type ResizeObserverConstructor = {
  prototype: ResizeObserver;
  new (callback: ResizeObserverCallback): ResizeObserver;
};

declare let ctor: ResizeObserverConstructor;

export default ctor;
