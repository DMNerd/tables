import DOMPurify, { type Config } from 'dompurify';

type ExtraConfig = Partial<Config>;

export const sanitizeHtml = (html: string, extra: ExtraConfig = {}): string =>
  DOMPurify.sanitize(html, {
    ADD_TAGS: ['table', 'tr', 'td', 'th'],
    ...extra,
  }) as string;

export const sanitizeText = (text: string): string => DOMPurify.sanitize(text) as string;
