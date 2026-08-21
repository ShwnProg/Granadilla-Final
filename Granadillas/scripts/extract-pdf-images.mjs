import fs from 'node:fs';
import path from 'node:path';

const source = process.argv[2];
const destination = process.argv[3] ?? 'assets/portfolio';

if (!source) {
  throw new Error('Usage: node scripts/extract-pdf-images.mjs <source.pdf> [destination]');
}

const pdf = fs.readFileSync(source);
const sourceText = pdf.toString('latin1');
const outputDirectory = path.resolve(destination);
fs.mkdirSync(outputDirectory, { recursive: true });

let cursor = 0;
let index = 0;
const extracted = [];

while ((cursor = sourceText.indexOf('/DCTDecode', cursor)) !== -1) {
  const headerStart = Math.max(0, cursor - 2000);
  const streamMarker = sourceText.indexOf('stream', cursor);
  const header = sourceText.slice(headerStart, streamMarker);
  const lengthMatch = header.match(/\/Length\s+(\d+)/);

  if (!lengthMatch || streamMarker === -1) {
    cursor += 10;
    continue;
  }

  let dataStart = streamMarker + 'stream'.length;
  while ([10, 13, 32].includes(pdf[dataStart])) dataStart += 1;

  const dataLength = Number(lengthMatch[1]);
  const data = pdf.subarray(dataStart, dataStart + dataLength);

  if (data[0] !== 0xff || data[1] !== 0xd8) {
    cursor += 10;
    continue;
  }

  index += 1;
  const dimensions = [
    header.match(/\/Width\s+(\d+)/)?.[1] ?? 'unknown',
    header.match(/\/Height\s+(\d+)/)?.[1] ?? 'unknown',
  ];
  const filename = `portfolio-${String(index).padStart(2, '0')}-${dimensions.join('x')}.jpg`;
  fs.writeFileSync(path.join(outputDirectory, filename), data);
  extracted.push(filename);
  cursor += 10;
}

console.log(`Extracted ${extracted.length} JPEG assets to ${outputDirectory}`);
