import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

const router = Router();

// ─── каталоги ───────────────────────────────────────────────────────────────────
const UPLOADS_DIR = 'uploads';
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');

for (const dir of [UPLOADS_DIR, IMAGES_DIR, VIDEOS_DIR, 'temp']) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── helper: промисифицируем ffmpeg ─────────────────────────────────────────────
function transcodeToMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-movflags +faststart', // для стриминга
        '-c:v libx264',
        '-preset veryfast',
        '-crf 23', // качество (меньше = лучше/больше размер)
        '-c:a aac',
        '-b:a 160k',
      ])
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });
}

// ─── multer: временная папка + фильтр типов ────────────────────────────────────
const upload = multer({
  dest: 'temp/',
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
    files: 30,
  },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    if (!ok) return cb(new Error('Разрешены только изображения и видео'));
    cb(null, true);
  },
});

router.post('/', upload.array('files'), async (req, res) => {
  try {
    /** @type {{type:'image'|'video', path:string, originalName:string}[]} */
    const results = [];

    for (const file of /** @type {Express.Multer.File[]} */ (req.files || [])) {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');

      if (isImage) {
        const base = path
          .parse(file.originalname)
          .name.replace(/[^\p{L}\p{N}\-_ ]/gu, '')
          .replace(/\s+/g, '-')
          .toLowerCase();

        const outputFilename = `${Date.now()}-${base}.webp`;
        const outputPath = path.join(IMAGES_DIR, outputFilename);

        await sharp(file.path)
          .rotate()
          .webp({ quality: 80 })
          .toFile(outputPath);
        fs.unlinkSync(file.path);

        results.push({
          type: 'image',
          path: `/${UPLOADS_DIR}/images/${outputFilename}`,
          originalName: file.originalname,
        });
      } else if (isVideo) {
        const origExt = (path.extname(file.originalname) || '').toLowerCase();
        const isQuickTime =
          file.mimetype === 'video/quicktime' ||
          origExt === '.mov' ||
          origExt === '.m4v';

        const base = path
          .parse(file.originalname)
          .name.replace(/[^\p{L}\p{N}\-_ ]/gu, '')
          .replace(/\s+/g, '-')
          .toLowerCase();

        if (isQuickTime) {
          // Перекодируем в MP4 (H.264/AAC) для кросс-браузерности
          const outputFilename = `${Date.now()}-${base}.mp4`;
          const outputPath = path.join(VIDEOS_DIR, outputFilename);

          await transcodeToMp4(file.path, outputPath);
          fs.unlinkSync(file.path);

          results.push({
            type: 'video',
            path: `/${UPLOADS_DIR}/videos/${outputFilename}`,
            originalName: file.originalname,
          });
        } else {
          // Оставляем как есть (mp4/webm/ogg и т.п.)
          const ext = origExt || '.mp4';
          const outputFilename = `${Date.now()}-${base}${ext}`;
          const outputPath = path.join(VIDEOS_DIR, outputFilename);

          fs.renameSync(file.path, outputPath);

          results.push({
            type: 'video',
            path: `/${UPLOADS_DIR}/videos/${outputFilename}`,
            originalName: file.originalname,
          });
        }
      } else {
        try {
          fs.unlinkSync(file.path);
        } catch {}
      }
    }

    res.json({ files: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при обработке файлов' });
  }
});

export default router;
