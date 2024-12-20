// スクロール関連の定数
export const SCROLL_DEBOUNCE_TIME = 100;
export const BASE_STYLES = `
  body {
    margin: 0;
    padding: 20px;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  /* コードブロックのスタイル */
  pre {
    background-color: #f6f8fa;
    border-radius: 6px;
    padding: 16px;
    overflow: auto;
    font-size: 14px;
    line-height: 1.45;
  }

  code {
    font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  }

  /* インラインコードのスタイル */
  :not(pre) > code {
    background-color: rgba(175, 184, 193, 0.2);
    padding: 0.2em 0.4em;
    border-radius: 6px;
    font-size: 85%;
  }

  .hljs {
    background: transparent;
    padding: 0;
  }
`;

export const SELECTION_MODE_STYLES = `
  * {
    cursor: pointer !important;
  }
  *:hover {
    outline: 2px solid #007bff !important;
  }
`;

export const SELECTED_ELEMENT_STYLES = `
  outline: 2px solid #007bff !important;
  outline-offset: 2px !important;
  position: relative !important;
`;
