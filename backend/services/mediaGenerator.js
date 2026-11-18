const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const opentype = require('opentype.js');

/**
 * 무채색(Achromatic) & 헤어라인(Hairline) 기반 미디어 생성 엔진
 * - opentype.js 기반 벡터 텍스트 렌더링: 한글 폰트를 SVG <path> 벡터로 직접 변환
 * - 시스템 폰트 / fontconfig / librsvg 의존성 0% -> Render Linux 배포 환경에서도 100% 한글 깨짐 방지
 * - Colors.white (#FFFFFF) 배경 기반 노이즈 제거
 * - Pure Black (#000000) 고대비 타이포그래피 (Heavy Header, 음수 자간)
 * - 0.5pt 미세 헤어라인 테두리 (#E5E7EB) 및 여백 활용
 * - 절제된 흑백 원형 배지(Circle Badge)
 */

class MediaGenerator {
    constructor() {
        this.outputBaseDir = path.join(__dirname, '../public/generated');
        if (!fs.existsSync(this.outputBaseDir)) {
            fs.mkdirSync(this.outputBaseDir, { recursive: true });
        }

        // NanumGothic-Bold 폰트 메모리 로딩
        this.font = this._loadFont();
    }

    _loadFont() {
        try {
            const fontPath = path.join(__dirname, '../fonts/NanumGothic-Bold.ttf');
            if (fs.existsSync(fontPath)) {
                const buffer = fs.readFileSync(fontPath);
                const font = opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
                console.log('[MediaGenerator] ✅ opentype.js 한글 폰트 로딩 완료: NanumGothic-Bold.ttf');
                return font;
            }
        } catch (e) {
            console.error('[MediaGenerator] ❌ 폰트 로드 실패:', e.message);
        }
        return null;
    }

    /**
     * opentype.js를 이용해 텍스트를 SVG <path> 벡터로 렌더링
     */
    _renderText(text, x, y, fontSize, { align = 'left', fill = '#000000', opacity = 1 } = {}) {
        if (!text || !this.font) return '';
        const cleanText = String(text);
        let targetX = x;

        if (align === 'center') {
            const width = this.font.getAdvanceWidth(cleanText, fontSize);
            targetX = x - (width / 2);
        } else if (align === 'right') {
            const width = this.font.getAdvanceWidth(cleanText, fontSize);
            targetX = x - width;
        }

        const p = this.font.getPath(cleanText, targetX, y, fontSize);
        p.fill = fill;
        const svgPath = p.toSVG();
        if (opacity < 1) {
            return `<g opacity="${opacity}">${svgPath}</g>`;
        }
        return svgPath;
    }

    /**
     * 텍스트를 maxWidth에 맞춰 줄바꿈
     */
    _wrapText(text, maxWidth, fontSize) {
        if (!text) return [];
        if (!this.font) return [String(text)];

        const cleanText = String(text);
        const chars = cleanText.split('');
        const lines = [];
        let curLine = '';

        for (const c of chars) {
            if (c === '\n') {
                lines.push(curLine);
                curLine = '';
                continue;
            }
            const testLine = curLine + c;
            const w = this.font.getAdvanceWidth(testLine, fontSize);
            if (w > maxWidth && curLine.length > 0) {
                lines.push(curLine);
                curLine = c;
            } else {
                curLine = testLine;
            }
        }
        if (curLine) lines.push(curLine);
        return lines;
    }

