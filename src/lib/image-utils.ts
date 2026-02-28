/**
 * Shimmer placeholder SVG — gorsel yuklenirken gosterilecek
 * base64 encoded SVG, animasyonlu gri gradient
 */
export function getShimmerPlaceholder(w = 400, h = 400): string {
  const shimmer = `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop offset="0%" stop-color="#f3f4f6"/>
      <stop offset="50%" stop-color="#e5e7eb"/>
      <stop offset="100%" stop-color="#f3f4f6"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f3f4f6"/>
  <rect width="${w}" height="${h}" fill="url(#g)">
    <animate attributeName="x" from="-${w}" to="${w}" dur="1.5s" repeatCount="indefinite"/>
  </rect>
</svg>`;

  const base64 = Buffer.from(shimmer.trim()).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

// Onceden hesaplanmis varsayilan placeholder (her seferinde yeniden hesaplamayi onler)
export const SHIMMER_PLACEHOLDER = getShimmerPlaceholder();
