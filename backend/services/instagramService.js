const axios = require('axios');

/**
 * 인스타그램 게시 서비스 (Meta Graph API v19.0)
 * STEP 6: 카드뉴스(캐러셀), 단일 이미지, 릴스 영상 게시
 */
class InstagramService {
    constructor() {
        this.apiVersion = 'v19.0';
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    }

    /**
     * 인스타그램 게시 실행
     * @param {Object} params
     * @param {string} params.contentType - 'post' | 'video'
     * @param {Array} params.mediaUrls - 절대 HTTP URL 목록 (캐러셀 이미지 또는 동영상)
     * @param {string} params.caption - 본문 캡션 및 해시태그
     * @param {Object} params.credentials - 액세스 토큰 및 계정 ID (선택)
     */
    async publish({ contentType, mediaUrls, caption, credentials = {} }) {
        const accessToken = credentials.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
        const accountId = credentials.accountId || process.env.INSTAGRAM_ACCOUNT_ID;

        // 실제 토큰이 없을 경우 Mock 시뮬레이션 모드로 안전하게 작동
        if (!accessToken || !accountId || accessToken === 'your_instagram_token') {
            return this._mockPublish({ contentType, mediaUrls, caption });
        }

        try {
            if (contentType === 'video') {
                return await this._publishReels({ accountId, accessToken, videoUrl: mediaUrls[0], caption });
            } else if (mediaUrls.length > 1) {
                return await this._publishCarousel({ accountId, accessToken, imageUrls: mediaUrls, caption });
            } else {
                return await this._publishSinglePhoto({ accountId, accessToken, imageUrl: mediaUrls[0], caption });
            }
        } catch (error) {
            console.error('[InstagramService Error]:', error.response?.data || error.message);
            throw new Error(`인스타그램 게시 실패: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    // 1. 단일 사진 게시
    async _publishSinglePhoto({ accountId, accessToken, imageUrl, caption }) {
        const createRes = await axios.post(`${this.baseUrl}/${accountId}/media`, {
            image_url: imageUrl,
            caption: caption,
            access_token: accessToken
        });
        const creationId = createRes.data.id;

        const publishRes = await axios.post(`${this.baseUrl}/${accountId}/media_publish`, {
            creation_id: creationId,
            access_token: accessToken
        });

        return {
            channel: 'instagram',
            mode: 'live',
            type: 'single_photo',
            postId: publishRes.data.id,
            postUrl: `https://www.instagram.com/p/${publishRes.data.id}/`,
            status: 'PUBLISHED'
        };
    }

    // 2. 캐러셀(슬라이드 여러 장) 카드뉴스 게시
    async _publishCarousel({ accountId, accessToken, imageUrls, caption }) {
        // Step A: 각 슬라이드별 미디어 아이템 컨테이너 생성
        const itemIds = [];
        for (const imgUrl of imageUrls) {
            const itemRes = await axios.post(`${this.baseUrl}/${accountId}/media`, {
                image_url: imgUrl,
                is_carousel_item: true,
                access_token: accessToken
            });
            itemIds.push(itemRes.data.id);
        }

        // Step B: 캐러셀 컨테이너 생성
        const carouselRes = await axios.post(`${this.baseUrl}/${accountId}/media`, {
            media_type: 'CAROUSEL',
            children: itemIds.join(','),
            caption: caption,
            access_token: accessToken
        });
        const carouselContainerId = carouselRes.data.id;

        // Step C: 최종 발행
        const publishRes = await axios.post(`${this.baseUrl}/${accountId}/media_publish`, {
            creation_id: carouselContainerId,
            access_token: accessToken
        });

        return {
            channel: 'instagram',
            mode: 'live',
            type: 'carousel',
            itemCount: itemIds.length,
            postId: publishRes.data.id,
            postUrl: `https://www.instagram.com/p/${publishRes.data.id}/`,
            status: 'PUBLISHED'
        };
    }

    // 3. 인스타그램 릴스(Reels) 동영상 게시
    async _publishReels({ accountId, accessToken, videoUrl, caption }) {
        const createRes = await axios.post(`${this.baseUrl}/${accountId}/media`, {
            media_type: 'REELS',
            video_url: videoUrl,
            caption: caption,
            share_to_feed: true,
            access_token: accessToken
        });
        const creationId = createRes.data.id;

        const publishRes = await axios.post(`${this.baseUrl}/${accountId}/media_publish`, {
            creation_id: creationId,
            access_token: accessToken
        });

        return {
            channel: 'instagram',
            mode: 'live',
            type: 'reels',
            postId: publishRes.data.id,
            postUrl: `https://www.instagram.com/reel/${publishRes.data.id}/`,
            status: 'PUBLISHED'
        };
    }

    // 모의(Mock) 시뮬레이션 응답
    _mockPublish({ contentType, mediaUrls, caption }) {
        const mockPostId = 'ig_' + Math.random().toString(36).substring(2, 11);
        return {
            channel: 'instagram',
            mode: 'simulation (API Key 미설정 모드)',
            type: contentType === 'video' ? 'reels' : (mediaUrls.length > 1 ? 'carousel' : 'single_photo'),
            itemCount: mediaUrls.length,
            postId: mockPostId,
            postUrl: contentType === 'video'
                ? `https://www.instagram.com/reel/${mockPostId}/`
                : `https://www.instagram.com/p/${mockPostId}/`,
            captionSnippet: caption.substring(0, 80) + '...',
            publishedAt: new Date().toISOString(),
            status: 'PUBLISHED_SUCCESS',
            note: '실제 Instagram Meta Graph API 발행 규격(v19.0)으로 처리되었습니다. .env에 INSTAGRAM_ACCESS_TOKEN 설정 시 실제 계정에 포스팅됩니다.'
        };
    }
}

module.exports = new InstagramService();
