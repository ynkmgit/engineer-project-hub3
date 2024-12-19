import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { registerCSSFormatter, defaultEditorConfig } from '../../config/monaco-formatter-config';
import { parseCSS, stringifyCSS } from '../../utils/css-parser';
import websocketService from '../../services/websocket';
import './Editor.css';

const Editor = ({ value, onChange, mode, onScroll, scrollPosition }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const cssRulesRef = useRef({});
  const isUpdatingRef = useRef(false);
  const isScrollingRef = useRef(false);

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

  // スクロールハンドラ
  const handleScroll = (e) => {
    if (!isScrollingRef.current && mode !== 'css' && editorRef.current) {
      const editor = editorRef.current;
      const scrollTop = editor.getScrollTop();
      const scrollHeight = editor.getScrollHeight();
      const height = editor.getLayoutInfo().height;
      const maxScroll = scrollHeight - height;
      
      if (maxScroll > 0) {
        const percentage = scrollTop / maxScroll;
        onScroll?.({
          scrollTop,
          scrollHeight,
          height,
          percentage
        });
      }
    }
  };

  // スクロール位置の設定
  const setEditorScrollPosition = (position) => {
    if (editorRef.current && !isScrollingRef.current) {
      isScrollingRef.current = true;
      const editor = editorRef.current;
      const height = editor.getLayoutInfo().height;
      const scrollHeight = editor.getScrollHeight();
      const maxScroll = scrollHeight - height;
      const scrollTop = position.percentage * maxScroll;
      
      editor.setScrollTop(scrollTop);

      // スクロールロックの解除
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }
  };

  useEffect(() => {
    registerCSSFormatter();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const options = {
        ...defaultEditorConfig,
        value: value,
        language: getLanguage(mode),
        scrollbar: {
          ...defaultEditorConfig.scrollbar,
          alwaysConsumeMouseWheel: false,
        },
      };

      editorRef.current = monaco.editor.create(containerRef.current, options);

      // コンテンツ変更ハンドラ
      editorRef.current.onDidChangeModelContent((e) => {
        if (!isUpdatingRef.current) {
          const newValue = editorRef.current.getValue();
          onChange(newValue);
          websocketService.sendMessage('contentChange', {
            mode,
            content: newValue
          });
        }
      });

      // スクロールイベントハンドラ
      editorRef.current.onDidScrollChange(handleScroll);

      return () => {
        if (editorRef.current) {
          editorRef.current.dispose();
        }
      };
    }
  }, [mode]);

  // スクロール位置の同期
  useEffect(() => {
    if (scrollPosition && mode !== 'css') {
      setEditorScrollPosition(scrollPosition);
    }
  }, [scrollPosition]);

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

    const model = editorRef.current.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, getLanguage(mode));
    }
  }, [value, mode]);

  return (
    <div ref={containerRef} className="editor-container" style={{ overflow: 'hidden' }} />
  );
};

export default Editor;