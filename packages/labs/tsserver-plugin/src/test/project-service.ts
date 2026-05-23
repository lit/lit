import ts from 'typescript';

/* eslint-disable @typescript-eslint/no-explicit-any */

const fakeFileWatcher: ts.FileWatcher = {close() {}};

const serverHost: ts.server.ServerHost = {
  ...ts.sys,
  // This is important on macOS at least
  useCaseSensitiveFileNames: true,
  watchFile(
    _path: string,
    _callback: ts.FileWatcherCallback,
    _pollingInterval?: number,
    _options?: ts.WatchOptions
  ): ts.FileWatcher {
    return fakeFileWatcher;
  },

  watchDirectory(
    _path: string,
    _callback: ts.DirectoryWatcherCallback,
    _recursive?: boolean,
    _options?: ts.WatchOptions
  ): ts.FileWatcher {
    return fakeFileWatcher;
  },

  setTimeout(
    callback: (...args: any[]) => void,
    ms: number,
    ...args: any[]
  ): any {
    return globalThis.setTimeout(callback, ms, ...args);
  },

  clearTimeout(timeoutId: any): void {
    globalThis.clearTimeout(timeoutId);
  },

  setImmediate(callback: (...args: any[]) => void, ...args: any[]): any {
    return (globalThis as any).setImmediate
      ? (globalThis as any).setImmediate(callback, ...args)
      : globalThis.setTimeout(callback, 0, ...args);
  },

  clearImmediate(timeoutId: any): void {
    if ((globalThis as any).clearImmediate) {
      (globalThis as any).clearImmediate(timeoutId);
    } else {
      globalThis.clearTimeout(timeoutId);
    }
  },
};

const logger: ts.server.Logger = {
  close(): void {},
  hasLevel(level: ts.server.LogLevel): boolean {
    return level <= ts.server.LogLevel.normal;
  },
  loggingEnabled(): boolean {
    return false;
  },
  perftrc(_s: string): void {},
  info(s: string): void {
    this.msg(s, ts.server.Msg.Info);
  },
  startGroup(): void {
    console.group();
  },
  endGroup(): void {
    console.groupEnd();
  },
  msg(s: string, type?: ts.server.Msg): void {
    if (this.loggingEnabled()) {
      console.log(type, s);
    }
  },
  getLogFileName(): string | undefined {
    return;
  },
};

export const createTestProjectService = () => {
  const projectService = new ts.server.ProjectService({
    host: serverHost,
    logger,
    cancellationToken: ts.server.nullCancellationToken,
    typingsInstaller: ts.server.nullTypingsInstaller,
    session: undefined,
    useInferredProjectPerProjectRoot: true,
    useSingleInferredProject: true,
    allowLocalPluginLoads: true,
    serverMode: ts.LanguageServiceMode.Semantic,
  });
  return projectService;
};

let reusableProjectService: ts.server.ProjectService | undefined;
export const getReusableTestProjectService = () => {
  if (!reusableProjectService) {
    reusableProjectService = createTestProjectService();
  }
  const projectService = reusableProjectService;
  return {
    projectService,
    [Symbol.dispose]() {
      for (const [path] of projectService.openFiles) {
        projectService.closeClientFile(path);
      }
    },
  };
};
