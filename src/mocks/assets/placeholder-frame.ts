let cached: Blob | null = null;
let cachedZone: Blob | null = null;

async function renderFrame(width: number, height: number, label: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, width, 2);
  ctx.fillRect(0, height - 2, width, 2);
  ctx.fillStyle = '#fff';
  ctx.font = `${Math.round(height / 10)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, height / 2);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas toBlob failed'))),
      'image/jpeg',
      0.8,
    );
  });
}

export async function placeholderFrame(): Promise<Blob> {
  if (cached) return cached;
  cached = await renderFrame(320, 180, 'MOCK FRAME');
  return cached;
}

export async function placeholderZoneFrame(): Promise<Blob> {
  if (cachedZone) return cachedZone;
  cachedZone = await renderFrame(1280, 720, 'MOCK ZONE FRAME');
  return cachedZone;
}
