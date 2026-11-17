const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * 무채색(Achromatic) & 헤어라인(Hairline) 기반 미디어 생성 엔진
 * 인스타그램 에디토리얼 미학:
 * 1. Colors.white (#FFFFFF) 배경 기반 노이즈 제거
 * 2. Pure Black (#000000) 고대비 타이포그래피 (Heavy Header, 음수 자간)
 * 3. 0.5pt 미세 헤어라인 테두리 (#E5E7EB) 및 여백 활용
 * 4. 절제된 흑백 원형 배지(Circle Badge)
 */

class MediaGenerator {
    constructor() {
        this.outputBaseDir = path.join(__dirname, '../public/generated');
        if (!fs.existsSync(this.outputBaseDir)) {
            fs.mkdirSync(this.outputBaseDir, { recursive: true });
        }
    }

    _escapeXml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * 무채색 카드뉴스 슬라이드(1080x1080) SVG 템플릿
     */
    _createCardSlideSvg({ slideNumber, totalSlides, badge, title, desc, optionA, optionB, isCover, isOutro }) {
        const escapedBadge = this._escapeXml(badge || 'UNIMEET');
        const escapedDesc = this._escapeXml(desc || '');
        const escapedA = this._escapeXml(optionA || '');
        const escapedB = this._escapeXml(optionB || '');

        const titleLines = (title || '').split('\n').map(l => this._escapeXml(l.trim())).filter(Boolean);
        const titleTspans = titleLines.map((line, idx) => 
            `<tspan x="100" dy="${idx === 0 ? 0 : 80}">${line}</tspan>`
        ).join('');

        // 1. 표지 (Cover) - 절제된 에디토리얼 매거진 스타일
        if (isCover) {
            return `
            <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
                <!-- 1. 배경: Pure White -->
                <rect width="1080" height="1080" fill="#FFFFFF" />

                <!-- 0.5pt 헤어라인 내부 프레임 -->
                <rect x="40" y="40" width="1000" height="1000" fill="none" stroke="#E5E7EB" stroke-width="1.5" />

                <!-- 상단 헤더: 브랜드 워드마크 & 볼드 원형 배지 -->
                <text x="100" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="32" font-weight="900" letter-spacing="-1.5" fill="#000000">UNIMEET</text>
                
                <rect x="830" y="100" width="150" height="40" rx="20" fill="#000000"/>
                <text x="905" y="126" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="16" font-weight="700" fill="#FFFFFF" text-anchor="middle">${escapedBadge}</text>

                <!-- 헤어라인 구분선 (0.5pt) -->
                <line x1="100" y1="180" x2="980" y2="180" stroke="#F3F4F6" stroke-width="1.5" />

                <!-- Heavy Header 메인 타이틀 (FontWeight 900, 자간 -2.5) -->
                <text x="100" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="70" font-weight="900" letter-spacing="-2.5" fill="#000000">
                    ${titleTspans}
                </text>

                <!-- 서브 설명 (Caption Style: 차분한 그레이) -->
                <text x="100" y="520" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="28" font-weight="500" fill="#6B7280" letter-spacing="-0.5">
                    ${escapedDesc}
                </text>

                <!-- 선택지 A vs B 미니멀 카드 박스 -->
                <g>
                    <!-- A 박스 -->
                    <rect x="100" y="600" width="410" height="230" rx="16" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1.5"/>
                    <circle cx="150" cy="655" r="20" fill="#000000"/>
                    <text x="150" y="662" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">A</text>
                    <text x="150" y="740" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="26" font-weight="800" fill="#111827">${escapedA}</text>

                    <!-- 중앙 VS 배지 -->
                    <circle cx="540" cy="715" r="28" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
                    <text x="540" y="723" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="900" fill="#000000" text-anchor="middle">VS</text>

                    <!-- B 박스 -->
                    <rect x="570" y="600" width="410" height="230" rx="16" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1.5"/>
                    <circle cx="620" cy="655" r="20" fill="#000000"/>
                    <text x="620" y="662" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">B</text>
                    <text x="620" y="740" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="26" font-weight="800" fill="#111827">${escapedB}</text>
                </g>

                <!-- 하단 에디토리얼 푸터 -->
                <line x1="100" y1="910" x2="980" y2="910" stroke="#F3F4F6" stroke-width="1.5" />
                <text x="100" y="960" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="700" fill="#000000">SWIPE TO CHOOSE</text>
                <text x="980" y="960" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="500" fill="#9CA3AF" text-anchor="end">01 / 05</text>
            </svg>
            `;
        }

        // 2. 아웃트로 (Outro) - 유니밋 앱 다운로드 CTA
        if (isOutro) {
            return `
            <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
                <rect width="1080" height="1080" fill="#FFFFFF" />
                <rect x="40" y="40" width="1000" height="1000" fill="none" stroke="#E5E7EB" stroke-width="1.5" />

                <!-- 상단 헤더 -->
                <text x="100" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="32" font-weight="900" letter-spacing="-1.5" fill="#000000">UNIMEET</text>
                <text x="980" y="130" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="600" fill="#9CA3AF" text-anchor="end">${slideNumber} / ${totalSlides}</text>
                <line x1="100" y1="180" x2="980" y2="180" stroke="#F3F4F6" stroke-width="1.5" />

                <!-- 미니멀 서클 아이콘 -->
                <circle cx="540" cy="340" r="60" fill="#000000" />
                <text x="540" y="358" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle">U</text>

                <!-- Heavy Header -->
                <text x="540" y="480" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="56" font-weight="900" letter-spacing="-2" fill="#000000" text-anchor="middle">
                    ${this._escapeXml((title || '').replace(/\n/g, ' '))}
                </text>

                <!-- 서브 설명 -->
                <text x="540" y="560" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="28" font-weight="500" fill="#6B7280" text-anchor="middle">
                    ${escapedDesc}
                </text>

                <!-- Pure Black CTA 버튼 -->
                <g>
                    <rect x="240" y="660" width="600" height="96" rx="48" fill="#000000" />
                    <text x="540" y="720" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="30" font-weight="800" fill="#FFFFFF" text-anchor="middle">지금 유니밋 다운로드하기</text>
                </g>

                <text x="540" y="820" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="600" fill="#9CA3AF" text-anchor="middle">프로필 링크 @unimeet.official</text>

                <!-- 하단 브랜드 라인 -->
                <line x1="100" y1="910" x2="980" y2="910" stroke="#F3F4F6" stroke-width="1.5" />
                <text x="540" y="960" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="600" fill="#9CA3AF" text-anchor="middle">UniMeet • Campus Match &amp; Social</text>
            </svg>
            `;
        }

        // 3. 질문 슬라이드 (Q1, Q2, Q3) - 0.5pt 헤어라인 & 고대비 선택지 카드
        return `
        <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
            <!-- 배경: Pure White -->
            <rect width="1080" height="1080" fill="#FFFFFF" />
            <rect x="40" y="40" width="1000" height="1000" fill="none" stroke="#E5E7EB" stroke-width="1.5" />

            <!-- 상단 헤더 -->
            <text x="100" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="32" font-weight="900" letter-spacing="-1.5" fill="#000000">UNIMEET</text>
            
            <rect x="800" y="100" width="110" height="38" rx="19" fill="#000000"/>
            <text x="855" y="125" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF" text-anchor="middle">${escapedBadge}</text>

            <text x="980" y="127" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="600" fill="#9CA3AF" text-anchor="end">${slideNumber} / ${totalSlides}</text>
            <line x1="100" y1="170" x2="980" y2="170" stroke="#F3F4F6" stroke-width="1.5" />

            <!-- 메인 질문 Heavy Header -->
            <text x="100" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="56" font-weight="900" letter-spacing="-2" fill="#000000">
                ${titleTspans}
            </text>

            <text x="100" y="380" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="26" font-weight="500" fill="#6B7280">
                ${escapedDesc}
            </text>

            <!-- 선택지 A 카드 (헤어라인 테두리 + Pure Black 원형 배지) -->
            <g>
                <rect x="100" y="440" width="880" height="190" rx="20" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1.5"/>
                <circle cx="170" cy="535" r="32" fill="#000000" />
                <text x="170" y="547" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="30" font-weight="900" fill="#FFFFFF" text-anchor="middle">A</text>
                <text x="235" y="545" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="32" font-weight="800" fill="#111827" letter-spacing="-1">${escapedA}</text>
            </g>

            <!-- 선택지 B 카드 (헤어라인 테두리 + Pure Black 원형 배지) -->
            <g>
                <rect x="100" y="670" width="880" height="190" rx="20" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="1.5"/>
                <circle cx="170" cy="765" r="32" fill="#000000" />
                <text x="170" y="777" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="30" font-weight="900" fill="#FFFFFF" text-anchor="middle">B</text>
                <text x="235" y="775" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="32" font-weight="800" fill="#111827" letter-spacing="-1">${escapedB}</text>
            </g>

            <!-- 하단 안내 라인 -->
            <line x1="100" y1="910" x2="980" y2="910" stroke="#F3F4F6" stroke-width="1.5" />
            <text x="100" y="960" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="700" fill="#000000">COMMENT YOUR CHOICE [A vs B]</text>
            <text x="980" y="960" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="500" fill="#9CA3AF" text-anchor="end">UNIMEET</text>
        </svg>
        `;
    }

    /**
     * 무채색 숏폼 영상 씬(1080x1920) SVG 템플릿
     */
    _createVideoSceneSvg({ sceneNumber, totalScenes, durationSec, title, subtitle, narration, visualDescription, optionA, optionB }) {
        const escapedTitle = this._escapeXml(title || '');
        const escapedSubtitle = this._escapeXml(subtitle || '');
        const escapedNarration = this._escapeXml(narration || '');
        const escapedA = this._escapeXml(optionA || '');
        const escapedB = this._escapeXml(optionB || '');

        return `
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
            <!-- 9:16 배경: Pure White -->
            <rect width="1080" height="1920" fill="#FFFFFF" />
            <rect x="50" y="50" width="980" height="1820" fill="none" stroke="#E5E7EB" stroke-width="1.5" />

            <!-- 상단 바: 브랜드 & 씬 정보 원형 배지 -->
            <text x="100" y="160" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="36" font-weight="900" letter-spacing="-1.5" fill="#000000">UNIMEET</text>
            
            <rect x="750" y="125" width="230" height="48" rx="24" fill="#000000"/>
            <text x="865" y="157" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="800" fill="#FFFFFF" text-anchor="middle">SCENE ${sceneNumber}/${totalScenes} • ${durationSec}S</text>

            <line x1="100" y1="210" x2="980" y2="210" stroke="#F3F4F6" stroke-width="1.5" />

            <!-- 중앙 타이틀 (Heavy Header) -->
            <text x="540" y="380" font-family="-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif" font-size="62" font-weight="900" letter-spacing="-2.5" fill="#000000" text-anchor="middle">
                ${escapedTitle}
            </text>

            <!-- 인스타그램 스토리 자막 바 (Pure Black 바탕 화이트 텍스트) -->
            <g>
                <rect x="90" y="470" width="900" height="140" rx="24" fill="#000000" />
                <text x="540" y="555" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="40" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">
                    ${escapedSubtitle}
                </text>
            </g>

            <!-- A vs B 선택지 박스 (무채색 헤어라인 카드) -->
            <g>
                <!-- CHOICE A -->
                <rect x="90" y="680" width="900" height="250" rx="28" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="2"/>
                <circle cx="170" cy="760" r="34" fill="#000000" />
                <text x="170" y="773" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="30" font-weight="900" fill="#FFFFFF" text-anchor="middle">A</text>
                <text x="235" y="770" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="34" font-weight="800" fill="#111827" letter-spacing="-1">${escapedA}</text>

                <!-- VS 뱃지 -->
                <circle cx="540" cy="980" r="40" fill="#FFFFFF" stroke="#000000" stroke-width="3"/>
                <text x="540" y="992" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="24" font-weight="900" fill="#000000" text-anchor="middle">VS</text>

                <!-- CHOICE B -->
                <rect x="90" y="1030" width="900" height="250" rx="28" fill="#FAFAFA" stroke="#E5E7EB" stroke-width="2"/>
                <circle cx="170" cy="1110" r="34" fill="#000000" />
                <text x="170" y="1123" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="30" font-weight="900" fill="#FFFFFF" text-anchor="middle">B</text>
                <text x="235" y="1120" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="34" font-weight="800" fill="#111827" letter-spacing="-1">${escapedB}</text>
            </g>

            <!-- 하단 나레이션 스크립트 오버레이 (0.5pt 헤어라인 박스) -->
            <rect x="90" y="1380" width="900" height="260" rx="24" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1.5"/>
            <text x="140" y="1440" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="800" fill="#000000">VOICEOVER SCRIPT</text>
            <text x="140" y="1500" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="26" font-weight="500" fill="#374151">"${escapedNarration}"</text>
            <text x="140" y="1580" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="500" fill="#9CA3AF">DIRECTING: ${this._escapeXml(visualDescription || '')}</text>

            <!-- 푸터 워터마크 -->
            <line x1="90" y1="1720" x2="990" y2="1720" stroke="#F3F4F6" stroke-width="1.5" />
            <text x="540" y="1790" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="24" font-weight="800" fill="#000000" text-anchor="middle">UNIMEET SHORTS &amp; REELS</text>
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
