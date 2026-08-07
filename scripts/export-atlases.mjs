import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import { createServer } from 'vite';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data) => {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
};

const encodePng = (width, height, rgba) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const target = y * (stride + 1);
    raw[target] = 0;
    rgba.copy(raw, target + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
};

const blendPixel = (rgba, offset, color, alpha) => {
  const srcAlpha = Math.max(0, Math.min(1, alpha));
  const dstAlpha = rgba[offset + 3] / 255;
  const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);
  const src = [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];

  if (outAlpha === 0) {
    rgba.fill(0, offset, offset + 4);
    return;
  }

  for (let channel = 0; channel < 3; channel += 1) {
    const dst = rgba[offset + channel];
    rgba[offset + channel] = Math.round(
      (src[channel] * srcAlpha + dst * dstAlpha * (1 - srcAlpha)) / outAlpha
    );
  }
  rgba[offset + 3] = Math.round(outAlpha * 255);
};

const renderAtlas = (frames, frameWidth, frameHeight) => {
  const width = frameWidth * frames.length;
  const rgba = Buffer.alloc(width * frameHeight * 4);

  frames.forEach((frame, frameIndex) => {
    const frameOffsetX = frameIndex * frameWidth;
    for (const pixel of frame.pixels) {
      const alpha = pixel.alpha ?? 1;
      for (let y = pixel.y; y < pixel.y + pixel.height; y += 1) {
        for (let x = pixel.x; x < pixel.x + pixel.width; x += 1) {
          const offset = (y * width + frameOffsetX + x) * 4;
          blendPixel(rgba, offset, pixel.color, alpha);
        }
      }
    }
  });

  return encodePng(width, frameHeight, rgba);
};

const digest = (buffer) => createHash('sha256').update(buffer).digest('hex');

const loadModules = async () => {
  const vite = await createServer({
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true }
  });

  try {
    const [manifest, characters, portraits, fauna, characterSystem, portraitSystem, faunaSystem] =
      await Promise.all([
        vite.ssrLoadModule('/src/data/assetManifest.ts'),
        vite.ssrLoadModule('/src/data/characterAtlases.ts'),
        vite.ssrLoadModule('/src/data/portraits.ts'),
        vite.ssrLoadModule('/src/data/fauna.ts'),
        vite.ssrLoadModule('/src/systems/CharacterAtlasSystem.ts'),
        vite.ssrLoadModule('/src/systems/PortraitSystem.ts'),
        vite.ssrLoadModule('/src/systems/FaunaAtlasSystem.ts')
      ]);
    return { manifest, characters, portraits, fauna, characterSystem, portraitSystem, faunaSystem };
  } finally {
    await vite.close();
  }
};

const buildExports = async () => {
  const modules = await loadModules();
  const byRuntimeKey = new Map();

  for (const definition of modules.characters.CHARACTER_ATLAS_DEFINITIONS) {
    byRuntimeKey.set(definition.key, modules.characterSystem.buildCharacterAtlas(definition));
  }
  for (const definition of modules.portraits.PORTRAIT_DEFINITIONS) {
    byRuntimeKey.set(
      `portrait:${definition.npcId}`,
      modules.portraitSystem.buildPortraitAtlas(definition)
    );
  }
  for (const species of Object.keys(modules.fauna.ANIMAL_SPECIES)) {
    byRuntimeKey.set(`fauna:${species}`, modules.faunaSystem.buildFaunaAtlas(species));
  }

  return modules.manifest.ATLAS_ASSET_MANIFEST.map((entry) => {
    const frames = byRuntimeKey.get(entry.runtimeKey);
    if (!frames) throw new Error(`Missing source frames for ${entry.id} (${entry.runtimeKey}).`);
    if (frames.length !== entry.frameCount) {
      throw new Error(`${entry.id} expected ${entry.frameCount} frames, received ${frames.length}.`);
    }
    const png = renderAtlas(frames, entry.frameWidth, entry.frameHeight);
    return { entry, png, sha256: digest(png) };
  });
};

const verifyDeterminism = async () => {
  const first = await buildExports();
  const second = await buildExports();
  if (first.length !== second.length) throw new Error('Asset export count changed between runs.');

  for (let index = 0; index < first.length; index += 1) {
    if (first[index].entry.id !== second[index].entry.id) {
      throw new Error(`Asset ordering changed at index ${index}.`);
    }
    if (!first[index].png.equals(second[index].png)) {
      throw new Error(`Non-deterministic PNG export for ${first[index].entry.id}.`);
    }
  }

  return first;
};

const writeExports = async (exports) => {
  for (const item of exports) {
    const path = resolve(item.entry.targetPath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, item.png);
  }
};

const checkCommittedExports = async (exports) => {
  for (const item of exports) {
    const path = resolve(item.entry.targetPath);
    let existing;
    try {
      existing = await readFile(path);
    } catch {
      throw new Error(`Missing committed PNG for ${item.entry.id}: ${item.entry.targetPath}`);
    }
    if (!existing.equals(item.png)) {
      throw new Error(`Committed PNG differs from deterministic export: ${item.entry.targetPath}`);
    }
  }
};

const args = new Set(process.argv.slice(2));
const exports = await verifyDeterminism();

if (args.has('--check')) {
  await checkCommittedExports(exports);
} else if (!args.has('--verify-only')) {
  await writeExports(exports);
}

for (const item of exports) {
  console.log(`${item.entry.id}\t${item.entry.targetPath}\t${item.png.length} B\t${item.sha256}`);
}
console.log(`Verified ${exports.length} deterministic atlas PNG exports.`);
