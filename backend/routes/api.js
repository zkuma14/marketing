const express = require('express');
const router = express.Router();

const contentController = require('../controllers/contentController');
const mediaController = require('../controllers/mediaController');
const publishController = require('../controllers/publishController');
const assetController = require('../controllers/assetController');

// ==========================================
// STEP 1, 2, 3: 유형 선택 & AI 내용 생성 & 텍스트 미리보기
// ==========================================
router.post('/content/draft', contentController.createDraft);
router.get('/content/draft/:draftId', contentController.getDraft);
router.get('/content/drafts', contentController.listDrafts);

// ==========================================
// STEP 4: 내용 수정 및 Fix(확정)
// ==========================================
router.put('/content/draft/:draftId', contentController.updateDraft);
router.post('/content/draft/:draftId/fix', contentController.fixDraft);

// ==========================================
// STEP 5: 게시글 / 영상 생성 버튼 누르기 (Media Generation)
// ==========================================
router.post('/media/generate/:draftId', mediaController.generateMedia);
router.get('/media/:draftId', mediaController.getMediaInfo);

// ==========================================
// STEP 6: SNS 게시하기 (Instagram & YouTube)
// ==========================================
router.post('/publish/:draftId', publishController.publishContent);

// 브랜드 에셋 조회
router.get('/assets', assetController.getBrandAssets);

module.exports = router;
