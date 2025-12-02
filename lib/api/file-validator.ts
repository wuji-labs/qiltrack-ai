/**
 * File upload validation utilities
 * Validates MIME types, file extensions, and file signatures (magic numbers)
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// Allowed MIME types for file uploads
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv',
  'text/plain',
] as const;

// Allowed file extensions
export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.docx',
  '.xlsx',
  '.csv',
  '.txt',
] as const;

// File signature (magic number) validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  '.pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  '.png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]], // PNG signature
  '.jpg': [[0xff, 0xd8, 0xff]], // JPEG signature
  '.jpeg': [[0xff, 0xd8, 0xff]], // JPEG signature
  '.webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP container)
  '.docx': [[0x50, 0x4b, 0x03, 0x04]], // ZIP archive (DOCX is a ZIP)
  '.xlsx': [[0x50, 0x4b, 0x03, 0x04]], // ZIP archive (XLSX is a ZIP)
};

/**
 * Validate file extension
 */
export function validateExtension(filename: string): FileValidationResult {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (!ALLOWED_EXTENSIONS.includes(ext as any)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions are PDF, JPG, PNG, WEBP, DOCX, XLSX, CSV, TXT`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate MIME type
 */
export function validateMimeType(mimeType: string): FileValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
    return {
      valid: false,
      error: `Invalid file type. Only documents and images are allowed`,
    };
  }
  
  return { valid: true };
}

/**
 * Check if byte array starts with a specific signature
 */
function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false;
  }
  
  return true;
}

/**
 * Validate file signature (magic number)
 */
export async function validateFileSignature(
  file: File
): Promise<FileValidationResult> {
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const signatures = FILE_SIGNATURES[ext];
  
  if (!signatures) {
    return { valid: true };
  }
  
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    const isValid = signatures.some(sig => matchesSignature(bytes, sig));
    
    if (!isValid) {
      return {
        valid: false,
        error: 'File signature does not match extension. File may be corrupted or renamed.',
      };
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to read file signature',
    };
  }
}

/**
 * Comprehensive file validation
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  const extResult = validateExtension(file.name);
  if (!extResult.valid) return extResult;
  
  const mimeResult = validateMimeType(file.type);
  if (!mimeResult.valid) return mimeResult;
  
  const signatureResult = await validateFileSignature(file);
  if (!signatureResult.valid) return signatureResult;
  
  return { valid: true };
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  const basename = filename.split(/[/\\]/).pop() || 'upload';
  const sanitized = basename.replace(/[^\w.\-]+/g, '-');
  return sanitized.replace(/-+/g, '-');
}
