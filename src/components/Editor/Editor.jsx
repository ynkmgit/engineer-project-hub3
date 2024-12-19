import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { registerCSSFormatter, defaultEditorConfig } from '../../config/monaco-formatter-config';
import { parseCSS, stringifyCSS } from '../../utils/css-parser';
import websocketService from '../../services/websocket';
import './Editor.css';

const Editor = ({ value, onChange, mode }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const cssRulesRef = useRef({});
  const isUpdatingRef = useRef(false);

  const getLanguage = (mode) => {
    switch (mode) {
      case 'markdown':
        return 'markdown';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      default:
        return 'plaintext';
    }
  };

  // フォーマットアクションを安全に実行する関数
  const safelyFormatDocument = () => {
    try {
      const editor = editorRef.current;
      if (!editor) return;

      const action = editor.getAction('editor.action.formatDocument');
      if (action) {
        action.run();
      }
    } catch (error) {
      console.warn('Format action not available:', error);
    }
  };

  // CSSルールを更新する関数
  const updateCSSRules = (newRule) => {
    if (mode !== 'css' || !editorRef.current || isUpdatingRef.current) return;

    try {
      isUpdatingRef.current = true;

      // カーソル位置と選択範囲を保存
      const position = editorRef.current.getPosition();
      const selection = editorRef.current.getSelection();

      // 現在のCSSルールをパース
      cssRulesRef.current = parseCSS(editorRef.current.getValue());

      // 新しいルールをパース
      const newRules = parseCSS(newRule);

      // 既存のルールを更新または追加
      Object.entries(newRules).forEach(([selector, styles]) => {
        cssRulesRef.current[selector] = {
          ...(cssRulesRef.current[selector] || {}),
          ...styles
        };
      });

      // 更新されたルールを文字列に変換
      const updatedCSS = stringifyCSS(cssRulesRef.current);

      // モデルの内容を直接更新
      const model = editorRef.current.getModel();
      if (model) {
        model.pushEditOperations(
          [],
          [{
            range: model.getFullModelRange(),
            text: updatedCSS
          }],
          () => null
        );
      }

      // カーソル位置と選択範囲を復元
      if (position) {
        editorRef.current.setPosition(position);
      }
      if (selection) {
        editorRef.current.setSelection(selection);
      }

    } catch (error) {
      console.error('Error updating CSS rules:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  };

  // 初期化時にフォーマッターを登録
  useEffect(() => {
    registerCSSFormatter();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const options = {
        ...defaultEditorConfig,
        value: value,
        language: getLanguage(mode),
        // readOnly: mode === 'html' を削除
      };

      editorRef.current = monaco.editor.create(containerRef.current, options);

      // コンテンツ変更時のハンドラ
      editorRef.current.onDidChangeModelContent((e) => {
        if (!isUpdatingRef.current) {
          const newValue = editorRef.current.getValue();
          onChange(newValue);
          
          // WebSocketで変更を通知
          websocketService.sendMessage('contentChange', {
            mode,
            content: newValue
          });
        }
      });

      // フォーマット時のハンドラ
      editorRef.current.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
        safelyFormatDocument();
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [mode]);

  useEffect(() => {
    if (!editorRef.current || isUpdatingRef.current) return;

    const currentValue = editorRef.current.getValue();
    if (currentValue === value) return;

    if (mode === 'css' && value.includes('{')) {
      updateCSSRules(value);
    } else {
      const position = editorRef.current.getPosition();
      const selection = editorRef.current.getSelection();

      editorRef.current.setValue(value);

      if (position) {
        editorRef.current.setPosition(position);
      }
      if (selection) {
        editorRef.current.setSelection(selection);
      }
    }

    // 言語モードの更新
    const model = editorRef.current.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, getLanguage(mode));
    }
  }, [value, mode]);

  return <div ref={containerRef} className="editor-container" />;
};

export default Editor;