import { marked } from 'marked';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

export const htmlToMarkdown = (html) => {
  return turndownService.turndown(html);
};

export const markdownToHtml = (markdown) => {
  return marked(markdown);
};