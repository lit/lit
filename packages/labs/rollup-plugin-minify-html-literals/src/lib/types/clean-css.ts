declare module 'clean-css/lib/options/optimization-level.js' {
  import {Options, OptimizationsOptions} from 'clean-css';

  export interface OptimizationLevel {
    Zero: '0';
    One: '1';
    Two: '2';
  }

  export const OptimizationLevel: OptimizationLevel;

  export interface OptimizationLevelOptions {
    [OptimizationLevel.Zero]: {};
    // CleanCSS v5 removed the `transform` callback from its level-1 optimizer
    // (it was used to intercept and rewrite individual property values). The
    // remaining level-1 options are still supported and behave the same as in
    // v4. Omitting 'transform' here keeps the return type accurate for v5.
    [OptimizationLevel.One]: Required<
      Omit<Exclude<OptimizationsOptions['1'], undefined>, 'all' | 'transform'>
    >;
    [OptimizationLevel.Two]: Required<
      Omit<Exclude<OptimizationsOptions['2'], undefined>, 'all'>
    >;
  }

  export function optimizationLevelFrom(
    source: Options['level']
  ): OptimizationLevelOptions;
}
