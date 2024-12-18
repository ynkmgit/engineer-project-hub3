import * as monaco from 'monaco-editor';

self.MonacoEnvironment = {
  getWorker: function (moduleId, label) {
    const getWorkerModule = (handler) => {
      return new Worker(
        new URL('../node_modules/monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url)
      );
    };

    switch (label) {
      case 'json':
        return new Worker(
          new URL('../node_modules/monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url)
        );
      case 'css':
      case 'scss':
      case 'less':
        return new Worker(
          new URL('../node_modules/monaco-editor/esm/vs/language/css/css.worker.js', import.meta.url)
        );
      case 'html':
      case 'handlebars':
      case 'razor':
        return new Worker(
          new URL('../node_modules/monaco-editor/esm/vs/language/html/html.worker.js', import.meta.url)
        );
      case 'typescript':
      case 'javascript':
        return new Worker(
          new URL('../node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url)
        );
      default:
        return getWorkerModule();
    }
  }
};