import { marked } from 'marked';

export const convertMarkdownToHtml = (markdown) => {
  return marked(markdown);
};