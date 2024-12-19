import TurndownService from 'turndown';
import { marked } from 'marked';
import hljs from 'highlight.js';

// シンタックスハイライトの設定
const markedOptions = {
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, code).value;
      } catch (err) {
        console.error('Highlight.js error:', err);
        return code;
      }
    }
    return code;
  }
};

// Markdownパーサーの設定
marked.setOptions({
  ...markedOptions,
  gfm: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  xhtml: true
});

// Turndownサービスのインスタンスを作成
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

// マーメイド記法のカスタムルールを追加
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

export const markdownToHtml = (markdown) => {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  try {
    // マーメイドブロックを一時的に保護
    const mermaidBlocks = new Map();
    let processedMarkdown = markdown.replace(/```mermaid\n([\s\S]*?)```/g, (match, code) => {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      mermaidBlocks.set(id, code.trim());
      return `MERMAID_PLACEHOLDER_${id}`;
    });

    // 通常のコードブロックを一時的に保護（マーメイド以外）
    const codeBlocks = new Map();
    processedMarkdown = processedMarkdown.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      // マーメイドのプレースホルダーはスキップ
      if (match.includes('MERMAID_PLACEHOLDER_')) {
        return match;
      }
      const id = `code-${Math.random().toString(36).substr(2, 9)}`;
      codeBlocks.set(id, { 
        lang: lang ? lang.trim() : '', 
        code: code.trim() 
      });
      return `CODE_PLACEHOLDER_${id}`;
    });

    // マークダウンをHTMLに変換
    let html = marked(processedMarkdown);

    // マーメイドブロックを復元
    mermaidBlocks.forEach((code, id) => {
      html = html.replace(
        `<p>MERMAID_PLACEHOLDER_${id}</p>`,
        `<div class="mermaid">${code}</div>`
      );
    });

    // 通常のコードブロックを復元
    codeBlocks.forEach(({ lang, code }, id) => {
      const highlightedCode = lang && hljs.getLanguage(lang)
        ? hljs.highlight(code, { language: lang }).value
        : code;

      html = html.replace(
        `<p>CODE_PLACEHOLDER_${id}</p>`,
        `<pre><code class="hljs language-${lang}">${highlightedCode}</code></pre>`
      );
    });

    return html;
  } catch (error) {
    console.error('Markdown to HTML conversion error:', error);
    return markdown;
  }
};