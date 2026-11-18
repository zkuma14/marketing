const { GoogleGenAI } = require('@google/genai');

/**
 * Gemini AI 서비스
 * STEP 1 (게시글/영상 선택) 및 STEP 2 (내용 주제)를 기반으로
 * STEP 3의 고품질 텍스트 미리보기 및 구조화된 데이터를 생성합니다.
 */

// API 키 부재 시 또는 fallback용 고품질 대학생 연애 밸런스 게임 템플릿
function getMockContent(contentType, topic, tone) {
    if (contentType === 'video') {
        const scenes = [
            {
                sceneNumber: 1,
                stepTitle: "01. HOOK (0~3초)",
                durationSec: 3,
                title: `대학생 99%가 과몰입한 ${topic}!`,
                subtitle: "너라면 둘 중 누구랑 사귈래?",
                narration: `대학생 99%가 싸운 역대급 ${topic}! 너라면 둘 중 누구랑 사귈래?`,
                visualDescription: "화면 흔들림 효과와 함께 불꽃 텍스트, 빠른 템포의 경쾌한 힙합 BGM 시작",
                optionA: "매일 갠톡 100개 vs 한 달에 갠톡 1개",
                optionB: "선택하기"
            },
            {
                sceneNumber: 2,
                stepTitle: "02. ROUND 1 (3~12초)",
                durationSec: 9,
                title: "새벽 2시에 여사친/남사친과 단둘이 술",
                subtitle: "A: 통보하고 마심 vs B: 몰래 마심",
                narration: "첫 번째! 새벽 2시에 여사친이랑 단둘이 술 마시기! 미리 통보하고 마시는 애인 vs 안 걸릴 줄 알고 몰래 마시는 애인!",
                visualDescription: "화면 분할(좌우 VS 레이아웃), 빨간색 A와 파란색 B 선택지 강조 애니메이션",
                optionA: "쿨하게 통보하고 단둘이 술",
                optionB: "안심시키려고 거짓말하고 몰래 술"
            },
            {
                sceneNumber: 3,
                stepTitle: "03. ROUND 2 (12~20초)",
                durationSec: 8,
                title: "내 친구들과의 술자리에서 애인의 태도",
                subtitle: "A: MC급 분위기메이커 vs B: 구석에서 조용히 내 손잡기",
                narration: "두 번째! 내 동기들과의 술자리에서 애인의 행동은? MC급으로 날아다니는 인싸 애인 vs 구석에서 조용히 내 챙기는 댕댕이 애인!",
                visualDescription: "동기 술자리 일러스트 배경에 캐릭터 리액션 모션",
                optionA: "과대 뺨치는 인싸 분위기 메이커",
                optionB: "낯가리며 나만 쳐다보는 조용한 댕댕이"
            },
            {
                sceneNumber: 4,
                stepTitle: "04. OUTRO (20~25초)",
                durationSec: 5,
                title: "나랑 밸런스 맞는 캠퍼스 인연 찾기",
                subtitle: "프로필 링크에서 유니밋 다운로드!",
                narration: "너의 선택은 댓글로 남겨줘! 나와 연애 가치관 딱 맞는 캠퍼스 짝꿍 찾고 싶다면 지금 유니밋 다운로드!",
                visualDescription: "유니밋 공식 로고 3D 팝업, 앱스토어/플레이스토어 다운로드 유도 애니메이션",
                optionA: "유니밋 다운로드",
                optionB: "댓글 남기기"
            }
        ];

        const caption = `대학생 99%가 밤새 토론한 역대급 ${topic} 🔥\n\n여러분의 연애관은 A인가요 B인가요?\n친구 태그해서 서로 취향 확인해보세요! 💬\n\n나랑 연애 가치관 100% 일치하는 우리 학교/이웃 캠퍼스 인연 찾기는?\n👉 프로필 링크 @unimeet.official 에서 유니밋 다운로드!\n\n#유니밋 #UNIMEET #연애밸런스게임 #대학생 #캠퍼스라이프 #대학생연애 #미팅 #캠퍼스커플`;
        
        return {
            contentType: 'video',
            topic,
            tone,
            title: `[유니밋] 대학생 99%가 과몰입한 ${topic} 극과 극 선택!`,
            scenes,
            caption,
            bgmRecommendation: "Trendy Upbeat Lo-fi HipHop / Fast Campus Pop",
            hashtags: ["#유니밋", "#연애밸런스게임", "#대학생", "#쇼츠", "#숏폼", "#Shorts"]
        };
    } else {
        // Post (카드뉴스)
        const slides = [
            {
                slideNumber: 1,
                stepTitle: "COVER",
                badge: "유니밋 연애 밸런스",
                title: "대학생이 가장 싸우는\n연애 밸런스 게임 TOP",
                desc: "너라면 둘 중 절대 못 참는 사람은 누구야?",
                optionA: "새벽 단둘이 술",
                optionB: "전애인과 맞팔",
                assetId: "wordmark",
                bgGradient: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)"
            },
            {
                slideNumber: 2,
                stepTitle: "Q1. 술자리 편",
                badge: "BALANCE 01",
                title: "애인의 새벽 술자리\n더 킹받는 상황은?",
                desc: "밤 12시가 넘은 상황, 둘 중 하나만 골라야 한다면?",
                optionA: "새벽 2시에 여사친과 단둘이 술 (통보함)",
                optionB: "남사친 여럿과 아침까지 연락 두절 (몰래감)",
                assetId: "photoroomLogo",
                bgGradient: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)"
            },
            {
                slideNumber: 3,
                stepTitle: "Q2. SNS & 연락 편",
                badge: "BALANCE 02",
                title: "애인의 연락 스타일\n더 미칠 것 같은 쪽은?",
                desc: "연애할 때 연락 빈도수, 당신의 한계치는?",
                optionA: "답장은 칼답인데 할 말 없게 단답형",
                optionB: "다정다감 장문인데 반나절 만에 1번 답장",
                assetId: "photoroomLogo",
                bgGradient: "linear-gradient(135deg, #3B82F6 0%, #2DD4BF 100%)"
            },
            {
                slideNumber: 4,
                stepTitle: "Q3. 데이트 편",
                badge: "BALANCE 03",
                title: "기념일 데이트 취향\n더 견디기 힘든 코스는?",
                desc: "100일 기념일 데이트, 둘 중 단 하나를 선택해야 한다면?",
                optionA: "내가 다 짜야 하는 무계획 즉흥 데이트",
                optionB: "분 단위 엑셀 일정표 꽉 채운 극E 데이트",
                assetId: "photoroomLogo",
                bgGradient: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)"
            },
            {
                slideNumber: 5,
                stepTitle: "OUTRO",
                badge: "UNIMEET",
                title: "나랑 연애 가치관 딱 맞는\n캠퍼스 인연 찾기!",
                desc: "지금 유니밋에서 연애관 밸런스 맞추고 설레는 캠퍼스 미팅을 시작해보세요 💕",
                optionA: "앱스토어 '유니밋' 검색",
                optionB: "프로필 링크 클릭하기",
                assetId: "mainLogo",
                bgGradient: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)"
            }
        ];

        const caption = `대학생들이 밤샘 토론하게 만드는 ${topic} 모음.zip 💭\n\n너라면 1, 2, 3번 중 어떤 걸 고를래?\n댓글로 친구 소환해서 의견 맞춰보자! 👇\n\n---\n✨ 나와 가치관·취향 딱 맞는 캠퍼스 짝꿍 찾고 싶다면?\n지금 바로 프로필 링크에서 '유니밋(Unimeet)' 다운로드!\n\n#유니밋 #UNIMEET #연애밸런스게임 #대학생밸런스게임 #캠퍼스커플 #대학생소통 #카드뉴스 #미팅앱`;

        return {
            contentType: 'post',
            topic,
            tone,
            title: `대학생 공감 ${topic} 카드뉴스`,
            slides,
            caption,
            hashtags: ["#유니밋", "#연애밸런스게임", "#대학생", "#카드뉴스", "#캠퍼스라이프"]
        };
    }
}

