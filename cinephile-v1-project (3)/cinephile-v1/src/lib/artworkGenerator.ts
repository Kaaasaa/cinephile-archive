/**
 * Generates deterministic, matte warm-charcoal & camel-taupe SVG data URIs
 * matching the Brunello Cucinelli / Loro Piana archival aesthetic (#171412 / #211D1A / #A88F76).
 */

export interface PosterTheme {
  bgPrimary: string;
  bgSecondary: string;
  accent: string;
  motif: 'horizon' | 'eclipse' | 'monolith' | 'labyrinth' | 'waves' | 'noir' | 'neon-grid' | 'prism';
  catalogCode: string;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function createCriterionPosterSvg(
  title: string,
  originalTitle: string,
  year: number,
  director: string,
  theme: PosterTheme
): string {
  const safeTitle = escapeXml(title);
  const safeOrig = escapeXml(originalTitle.toUpperCase());
  const safeDir = escapeXml(director.toUpperCase());
  const safeCode = escapeXml(theme.catalogCode);
  const camelAccent = '#A88F76';

  let motifSvg = '';
  switch (theme.motif) {
    case 'eclipse':
      motifSvg = `
        <circle cx="300" cy="400" r="136" fill="url(#accentGrad)" opacity="0.5" />
        <circle cx="312" cy="392" r="120" fill="#171412" />
        <circle cx="300" cy="400" r="160" fill="none" stroke="${camelAccent}" stroke-width="0.6" opacity="0.25" />
      `;
      break;
    case 'monolith':
      motifSvg = `
        <rect x="242" y="220" width="116" height="340" fill="#171412" stroke="${camelAccent}" stroke-width="0.6" opacity="0.7" />
        <rect x="254" y="232" width="92" height="316" fill="url(#accentGrad)" opacity="0.25" />
      `;
      break;
    default:
      motifSvg = `
        <circle cx="300" cy="390" r="76" fill="url(#accentGrad)" opacity="0.45" />
        <line x1="110" y1="405" x2="490" y2="405" stroke="${camelAccent}" stroke-width="0.6" opacity="0.35" />
      `;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0.2" y2="1">
        <stop offset="0%" stop-color="#211D1A" />
        <stop offset="100%" stop-color="#171412" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#A88F76" />
        <stop offset="100%" stop-color="#211D1A" />
      </linearGradient>
    </defs>
    <rect width="600" height="900" fill="url(#bgGrad)" />
    <text x="64" y="82" fill="#9C948B" font-family="Georgia, serif" font-size="10" letter-spacing="3" font-weight="300">ARCHIVE FOLIO</text>
    <text x="536" y="82" fill="#9C948B" font-family="monospace" font-size="10" letter-spacing="2" text-anchor="end">${safeCode}</text>
    ${motifSvg}
    <text x="64" y="728" fill="#9C948B" font-family="Georgia, serif" font-size="11" letter-spacing="2.5" font-weight="300">${safeOrig}</text>
    <text x="64" y="772" fill="#E7E2DD" font-family="Georgia, Noto Serif SC, serif" font-size="32" font-weight="300" letter-spacing="1.5">${safeTitle}</text>
    <text x="64" y="810" fill="#9C948B" font-family="Georgia, serif" font-size="11" letter-spacing="1.5" font-weight="300">${safeDir} · ${year}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createBackdropSvg(
  title: string,
  originalTitle: string,
  year: number,
  sceneTitle: string,
  theme: PosterTheme
): string {
  const safeTitle = escapeXml(title);
  const safeScene = escapeXml(sceneTitle);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
    <defs>
      <linearGradient id="widescreenBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#211D1A" />
        <stop offset="60%" stop-color="#1A1714" />
        <stop offset="100%" stop-color="#171412" />
      </linearGradient>
      <radialGradient id="glow" cx="62%" cy="44%" r="48%">
        <stop offset="0%" stop-color="#A88F76" stop-opacity="0.22" />
        <stop offset="100%" stop-color="#171412" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#widescreenBg)" />
    <rect width="1600" height="900" fill="url(#glow)" />
    <circle cx="1040" cy="410" r="210" fill="none" stroke="#A88F76" stroke-opacity="0.18" stroke-width="0.8" />
    <text x="1480" y="830" fill="#9C948B" fill-opacity="0.45" font-family="Georgia, serif" font-size="13" font-weight="300" letter-spacing="2" text-anchor="end">${safeTitle} (${year}) · ${safeScene}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createAvatarSvg(name: string, role: string, accentColor = '#A88F76'): string {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
    <defs>
      <linearGradient id="avBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#211D1A" />
        <stop offset="100%" stop-color="#171412" />
      </linearGradient>
    </defs>
    <rect width="300" height="300" fill="url(#avBg)" />
    <circle cx="150" cy="122" r="42" fill="#A88F76" fill-opacity="0.12" stroke="${accentColor}" stroke-opacity="0.25" stroke-width="0.8" />
    <path d="M 78 248 C 78 195 222 195 222 248" fill="#A88F76" fill-opacity="0.08" stroke="${accentColor}" stroke-opacity="0.22" stroke-width="0.8" />
    <text x="150" y="134" fill="#E7E2DD" font-family="Georgia, serif" font-size="26" font-weight="300" text-anchor="middle">${escapeXml(initials)}</text>
    <text x="150" y="274" fill="#9C948B" font-family="Georgia, serif" font-size="10" letter-spacing="2" font-weight="300" text-anchor="middle">${escapeXml(role.toUpperCase())}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
