const mediaGenerator = require('../services/mediaGenerator');
const draftStore = require('../models/draftStore');

/**
 * STEP 5: 게시글 / 영상 생성 버튼 누르기
 * POST /api/media/generate/:draftId
 */
exports.generateMedia = async (req, res, next) => {
    try {
        const { draftId } = req.params;
        const draft = draftStore.getDraft(draftId);

        if (!draft) {
            return res.status(404).json({ success: false, message: `Draft '${draftId}'를 찾을 수 없습니다.` });
        }

        // STEP 4 확정 상태 확인 (아직 DRAFT인 경우 사용자 편의를 위해 자동 Fix 처리)
        if (draft.status !== 'FIXED' && draft.status !== 'GENERATED') {
            console.log(`[MediaController] Draft ${draftId}가 FIXED 상태가 아니므로 자동 Fix 처리합니다.`);
            draftStore.fixDraft(draftId);
        }

        console.log(`[MediaController] STEP 5 미디어 생성 시작: Draft ${draftId} (Type: ${draft.contentType})`);

        let mediaResult = null;
        if (draft.contentType === 'video') {
            // 영상/쇼츠 에셋 및 프레임 렌더링
            mediaResult = await mediaGenerator.generateVideoAssets(draft.id, draft.content);
        } else {
            // 카드뉴스 게시글 PNG 이미지 세트 렌더링
            mediaResult = await mediaGenerator.generatePostImages(draft.id, draft.content);
        }

        // 상태를 'GENERATED'로 업데이트
        const updatedDraft = draftStore.setRenderedMedia(draftId, mediaResult);

        res.status(200).json({
            success: true,
            step: "STEP 5 완료 (게시글/영상 미디어 생성)",
            message: draft.contentType === 'video'
                ? `쇼츠/릴스 영상 씬 ${mediaResult.scenes.length}개 렌더링이 완료되었습니다.`
                : `카드뉴스 슬라이드 ${mediaResult.files.length}장 생성이 완료되었습니다.`,
            data: {
                draftId: updatedDraft.id,
                status: updatedDraft.status, // "GENERATED"
                contentType: updatedDraft.contentType,
                media: updatedDraft.renderedMedia,
                nextStep: "STEP 6: /api/publish/" + draftId + " 로 게시를 요청하세요."
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 생성된 미디어 정보 조회
 * GET /api/media/:draftId
 */
exports.getMediaInfo = (req, res, next) => {
    try {
        const { draftId } = req.params;
        const draft = draftStore.getDraft(draftId);

        if (!draft) {
            return res.status(404).json({ success: false, message: `Draft '${draftId}'를 찾을 수 없습니다.` });
        }

        if (!draft.renderedMedia) {
            return res.status(400).json({ 
                success: false, 
                message: "미디어가 아직 생성되지 않았습니다. STEP 5 생성 버튼을 먼저 눌러주세요." 
            });
        }

        res.status(200).json({
            success: true,
            data: draft.renderedMedia
        });
    } catch (error) {
        next(error);
    }
};
