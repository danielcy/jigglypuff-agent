import fs from 'fs';
import path from 'path';

const productsDir = path.join(__dirname, '../../../data/products');

// Ensure products directory exists
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

/**
 * Download a remote file and save it to local data/products directory
 * @param remoteUrl Remote URL to download from
 * @param extension File extension (e.g., 'png', 'jpg', 'mp4')
 * @returns Local URL path that can be served by backend
 */
export async function downloadAndSaveProduct(remoteUrl: string, extension: string): Promise<string> {
  // Generate unique filename
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = `${uniqueSuffix}.${extension}`;
  const filePath = path.join(productsDir, filename);

  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    // Return the relative URL that backend will serve
    return `/products/${filename}`;
  } catch (error) {
    // Clean up partial file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
}
