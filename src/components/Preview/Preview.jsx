import { marked } from 'marked'
import { useEffect, useRef } from 'react'
import './Preview.css'

const Preview = ({ markdown, isHtml, css }) => {
  const iframeRef = useRef(null)
  const content = isHtml ? markdown : marked(markdown)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    // Create a blob URL for the content with proper encoding
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${css}</style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    // Set the iframe src to the blob URL
    iframe.src = url

    // Cleanup
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [content, css])

  return (
    <iframe
      ref={iframeRef}
      className="preview-container"
      title="Preview"
      sandbox="allow-scripts"
    />
  )
}

export default Preview