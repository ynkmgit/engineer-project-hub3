import { useState } from 'react'
import Editor from './components/Editor/Editor'
import Preview from './components/Preview/Preview'
import TabSelector from './components/TabSelector/TabSelector'
import Toolbar from './components/Toolbar/Toolbar'
import CSSPropertyMenu from './components/CSSEditor/CSSPropertyMenu'
import { htmlToMarkdown, markdownToHtml } from './utils/converter'
import './styles/global.css'

function App() {
  const [markdown, setMarkdown] = useState('# Hello World\n\nStart editing to see some magic happen!')
  const [html, setHtml] = useState('<h1>Hello World</h1>\n<p>Start editing to see some magic happen!</p>')
  const [css, setCss] = useState('/* Add your styles here */\n\nbody {\n  font-family: Arial, sans-serif;\n}')
  const [activeTab, setActiveTab] = useState('markdown')
  const [selectedElement, setSelectedElement] = useState(null)
  const [previewStyles, setPreviewStyles] = useState('')

  const handleContentChange = (value) => {
    switch (activeTab) {
      case 'markdown':
        setMarkdown(value)
        break
      case 'html':
        setHtml(value)
        break
      case 'css':
        setCss(value)
        break
    }
  }

  const handleConvertToMarkdown = () => {
    try {
      const convertedMarkdown = htmlToMarkdown(html)
      setMarkdown(convertedMarkdown)
      setActiveTab('markdown')
    } catch (error) {
      console.error('Error converting HTML to Markdown:', error)
      alert('Error converting HTML to Markdown. Please check your HTML syntax.')
    }
  }

  const handleConvertToHtml = () => {
    try {
      const convertedHtml = markdownToHtml(markdown)
      // Format the HTML with proper indentation
      const formattedHtml = convertedHtml
        .replace(/></g, '>\n<')
        .replace(/^/gm, '  ')
        .trim()
      setHtml(formattedHtml)
      setActiveTab('html')
    } catch (error) {
      console.error('Error converting Markdown to HTML:', error)
      alert('Error converting Markdown to HTML. Please check your Markdown syntax.')
    }
  }

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'markdown':
        return markdown
      case 'html':
        return html
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
          onConvertToMarkdown={handleConvertToMarkdown}
          onConvertToHtml={handleConvertToHtml}
          activeTab={activeTab}
        />
        <Editor
          value={getCurrentContent()}
          onChange={handleContentChange}
          mode={activeTab}
        />
      </div>
      <Preview
        markdown={activeTab === 'markdown' ? markdown : html}
        isHtml={activeTab === 'html'}
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
        />
      )}
    </div>
  )
}

export default App