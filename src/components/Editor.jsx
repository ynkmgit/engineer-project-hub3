import React from 'react';
import { Editor, loader } from '@monaco-editor/react';

// Monaco Editorの設定
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

const MonacoEditor = () => {
  const editorOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    minimap: {
      enabled: false
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    // エディターが初期化された後の処理
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
  };

  return (
    <Editor
      height="90vh"
      defaultLanguage="markdown"
      defaultValue="# Welcome to Markdown Editor"
      options={editorOptions}
      theme="vs-dark"
      onMount={handleEditorDidMount}
    />
  );
};

export default MonacoEditor;