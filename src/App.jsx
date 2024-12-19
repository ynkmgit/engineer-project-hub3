import { useState, useEffect } from 'react'
import Editor from './components/Editor/Editor'
import Preview from './components/Preview/Preview'
import TabSelector from './components/TabSelector/TabSelector'
import Toolbar from './components/Toolbar/Toolbar'
import CSSPropertyMenu from './components/CSSEditor/CSSPropertyMenu'
import { htmlToMarkdown, markdownToHtml } from './utils/converter'
import websocketService from './services/websocket'
import './styles/global.css'

function App() {
  const [markdown, setMarkdown] = useState('# Hello World\n\nStart editing to see some magic happen!')
  const [html, setHtml] = useState('<h1>Hello World</h1>\n<p>Start editing to see some magic happen!</p>')
  const [css, setCss] = useState('/* Add your styles here */\n\nbody {\n  font-family: Arial, sans-serif;\n}')
  const [activeTab, setActiveTab] = useState('markdown')
  const [selectedElement, setSelectedElement] = useState(null)
  const [previewStyles, setPreviewStyles] = useState('')

  useEffect(() => {
    // WebSocket接続の確立
    websocketService.connect();

    // コンテンツ変更の購読
    const unsubscribe = websocketService.subscribe('contentChange', (data) => {
      const { mode, content } = data;
      switch (mode) {
        case 'markdown':
          setMarkdown(content);
          break;
        case 'css':
          setCss(content);
          break;
      }
    });

    return () => {
      unsubscribe();
      websocketService.disconnect();
    };
  }, []);

  const handleContentChange = (value) => {
    switch (activeTab) {
      case 'markdown':
        setMarkdown(value);
        const convertedHtml = markdownToHtml(value);
        setHtml(convertedHtml);
        break;
      case 'css':
        setCss(value);
        break;
    }
  }

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'markdown':
        return markdown
      case 'css':
        return css
      default:
        return ''
    }
  }

  const handleElementSelect = (elementData) => {
    setSelectedElement(elementData)
    setActiveTab('css')
  }

  const handleUpdateElement = (updates) => {
    // HTMLを更新
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const element = doc.querySelector(updates.originalPath);

    if (element) {
      // IDの更新（nullの場合は属性を削除）
      if (updates.id === null) {
        element.removeAttribute('id');
      } else if (updates.id) {
        element.id = updates.id;
      }

      // クラスの更新（nullの場合は属性を削除）
      if (updates.className === null) {
        element.removeAttribute('class');
      } else if (updates.className) {
        element.className = updates.className;
      }

      // 更新されたHTMLを設定
      const updatedHtml = doc.body.innerHTML;
      setHtml(updatedHtml);

      // Markdownも更新
      const convertedMarkdown = htmlToMarkdown(updatedHtml);
      setMarkdown(convertedMarkdown);
    }
  };

  const handleApplyStyles = (cssRule) => {
    setCss(prevCss => {
      const cssRules = prevCss.split(/}\s*/)
      const selector = cssRule.split('{')[0].trim()
      const existingRuleIndex = cssRules.findIndex(rule =>
        rule.trim().startsWith(selector)
      )

      if (existingRuleIndex !== -1) {
        cssRules[existingRuleIndex] = cssRule
      } else {
        cssRules.push(cssRule)
      }

      return cssRules
        .filter(rule => rule.trim())
        .map(rule => rule.trim() + (rule.endsWith('}') ? '' : '}'))
        .join('\n\n')
    })
    setSelectedElement(null)
    setPreviewStyles('')
  }

  return (
    <div className="app-container">
      <div className="editor-section">
        <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />
        <Toolbar
          onConvertToMarkdown={null}
          onConvertToHtml={null}
          activeTab={activeTab}
        />
        <Editor
          value={getCurrentContent()}
          onChange={handleContentChange}
          mode={activeTab}
        />
      </div>
      <Preview
        markdown={markdown} // CSSタブでもマークダウンを表示
        isHtml={false} // HTML編集を無効化したので常にfalse
        css={css}
        previewStyles={previewStyles}
        onElementSelect={handleElementSelect}
      />
      {selectedElement && (
        <CSSPropertyMenu
          selectedElement={selectedElement}
          onApplyStyles={handleApplyStyles}
          onClose={() => {
            setSelectedElement(null)
            setPreviewStyles('')
          }}
          onPreviewStyles={setPreviewStyles}
          onUpdateElement={handleUpdateElement}
        />
      )}
    </div>
  )
}

export default App