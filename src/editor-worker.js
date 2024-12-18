import * as monaco from 'monaco-editor';

self.MonacoEnvironment = {
  getWorker(_, label) {
    const workerURL = new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url);
    return new Worker(workerURL, {
      type: 'module'
    });
  }
};