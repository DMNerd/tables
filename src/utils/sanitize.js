import DOMPurify from 'dompurify';

export const sanitizeHtml = (html, extra = {}) =>
  DOMPurify.sanitize(html, {
    ADD_TAGS: ['table', 'tr', 'td', 'th'],
    ...extra,
  });

export const sanitizeText = (text) => DOMPurify.sanitize(text);