/**
 * 미리보기용 텍스트 포맷 생성 함수 (STEP 3 핵심)
 */
function formatPreviewText(data) {
    let preview = `=================================================\n`;
    preview += `📌 [${data.contentType === 'video' ? '영상/쇼츠 대본' : '카드뉴스 게시글'}] ${data.title}\n`;
    preview += `주제: ${data.topic} | 톤앤매너: ${data.tone}\n`;
    preview += `=================================================\n\n`;

    if (data.contentType === 'video') {
        preview += `🎬 [영상 씬별 타임라인 & 대본]\n`;
        data.scenes.forEach(s => {
            preview += `-------------------------------------------------\n`;
            preview += `[Scene ${s.sceneNumber}] ${s.stepTitle} (${s.durationSec}초)\n`;
            preview += `• 화면 연출: ${s.visualDescription}\n`;
            preview += `• 자막 문구: ${s.subtitle}\n`;
            preview += `• 나레이션: "${s.narration}"\n`;
            if (s.optionA && s.optionB) {
                preview += `• 선택지 A: ${s.optionA} vs 선택지 B: ${s.optionB}\n`;
            }
        });
        preview += `\n🎵 추천 BGM 분위기: ${data.bgmRecommendation || 'Trendy Upbeat Lo-fi'}\n`;
    } else {
        preview += `🖼️ [슬라이드별 카드뉴스 구성]\n`;
        data.slides.forEach(s => {
            preview += `-------------------------------------------------\n`;
            preview += `[Slide ${s.slideNumber}] [${s.badge}] ${s.stepTitle}\n`;
            preview += `• 헤드라인: ${s.title.replace(/\n/g, ' ')}\n`;
            preview += `• 서브설명: ${s.desc}\n`;
            if (s.optionA && s.optionB) {
                preview += `• [A] ${s.optionA}\n`;
                preview += `• [B] ${s.optionB}\n`;
            }
        });
    }

    preview += `\n📝 [SNS 캡션 및 본문]\n`;
    preview += `${data.caption}\n\n`;
    preview += `🏷️ [추천 해시태그]\n${(data.hashtags || []).join(' ')}\n`;

    return preview;
}

