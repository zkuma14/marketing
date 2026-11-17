const geminiService = require('../services/geminiService');
const draftStore = require('../models/draftStore');

/**
 * STEP 1, 2, 3: 게시글/영상 유형 선택 및 AI 내용 생성, 미리보기 제공
 * POST /api/content/draft
 */
exports.createDraft = async (req, res, next) => {
    try {
        const { contentType = 'post', topic, tone = 'mz' } = req.body;
        const clientApiKey = req.headers['x-gemini-api-key'];

        if (!topic) {
            return res.status(400).json({ 
                success: false, 
                message: '주제(topic)를 입력해주세요. 예: 연애 밸런스 게임' 
            });
        }

        if (!['post', 'video'].includes(contentType)) {
            return res.status(400).json({ 
                success: false, 
                message: "contentType은 'post'(게시글/카드뉴스) 또는 'video'(영상/쇼츠)여야 합니다." 
            });
        }

        // STEP 2 & STEP 3: 내용 생성 및 텍스트 미리보기 포맷팅
        const { content, previewText, warning } = await geminiService.generateSocialContent({
            contentType,
            topic,
            tone,
            clientApiKey
        });

        // Draft 저장소에 저장 (초기 상태: DRAFT)
        const draft = draftStore.createDraft({
            contentType,
            topic,
            tone,
            content,
            previewText
        });

        res.status(201).json({
            success: true,
            step: "STEP 3 완료 (내용 생성 및 미리보기)",
            message: `[STEP 1 & 2 완료] ${contentType === 'video' ? '영상/쇼츠' : '카드뉴스 게시글'} 대본이 생성되었습니다.`,
            warning: warning || undefined,
            data: {
                draftId: draft.id,
                status: draft.status,
                contentType: draft.contentType,
                topic: draft.topic,
                previewText: draft.previewText, // STEP 3: 텍스트 미리보기
                content: draft.content // 프론트엔드 편집 폼에 바인딩할 구조화된 데이터
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 특정 Draft 조회
 * GET /api/content/draft/:draftId
 */
exports.getDraft = async (req, res, next) => {
    try {
        const { draftId } = req.params;
        const draft = draftStore.getDraft(draftId);

        if (!draft) {
            return res.status(404).json({ success: false, message: `Draft '${draftId}'를 찾을 수 없습니다.` });
        }

        res.status(200).json({
            success: true,
            data: draft
        });
    } catch (error) {
        next(error);
    }
};

/**
 * STEP 4-A: 게시글/영상 내용 수정하기
 * PUT /api/content/draft/:draftId
 */
exports.updateDraft = async (req, res, next) => {
    try {
        const { draftId } = req.params;
        const { topic, tone, content } = req.body;

        const currentDraft = draftStore.getDraft(draftId);
        if (!currentDraft) {
            return res.status(404).json({ success: false, message: `Draft '${draftId}'를 찾을 수 없습니다.` });
        }

        // 내용이 수정된 경우 미리보기 텍스트도 재계산
        let newPreviewText = currentDraft.previewText;
        if (content) {
            const mergedContent = { ...currentDraft.content, ...content };
            newPreviewText = geminiService.formatPreviewText(mergedContent);
        }

        const updatedDraft = draftStore.updateDraft(draftId, {
            topic,
            tone,
            content,
            previewText: newPreviewText
        });

        res.status(200).json({
            success: true,
            step: "STEP 4 (수정 반영 완료)",
            message: "초안 내용이 성공적으로 수정되었습니다.",
            data: updatedDraft
        });
    } catch (error) {
        next(error);
    }
};

/**
 * STEP 4-B: 게시글/영상 내용 최종 확정하기 (Fix)
 * POST /api/content/draft/:draftId/fix
 */
exports.fixDraft = async (req, res, next) => {
    try {
        const { draftId } = req.params;
        const fixedDraft = draftStore.fixDraft(draftId);

        res.status(200).json({
            success: true,
            step: "STEP 4 완료 (내용 Fix 확정)",
            message: "콘텐츠 내용이 성공적으로 확정(Fix)되었습니다. 이제 STEP 5에서 미디어를 생성할 수 있습니다.",
            data: {
                draftId: fixedDraft.id,
                status: fixedDraft.status, // "FIXED"
                contentType: fixedDraft.contentType,
                fixedAt: fixedDraft.fixedAt,
                summary: fixedDraft.contentType === 'post' 
                    ? `카드뉴스 슬라이드 ${fixedDraft.content.slides.length}장 확정`
                    : `쇼츠 씬 ${fixedDraft.content.scenes.length}개 확정`
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 전체 초안 목록 조회
 * GET /api/content/drafts
 */
exports.listDrafts = (req, res) => {
    res.status(200).json({
        success: true,
        data: draftStore.listDrafts()
    });
};
