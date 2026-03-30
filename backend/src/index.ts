import express from 'express';
import cors from 'cors';
import { initDatabase } from './database/db';
import petRoutes from './routes/pets';
import llmConfigRoutes from './routes/llmConfig';
import mcpConfigRoutes from './routes/mcpConfig';
import trendingVideoRoutes from './routes/trendingVideo';
import resourceRoutes from './routes/resources';
import * as uploadController from './controllers/upload';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

initDatabase();

app.use('/api/pets', petRoutes);
app.use('/api/llm-configs', llmConfigRoutes);
app.use('/api/mcp-configs', mcpConfigRoutes);
app.use('/api/trending-videos', trendingVideoRoutes);
app.use('/api/resources', resourceRoutes);
app.post('/api/upload', uploadController.uploadFile(), uploadController.handleUpload);
app.use('/uploads', uploadController.serveUploads());

const resourcesRoot = path.join(__dirname, '../../data/resources');
app.use('/resources', express.static(resourcesRoot));

app.get('/api/proxy/image', async (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Failed to proxy image:', error);
    res.status(500).send('Failed to proxy image');
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'JigglyPuff backend is running' });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
