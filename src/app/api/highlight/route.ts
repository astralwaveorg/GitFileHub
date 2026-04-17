import { NextRequest, NextResponse } from 'next/server';
import { codeToHtml, isPlainLang } from 'shiki';

export async function POST(request: NextRequest) {
  try {
    const { code, lang } = await request.json();

    if (typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    const language = lang || 'plaintext';

    // Check if language is supported
    if (isPlainLang(language)) {
      // Fallback to plain text highlighting
      const escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      const lines = escaped.split('\n');
      const lineNumbersHtml = lines
        .map((_, i) => `<span class="line-number">${i + 1}</span>`)
        .join('\n');

      const codeLinesHtml = lines
        .map((line) => `<span class="line">${line}</span>`)
        .join('\n');

      return NextResponse.json({
        html: `<div class="code-container"><div class="line-numbers">${lineNumbersHtml}</div><pre class="code-block"><code>${codeLinesHtml}</code></pre></div>`,
        language: 'plaintext',
      });
    }

    const html = await codeToHtml(code, {
      lang: language,
      theme: 'github-dark',
    });

    // Inject line numbers into the highlighted HTML
    const lineCount = code.split('\n').length;
    const lineNumbers = Array.from(
      { length: lineCount },
      (_, i) => `<span class="line-number">${i + 1}</span>`
    ).join('\n');

    // Wrap the code in a container with line numbers gutter
    const wrappedHtml = `<div class="code-container"><div class="line-numbers">${lineNumbers}</div><div class="code-wrapper">${html}</div></div>`;

    return NextResponse.json({ html: wrappedHtml, language });
  } catch (error) {
    console.error('[Shiki highlight error]:', error);

    // Fallback to plain text
    const code =
      typeof (await request.clone().json().catch(() => ({}))).code === 'string'
        ? (await request.clone().json().catch(() => ({}))).code
        : '';

    const escaped = String(code)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const lines = escaped.split('\n');
    const lineNumbersHtml = lines
      .map((_, i) => `<span class="line-number">${i + 1}</span>`)
      .join('\n');

    const codeLinesHtml = lines
      .map((line) => `<span class="line">${line}</span>`)
      .join('\n');

    return NextResponse.json({
      html: `<div class="code-container"><div class="line-numbers">${lineNumbersHtml}</div><pre class="code-block"><code>${codeLinesHtml}</code></pre></div>`,
      language: 'plaintext',
    });
  }
}
