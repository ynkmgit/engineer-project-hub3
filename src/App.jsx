import { useState } from 'react'
import Editor from './components/Editor/Editor'
import Preview from './components/Preview/Preview'
import TabSelector from './components/TabSelector/TabSelector'
import Toolbar from './components/Toolbar/Toolbar'
import { htmlToMarkdown, markdownToHtml } from './utils/converter'
import './styles/global.css'

function App() {
  const [markdown, setMarkdown] = useState('# Hello World\n\nStart editing to see some magic happen!')
  const [html, setHtml] = useState('<h1>Hello World</h1>\n<p>Start editing to see some magic happen!</p>')
  const [activeTab, setActiveTab] = useState('markdown')

  const handleContentChange = (value) => {
    if (activeTab === 'markdown') {
      setMarkdown(value)
    } else {
      setHtml(value)
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
          value={activeTab === 'markdown' ? markdown : html}
          onChange={handleContentChange}
          mode={activeTab}
        />
      </div>
      <Preview 
        markdown={activeTab === 'markdown' ? markdown : html} 
        isHtml={activeTab === 'html'}
      />
    </div>
  )
}

export default App