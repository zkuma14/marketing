const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const supabaseService = require('../services/supabaseService');

/**
 * Supabase DB + 로컬 영구 캐시 하이브리드 Draft 저장소
 * STEP 1 ~ STEP 6 전 과정의 상태(DRAFT -> FIXED -> GENERATED -> PUBLISHED)를 관리합니다.
 */
class DraftStore {
    constructor() {
        this.drafts = new Map();
        this.storageDir = path.join(__dirname, '../data');
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }

    createDraft({ contentType, topic, tone, content, previewText }) {
        const id = 'draft_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
        const draft = {
            id,
            contentType, // 'post' (카드뉴스) | 'video' (쇼츠/릴스)
            topic,
            tone: tone || 'mz',
            status: 'DRAFT',
            content,
            previewText,
            renderedMedia: null,
            publishResults: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.drafts.set(id, draft);
        this._saveToFile(draft);
        // Supabase DB 비동기 동기화
        supabaseService.saveDraft(draft).catch(err => console.error('[Supabase Sync Error]:', err.message));

        return draft;
    }

    getDraft(id) {
        if (this.drafts.has(id)) {
            return this.drafts.get(id);
        }

        // 로컬 파일에서 로드 시도
        const filePath = path.join(this.storageDir, `${id}.json`);
        if (fs.existsSync(filePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                this.drafts.set(id, data);
                return data;
            } catch (err) {
                console.error(`Failed to load draft file ${filePath}:`, err);
            }
        }
        return null;
    }

    async getDraftAsync(id) {
        let draft = this.getDraft(id);
        if (!draft && supabaseService.isConnected) {
            draft = await supabaseService.getDraft(id);
            if (draft) {
                this.drafts.set(id, draft);
                this._saveToFile(draft);
            }
        }
        return draft;
    }

    updateDraft(id, updates) {
        const draft = this.getDraft(id);
        if (!draft) throw new Error(`Draft '${id}'를 찾을 수 없습니다.`);

        if (updates.topic) draft.topic = updates.topic;
        if (updates.tone) draft.tone = updates.tone;
        if (updates.content) {
            draft.content = {
                ...draft.content,
                ...updates.content
            };
        }
        if (updates.previewText) draft.previewText = updates.previewText;

        draft.status = 'MODIFIED';
        draft.updatedAt = new Date().toISOString();

        this.drafts.set(id, draft);
        this._saveToFile(draft);
        supabaseService.saveDraft(draft).catch(err => console.error('[Supabase Sync Error]:', err.message));

        return draft;
    }

    fixDraft(id) {
        const draft = this.getDraft(id);
        if (!draft) throw new Error(`Draft '${id}'를 찾을 수 없습니다.`);

        if (draft.contentType === 'post') {
            if (!draft.content?.slides || draft.content.slides.length === 0) {
                throw new Error('카드뉴스 슬라이드 데이터가 비어있어 Fix할 수 없습니다.');
            }
        } else if (draft.contentType === 'video') {
            if (!draft.content?.scenes || draft.content.scenes.length === 0) {
                throw new Error('영상 씬(Scene) 데이터가 비어있어 Fix할 수 없습니다.');
            }
        }

        draft.status = 'FIXED';
        draft.fixedAt = new Date().toISOString();
        draft.updatedAt = new Date().toISOString();

        this.drafts.set(id, draft);
        this._saveToFile(draft);
        supabaseService.saveDraft(draft).catch(err => console.error('[Supabase Sync Error]:', err.message));

        return draft;
    }

    setRenderedMedia(id, mediaData) {
        const draft = this.getDraft(id);
        if (!draft) throw new Error(`Draft '${id}'를 찾을 수 없습니다.`);

        draft.renderedMedia = {
            ...mediaData,
            generatedAt: new Date().toISOString()
        };
        draft.status = 'GENERATED';
        draft.updatedAt = new Date().toISOString();

        this.drafts.set(id, draft);
        this._saveToFile(draft);
        supabaseService.saveDraft(draft).catch(err => console.error('[Supabase Sync Error]:', err.message));

        return draft;
    }

    setPublishResult(id, publishData) {
        const draft = this.getDraft(id);
        if (!draft) throw new Error(`Draft '${id}'를 찾을 수 없습니다.`);

        draft.publishResults = {
            ...publishData,
            publishedAt: new Date().toISOString()
        };
        draft.status = 'PUBLISHED';
        draft.updatedAt = new Date().toISOString();

        this.drafts.set(id, draft);
        this._saveToFile(draft);
        supabaseService.saveDraft(draft).catch(err => console.error('[Supabase Sync Error]:', err.message));

        return draft;
    }

    listDrafts() {
        return Array.from(this.drafts.values()).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    _saveToFile(draft) {
        try {
            const filePath = path.join(this.storageDir, `${draft.id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(draft, null, 2), 'utf-8');
        } catch (err) {
            console.error(`Failed to save draft ${draft.id} to file:`, err);
        }
    }
}

module.exports = new DraftStore();
