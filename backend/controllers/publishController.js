const instagramService = require('../services/instagramService');
const youtubeService = require('../services/youtubeService');
const draftStore = require('../models/draftStore');

/**
 * STEP 6: 게시하기 API
 * POST /api/publish/:draftId
 */
exports.publishContent = async (req, res, next) => {
    try {
        const { draftId } = req.params;
        const { 
            channels = ['instagram'], 
            timing = 'instant', 
            scheduledAt, 
            credentials = {} 
        } = req.body;

        const draft = draftStore.getDraft(draftId);
        if (!draft) {
            return res.status(404).json({ success: false, message: `Draft '${draftId}'를 찾을 수 없습니다.` });
        }

        // STEP 5에서 미디어가 생성되었는지 확인
        if (!draft.renderedMedia) {
            return res.status(400).json({ 
                success: false, 
                message: '미디어가 아직 생성되지 않았습니다. STEP 5 [미디어 생성]을 먼저 완료해주세요.' 
            });
        }

        const isScheduled = (timing === 'schedule');

        // 1. 예약 게시일 경우 스케줄 등록 처리
        if (isScheduled) {
            if (!scheduledAt) {
                return res.status(400).json({ success: false, message: '예약 게시를 위한 scheduledAt (ISO 날짜)이 필요합니다.' });
            }

            const scheduleResult = {
                type: 'scheduled',
                timing: 'schedule',
                scheduledAt,
                targetChannels: channels,
                taskId: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                status: 'SCHEDULED'
            };

            draftStore.setPublishResult(draftId, scheduleResult);

            return res.status(200).json({
                success: true,
                step: "STEP 6 완료 (예약 게시 등록)",
                message: `지정하신 시간(${scheduledAt})에 인스타그램/유튜브에 자동 게시되도록 예약되었습니다.`,
                data: scheduleResult
            });
        }

        // 2. 즉시 게시 (Instant Publish)
        console.log(`[PublishController] STEP 6 즉시 게시 시작: Draft ${draftId} (Channels: ${channels.join(', ')})`);

        const publishResults = {
            timing: 'instant',
            publishedAt: new Date().toISOString(),
            channels: {}
        };

        const hostUrl = req.protocol + '://' + req.get('host');

        // A. 인스타그램 게시
        if (channels.includes('instagram')) {
            try {
                let mediaUrls = [];
                if (draft.contentType === 'post') {
                    // 슬라이드 PNG 이미지 URL 목록
                    mediaUrls = draft.renderedMedia.files.map(f => hostUrl + f.publicUrl);
                } else {
                    // 숏폼 비디오/씬 이미지 URL 목록
                    mediaUrls = draft.renderedMedia.scenes.map(s => hostUrl + s.publicUrl);
                }

                const igRes = await instagramService.publish({
                    contentType: draft.contentType,
                    mediaUrls,
                    caption: draft.content.caption,
                    credentials: credentials.instagram
                });
                publishResults.channels.instagram = igRes;
            } catch (err) {
                publishResults.channels.instagram = {
                    success: false,
                    error: err.message
                };
            }
        }

        // B. 유튜브 게시 (영상 콘텐츠 또는 유튜브 선택 시)
        if (channels.includes('youtube')) {
            if (draft.contentType === 'post') {
                publishResults.channels.youtube = {
                    skipped: true,
                    message: "게시글(카드뉴스)은 인스타그램 전용 포맷이므로 유튜브 업로드는 건너뛰었습니다."
                };
            } else {
                try {
                    const videoThumbnail = draft.renderedMedia.thumbnailUrl 
                        ? (hostUrl + draft.renderedMedia.thumbnailUrl) 
                        : null;

                    const ytRes = await youtubeService.publish({
                        title: draft.content.title,
                        description: draft.content.caption,
                        tags: draft.content.hashtags || [],
                        privacyStatus: 'public',
                        videoUrl: videoThumbnail,
                        credentials: credentials.youtube
                    });
                    publishResults.channels.youtube = ytRes;
                } catch (err) {
                    publishResults.channels.youtube = {
                        success: false,
                        error: err.message
                    };
                }
            }
        }

        // Draft 상태를 PUBLISHED로 기록
        const updatedDraft = draftStore.setPublishResult(draftId, publishResults);

        res.status(200).json({
            success: true,
            step: "STEP 6 완료 (SNS 게시 완료)",
            message: "인스타그램 및 유튜브에 성공적으로 게시되었습니다!",
            data: {
                draftId: updatedDraft.id,
                status: updatedDraft.status,
                publishResults
            }
        });
    } catch (error) {
        next(error);
    }
};
