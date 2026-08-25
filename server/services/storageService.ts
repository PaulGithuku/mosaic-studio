import path from 'path';
import fs from 'fs';
import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { env } from '../config/env';

export interface UploadResult {
  storage_path: string;
  public_url: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
]);

const MAX_PROFILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PORTFOLIO_SIZE = 15 * 1024 * 1024; // 15MB

export class StorageValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'StorageValidationError';
  }
}

export const storageService = {
  validateFile(
    file: Express.Multer.File,
    bucket: 'profile-images' | 'portfolio-images'
  ): { ext: string; mime: string } {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new StorageValidationError('No image file was uploaded');
    }

    const mime = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      throw new StorageValidationError(
        `Unsupported file format (${mime}). Allowed image formats: JPEG, PNG, WebP, AVIF.`
      );
    }

    const originalExt = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(originalExt)) {
      throw new StorageValidationError(
        `Invalid file extension (${originalExt}). Allowed extensions: .jpg, .jpeg, .png, .webp, .avif.`
      );
    }

    const maxSize = bucket === 'profile-images' ? MAX_PROFILE_SIZE : MAX_PORTFOLIO_SIZE;
    if (file.size > maxSize || file.buffer.length > maxSize) {
      const maxMb = Math.round(maxSize / (1024 * 1024));
      throw new StorageValidationError(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of ${maxMb}MB.`
      );
    }

    // Inspect initial bytes (magic numbers) to ensure not an executable disguised as image
    const buf = file.buffer;
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isWebpOrAvif = buf.length > 12 && (
      (buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) || // WEBP
      (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) // ftyp (avif)
    );

    if (!isJpeg && !isPng && !isWebpOrAvif) {
      throw new StorageValidationError('Corrupted or invalid image header. File rejected.');
    }

    // Canonical extension based on MIME
    let cleanExt = originalExt;
    if (mime === 'image/jpeg' && !cleanExt.startsWith('.jp')) cleanExt = '.jpg';
    if (mime === 'image/png') cleanExt = '.png';
    if (mime === 'image/webp') cleanExt = '.webp';
    if (mime === 'image/avif') cleanExt = '.avif';

    return { ext: cleanExt, mime };
  },

  async uploadImage(
    file: Express.Multer.File,
    bucket: 'profile-images' | 'portfolio-images',
    photographerId: string
  ): Promise<UploadResult> {
    const { ext, mime } = this.validateFile(file, bucket);
    const uniqueFileId = crypto.randomUUID();
    const safeFilename = `${uniqueFileId}${ext}`;
    const storagePath = `${photographerId}/${safeFilename}`;

    const client = getSupabaseAdmin();
    if (client && isSupabaseConfigured()) {
      try {
        const { data, error } = await client.storage
          .from(bucket)
          .upload(storagePath, file.buffer, {
            contentType: mime,
            upsert: true,
          });

        if (error) {
          console.warn(`[Storage] Supabase cloud upload error (${error.message}). Falling back to local store.`);
        } else if (data) {
          const { data: publicUrlData } = client.storage
            .from(bucket)
            .getPublicUrl(storagePath);

          return {
            storage_path: storagePath,
            public_url: publicUrlData.publicUrl,
            file_size: file.size,
            mime_type: mime,
          };
        }
      } catch (err: any) {
        console.warn(`[Storage] Supabase client error: ${err.message}. Falling back to local storage.`);
      }
    }

    // Local resilient filesystem fallback
    const uploadsDir = path.join(process.cwd(), 'uploads', bucket, photographerId);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, safeFilename);
    fs.writeFileSync(localFilePath, file.buffer);

    const publicUrl = `/uploads/${bucket}/${photographerId}/${safeFilename}`;

    return {
      storage_path: storagePath,
      public_url: publicUrl,
      file_size: file.size,
      mime_type: mime,
    };
  },

  async deleteImage(
    bucket: 'profile-images' | 'portfolio-images',
    storagePath: string
  ): Promise<void> {
    if (!storagePath) return;

    const client = getSupabaseAdmin();
    if (client && isSupabaseConfigured()) {
      try {
        await client.storage.from(bucket).remove([storagePath]);
      } catch (err) {
        console.warn(`[Storage] Could not remove ${storagePath} from Supabase storage:`, err);
      }
    }

    // Also remove local file if present
    try {
      const localFilePath = path.join(process.cwd(), 'uploads', bucket, storagePath);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch {
      // Ignore local removal error
    }
  },
};
