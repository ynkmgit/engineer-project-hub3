import { marked } from 'marked'
import { useEffect, useRef, useState } from 'react'
import { markdownToHtml } from '../../utils/converter'
import './Preview.css'

const Preview = ({ markdown, isHtml, css, onElementSelect, previewStyles }) => {
  const iframeRef = useRef(null)
  const content = isHtml ? markdown : markdownToHtml(markdown)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedPath, setSelectedPath] = useState(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
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
          <script>
            document.addEventListener('click', (e) => {
              if (${isSelectionMode}) {
                e.preventDefault();
                e.stopPropagation();
                
                const element = e.target;
                const styles = window.getComputedStyle(element);
                const cssProperties = {};
                
                for (let prop of styles) {
                  cssProperties[prop] = styles.getPropertyValue(prop);
                }

                const path = generateSelector(element);
                window.parent.postMessage({
                  type: 'elementSelected',
                  tagName: element.tagName.toLowerCase(),
                  cssProperties,
                  path,
                  id: element.id || '',
                  className: element.className || ''
                }, '*');
              }
            }, true);

            function generateSelector(element) {
              if (!element) return '';
              if (element === document.body) return 'body';
              
              let selector = element.tagName.toLowerCase();
              if (element.id) {
                selector += '#' + element.id;
              } else if (element.className) {
                selector += '.' + Array.from(element.classList).join('.');
              }
              
              const parent = element.parentElement;
              if (parent && parent !== document.body) {
                return generateSelector(parent) + ' > ' + selector;
              }
              
              return selector;
            }
          </script>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    iframe.src = url

    const handleMessage = (event) => {
      if (event.data.type === 'elementSelected') {
        setSelectedPath(event.data.path);
        onElementSelect?.(event.data);
        setIsSelectionMode(false);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      URL.revokeObjectURL(url);
      window.removeEventListener('message', handleMessage);
    }
  }, [content, css, isSelectionMode, previewStyles, selectedPath])

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
  )
}

export default Preview