## Installation
```bash
npm install yt-dlp-nodejs
```

## Usage
```javascript
import { YtDlp } from 'ytdlp-nodejs';

const ytdlp = new YtDlp();

// Download a video with fluent API
const result = await ytdlp
  .download('https://youtube.com/watch?v=dQw4w9WgXcQ')
  .filter('mergevideo')
  .quality('1080p')
  .type('mp4')
  .on('progress', (p) => console.log(`${p.percentage_str}`))
  .run();

console.log('Downloaded:', result.filePaths);

// Get video info
const info = await ytdlp.getInfoAsync(
  'https://youtube.com/watch?v=dQw4w9WgXcQ',
);
console.log(info.title);

// Stream to file
import { createWriteStream } from 'fs';
const stream = ytdlp.stream('https://youtube.com/watch?v=dQw4w9WgXcQ');
await stream.pipeAsync(createWriteStream('video.mp4'));
```

## 小红书与B站下载方式
小红书：
 - download字段传`https://www.xiaohongshu.com/explore/{id}`
B站：
 - download字段传`https://www.bilibili.com/video/{id}`
