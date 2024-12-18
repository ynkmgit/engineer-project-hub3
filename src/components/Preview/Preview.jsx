import { marked } from 'marked'
import './Preview.css'

const Preview = ({ markdown, isHtml }) => {
  const content = isHtml ? markdown : marked(markdown)

  return (
    <div 
      className="preview-container"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

export default Preview