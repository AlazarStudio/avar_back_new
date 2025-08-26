import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';

const router = Router();

// ─── каталоги ───────────────────────────────────────────────────────────────────
const UPLOADS_DIR = 'uploads';
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');

for (const dir of [UPLOADS_DIR, IMAGES_DIR, VIDEOS_DIR, 'temp']) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── multer: складываем во временную папку, фильтруем типы ─────────────────────
const upload = multer({
  dest: 'temp/',
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB на файл (поменяй под себя)
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
        // имя без расширения + .webp
        const base = path
          .parse(file.originalname)
          .name.replace(/[^\p{L}\p{N}\-_ ]/gu, '') // простая санация
          .replace(/\s+/g, '-')
          .toLowerCase();

        const outputFilename = `${Date.now()}-${base}.webp`;
        const outputPath = path.join(IMAGES_DIR, outputFilename);

        // конвертация изображения
        await sharp(file.path)
          .rotate() // учесть EXIF-ориентацию
          .webp({ quality: 80 })
          .toFile(outputPath);

        // убрать временный файл
        fs.unlinkSync(file.path);

        results.push({
          type: 'image',
          path: `/${UPLOADS_DIR}/images/${outputFilename}`,
          originalName: file.originalname,
        });
      } else if (isVideo) {
        // оставим оригинальное расширение
        const ext = path.extname(file.originalname) || '.mp4';
        const base = path
          .parse(file.originalname)
          .name.replace(/[^\p{L}\p{N}\-_ ]/gu, '')
          .replace(/\s+/g, '-')
          .toLowerCase();

        const outputFilename = `${Date.now()}-${base}${ext}`;
        const outputPath = path.join(VIDEOS_DIR, outputFilename);

        // просто переносим без перекодирования
        fs.renameSync(file.path, outputPath);

        results.push({
          type: 'video',
          path: `/${UPLOADS_DIR}/videos/${outputFilename}`,
          originalName: file.originalname,
        });
      } else {
        // на всякий случай чистим временный
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
