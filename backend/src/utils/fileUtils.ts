import fs from 'fs';
import path from 'path';

/**
 * 将文件转换为 base64 编码的 data URL
 * @param filePath 文件路径
 * @param mimeType MIME 类型
 * @returns base64 编码的 data URL
 */
export function fileToBase64(filePath: string, mimeType: string): string {
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * 根据文件扩展名获取 MIME 类型
 * @param fileName 文件名
 * @returns MIME 类型
 */
export function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  if (ext === '.ogg') return 'video/ogg';
  return 'application/octet-stream';
}

/**
 * 将素材转换为 base64 编码
 * @param attachment 素材对象 (完整 LibraryMaterial)
 * @returns 包含 base64 编码内容的对象
 */
export async function convertAttachmentToBase64(attachment: any): Promise<any> {
  try {
    // Get the actual content URL from metadata based on type
    let contentUrl: string;
    if (attachment.type === 'image') {
      contentUrl = attachment.metadata.imageUrl;
    } else {
      // video
      contentUrl = attachment.metadata.videoUrl;
    }

    // If already base64, directly return
    if (contentUrl && contentUrl.startsWith('data:')) {
      return {
        ...attachment,
        url: contentUrl,
      };
    }

    let url = contentUrl;

    // Remove domain/base URL prefix to get the path
    // Handles: http://localhost:3001/uploads/xxx, /uploads/xxx
    if (url.includes('/uploads/')) {
      url = url.substring(url.indexOf('/uploads/'));
    } else if (url.includes('/resources/')) {
      url = url.substring(url.indexOf('/resources/'));
    }

    // URL is now something like "/uploads/xxx.jpg" or "/resources/xxx.mp4"
    // Remove leading slash
    const relativePath = url.startsWith('/') ? url.substring(1) : url;

    // Resolve to absolute path on server: project-root/data/...
    const projectRoot = path.resolve(__dirname, '../../..');
    const filePath = path.join(projectRoot, 'data', relativePath);

    const mimeType = attachment.type === 'image'
      ? getMimeType(filePath)
      : `video/${path.extname(filePath).substring(1)}`;

    const base64Url = fileToBase64(filePath, mimeType);

    return {
      ...attachment,
      url: base64Url,
    };
  } catch (error) {
    console.error(`Failed to convert attachment to base64: ${error}`);
    return attachment; // 转换失败时返回原始对象
  }
}
