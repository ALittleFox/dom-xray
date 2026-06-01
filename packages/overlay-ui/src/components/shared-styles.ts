/**
 * Shared CSS tokens used across all shadow DOM components.
 * Each component inlines these via a <style> tag in its shadow root.
 */
export const cssTokens = `
  :host {
    --ds-color-bg: #fff;
    --ds-color-border: #e5e7eb;
    --ds-color-text: #111;
    --ds-color-text-secondary: #374151;
    --ds-color-text-muted: #6b7280;
    --ds-color-input-border: #d1d5db;
    --ds-color-input-focus: #3b82f6;
    --ds-color-primary: #2563eb;
    --ds-color-primary-text: #fff;
    --ds-color-code-bg: #f9fafb;
    --ds-radius: 12px;
    --ds-radius-sm: 6px;
    --ds-radius-md: 8px;
    --ds-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --ds-font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  }
`;
