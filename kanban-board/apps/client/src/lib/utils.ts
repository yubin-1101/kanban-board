const AVATAR_GRADIENTS = [
  ['#7c3aed', '#a78bfa'], // violet
  ['#2563eb', '#60a5fa'], // blue
  ['#059669', '#34d399'], // emerald
  ['#d97706', '#fbbf24'], // amber
  ['#dc2626', '#f87171'], // red
  ['#db2777', '#f472b6'], // pink
  ['#0891b2', '#22d3ee'], // cyan
  ['#4f46e5', '#818cf8'], // indigo
  ['#7c2d12', '#ea580c'], // orange
  ['#0d9488', '#2dd4bf'], // teal
];

export function avatarGradient(name?: string | null): { from: string; to: string } {
  if (!name) return { from: AVATAR_GRADIENTS[0][0], to: AVATAR_GRADIENTS[0][1] };
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return { from: AVATAR_GRADIENTS[idx][0], to: AVATAR_GRADIENTS[idx][1] };
}

/** 보드 배경색에서 그라데이션 세트 생성 */
export function boardGradient(color: string): { bg: string; accent: string; muted: string } {
  // 색상을 HSL로 변환하여 밝기/채도 변형 생성
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;

  if (d !== 0) {
    const s = l > 0.5 ? d / (2 - max - min) : d / (max - min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  const hDeg = Math.round(h * 360);
  return {
    bg: `linear-gradient(135deg, hsl(${hDeg}, 65%, 45%) 0%, hsl(${(hDeg + 30) % 360}, 55%, 35%) 50%, hsl(${(hDeg + 60) % 360}, 45%, 30%) 100%)`,
    accent: `hsl(${(hDeg + 20) % 360}, 60%, 55%)`,
    muted: `hsl(${hDeg}, 30%, 25%)`,
  };
}
