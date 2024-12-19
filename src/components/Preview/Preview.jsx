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
      } else if (event.data.type === 'toggleSelectionMode') {
        if (event.data.isSelectionMode) {
          document.body.classList.add('selection-mode');
        } else {
          document.body.classList.remove('selection-mode');
        }
      }
    });
  `;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const updateStyles = () => {
      const styleElement = iframe.contentDocument?.querySelector('style');
      if (styleElement) {
        styleElement.textContent = `
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
        `;
      }
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style></style>
          <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
          <script>${scrollScript}</script>
          <script>
            let mermaidInitialized = false;
            let isInSelectionMode = false;

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

            // 要素選択のためのクリックイベントハンドラーを追加
            document.addEventListener('click', function(e) {
              if (isInSelectionMode) {
                e.preventDefault();
                e.stopPropagation();

                let element = e.target;
                let path = [];
                let cssProperties = {};

                // CSSプロパティを取得
                const computedStyle = window.getComputedStyle(element);
                const properties = ['color', 'background-color', 'font-weight', 'margin-top', 'margin-right', 
                  'margin-bottom', 'margin-left', 'padding', 'border-radius', 'text-align', 'position', 'display'];
                
                properties.forEach(prop => {
                  cssProperties[prop] = computedStyle.getPropertyValue(prop);
                });

                // セレクターパスを構築
                while (element && element.tagName !== 'BODY') {
                  let selector = element.tagName.toLowerCase();
                  if (element.id) {
                    selector += '#' + element.id;
                  } else if (element.className) {
                    const classes = Array.from(element.classList)
                      .filter(className => className !== 'selection-mode')
                      .join('.');
                    if (classes) {
                      selector += '.' + classes;
                    }
                  }
                  path.unshift(selector);
                  element = element.parentElement;
                }

                // 親ウィンドウにメッセージを送信
                window.parent.postMessage({
                  type: 'elementSelected',
                  path: path.join(' > '),
                  tagName: e.target.tagName.toLowerCase(),
                  id: e.target.id,
                  className: e.target.className,
                  cssProperties: cssProperties
                }, '*');
              }
            }, true);

            // メッセージハンドラ
            window.addEventListener('message', function(event) {
              if (event.data.type === 'setScrollPosition') {
                setScrollPosition(event.data.percentage);
              } else if (event.data.type === 'toggleSelectionMode') {
                isInSelectionMode = event.data.isSelectionMode;
                if (isInSelectionMode) {
                  document.body.classList.add('selection-mode');
                } else {
                  document.body.classList.remove('selection-mode');
                }
              }
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

    // iframeのロード完了後にスタイルを更新
    iframe.onload = () => {
      updateStyles();
    };

    return () => {
      URL.revokeObjectURL(url);
      window.removeEventListener('message', handleMessage);
    }
  }, [content]);

  // CSSの変更を監視して即座に反映
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const styleElement = iframe.contentDocument.querySelector('style');
    if (styleElement) {
      styleElement.textContent = `
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
      `;
    }
  }, [css, previewStyles, isSelectionMode, selectedPath]);

  // 選択モードの切り替えを監視
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    iframe.contentWindow.postMessage({
      type: 'toggleSelectionMode',
      isSelectionMode
    }, '*');
  }, [isSelectionMode]);

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
        sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
        onLoad={() => {
          const iframe = iframeRef.current;
          if (iframe && iframe.contentWindow) {
            // 初期状態を設定
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