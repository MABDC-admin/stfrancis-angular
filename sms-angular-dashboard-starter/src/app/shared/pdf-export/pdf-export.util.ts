export interface PrintableHtmlOptions {
  title: string;
  subtitle?: string;
  contentHtml: string;
  styleLinks?: string[];
  inlineStyles?: string[];
}

export function buildPrintableHtml(options: PrintableHtmlOptions) {
  const title = escapeHtml(options.title || 'Finance Export');
  const subtitle = options.subtitle ? `<p class="pdf-subtitle">${escapeHtml(options.subtitle)}</p>` : '';
  const links = (options.styleLinks || [])
    .map((href) => `<link rel="stylesheet" href="${escapeAttribute(href)}">`)
    .join('\n');
  const inlineStyles = (options.inlineStyles || [])
    .map((style) => `<style>${style}</style>`)
    .join('\n');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  ${links}
  ${inlineStyles}
  <style>
    @page { size: A4; margin: 12mm; }
    body { margin: 0; background: #fff; color: #0f172a; font-family: Arial, sans-serif; }
    .pdf-document-header { margin-bottom: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; }
    .pdf-document-header h1 { margin: 0; font-size: 18px; font-weight: 800; }
    .pdf-subtitle { margin: 4px 0 0; color: #475569; font-size: 11px; font-weight: 700; }
    .pdf-export-button, .no-print { display: none !important; }
    .finance-page { min-height: auto !important; padding: 0 !important; background: #fff !important; }
    .finance-header, .finance-panel, .finance-widget { box-shadow: none !important; break-inside: avoid; }
    button { display: none !important; }
    input, select, textarea { border: 1px solid #cbd5e1 !important; background: #fff !important; }
  </style>
</head>
<body>
  <div class="pdf-document-header">
    <h1>${title}</h1>
    ${subtitle}
  </div>
  ${options.contentHtml}
  <script>
    window.addEventListener('load', () => setTimeout(() => window.print(), 250));
  </script>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