/**
 * AI 내용 생성 메인 함수
 */
async function generateSocialContent({ contentType = 'post', topic, tone = 'mz', clientApiKey }) {
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    // API Key가 없거나 기본 placeholder인 경우 mock 템플릿 반환
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.log(`[GeminiService] API 키 미설정 또는 기본값 - 고품질 Mock 템플릿으로 생성합니다. (ContentType: ${contentType}, Topic: ${topic})`);
        const content = getMockContent(contentType, topic, tone);
        const previewText = formatPreviewText(content);
        return { content, previewText };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        let systemPrompt = '';
        if (contentType === 'video') {
            systemPrompt = `
너는 20대 대학생 소셜/미팅 플랫폼 '유니밋(Unimeet)'의 숏폼(유튜브 쇼츠, 인스타그램 릴스) 전문 크리에이터야.
사용자가 요청한 주제: "${topic}" (톤앤매너: ${tone})를 바탕으로,
시청자의 스와이프를 멈추게 할 25초 이내의 숏폼 영상 기획안 및 나레이션 대본을 작성해줘.

반드시 다음 JSON 규격으로만 응답해:
{
  "contentType": "video",
  "topic": "${topic}",
  "tone": "${tone}",
  "title": "호기심을 끄는 영상 제목",
  "bgmRecommendation": "추천 BGM 스타일",
  "scenes": [
    {
      "sceneNumber": 1,
      "stepTitle": "01. HOOK (0~3초)",
      "durationSec": 3,
      "title": "화면 메인 카피",
      "subtitle": "중앙 자막",
      "narration": "오프닝 멘트",
      "visualDescription": "화면 연출 지시문",
      "optionA": "선택지 A",
      "optionB": "선택지 B"
    },
    {
      "sceneNumber": 2,
      "stepTitle": "02. 질문 1",
      "durationSec": 8,
      "title": "첫 번째 대결",
      "subtitle": "자막",
      "narration": "상세 질문 나레이션",
      "visualDescription": "화면 연출 지시문",
      "optionA": "선택지 A",
      "optionB": "선택지 B"
    },
    {
      "sceneNumber": 3,
      "stepTitle": "03. 질문 2",
      "durationSec": 8,
      "title": "두 번째 대결",
      "subtitle": "자막",
      "narration": "상세 질문 나레이션",
      "visualDescription": "화면 연출 지시문",
      "optionA": "선택지 A",
      "optionB": "선택지 B"
    },
    {
      "sceneNumber": 4,
      "stepTitle": "04. OUTRO (유니밋 CTA)",
      "durationSec": 6,
      "title": "유니밋 다운로드 유도",
      "subtitle": "프로필 링크 확인!",
      "narration": "마무리 나레이션",
      "visualDescription": "앱 다운로드 화면 및 로고",
      "optionA": "앱 다운로드",
      "optionB": "댓글 참여"
    }
  ],
  "caption": "인스타 릴스 및 유튜브 설명 본문 (해시태그 포함)",
  "hashtags": ["#유니밋", "#연애밸런스게임", "#대학생"]
}
`;
        } else {
            systemPrompt = `
너는 20대 대학생 소셜/미팅 플랫폼 '유니밋(Unimeet)'의 인스타그램 카드뉴스 전문 마케터야.
주제: "${topic}" (톤앤매너: ${tone})를 바탕으로,
인스타그램 넘겨보기(캐러셀)에 최적화된 5장의 카드뉴스 텍스트를 작성해줘.

반드시 다음 JSON 규격으로만 응답해:
{
  "contentType": "post",
  "topic": "${topic}",
  "tone": "${tone}",
  "title": "카드뉴스 전체 타이틀",
  "slides": [
    {
      "slideNumber": 1,
      "stepTitle": "COVER",
      "badge": "유니밋 밸런스",
      "title": "표지 타이틀 (두 줄 이내 줄바꿈 \\n 포함)",
      "desc": "표지 서브 설명",
      "optionA": "대표 키워드 A",
      "optionB": "대표 키워드 B",
      "assetId": "wordmark"
    },
    {
      "slideNumber": 2,
      "stepTitle": "Q1. 1라운드",
      "badge": "BALANCE 01",
      "title": "질문 1 타이틀",
      "desc": "상세 상황 설명",
      "optionA": "선택지 A",
      "optionB": "선택지 B",
      "assetId": "photoroomLogo"
    },
    {
      "slideNumber": 3,
      "stepTitle": "Q2. 2라운드",
      "badge": "BALANCE 02",
      "title": "질문 2 타이틀",
      "desc": "상세 상황 설명",
      "optionA": "선택지 A",
      "optionB": "선택지 B",
      "assetId": "photoroomLogo"
    },
    {
      "slideNumber": 4,
      "stepTitle": "Q3. 3라운드",
      "badge": "BALANCE 03",
      "title": "질문 3 타이틀",
      "desc": "상세 상황 설명",
      "optionA": "선택지 A",
      "optionB": "선택지 B",
      "assetId": "photoroomLogo"
    },
    {
      "slideNumber": 5,
      "stepTitle": "OUTRO",
      "badge": "UNIMEET",
      "title": "마무리 CTA 문구",
      "desc": "유니밋 앱 다운로드 및 프로필 링크 유도 문구",
      "optionA": "유니밋 다운로드",
      "optionB": "댓글 남기기",
      "assetId": "mainLogo"
    }
  ],
  "caption": "인스타그램 캡션 본문 (이모지와 공감대 유도 문구, #유니밋 #대학생 등 필수 해시태그 포함)",
  "hashtags": ["#유니밋", "#연애밸런스게임", "#대학생", "#카드뉴스"]
}
`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: systemPrompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const parsed = JSON.parse(response.text);
        const previewText = formatPreviewText(parsed);
        return { content: parsed, previewText };
    } catch (error) {
        console.error('[GeminiService] Error calling Gemini API, fallbacking to template:', error.message);
        const content = getMockContent(contentType, topic, tone);
        const previewText = formatPreviewText(content);
        return { content, previewText, warning: `AI 실시간 호출 에러(${error.message})로 인해 백업 템플릿으로 생성되었습니다.` };
    }
}

module.exports = {
    generateSocialContent,
    formatPreviewText
};
