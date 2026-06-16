const DEBUG = __DEV__;

export const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[TodoApp]', new Date().toISOString().slice(11, 23), ...args);
};

export const error = (...args: unknown[]) => {
  if (DEBUG) console.error('[TodoApp ERROR]', new Date().toISOString().slice(11, 23), ...args);
};
