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
    </div>
  )
}

export default TabSelector