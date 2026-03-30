import express from 'express';
import * as trendingVideoController from '../controllers/trendingVideo';
import * as trendingVideoControllerV2 from '../controllers/trendingVideoV2';

const router = express.Router();

router.post('/search', trendingVideoController.searchTrendingVideos);
router.post('/search-v2', trendingVideoControllerV2.searchTrendingVideosV2);
router.get('/', trendingVideoController.getAllTrendingVideos);

export default router;