    /**
     * 카드뉴스 슬라이드(1080x1080) SVG 템플릿
     */
    _createCardSlideSvg({ slideNumber, totalSlides, badge, title, desc, optionA, optionB, isCover, isOutro }) {
        let textPaths = '';

        // 1. 표지 (Cover)
        if (isCover) {
            // UNIMEET 워드마크
            textPaths += this._renderText('UNIMEET', 100, 135, 34, { fill: '#000000' });

            // 배지 (우상단 알약 배지 텍스트)
            textPaths += this._renderText(badge || 'UNIMEET', 905, 126, 16, { align: 'center', fill: '#FFFFFF' });

            // 메인 타이틀 (Heavy Header)
            const titleLines = (title || '').split('\n').map(l => l.trim()).filter(Boolean);
            let ty = 340;
            for (const line of titleLines) {
                textPaths += this._renderText(line, 100, ty, 68, { fill: '#000000' });
                ty += 85;
            }

            // 서브 설명
            if (desc) {
                const descLines = this._wrapText(desc, 880, 28);
                let dy = ty + 30;
                for (const dline of descLines) {
                    textPaths += this._renderText(dline, 100, dy, 28, { fill: '#6B7280' });
                    dy += 40;
                }
            }

            // 선택지 A 카드
            textPaths += this._renderText('A', 150, 663, 20, { align: 'center', fill: '#FFFFFF' });
            const aLines = this._wrapText(optionA || '', 350, 24);
            let ay = 740;
            for (const line of aLines) {
                textPaths += this._renderText(line, 140, ay, 24, { fill: '#111827' });
                ay += 34;
            }

            // VS 배지
            textPaths += this._renderText('VS', 540, 722, 18, { align: 'center', fill: '#000000' });

            // 선택지 B 카드
            textPaths += this._renderText('B', 620, 663, 20, { align: 'center', fill: '#FFFFFF' });
            const bLines = this._wrapText(optionB || '', 350, 24);
            let by = 740;
            for (const line of bLines) {
                textPaths += this._renderText(line, 610, by, 24, { fill: '#111827' });
                by += 34;
            }

            // 하단 푸터
            textPaths += this._renderText('SWIPE TO CHOOSE', 100, 960, 20, { fill: '#000000' });
            textPaths += this._renderText(`01 / ${String(totalSlides).padStart(2, '0')}`, 980, 960, 20, { align: 'right', fill: '#9CA3AF' });

            return `
            <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
                <!-- 배경 -->
                <rect width="1080" height="1080" fill="#FFFFFF" />

                <!-- 0.5pt 헤어라인 내부 프레임 -->
                <rect x="40" y="40" width="1000" height="1000" fill="none" stroke="#E5E7EB" stroke-width="1.5" />

                <!-- 상단 우측 배지 배경 -->
                <rect x="830" y="100" width="150" height="40" rx="20" fill="#000000"/>

                <!-- 헤어라인 구분선 -->
                <line x1="100" y1="180" x2="980" y2="180" stroke="#F3F4F6" stroke-width="1.5" />

                <!-- 선택지 A 박스 -->
                <rect x="100" y="600" width="410" height="230" rx="16" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1.5"/>
                <circle cx="150" cy="655" r="20" fill="#000000"/>

                <!-- 중앙 VS 원 -->
                <circle cx="540" cy="715" r="28" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>

                <!-- 선택지 B 박스 -->
                <rect x="570" y="600" width="410" height="230" rx="16" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1.5"/>
                <circle cx="620" cy="655" r="20" fill="#000000"/>

                <!-- 하단 구분선 -->
                <line x1="100" y1="910" x2="980" y2="910" stroke="#F3F4F6" stroke-width="1.5" />

                <!-- 모든 텍스트 벡터 패스 -->
                ${textPaths}
            </svg>
            `;
        }

        // 2. 아웃트로 (Outro)
        if (isOutro) {
            textPaths += this._renderText('UNIMEET', 100, 135, 34, { fill: '#000000' });
            textPaths += this._renderText(`${slideNumber} / ${totalSlides}`, 980, 130, 20, { align: 'right', fill: '#9CA3AF' });
            textPaths += this._renderText('U', 540, 358, 44, { align: 'center', fill: '#FFFFFF' });

            const cleanTitle = (title || '').replace(/\n/g, ' ');
            const titleLines = this._wrapText(cleanTitle, 800, 52);
            let ty = 480;
            for (const line of titleLines) {
                textPaths += this._renderText(line, 540, ty, 52, { align: 'center', fill: '#000000' });
                ty += 65;
            }

            const descLines = this._wrapText(desc || '', 800, 26);
            let dy = ty + 25;
            for (const line of descLines) {
                textPaths += this._renderText(line, 540, dy, 26, { align: 'center', fill: '#6B7280' });
                dy += 38;
            }

            textPaths += this._renderText('지금 유니밋 다운로드하기', 540, 720, 28, { align: 'center', fill: '#FFFFFF' });
            textPaths += this._renderText('프로필 링크 @unimeet.official', 540, 820, 22, { align: 'center', fill: '#9CA3AF' });
            textPaths += this._renderText('UniMeet · Campus Match & Social', 540, 960, 20, { align: 'center', fill: '#9CA3AF' });

            return `
            <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
                <rect width="1080" height="1080" fill="#FFFFFF" />
                <rect x="40" y="40" width="1000" height="1000" fill="none" stroke="#E5E7EB" stroke-width="1.5" />
                <line x1="100" y1="180" x2="980" y2="180" stroke="#F3F4F6" stroke-width="1.5" />

                <!-- 중앙 아이콘 원 -->
                <circle cx="540" cy="340" r="60" fill="#000000" />

                <!-- CTA 버튼 -->
                <rect x="240" y="660" width="600" height="96" rx="48" fill="#000000" />

                <!-- 하단 구분선 -->
                <line x1="100" y1="910" x2="980" y2="910" stroke="#F3F4F6" stroke-width="1.5" />

                ${textPaths}
            </svg>
            `;
        }

        // 3. 질문 슬라이드 (Q1, Q2, Q3)
        textPaths += this._renderText('UNIMEET', 100, 135, 34, { fill: '#000000' });
        textPaths += this._renderText(badge || '', 855, 125, 16, { align: 'center', fill: '#FFFFFF' });
        textPaths += this._renderText(`${slideNumber} / ${totalSlides}`, 980, 128, 20, { align: 'right', fill: '#9CA3AF' });

        // 메인 질문 헤드라인
        const titleLines = (title || '').split('\n').map(l => l.trim()).filter(Boolean);
        let ty = 270;
        for (const line of titleLines) {
            textPaths += this._renderText(line, 100, ty, 52, { fill: '#000000' });
            ty += 68;
        }

        // 서브 설명
        if (desc) {
            const descLines = this._wrapText(desc, 850, 26);
            let dy = ty + 15;
            for (const dline of descLines) {
                textPaths += this._renderText(dline, 100, dy, 26, { fill: '#6B7280' });
                dy += 36;
            }
        }

        // 선택지 A 카드
        textPaths += this._renderText('A', 170, 545, 30, { align: 'center', fill: '#FFFFFF' });
        const aLines = this._wrapText(optionA || '', 680, 30);
        let aY = 535;
        for (const line of aLines) {
            textPaths += this._renderText(line, 235, aY, 30, { fill: '#111827' });
            aY += 40;
        }

        // VS 원
        textPaths += this._renderText('VS', 540, 680, 18, { align: 'center', fill: '#000000' });

        // 선택지 B 카드
        textPaths += this._renderText('B', 170, 775, 30, { align: 'center', fill: '#FFFFFF' });
        const bLines = this._wrapText(optionB || '', 680, 30);
        let bY = 765;
        for (const line of bLines) {
            textPaths += this._renderText(line, 235, bY, 30, { fill: '#111827' });
            bY += 40;
        }

        // 하단 라인
        textPaths += this._renderText('COMMENT YOUR CHOICE [A vs B]', 100, 960, 20, { fill: '#000000' });
        textPaths += this._renderText('UNIMEET', 980, 960, 20, { align: 'right', fill: '#9CA3AF' });

        return `
        <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
            <rect width="1080" height="1080" fill="#FFFFFF" />
            <rect x="40" y="40" width="1000" height="1000" fill="none" stroke="#E5E7EB" stroke-width="1.5" />

            <!-- 상단 배지 -->
            <rect x="800" y="100" width="110" height="38" rx="19" fill="#000000"/>
            <line x1="100" y1="170" x2="980" y2="170" stroke="#F3F4F6" stroke-width="1.5" />

            <!-- 선택지 A 카드 -->
            <rect x="100" y="440" width="880" height="190" rx="20" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1.5"/>
            <circle cx="170" cy="535" r="32" fill="#000000" />

            <!-- VS 배지 -->
            <circle cx="540" cy="672" r="26" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>

            <!-- 선택지 B 카드 -->
            <rect x="100" y="670" width="880" height="190" rx="20" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1.5"/>
            <circle cx="170" cy="765" r="32" fill="#000000" />

            <!-- 하단 구분선 -->
            <line x1="100" y1="910" x2="980" y2="910" stroke="#F3F4F6" stroke-width="1.5" />

            ${textPaths}
        </svg>
        `;
    }

