import { useEffect, useRef, useState } from 'react'
import { markdownToHtml } from '../../utils/converter'
import './Preview.css'
import 'highlight.js/styles/github.css'

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

  /**
   * プレビューを新しいタブで開く関数
   * 現在のコンテンツとスタイルを維持したHTMLを生成し、新しいタブで表示する
   * highlight.jsとmermaidの機能を保持したまま表示される
   */
  const openInNewTab = () => {
    // 新しいタブで表示するHTMLコンテンツを構築
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <!-- シンタックスハイライト用のスタイルシート -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
        <style>
          /* 基本的なページスタイル */
          body {
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }

          /* コードブロックのスタイル - GitHubライクな表示 */
          pre {
            background-color: #f6f8fa;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
            overflow: auto;
            font-size: 14px;
            line-height: 1.45;
            border: 1px solid #e1e4e8;
          }

          /* コードブロック内のコード要素のスタイル */
          pre code {
            background: none;
            padding: 0;
            font-size: inherit;
            white-space: pre;
            word-break: normal;
            overflow-wrap: normal;
            font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
          }

          /* インラインコードのスタイル - 文中で使用されるコード */
          :not(pre) > code {
            background-color: rgba(175, 184, 193, 0.2);
            padding: 0.2em 0.4em;
            border-radius: 6px;
            font-size: 85%;
            font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
          }

          /* highlight.jsのスタイル調整 */
          .hljs {
            background: transparent;
            padding: 0;
            font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
          }

          /* ユーザー定義のカスタムスタイル */
          ${css}
        </style>
        <!-- マーメイド図表示用のスクリプト -->
        <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
        <script>
          // DOMコンテンツ読み込み完了後にマーメイド図を初期化・描画
          document.addEventListener('DOMContentLoaded', () => {
            // マーメイドの初期設定
            mermaid.initialize({
              startOnLoad: false,
              theme: 'default',
              securityLevel: 'loose',
              fontFamily: 'sans-serif'
            });

            // ページ内のすべてのマーメイド図を検索して描画
            const mermaidDivs = document.querySelectorAll('.mermaid');
            mermaidDivs.forEach(async (div, index) => {
              try {
                // 一意のIDを生成して図を描画
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

    // BlobとしてHTMLを作成し、URLを生成
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 新しいタブでURLを開く
    window.open(url, '_blank');

    // メモリリークを防ぐため、使用後にURLを解放
    // 非同期でURLを解放することで、ページの読み込みに影響を与えない
    setTimeout(() => URL.revokeObjectURL(url), 0);
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

            document.addEventListener('click', function(e) {
              if (isInSelectionMode) {
                e.preventDefault();
                e.stopPropagation();

                let element = e.target;
                let path = [];
                let cssProperties = {};

                const computedStyle = window.getComputedStyle(element);
                const properties = ['color', 'background-color', 'font-weight', 'margin-top', 'margin-right', 
                  'margin-bottom', 'margin-left', 'padding', 'border-radius', 'text-align', 'position', 'display'];
                
                properties.forEach(prop => {
                  cssProperties[prop] = computedStyle.getPropertyValue(prop);
                });

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

    iframe.onload = () => {
      const styleElement = iframe.contentDocument?.querySelector('style');
      if (styleElement) {
        styleElement.textContent = `
          body {
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }

          /* コードブロックのスタイル */
          pre {
            background-color: #f6f8fa;
            border-radius: 6px;
            padding: 16px;
            overflow: auto;
            font-size: 14px;
            line-height: 1.45;
          }

          code {
            font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
          }

          /* インラインコードのスタイル */
          :not(pre) > code {
            background-color: rgba(175, 184, 193, 0.2);
            padding: 0.2em 0.4em;
            border-radius: 6px;
            font-size: 85%;
          }

          .hljs {
            background: transparent;
            padding: 0;
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

    return () => {
      URL.revokeObjectURL(url);
      window.removeEventListener('message', handleMessage);
    }
  }, [content, css, previewStyles, isSelectionMode, selectedPath, scrollScript]);

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