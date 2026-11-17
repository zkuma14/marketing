const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase 데이터베이스 및 클라이언트 연동 모듈
 * - PostgreSQL 직접 연결 (pg Pool)
 * - Supabase JS 클라이언트 (@supabase/supabase-js)
 * - 자동 테이블 생성 (마이그레이션 DDL) 및 동기화
 */
class SupabaseService {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL || 'https://brrftctjidoldyklvced.supabase.co';
        this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
        this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        // Supabase JS REST 클라이언트 초기화 (키가 제공된 경우)
        const key = this.supabaseServiceKey || this.supabaseAnonKey;
        if (key) {
            this.client = createClient(this.supabaseUrl, key);
        } else {
            this.client = null;
        }

        // PostgreSQL 연결 풀 (Direct Connection)
        this.dbConfig = {
            host: process.env.DB_HOST || 'db.brrftctjidoldyklvced.supabase.co',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            database: process.env.DB_DATABASE || 'postgres',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'smuys123!!',
            ssl: {
                rejectUnauthorized: false
            },
            connectionTimeoutMillis: 5000,
            max: 5
        };

        this.pool = null;
        this.isConnected = false;
    }

    /**
     * DB 연결 초기화 및 테이블 자동 생성
     */
    async init() {
        try {
            this.pool = new Pool(this.dbConfig);
            
            // 핑 테스트
            const client = await this.pool.connect();
            this.isConnected = true;
            console.log(`[Supabase] ✅ PostgreSQL Database connected successfully! (Host: ${this.dbConfig.host})`);

            // 테이블 DDL 자동 생성
            await client.query(`
                CREATE TABLE IF NOT EXISTS marketing_drafts (
                    id VARCHAR(64) PRIMARY KEY,
                    content_type VARCHAR(32) NOT NULL,
                    topic TEXT NOT NULL,
                    tone VARCHAR(32) DEFAULT 'mz',
                    status VARCHAR(32) DEFAULT 'DRAFT',
                    content JSONB,
                    preview_text TEXT,
                    rendered_media JSONB,
                    publish_results JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    fixed_at TIMESTAMPTZ
                );
            `);
            console.log('[Supabase] ✅ marketing_drafts 테이블 준비 완료.');
            client.release();
        } catch (err) {
            this.isConnected = false;
            console.warn(`[Supabase Notice] PostgreSQL 직접 연결 알림: ${err.message}`);
            console.warn(`[Supabase Notice] (로컬 네트워크 IPv6 미지원 환경이거나 일시적 연결 지연 시 로컬 저장소 캐시와 자동 병행 처리됩니다.)`);
        }
    }

    /**
     * Draft 저장/업데이트 (UPSERT)
     */
    async saveDraft(draft) {
        if (!this.isConnected || !this.pool) return false;

        const query = `
            INSERT INTO marketing_drafts (
                id, content_type, topic, tone, status, content, preview_text,
                rendered_media, publish_results, created_at, updated_at, fixed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) DO UPDATE SET
                topic = EXCLUDED.topic,
                tone = EXCLUDED.tone,
                status = EXCLUDED.status,
                content = EXCLUDED.content,
                preview_text = EXCLUDED.preview_text,
                rendered_media = EXCLUDED.rendered_media,
                publish_results = EXCLUDED.publish_results,
                updated_at = EXCLUDED.updated_at,
                fixed_at = EXCLUDED.fixed_at;
        `;

        try {
            await this.pool.query(query, [
                draft.id,
                draft.contentType,
                draft.topic,
                draft.tone,
                draft.status,
                JSON.stringify(draft.content || {}),
                draft.previewText || '',
                draft.renderedMedia ? JSON.stringify(draft.renderedMedia) : null,
                draft.publishResults ? JSON.stringify(draft.publishResults) : null,
                draft.createdAt,
                draft.updatedAt,
                draft.fixedAt || null
            ]);
            return true;
        } catch (err) {
            console.error('[Supabase Save Error]:', err.message);
            return false;
        }
    }

    /**
     * Draft 조회
     */
    async getDraft(id) {
        if (!this.isConnected || !this.pool) return null;

        try {
            const res = await this.pool.query('SELECT * FROM marketing_drafts WHERE id = $1', [id]);
            if (res.rows.length === 0) return null;

            const row = res.rows[0];
            return {
                id: row.id,
                contentType: row.content_type,
                topic: row.topic,
                tone: row.tone,
                status: row.status,
                content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
                previewText: row.preview_text,
                renderedMedia: typeof row.rendered_media === 'string' ? JSON.parse(row.rendered_media) : row.rendered_media,
                publishResults: typeof row.publish_results === 'string' ? JSON.parse(row.publish_results) : row.publish_results,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                fixedAt: row.fixed_at
            };
        } catch (err) {
            console.error('[Supabase Get Error]:', err.message);
            return null;
        }
    }

    /**
     * 전체 Draft 목록 조회
     */
    async listDrafts() {
        if (!this.isConnected || !this.pool) return [];

        try {
            const res = await this.pool.query('SELECT * FROM marketing_drafts ORDER BY created_at DESC');
            return res.rows.map(row => ({
                id: row.id,
                contentType: row.content_type,
                topic: row.topic,
                tone: row.tone,
                status: row.status,
                content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
                previewText: row.preview_text,
                renderedMedia: typeof row.rendered_media === 'string' ? JSON.parse(row.rendered_media) : row.rendered_media,
                publishResults: typeof row.publish_results === 'string' ? JSON.parse(row.publish_results) : row.publish_results,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                fixedAt: row.fixed_at
            }));
        } catch (err) {
            console.error('[Supabase List Error]:', err.message);
            return [];
        }
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            supabaseUrl: this.supabaseUrl,
            host: this.dbConfig.host,
            database: this.dbConfig.database,
            user: this.dbConfig.user,
            port: this.dbConfig.port
        };
    }
}

module.exports = new SupabaseService();
