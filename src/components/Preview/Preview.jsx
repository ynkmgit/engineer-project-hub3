import { useEffect, useRef, useState } from 'react'
import { markdownToHtml } from '../../utils/converter'
import { SCROLL_DEBOUNCE_TIME, BASE_STYLES, SELECTION_MODE_STYLES, SELECTED_ELEMENT_STYLES } from './constants'
import { getScrollSyncScript, getMermaidInitScript, getElementSelectionScript } from './scripts/preview-scripts'
import './Preview.css'
import 'highlight.js/styles/github.css'

const Preview = ({ markdown, isHtml, css, onElementSelect, previewStyles, onScroll, scrollPosition }) => {
  const iframeRef = useRef(null);
  const isScrollingRef = useRef(false);
  const content = isHtml ? markdown : markdownToHtml(markdown);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);

  const openInNewTab = () => {
    // 既存のopenInNewTab関数の内容
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
          <style></style>
          <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
          <script>
            ${getScrollSyncScript()}
            ${getMermaidInitScript()}
            ${getElementSelectionScript()}
          </script>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    iframe.src = url;

    const handleMessage = (event) => {
      if (event.data.type === 'elementSelected') {
        setSelectedPath(event.data.path);
        onElementSelect?.(event.data);
        setIsSelectionMode(false);
      } else if (event.data.type === 'scroll' && !isScrollingRef.current) {
        onScroll?.(event.data.scrollInfo);
      }
    };

    window.addEventListener('message', handleMessage);

    iframe.onload = () => {
      const styleElement = iframe.contentDocument?.querySelector('style');
      if (styleElement) {
        styleElement.textContent = `
          ${BASE_STYLES}
          ${css}
          ${previewStyles || ''}
          ${isSelectionMode ? SELECTION_MODE_STYLES : ''}
          ${selectedPath ? `
            ${selectedPath} {
              ${SELECTED_ELEMENT_STYLES}
            }
            ${selectedPath}::after {
              content: '';
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              pointer-events: none;
              border: 1px solid rgba(0, 123, 255, 0.3);
            }
          ` : ''}
        `;
      }
    };

    return () => {
      URL.revokeObjectURL(url);
      window.removeEventListener('message', handleMessage);
    }
  }, [content, css, previewStyles, isSelectionMode, selectedPath]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    iframe.contentWindow.postMessage({
      type: 'toggleSelectionMode',
      isSelectionMode
    }, '*');
  }, [isSelectionMode]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow && scrollPosition) {
      iframe.contentWindow.postMessage({
        type: 'setScrollPosition',
        percentage: scrollPosition.percentage
      }, '*');
    }
  }, [scrollPosition]);

  return (
    <div className="preview-section">
      <div className="preview-toolbar">
        <button
          className={`selection-mode-button ${isSelectionMode ? 'active' : ''}`}
          onClick={() => {
            setIsSelectionMode(!isSelectionMode);
            if (!isSelectionMode) {
              setSelectedPath(null);
            }
          }}
        >
          要素を選択
        </button>
        <button
          className="open-new-tab-button"
          onClick={openInNewTab}
        >
          新しいタブで開く
        </button>
      </div>
      <iframe
        ref={iframeRef}
        className="preview-container"
        title="Preview"
        sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
        onLoad={() => {
          const iframe = iframeRef.current;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'toggleSelectionMode',
              isSelectionMode
            }, '*');
          }
        }}
      />
    </div>
  );
};

export default Preview;