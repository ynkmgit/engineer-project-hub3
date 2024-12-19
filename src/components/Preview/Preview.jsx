import { useEffect, useRef, useState } from 'react'
import { markdownToHtml } from '../../utils/converter'
import './Preview.css'

const Preview = ({ markdown, isHtml, css, onElementSelect, previewStyles, onScroll, scrollPosition }) => {
  const iframeRef = useRef(null);
  const isScrollingRef = useRef(false);
  const content = isHtml ? markdown : markdownToHtml(markdown);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);

  // スクロール同期のスクリプト
  const scrollScript = `
    let isScrolling = false;
    let lastKnownScrollPosition = 0;
    let ticking = false;

    document.addEventListener('scroll', function(e) {
      if (!isScrolling) {
        lastKnownScrollPosition = window.scrollY;
        
        if (!ticking) {
          window.requestAnimationFrame(function() {
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;
            const maxScroll = scrollHeight - clientHeight;
            
            if (maxScroll > 0) {
              const percentage = lastKnownScrollPosition / maxScroll;
              window.parent.postMessage({
                type: 'scroll',
                scrollInfo: {
                  scrollTop: lastKnownScrollPosition,
                  scrollHeight: scrollHeight,
                  height: clientHeight,
                  percentage: percentage
                }
              }, '*');
            }
            ticking = false;
          });
          ticking = true;
        }
      }
    }, { passive: true });

    // スクロール位置を設定する関数
    function setScrollPosition(percentage) {
      if (!isScrolling) {
        isScrolling = true;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const maxScroll = scrollHeight - clientHeight;
        const scrollTop = percentage * maxScroll;
        
        window.scrollTo({
          top: scrollTop,
          behavior: 'instant'
        });

        setTimeout(() => {
          isScrolling = false;
        }, 100);
      }
    }

    // メッセージハンドラ
    window.addEventListener('message', function(event) {
      if (event.data.type === 'setScrollPosition') {
        setScrollPosition(event.data.percentage);
      }
    });
  `;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            ${css}
            ${previewStyles || ''}
            ${isSelectionMode ? `
              * {
                cursor: pointer !important;
              }
              *:hover {
                outline: 2px solid #007bff !important;
              }
            ` : ''}
            ${selectedPath ? `
              ${selectedPath} {
                outline: 2px solid #007bff !important;
                outline-offset: 2px !important;
                position: relative !important;
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
          </style>
          <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
          <script>${scrollScript}</script>
          <script>
            let mermaidInitialized = false;

            function initializeMermaid() {
              if (!mermaidInitialized) {
                mermaid.initialize({
                  startOnLoad: false,
                  theme: 'default',
                  securityLevel: 'loose',
                  fontFamily: 'sans-serif'
                });
                mermaidInitialized = true;
              }
            }

            // マーメイド記法のレンダリング
            document.addEventListener('DOMContentLoaded', () => {
              initializeMermaid();
              const mermaidDivs = document.querySelectorAll('.mermaid');
              
              mermaidDivs.forEach(async (div, index) => {
                try {
                  const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
                  const diagramText = div.textContent.trim();
                  const { svg } = await mermaid.render(id, diagramText);
                  div.innerHTML = svg;
                } catch (error) {
                  console.error('Error rendering mermaid:', error);
                  div.innerHTML = '<pre>Error rendering diagram: ' + error.message + '</pre>';
                }
              });
            });
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

    return () => {
      URL.revokeObjectURL(url);
      window.removeEventListener('message', handleMessage);
    }
  }, [content, css, isSelectionMode, previewStyles, selectedPath]);

  // スクロール位置の同期
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
      </div>
      <iframe
        ref={iframeRef}
        className="preview-container"
        title="Preview"
        sandbox="allow-scripts"
      />
    </div>
  );
};

export default Preview;