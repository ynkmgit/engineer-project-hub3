import './TabSelector.css'

const TabSelector = ({ activeTab, onTabChange }) => {
  return (
    <div className="tab-selector">
      <button
        className={`tab-button ${activeTab === 'markdown' ? 'active' : ''}`}
        onClick={() => onTabChange('markdown')}
      >
        Markdown
      </button>
      <button
        className={`tab-button ${activeTab === 'html' ? 'active' : ''}`}
        onClick={() => onTabChange('html')}
      >
        HTML
      </button>
      <button
        className={`tab-button ${activeTab === 'css' ? 'active' : ''}`}
        onClick={() => onTabChange('css')}
      >
        CSS
      </button>
      {activeTab === 'html' && (
        <div className="warning-message">
          ⚠️ HTMLからMarkdownへの変換は、特にMermaid記法などの特殊な記法において
          正確な変換が保証されません。可能な限りMarkdownエディタでの編集を推奨します。
        </div>
      )}
    </div>
  )
}

export default TabSelector