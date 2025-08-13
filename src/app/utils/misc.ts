import { Difficulty } from 'arcaea-toolbelt-core/constants';

export function mergeArray<T>(a: T[], b: T[]) {
  return [...new Set([...a, ...b])];
}

export function color(difficulty: Difficulty) {
  return `var(--${difficulty})`;
}

export function border(difficulty: Difficulty) {
  return `border ${difficulty}`;
}

export function linearMap(distMin: number, distMax: number, srcMin: number, srcMax: number, x: number) {
  return ((x - srcMin) * (distMax - distMin)) / (srcMax - srcMin) + distMin;
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function colorToRgb(color: string) {
  const hex = parseInt(color.slice(1), 16);
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

export function linearColorMap(colorA: string, colorB: string, min: number, max: number, x: number) {
  const [r1, g1, b1] = colorToRgb(colorA);
  const [r2, g2, b2] = colorToRgb(colorB);
  const r = Math.round(linearMap(r1, r2, min, max, x));
  const g = Math.round(linearMap(g1, g2, min, max, x));
  const b = Math.round(linearMap(b1, b2, min, max, x));
  const hex = rgbToHex(r, g, b);
  return hex;
}

export function colorPointInterpolation(colors: string[], min: number, max: number, x: number) {
  const step = (max - min) / (colors.length - 1);
  if (x === min) {
    return colors[0];
  }
  if (x === max) {
    return colors[colors.length - 1];
  }
  const round = (x - min) / step;
  const index = Math.floor(round);
  if (round === index) {
    return colors[index];
  }
  return linearColorMap(colors[index], colors[index + 1], min + step * index, min + step * (index + 1), x);
}
