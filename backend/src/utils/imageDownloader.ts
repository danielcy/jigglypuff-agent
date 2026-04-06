import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const DOWNLOADS_DIR = path.join(__dirname, '../../../data/resources');

// 确保目录存在
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

export async function downloadImage(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`URL is not an image: ${contentType}`);
    }

    // 从content-type获取文件扩展名
    const ext = contentType.split('/')[1];
    const validExts = ['jpeg', 'png', 'gif', 'webp', 'jpg'];
    const finalExt = validExts.includes(ext) ? ext : 'jpg';

    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${uniqueSuffix}.${finalExt}`;
    const filePath = path.join(DOWNLOADS_DIR, filename);

    // 保存文件
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    // 返回相对路径（使用已配置的 /resources 静态服务）
    return `/resources/${filename}`;
  } catch (error) {
    console.error('Failed to download image:', error);
    throw error;
  }
}
