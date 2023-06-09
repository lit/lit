declare module 'clean-css/lib/options/optimization-level' {
  import { Options, OptimizationsOptions } from 'clean-css';

  export interface OptimizationLevel {
    Zero: '0';
    One: '1';
    Two: '2';
  }

  export const OptimizationLevel: OptimizationLevel;

  export interface OptimizationLevelOptions {
    [OptimizationLevel.Zero]: {};
    [OptimizationLevel.One]: Required<
      Omit<Exclude<OptimizationsOptions['1'], undefined>, 'all'>
    >;
    [OptimizationLevel.Two]: Required<
      Omit<Exclude<OptimizationsOptions['2'], undefined>, 'all'>
    >;
  }

  export function optimizationLevelFrom(
    source: Options['level']
  ): OptimizationLevelOptions;
}
