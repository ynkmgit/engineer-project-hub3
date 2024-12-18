import TurndownService from 'turndown';
import { marked } from 'marked';

// Turndownサービスのインスタンスを作成
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

// 要素のID・クラス情報を属性記法に変換する関数
const getAttributeString = (element) => {
  const attributes = [];

  if (element.id) {
    attributes.push(`#${element.id}`);
  }

  if (element.className) {
    const classes = element.className.split(' ').filter(c => c);
    if (classes.length > 0) {
      attributes.push(...classes.map(c => `.${c}`));
    }
  }

  return attributes.length > 0 ? ` {${attributes.join(' ')}}` : '';
};

// 見出し要素のカスタムルールを追加
turndownService.addRule('headingWithAttributes', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement: function (content, node, options) {
    const hLevel = node.nodeName.charAt(1);
    const hashes = '#'.repeat(hLevel);
    const attributeString = getAttributeString(node);
    return `\n\n${hashes} ${content}${attributeString}\n\n`;
  }
});

// 段落要素のカスタムルールを追加
turndownService.addRule('paragraphWithAttributes', {
  filter: 'p',
  replacement: function (content, node, options) {
    const attributeString = getAttributeString(node);
    return `\n\n${content}${attributeString}\n\n`;
  }
});

// その他のブロック要素のカスタムルールを追加
turndownService.addRule('blockElementWithAttributes', {
  filter: ['div', 'section', 'article', 'aside', 'nav', 'header', 'footer'],
  replacement: function (content, node, options) {
    const attributeString = getAttributeString(node);
    return `\n\n${content}${attributeString}\n\n`;
  }
});

// インライン要素のカスタムルールを追加
turndownService.addRule('inlineElementWithAttributes', {
  filter: ['span', 'strong', 'em', 'code', 'a'],
  replacement: function (content, node, options) {
    const attributeString = getAttributeString(node);
    // インライン要素の場合は改行を入れない
    return `${content}${attributeString}`;
  }
});

export const htmlToMarkdown = (html) => {
  return turndownService.turndown(html);
};

// マークダウンの属性記法を解析してHTMLタグに変換する関数
const processMarkdownAttributes = (markdown) => {
  // 属性情報を抽出して保存
  const attributes = new Map();
  let processedMarkdown = markdown;

  // 見出しの属性を処理
  processedMarkdown = processedMarkdown.replace(
    /^(#{1,6})\s+(.+?)\s*(\{[#\.][^\}]+\})\s*$/gm,
    (match, hashes, content, attrs) => {
      const level = hashes.length;
      const key = `${content.trim()}_h${level}`;

      if (attrs) {
        const attrList = attrs.slice(1, -1).split(/\s+/);
        let id = '';
        const classes = [];

        attrList.forEach(attr => {
          if (attr.startsWith('#')) {
            id = attr.slice(1);
          } else if (attr.startsWith('.')) {
            classes.push(attr.slice(1));
          }
        });

        attributes.set(key, { tag: `h${level}`, id, classes });
      }

      return `${hashes} ${content.trim()}`;
    }
  );

  // 段落の属性を処理
  const paragraphMatches = [...processedMarkdown.matchAll(/^([^#\n].*?)(\{[#\.][^\}]+\})\s*$/gm)];
  paragraphMatches.reverse().forEach(match => {
    const [fullMatch, content, attrs] = match;
    const cleanContent = content.trim();
    const key = `${cleanContent}_p`;

    const attrList = attrs.slice(1, -1).split(/\s+/);
    let id = '';
    const classes = [];

    attrList.forEach(attr => {
      if (attr.startsWith('#')) {
        id = attr.slice(1);
      } else if (attr.startsWith('.')) {
        classes.push(attr.slice(1));
      }
    });

    attributes.set(key, { tag: 'p', id, classes });

    // 属性記法を削除
    processedMarkdown = processedMarkdown.slice(0, match.index) +
      cleanContent +
      processedMarkdown.slice(match.index + fullMatch.length);
  });

  // マークダウンをHTMLに変換
  let html = marked(processedMarkdown);

  // 保存した属性を対応する要素に適用
  attributes.forEach((attr, key) => {
    const [content, tag] = key.split('_');
    const escapedContent = content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 段落の場合は、より柔軟なマッチングを使用
    const regex = tag === 'p'
      ? new RegExp(`<p>${escapedContent}(?:</p>|\\s*$)`)
      : new RegExp(`<${tag}>${escapedContent}</${tag}>`);

    html = html.replace(regex, (match) => {
      let attrString = '';
      if (attr.id) attrString += ` id="${attr.id}"`;
      if (attr.classes.length > 0) attrString += ` class="${attr.classes.join(' ')}"`;
      return `<${attr.tag}${attrString}>${content}</${attr.tag}>`;
    });
  });

  // HTMLを整形
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 不要なhead要素とbody要素を削除し、直接HTML文字列を生成
  return Array.from(doc.body.children)
    .map(element => element.outerHTML)
    .join('\n');
};

export const markdownToHtml = (markdown) => {
  return processMarkdownAttributes(markdown);
};