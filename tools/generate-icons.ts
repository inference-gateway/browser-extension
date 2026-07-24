// Generates simple PNG icons for the extension at 16, 32, 48, and 128 px.
// Run: bun run tools/generate-icons.ts
import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const SIZES = [16, 32, 48, 128];

// Simple circle icon: a filled circle centered in the canvas.
// We use a simple RGBA pixel buffer and encode as PNG.
function createIcon(size: number): Buffer {
  const channels = 4; // RGBA
  const raw = Buffer.alloc(size * size * channels, 0);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * size + x) * channels;

      if (dist <= r) {
        const t = dist / r;
        const rVal = Math.round(99 + t * (139 - 99));
        const gVal = Math.round(102 + t * (92 - 102));
        const bVal = Math.round(241 + t * (246 - 241));
        raw[idx] = rVal;
        raw[idx + 1] = gVal;
        raw[idx + 2] = bVal;
        raw[idx + 3] = 255;
      } else {
        // Transparent
        raw[idx] = 0;
        raw[idx + 1] = 0;
        raw[idx + 2] = 0;
        raw[idx + 3] = 0;
      }
    }
  }

  return encodePNG(size, size, raw);
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeB, data]);
  const crcVal = crc32(crcData);
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crcVal);
  return Buffer.concat([len, typeB, data, crcB]);
}

function encodePNG(width: number, height: number, pixelData: Buffer): Buffer {
  const stride = width * 4;
  const rawScanlines = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    rawScanlines[y * (stride + 1)] = 0;
    pixelData.copy(rawScanlines, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const compressed = deflateSync(rawScanlines);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

await mkdir("src/icons", { recursive: true });

for (const size of SIZES) {
  const png = createIcon(size);
  await writeFile(`src/icons/icon-${size}.png`, png);
  console.log(`Created src/icons/icon-${size}.png (${png.length} bytes)`);
}
