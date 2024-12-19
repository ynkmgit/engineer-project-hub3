import * as monaco from 'monaco-editor';

// CSSフォーマッター関数
const formatCSSCode = (text) => {
  try {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/;\s*/g, ';\n  ')
      .replace(/\s*}\s*/g, '\n}\n')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  } catch (e) {
    console.error('CSS formatting error:', e);
    return text;
  }
};

// CSSフォーマッタープロバイダーの登録
export const registerCSSFormatter = () => {
  monaco.languages.registerDocumentFormattingEditProvider('css', {
    provideDocumentFormattingEdits: function (model) {
      const text = model.getValue();
      const formatted = formatCSSCode(text);
      return [
        {
          range: model.getFullModelRange(),
          text: formatted,
        },
      ];
    }
  });
};

// エディタのデフォルト設定
export const defaultEditorConfig = {
  theme: 'vs-dark',
  minimap: { enabled: false },
  wordWrap: 'on',
  automaticLayout: true,
  scrollBeyondLastLine: false,
  lineNumbers: 'on',
  renderLineHighlight: 'all',
  roundedSelection: false,
  cursorStyle: 'line',
  fontSize: 14,
  tabSize: 2,
  formatOnPaste: true,
  formatOnType: true,
  autoIndent: 'full',
  useTabStops: true,
  insertSpaces: true,
};