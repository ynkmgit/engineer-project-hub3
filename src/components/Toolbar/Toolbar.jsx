import './Toolbar.css';

const Toolbar = ({ onConvertToMarkdown, onConvertToHtml, activeTab }) => {
  return (
    <div className="toolbar">
      {activeTab === 'html' && (
        <button 
          className="toolbar-button"
          onClick={onConvertToMarkdown}
          title="Convert HTML to Markdown"
        >
          Convert to Markdown
        </button>
      )}
      {activeTab === 'markdown' && (
        <button 
          className="toolbar-button"
          onClick={onConvertToHtml}
          title="Convert Markdown to HTML"
        >
          Convert to HTML
        </button>
      )}
    </div>
  );
};

export default Toolbar;