    /**
     * 무채색 숏폼 영상 씬(1080x1920) SVG 템플릿
     */
    _createVideoSceneSvg({ sceneNumber, totalScenes, durationSec, title, subtitle, narration, visualDescription, optionA, optionB }) {
        let textPaths = '';

        // 상단 바
        textPaths += this._renderText('UNIMEET', 100, 160, 36, { fill: '#000000' });
        textPaths += this._renderText(`SCENE ${sceneNumber}/${totalScenes} · ${durationSec}S`, 865, 157, 18, { align: 'center', fill: '#FFFFFF' });

        // 중앙 타이틀
        const titleLines = this._wrapText(title || '', 850, 56);
        let ty = 380;
        for (const line of titleLines) {
            textPaths += this._renderText(line, 540, ty, 56, { align: 'center', fill: '#000000' });
            ty += 70;
        }

        // 인스타그램 스토리 자막 바
        const subLines = this._wrapText(subtitle || '', 820, 36);
        let sy = 545;
        for (const line of subLines) {
            textPaths += this._renderText(line, 540, sy, 36, { align: 'center', fill: '#FFFFFF' });
            sy += 48;
        }

        // A 카드
        textPaths += this._renderText('A', 170, 773, 30, { align: 'center', fill: '#FFFFFF' });
        const aLines = this._wrapText(optionA || '', 720, 32);
        let aY = 770;
        for (const line of aLines) {
            textPaths += this._renderText(line, 235, aY, 32, { fill: '#111827' });
            aY += 44;
        }

        // VS 원
        textPaths += this._renderText('VS', 540, 992, 24, { align: 'center', fill: '#000000' });

        // B 카드
        textPaths += this._renderText('B', 170, 1123, 30, { align: 'center', fill: '#FFFFFF' });
        const bLines = this._wrapText(optionB || '', 720, 32);
        let bY = 1120;
        for (const line of bLines) {
            textPaths += this._renderText(line, 235, bY, 32, { fill: '#111827' });
            bY += 44;
        }

        // 나레이션 스크립트 오버레이
        textPaths += this._renderText('VOICEOVER SCRIPT', 140, 1440, 20, { fill: '#000000' });
        const narLines = this._wrapText(`"${narration || ''}"`, 820, 24);
        let ny = 1490;
        for (const line of narLines) {
            textPaths += this._renderText(line, 140, ny, 24, { fill: '#374151' });
            ny += 34;
        }
        const dirLines = this._wrapText(`DIRECTING: ${visualDescription || ''}`, 820, 18);
        let diry = ny + 15;
        for (const line of dirLines) {
            textPaths += this._renderText(line, 140, diry, 18, { fill: '#9CA3AF' });
            diry += 26;
        }

        // 푸터
        textPaths += this._renderText('UNIMEET SHORTS & REELS', 540, 1790, 24, { align: 'center', fill: '#000000' });

        return `
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
            <rect width="1080" height="1920" fill="#FFFFFF" />
            <rect x="50" y="50" width="980" height="1820" fill="none" stroke="#E5E7EB" stroke-width="1.5" />

            <!-- 상단 바 배지 -->
            <rect x="750" y="125" width="230" height="48" rx="24" fill="#000000"/>
            <line x1="100" y1="210" x2="980" y2="210" stroke="#F3F4F6" stroke-width="1.5" />

            <!-- 자막 바 (Pure Black) -->
            <rect x="90" y="470" width="900" height="140" rx="24" fill="#000000" />

            <!-- A 선택지 박스 -->
            <rect x="90" y="680" width="900" height="250" rx="28" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="2"/>
            <circle cx="170" cy="760" r="34" fill="#000000" />

            <!-- VS 배지 -->
            <circle cx="540" cy="980" r="40" fill="#FFFFFF" stroke="#000000" stroke-width="3"/>

            <!-- B 선택지 박스 -->
            <rect x="90" y="1030" width="900" height="250" rx="28" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="2"/>
            <circle cx="170" cy="1110" r="34" fill="#000000" />

            <!-- 나레이션 오버레이 박스 -->
            <rect x="90" y="1380" width="900" height="260" rx="24" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1.5"/>
            <line x1="90" y1="1720" x2="990" y2="1720" stroke="#F3F4F6" stroke-width="1.5" />

            ${textPaths}
        </svg>
        `;
    }

