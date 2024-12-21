import TurndownService from 'turndown';
import { marked } from 'marked';
import hljs from 'highlight.js';

const markedOptions = {
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error('Highlight.js error:', err);
        return code;
      }
    }
    return code;
  }
};

marked.setOptions({
  ...markedOptions,
  gfm: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  xhtml: true
});

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

turndownService.addRule('mermaid', {
  filter: (node) => {
    return node.classList && node.classList.contains('mermaid');
  },
  replacement: (content) => {
    return `\n\`\`\`mermaid\n${content}\n\`\`\`\n`;
  }
});

export const htmlToMarkdown = (html) => {
  if (!html) return '';
  try {
    return turndownService.turndown(html);
  } catch (error) {
    console.error('HTML to Markdown conversion error:', error);
    return '';
  }
};

// マーメイド図のコードを安全に処理する関数
const processMermaidCode = (code) => {
  // コードの前後の空白を削除
  code = code.trim();
  
  // 各行を処理
  const lines = code.split('\n').map(line => {
    // 行の前後の空白を削除
    line = line.trim();
    // コメント行は保持
    if (line.startsWith('%%')) {
      return line;
    }
    // 空行はスキップ
    if (!line) {
      return '';
    }
    return line;
  });

  // 空行を除去して結合
  return lines.filter(line => line !== '').join('\n');
};

export const markdownToHtml = (markdown) => {
  if (!markdown || typeof markdown !== 'string') return '';

  try {
    // テンポラリIDを生成する関数
    const generateTempId = () => `temp_${Math.random().toString(36).substr(2, 9)}`;
    
    // マーメイド図とコードブロックを一時的に保存
    const blocks = new Map();
    
    // マークダウンを処理
    let processedMarkdown = markdown;

    // 1. まず、マーメイド図を処理
    processedMarkdown = processedMarkdown.replace(/```mermaid\n([\s\S]*?)```/g, (match, code) => {
      const id = generateTempId();
      const processedCode = processMermaidCode(code);
      blocks.set(id, {
        type: 'mermaid',
        content: processedCode
      });
      return `\nMERMAID_${id}\n`;
    });

    // 2. 次に、その他のコードブロックを処理
    processedMarkdown = processedMarkdown.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      // マーメイドのプレースホルダーはスキップ
      if (match.includes('MERMAID_')) {
        return match;
      }
      const id = generateTempId();
      blocks.set(id, {
        type: 'code',
        lang: lang.trim(),
        content: code.trim()
      });
      return `\nCODE_${id}\n`;
    });

    // 3. マークダウンをHTMLに変換
    let html = marked(processedMarkdown);

    // 4. マーメイド図を復元
    blocks.forEach((block, id) => {
      if (block.type === 'mermaid') {
        const placeholder = `<p>MERMAID_${id}</p>`;
        if (html.includes(placeholder)) {
          html = html.replace(
            placeholder,
            `<div class="mermaid">\n${block.content}\n</div>`
          );
        }
      } else if (block.type === 'code') {
        const placeholder = `<p>CODE_${id}</p>`;
        if (html.includes(placeholder)) {
          const code = block.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          
          if (block.lang && hljs.getLanguage(block.lang)) {
            const highlighted = hljs.highlight(code, { language: block.lang }).value;
            html = html.replace(
              placeholder,
              `<pre><code class="hljs language-${block.lang}">${highlighted}</code></pre>`
            );
          } else {
            html = html.replace(
              placeholder,
              `<pre><code>${code}</code></pre>`
            );
          }
        }
      }
    });

    return html;
  } catch (error) {
    console.error('Markdown to HTML conversion error:', error);
    return markdown;
  }
};