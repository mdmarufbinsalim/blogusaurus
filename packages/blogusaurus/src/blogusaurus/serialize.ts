import { NodeApi, createSlateEditor } from 'platejs';
import { MarkdownPlugin } from '@platejs/markdown';

import { BlogusaurusStaticKit } from './static-kit';
import type { BlogusaurusContent } from './types';

export const emptyContent = (): BlogusaurusContent => [
  { type: 'p', children: [{ text: '' }] },
];

/**
 * Accepts what your database is likely to hold: the Plate JSON value, a JSON
 * string of it, or nothing. Always returns a valid, non-empty document.
 */
export function parseContent(
  input: BlogusaurusContent | string | null | undefined
): BlogusaurusContent {
  if (!input) return emptyContent();

  let value: unknown = input;

  if (typeof input === 'string') {
    try {
      value = JSON.parse(input);
    } catch {
      return emptyContent();
    }
  }

  return Array.isArray(value) && value.length > 0
    ? (value as BlogusaurusContent)
    : emptyContent();
}

export const contentToText = (content: BlogusaurusContent) =>
  content.map((node) => NodeApi.string(node)).join('\n');

export function countWords(content: BlogusaurusContent) {
  const text = contentToText(content).trim();

  return text ? text.split(/\s+/).length : 0;
}

/** ~225 wpm, never less than 1 minute. */
export const readingTime = (content: BlogusaurusContent) =>
  Math.max(1, Math.round(countWords(content) / 225));

export const slugify = (input: string) =>
  input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const markdownEditor = (value: BlogusaurusContent) =>
  createSlateEditor({ plugins: BlogusaurusStaticKit, value });

export const contentToMarkdown = (content: BlogusaurusContent) =>
  markdownEditor(content).getApi(MarkdownPlugin).markdown.serialize();

export const markdownToContent = (markdown: string): BlogusaurusContent =>
  markdownEditor(emptyContent()).getApi(MarkdownPlugin).markdown.deserialize(markdown);
