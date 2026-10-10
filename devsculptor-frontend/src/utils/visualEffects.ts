export const GLASS_BLUR_RANGE = { min: 0, max: 120, step: 5, def: 20 } as const;
export const WINDOW_OPACITY_RANGE = { min: 10, max: 100, step: 5, def: 85 } as const;

const clamp = (v: unknown, min: number, max: number, def: number): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.round(n)));
};

export const clampBlur = (v: unknown): number =>
  clamp(v, GLASS_BLUR_RANGE.min, GLASS_BLUR_RANGE.max, GLASS_BLUR_RANGE.def);

export const clampOpacity = (v: unknown): number =>
  clamp(v, WINDOW_OPACITY_RANGE.min, WINDOW_OPACITY_RANGE.max, WINDOW_OPACITY_RANGE.def);
