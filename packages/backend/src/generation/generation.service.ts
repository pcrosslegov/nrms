import { Injectable } from '@nestjs/common';

interface ReleaseData {
  id: string;
  reference: string;
  key: string;
  releaseType: string;
  releaseDateTime: Date | null;
  publishDateTime: Date | null;
  ministry?: { displayName: string; abbreviation: string } | null;
  languages?: { languageId: string; location: string; summary: string }[];
  documents?: {
    id: string;
    sortIndex: number;
    languages?: {
      languageId: string;
      headline: string;
      subheadline: string;
      organizations: string;
      byline: string;
      bodyHtml: string;
    }[];
    contacts?: {
      languageId: string;
      sortIndex: number;
      information: string;
    }[];
  }[];
}

@Injectable()
export class GenerationService {
  generateHtml(release: ReleaseData, lang = 'en'): string {
    const releaseLang = release.languages?.find((l) => l.languageId === lang);
    const location = releaseLang?.location ?? '';

    const dateStr = release.releaseDateTime
      ? new Date(release.releaseDateTime).toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

    const ministry = release.ministry?.displayName ?? '';

    let documentsHtml = '';
    for (const doc of release.documents ?? []) {
      const docLang = doc.languages?.find((l) => l.languageId === lang);
      if (!docLang) continue;

      const contacts = (doc.contacts ?? [])
        .filter((c) => c.languageId === lang)
        .sort((a, b) => a.sortIndex - b.sortIndex);

      const contactsHtml = contacts.length
        ? `<div class="contacts">
            <h3>Media Contact</h3>
            ${contacts.map((c) => `<p>${this.escapeHtml(c.information)}</p>`).join('\n')}
          </div>`
        : '';

      documentsHtml += `
        <article class="document">
          ${docLang.organizations ? `<p class="organizations">${this.escapeHtml(docLang.organizations)}</p>` : ''}
          <h1>${this.escapeHtml(docLang.headline)}</h1>
          ${docLang.subheadline ? `<h2 class="subheadline">${this.escapeHtml(docLang.subheadline)}</h2>` : ''}
          ${docLang.byline ? `<p class="byline">${this.escapeHtml(docLang.byline)}</p>` : ''}
          <div class="body">${docLang.bodyHtml}</div>
          ${contactsHtml}
        </article>`;
    }

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${this.escapeHtml(this.getFirstHeadline(release, lang))} - ${this.escapeHtml(ministry)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
    .header { border-bottom: 3px solid #003366; padding-bottom: 1rem; margin-bottom: 2rem; }
    .header .ministry { color: #003366; font-size: 1.1rem; font-weight: 600; }
    .header .release-type { text-transform: uppercase; font-size: 0.85rem; color: #666; letter-spacing: 0.05em; margin-top: 0.25rem; }
    .meta { display: flex; gap: 2rem; color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
    .document { margin-bottom: 3rem; }
    .document h1 { font-size: 1.5rem; color: #003366; margin-bottom: 0.5rem; line-height: 1.3; }
    .subheadline { font-size: 1.1rem; color: #555; font-weight: 400; margin-bottom: 1rem; }
    .organizations { font-size: 0.9rem; color: #666; margin-bottom: 0.5rem; }
    .byline { font-style: italic; color: #666; margin-bottom: 1.5rem; }
    .body { margin-bottom: 2rem; }
    .body p { margin-bottom: 1rem; }
    .body h2 { font-size: 1.2rem; color: #003366; margin: 1.5rem 0 0.5rem; }
    .body h3 { font-size: 1.05rem; margin: 1.25rem 0 0.5rem; }
    .body ul, .body ol { margin: 0.5rem 0 1rem 1.5rem; }
    .body blockquote { border-left: 3px solid #003366; padding-left: 1rem; margin: 1rem 0; color: #555; }
    .contacts { border-top: 1px solid #ddd; padding-top: 1rem; margin-top: 2rem; }
    .contacts h3 { font-size: 0.95rem; color: #003366; margin-bottom: 0.5rem; }
    .contacts p { font-size: 0.9rem; color: #666; margin-bottom: 0.25rem; }
    .footer { border-top: 1px solid #ddd; padding-top: 1rem; margin-top: 2rem; font-size: 0.8rem; color: #999; }
  </style>
</head>
<body>
  <header class="header">
    <div class="ministry">${this.escapeHtml(ministry)}</div>
    <div class="release-type">${this.escapeHtml(release.releaseType)}</div>
  </header>

  <div class="meta">
    <span>${dateStr}</span>
    ${location ? `<span>${this.escapeHtml(location)}</span>` : ''}
    <span>${this.escapeHtml(release.reference)}</span>
  </div>

  ${documentsHtml}

  <footer class="footer">
    <p>${release.reference} &bull; ${dateStr}</p>
  </footer>
</body>
</html>`;
  }

  generateTxt(release: ReleaseData, lang = 'en'): string {
    const releaseLang = release.languages?.find((l) => l.languageId === lang);
    const location = releaseLang?.location ?? '';
    const ministry = release.ministry?.displayName ?? '';

    const dateStr = release.releaseDateTime
      ? new Date(release.releaseDateTime).toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

    const lines: string[] = [
      ministry,
      release.releaseType.toUpperCase(),
      '',
      `${dateStr}${location ? ` — ${location}` : ''}`,
      `Reference: ${release.reference}`,
      '',
      '='.repeat(60),
      '',
    ];

    for (const doc of release.documents ?? []) {
      const docLang = doc.languages?.find((l) => l.languageId === lang);
      if (!docLang) continue;

      if (docLang.organizations) lines.push(docLang.organizations, '');
      lines.push(docLang.headline);
      if (docLang.subheadline) lines.push(docLang.subheadline);
      lines.push('');
      if (docLang.byline) lines.push(docLang.byline, '');

      // Strip HTML for plain text
      const plainBody = this.stripHtml(docLang.bodyHtml);
      lines.push(plainBody, '');

      const contacts = (doc.contacts ?? [])
        .filter((c) => c.languageId === lang)
        .sort((a, b) => a.sortIndex - b.sortIndex);

      if (contacts.length) {
        lines.push('-'.repeat(40), 'Media Contact:', '');
        for (const c of contacts) {
          lines.push(c.information);
        }
        lines.push('');
      }
    }

    lines.push('='.repeat(60));
    lines.push(`${release.reference} — ${dateStr}`);

    return lines.join('\n');
  }

  async generatePdf(html: string): Promise<Buffer> {
    // Dynamic import to avoid issues when Puppeteer isn't available
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'Letter',
        margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
        printBackground: true,
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private getFirstHeadline(release: ReleaseData, lang: string): string {
    const doc = release.documents?.[0];
    const docLang = doc?.languages?.find((l) => l.languageId === lang);
    return docLang?.headline ?? release.reference ?? 'News Release';
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/?(li|div)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
