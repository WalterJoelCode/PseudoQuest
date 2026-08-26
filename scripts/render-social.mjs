import sharp from 'sharp';
import {fileURLToPath} from 'node:url';

await sharp(fileURLToPath(new URL('../public/keplercode-social.svg',import.meta.url)))
  .png({compressionLevel:9,quality:92})
  .toFile(fileURLToPath(new URL('../public/keplercode-social.png',import.meta.url)));
