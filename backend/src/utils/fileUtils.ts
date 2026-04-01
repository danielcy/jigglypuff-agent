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
 * @param attachment 素材对象
 * @returns 包含 base64 编码内容的对象
 */
export async function convertAttachmentToBase64(attachment: any): Promise<any> {
  try {
    // 如果 attachment.url 已经是 base64，直接返回
    if (attachment.url && attachment.url.startsWith('data:')) {
      return attachment;
    }

    // 假设素材存储在特定目录，需要根据实际存储位置修改
    let filePath = attachment.url;

    // 如果是相对路径，尝试解析为绝对路径
    if (!path.isAbsolute(filePath)) {
      // 这里需要根据实际的素材存储目录进行修改
      // 假设素材存储在项目根目录的 data/materials 目录下
      const projectRoot = path.resolve(__dirname, '../../..');
      filePath = path.join(projectRoot, 'data', 'materials', filePath);
    }

    const mimeType = attachment.type === 'image'
      ? getMimeType(filePath)
      : `video/${path.extname(filePath).substring(1)}`;

    const base64Url = fileToBase64(filePath, mimeType);

    return {
      ...attachment,
      url: base64Url
    };
  } catch (error) {
    console.error(`Failed to convert attachment to base64: ${error}`);
    return attachment; // 转换失败时返回原始对象
  }
}
