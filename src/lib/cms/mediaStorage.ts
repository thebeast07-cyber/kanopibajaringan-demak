import { ServiceSchema } from '../../types/domain';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file format (JPG, PNG, WebP) and size (max 5MB).
 * Returns Indonesian validation messages on failure.
 */
export function validateImageFile(file: File): ImageValidationResult {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
  const validMime = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());

  if (!validMime && !validExt) {
    return { valid: false, error: 'Format foto harus JPG, PNG, atau WebP.' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: 'Ukuran foto maksimal 5 MB.' };
  }

  return { valid: true };
}

/**
 * Reads a File into a Data URL string for local client storage.
 * Does not store raw File objects in CMS dataset.
 */
export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Returns fallback Unsplash image based on service slug/category keyword.
 * Never throws error; guarantees a valid fallback image URL string.
 */
export function getFallbackServiceImage(slug: string = ''): string {
  const s = slug.toLowerCase();
  if (s.includes('alderon')) return 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800&q=80';
  if (s.includes('baja-ringan')) return 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80';
  if (s.includes('pagar')) return 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80';
  if (s.includes('gerobak') || s.includes('booth')) return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80';
  return 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800&q=80';
}

/**
 * Public catalog image resolution helper.
 * Priority:
 * 1. service.imageUrl when present and non-empty
 * 2. getFallbackServiceImage(service.slug) fallback
 */
export function resolveServiceImage(service: Partial<ServiceSchema> | null | undefined): string {
  if (!service) return getFallbackServiceImage('');
  if (service.imageUrl && service.imageUrl.trim().length > 0) {
    return service.imageUrl;
  }
  return getFallbackServiceImage(service.slug || '');
}
