const axios = require('axios');

async function testFullFlow() {
    const BASE_URL = 'http://localhost:3000/api';
    console.log('========================================================');
    console.log('🧪 유니밋 인스타그램·유튜브 자동화 백엔드 E2E 플로우 테스트');
    console.log('========================================================\n');

    try {
        // [STEP 1, 2, 3] 게시글 선택 -> 내용 생성 ("연애 밸런스 게임") -> 텍스트 미리보기
        console.log('▶ [STEP 1, 2, 3] 게시글 선택 및 "연애 밸런스 게임" AI 초안 생성 요청...');
        const draftRes = await axios.post(`${BASE_URL}/content/draft`, {
            contentType: 'post',
            topic: '연애 밸런스 게임',
            tone: 'mz'
        });

        const draftData = draftRes.data.data;
        const draftId = draftData.draftId;
        console.log(`✅ Draft 생성 성공! [Draft ID: ${draftId}]`);
        console.log(`\n--- [STEP 3 텍스트 미리보기] ---`);
        console.log(draftData.previewText.substring(0, 350) + '\n... (생략) ...\n');

        // [STEP 4-A] 내용 수정하기 (Edit)
        console.log('▶ [STEP 4-A] 슬라이드 제목 수정 요청...');
        const updatedSlides = [...draftData.content.slides];
        updatedSlides[0].title = '대학생이 밤새 토론하는\n극악의 연애 밸런스 게임 (수정됨)';

        const updateRes = await axios.put(`${BASE_URL}/content/draft/${draftId}`, {
            content: { slides: updatedSlides }
        });
        console.log('✅ 수정 반영 완료: status =', updateRes.data.data.status);

        // [STEP 4-B] 내용 확정하기 (Fix)
        console.log('▶ [STEP 4-B] 내용 최종 확정 (Fix) 요청...');
        const fixRes = await axios.post(`${BASE_URL}/content/draft/${draftId}/fix`);
        console.log('✅ Fix 확정 완료:', fixRes.data.message);

        // [STEP 5] 게시글/영상 생성 버튼 누르기 (Media Render)
        console.log('\n▶ [STEP 5] "게시글 생성 버튼 누르기" (이미지 렌더링 파이프라인 가동)...');
        const mediaRes = await axios.post(`${BASE_URL}/media/generate/${draftId}`);
        console.log('✅ 미디어 생성 완료!');
        console.log(`- 해상도: ${mediaRes.data.data.media.resolution}`);
        console.log(`- 생성된 슬라이드 장수: ${mediaRes.data.data.media.slideCount}장`);
        console.log('- 첫 번째 슬라이드 URL:', mediaRes.data.data.media.files[0]?.publicUrl);

        // [STEP 6] 게시하기 (Publish)
        console.log('\n▶ [STEP 6] 인스타그램 & 유튜브에 최종 게시하기 요청...');
        const publishRes = await axios.post(`${BASE_URL}/publish/${draftId}`, {
            channels: ['instagram'],
            timing: 'instant'
        });
        console.log('✅ 게시 완료 결과:');
        console.log(JSON.stringify(publishRes.data.data.publishResults, null, 2));

        console.log('\n========================================================');
        console.log('🎉 STEP 1부터 STEP 6까지 전 과정이 완벽히 성공했습니다!');
        console.log('========================================================');
    } catch (err) {
        console.error('❌ 테스트 실패:', err.response?.data || err.message);
    }
}

testFullFlow();
