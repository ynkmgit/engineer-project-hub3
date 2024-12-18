import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'
import './Editor.css'

const Editor = ({ value, onChange, mode }) => {
  const editorRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: value,
        language: mode === 'markdown' ? 'markdown' : 'html',
        theme: 'vs-dark',
        minimap: { enabled: false },
        wordWrap: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        roundedSelection: false,
        cursorStyle: 'line',
        fontSize: 14,
        tabSize: 2,
      })

      editorRef.current.onDidChangeModelContent(() => {
        onChange(editorRef.current.getValue())
      })
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose()
      }
    }
  }, [mode])

  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue()
      if (currentValue !== value) {
        editorRef.current.setValue(value)
      }
      
      monaco.editor.setModelLanguage(
        editorRef.current.getModel(),
        mode === 'markdown' ? 'markdown' : 'html'
      )
    }
  }, [value, mode])

  return <div ref={containerRef} className="editor-container" />
}

export default Editor