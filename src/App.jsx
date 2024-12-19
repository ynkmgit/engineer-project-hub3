import { useState, useEffect, useCallback } from 'react'
import Editor from './components/Editor/Editor'
import Preview from './components/Preview/Preview'
import TabSelector from './components/TabSelector/TabSelector'
import Toolbar from './components/Toolbar/Toolbar'
import CSSPropertyMenu from './components/CSSEditor/CSSPropertyMenu'
import { htmlToMarkdown, markdownToHtml } from './utils/converter'
import websocketService from './services/websocket'
import './styles/global.css'

function App() {
  const [markdown, setMarkdown] = useState(`
# マークダウン＆マーメイドプレゼンテーションエディタへようこそ！ 🎉

このWebベースのエディタを使えば、マークダウンとマーメイド記法で美しいプレゼンテーションを作成できます。

## 🖊️ マークダウンの基本

### 見出し
# 見出し1
## 見出し2 
### 見出し3

### リスト
- 項目1
- 項目2
  - 項目2a
  - 項目2b

### リンクと画像
[Googleへのリンク](https://www.google.com)
![代替テキスト](https://picsum.photos/200/300)

## 🎨 マーメイド図形

\`\`\`mermaid
graph TD
    A[開始] --> B{条件分岐}
    B -->|はい| C[OK]
    B -->|いいえ| D[終了] 
\`\`\`

## ✨ エディタの機能
- リアルタイムプレビュー
- HTML/PDFへのエクスポート
- 共同編集
- など

さあ、編集を始めて、マークダウンとマーメイドの魔法を体験しましょう！ 🪄
`);
  const [html, setHtml] = useState(`
<h1>マークダウン＆マーメイドプレゼンテーションエディタへようこそ！ 🎉</h1>

<p>このWebベースのエディタを使えば、マークダウンとマーメイド記法で美しいプレゼンテーションを作成できます。</p>

<h2>🖊️ マークダウンの基本</h2>

<h3>見出し</h3>
<h1>見出し1</h1>
<h2>見出し2</h2>
<h3>見出し3</h3>

<h3>リスト</h3>
<ul>
  <li>項目1</li>
  <li>項目2
    <ul>
      <li>項目2a</li>
      <li>項目2b</li>
    </ul>
  </li>
</ul>

<h3>リンクと画像</h3>
<p><a href="https://www.google.com">Googleへのリンク</a></p>
<p><img src="https://picsum.photos/200/300" alt="代替テキスト" /></p>

<h2>🎨 マーメイド図形</h2>

<p></p>
<div class="mermaid">graph TD
    A[開始] --&gt; B{条件分岐}
    B --&gt;|はい| C[OK]
    B --&gt;|いいえ| D[終了]</div>
<p></p>

<h2>✨ エディタの機能</h2>
<ul>
  <li>リアルタイムプレビュー</li>
  <li>HTML/PDFへのエクスポート</li>
  <li>共同編集</li>
  <li>など</li>
</ul>

<p>さあ、編集を始めて、マークダウンとマーメイドの魔法を体験しましょう！ 🪄</p>
`);
  const [css, setCss] = useState('/* Add your styles here */\n\nbody {\n  font-family: Arial, sans-serif;\n}')
  const [activeTab, setActiveTab] = useState('markdown')
  const [selectedElement, setSelectedElement] = useState(null)
  const [previewStyles, setPreviewStyles] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const [editorScrollPosition, setEditorScrollPosition] = useState(null)
  const [previewScrollPosition, setPreviewScrollPosition] = useState(null)

  useEffect(() => {
    websocketService.connect();
    return () => websocketService.disconnect();
  }, []);

  const handleWebSocketMessage = useCallback((data) => {
    const { mode, content } = data;
    setIsConverting(true);
    try {
      switch (mode) {
        case 'markdown':
          setMarkdown(content);
          setHtml(markdownToHtml(content));
          break;
        case 'html':
          setHtml(content);
          setMarkdown(htmlToMarkdown(content));
          break;
        case 'css':
          setCss(content);
          break;
      }
    } catch (error) {
      console.error('Error during content sync:', error);
    } finally {
      setIsConverting(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe('contentChange', handleWebSocketMessage);
    return () => unsubscribe();
  }, [handleWebSocketMessage]);

  // タイマーを使用してスクロールの連続性を制御
  const setScrollTimeout = useCallback(() => {
    setScrolling(true);
    return setTimeout(() => setScrolling(false), 150);
  }, []);

  // エディタのスクロールハンドラ
  const handleEditorScroll = useCallback((info) => {
    if (!scrolling && activeTab !== 'css') {
      const timeoutId = setScrollTimeout();
      setPreviewScrollPosition(info);
      return () => clearTimeout(timeoutId);
    }
  }, [scrolling, activeTab, setScrollTimeout]);

  // プレビューのスクロールハンドラ
  const handlePreviewScroll = useCallback((info) => {
    if (!scrolling && activeTab !== 'css') {
      const timeoutId = setScrollTimeout();
      setEditorScrollPosition(info);
      return () => clearTimeout(timeoutId);
    }
  }, [scrolling, activeTab, setScrollTimeout]);

  const getCurrentContent = useCallback(() => {
    switch (activeTab) {
      case 'markdown':
        return markdown;
      case 'html':
        return html;
      case 'css':
        return css;
      default:
        return '';
    }
  }, [activeTab, markdown, html, css]);

  const handleContentChange = (value) => {
    if (isConverting) return;

    setIsConverting(true);
    try {
      switch (activeTab) {
        case 'markdown':
          setMarkdown(value);
          setHtml(markdownToHtml(value));
          websocketService.sendMessage('contentChange', {
            mode: 'markdown',
            content: value
          });
          break;
        case 'html':
          setHtml(value);
          setMarkdown(htmlToMarkdown(value));
          websocketService.sendMessage('contentChange', {
            mode: 'html',
            content: value
          });
          break;
        case 'css':
          setCss(value);
          websocketService.sendMessage('contentChange', {
            mode: 'css',
            content: value
          });
          break;
      }
    } catch (error) {
      console.error('Error during content conversion:', error);
    } finally {
      setIsConverting(false);
    }
  }

  const handleElementSelect = (elementData) => {
    setSelectedElement(elementData)
    setActiveTab('css')
  }

  const handleUpdateElement = (updates) => {
    if (isConverting) return;

    setIsConverting(true);
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const element = doc.querySelector(updates.originalPath);

      if (element) {
        if (updates.id === null) {
          element.removeAttribute('id');
        } else if (updates.id) {
          element.id = updates.id;
        }

        if (updates.className === null) {
          element.removeAttribute('class');
        } else if (updates.className) {
          element.className = updates.className;
        }

        const updatedHtml = doc.body.innerHTML;
        setHtml(updatedHtml);
        setMarkdown(htmlToMarkdown(updatedHtml));

        websocketService.sendMessage('contentChange', {
          mode: 'html',
          content: updatedHtml
        });
      }
    } catch (error) {
      console.error('Error updating element:', error);
    } finally {
      setIsConverting(false);
    }
  };

  const handleApplyStyles = (cssRule) => {
    if (isConverting) return;

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

      const updatedCss = cssRules
        .filter(rule => rule.trim())
        .map(rule => rule.trim() + (rule.endsWith('}') ? '' : '}'))
        .join('\n\n');

      websocketService.sendMessage('contentChange', {
        mode: 'css',
        content: updatedCss
      });

      return updatedCss;
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
          onScroll={handleEditorScroll}
          scrollPosition={editorScrollPosition}
        />
      </div>
      <Preview
        markdown={activeTab === 'css' ? markdown : (activeTab === 'markdown' ? markdown : html)}
        isHtml={activeTab === 'html'}
        css={css}
        previewStyles={previewStyles}
        onElementSelect={handleElementSelect}
        onScroll={handlePreviewScroll}
        scrollPosition={previewScrollPosition}
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