    /**
     * 카드뉴스 게시글(Post) 이미지 세트 생성
     */
    async generatePostImages(draftId, content) {
        const draftDir = path.join(this.outputBaseDir, draftId);
        if (!fs.existsSync(draftDir)) {
            fs.mkdirSync(draftDir, { recursive: true });
        }

        const slides = content.slides || [];
        const generatedFiles = [];
        const totalSlides = slides.length;

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const slideNumber = i + 1;
            const isCover = (i === 0);
            const isOutro = (i === slides.length - 1);

            const svgContent = this._createCardSlideSvg({
                slideNumber,
                totalSlides,
                badge: slide.badge,
                title: slide.title,
                desc: slide.desc,
                optionA: slide.optionA,
                optionB: slide.optionB,
                isCover,
                isOutro
            });

            const fileName = `slide-${slideNumber}.png`;
            const filePath = path.join(draftDir, fileName);

            await sharp(Buffer.from(svgContent))
                .resize(1080, 1080)
                .png({ quality: 95 })
                .toFile(filePath);

            generatedFiles.push({
                slideNumber,
                fileName,
                filePath,
                publicUrl: `/generated/${draftId}/${fileName}`,
                title: slide.title,
                isCover,
                isOutro
            });
        }

        return {
            mediaType: 'card_news',
            theme: 'achromatic_minimal',
            resolution: '1080x1080',
            slideCount: generatedFiles.length,
            files: generatedFiles,
            previewCoverUrl: generatedFiles[0]?.publicUrl || null
        };
    }

    /**
     * 영상/숏폼(Video) 미디어 세트 생성
     */
    async generateVideoAssets(draftId, content) {
        const draftDir = path.join(this.outputBaseDir, draftId);
        if (!fs.existsSync(draftDir)) {
            fs.mkdirSync(draftDir, { recursive: true });
        }

        const scenes = content.scenes || [];
        const sceneFiles = [];
        const totalScenes = scenes.length;

        for (let i = 0; i < scenes.length; i++) {
            const sc = scenes[i];
            const sceneNumber = i + 1;

            const svgContent = this._createVideoSceneSvg({
                sceneNumber,
                totalScenes,
                durationSec: sc.durationSec || 5,
                title: sc.title,
                subtitle: sc.subtitle,
                narration: sc.narration,
                visualDescription: sc.visualDescription,
                optionA: sc.optionA,
                optionB: sc.optionB
            });

            const fileName = `scene-${sceneNumber}.png`;
            const filePath = path.join(draftDir, fileName);

            await sharp(Buffer.from(svgContent))
                .resize(1080, 1920)
                .png({ quality: 95 })
                .toFile(filePath);

            sceneFiles.push({
                sceneNumber,
                durationSec: sc.durationSec,
                fileName,
                filePath,
                publicUrl: `/generated/${draftId}/${fileName}`,
                narration: sc.narration,
                subtitle: sc.subtitle
            });
        }

        const totalDuration = scenes.reduce((acc, cur) => acc + (cur.durationSec || 5), 0);
        
        return {
            mediaType: 'shorts_video',
            theme: 'achromatic_minimal',
            aspectRatio: '9:16',
            resolution: '1080x1920',
            totalDurationSec: totalDuration,
            bgm: content.bgmRecommendation || 'Minimal Clean Lo-fi',
            scenes: sceneFiles,
            thumbnailUrl: sceneFiles[0]?.publicUrl || null,
            videoStatus: 'READY_FOR_UPLOAD'
        };
    }
}

module.exports = new MediaGenerator();
