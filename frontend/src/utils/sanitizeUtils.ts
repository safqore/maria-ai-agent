/**
 * Sanitizes a string of HTML to prevent XSS attacks
 *
 * This function escapes HTML characters and converts newlines to <br> tags
 *
 * @param html - The string to sanitize
 * @returns The sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';

  return html.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
};
