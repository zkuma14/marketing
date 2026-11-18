/**
 * UNIMEET Studio — Front-End Application Controller
 * Instagram Achromatic Minimalist UX Engine
 */

// 백엔드 API 호스트 자동 감지 (Render 상용 배포 및 로컬 대응)
const isBackendDirect = window.location.port === '3000';
const isLocalSeparateDev = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') && !isBackendDirect;
const API_BASE = isLocalSeparateDev ? 'http://localhost:3000/api' : '/api';
const ASSET_BASE = isLocalSeparateDev ? 'http://localhost:3000' : '';

let currentDraftId = null;
let currentDraftData = null;
let currentContentType = 'post';
let currentSlideIndex = 0;
let renderedMediaItems = [];

// [STEP 1] 포맷 변경 처리
function onFormatChange(type) {
    currentContentType = type;
    const labelPost = document.getElementById('labelPost');
    const labelVideo = document.getElementById('labelVideo');
    const canvas = document.getElementById('instagramCanvas');
    const imgEl = document.getElementById('renderedSlideImg');

    if (type === 'post') {
        labelPost.classList.add('active');
        labelVideo.classList.remove('active');
        canvas.classList.remove('aspect-video');
        canvas.classList.add('aspect-square');
        canvas.style.height = '';
        if (imgEl) {
            imgEl.className = imgEl.classList.contains('hidden') ? 'hidden w-full h-full object-cover' : 'w-full h-full object-cover';
        }
    } else {
        labelVideo.classList.add('active');
        labelPost.classList.remove('active');
        // 9:16 쇼츠 비율 온전히 표시 (위아래 잘림 방지)
        canvas.classList.remove('aspect-square');
        canvas.style.height = '520px';
        if (imgEl) {
            imgEl.className = imgEl.classList.contains('hidden') ? 'hidden w-full h-full object-contain bg-neutral-900' : 'w-full h-full object-contain bg-neutral-900';
        }
    }
}

// [STEP 2 & STEP 3] AI 내용 생성 및 텍스트 미리보기
async function generateDraft() {
    const topic = document.getElementById('topicInput').value.trim();
    const tone = document.getElementById('toneSelect').value;

    if (!topic) return alert('기획할 주제를 입력해주세요.');

    const btn = document.getElementById('btnGenerateDraft');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> AI 기획안 작성 중...';

    try {
        const res = await fetch(`${API_BASE}/content/draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contentType: currentContentType, topic, tone })
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message);

        currentDraftId = result.data.draftId;
        currentDraftData = result.data.content;

        document.getElementById('draftIdDisplay').innerText = currentDraftId;
        // STEP 3: 텍스트 미리보기 표시
        document.getElementById('previewTextViewer').value = result.data.previewText;

        // 인스타그램 피드 목업의 캡션 텍스트 업데이트
        const captionEl = document.getElementById('mockCaptionText');
        captionEl.innerHTML = `
            <span class="font-bold text-black mr-1">unimeet.official</span>
            <span>${(result.data.content.caption || '').substring(0, 140)}...</span>
        `;

        // 상태 배지 업데이트
        const statusBadge = document.getElementById('badgeDraftStatus');
        statusBadge.innerText = 'DRAFT (초안 생성됨)';
        statusBadge.className = 'tag-status';

        document.getElementById('editorSummaryText').innerText = currentContentType === 'post' 
            ? `슬라이드 ${result.data.content.slides.length}장의 문구가 준비되었습니다.`
            : `영상 씬 ${result.data.content.scenes.length}개의 대본이 준비되었습니다.`;

        // 컨트롤 활성화
        document.getElementById('btnOpenBottomSheet').disabled = false;
        document.getElementById('btnFix').disabled = false;

        // 상단 인디케이터 업데이트
        activateStepNav(3);
    } catch (err) {
        alert('내용 생성 실패: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-sparkles text-xs mr-2"></i><span>내용 생성하기 (STEP 3 텍스트 미리보기 실행)</span>';
    }
}

// [인스타그램 UX 메타포] 바텀 시트 열기
function openBottomSheet() {
    if (!currentDraftData) return;

    const formArea = document.getElementById('bottomSheetFormArea');
    formArea.innerHTML = '';

    if (currentContentType === 'video') {
        (currentDraftData.scenes || []).forEach((scene, i) => {
            const div = document.createElement('div');
            div.className = 'p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-2';
            div.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-black">Scene ${scene.sceneNumber}: ${scene.stepTitle}</span>
                    <span class="circle-badge text-3xs">${scene.durationSec}초</span>
                </div>
                <input type="text" id="edit_sc_title_${i}" value="${scene.title || ''}" class="input-hairline w-full p-2.5 text-xs font-bold text-black rounded-lg bg-white" placeholder="화면 타이틀">
                <input type="text" id="edit_sc_sub_${i}" value="${scene.subtitle || ''}" class="input-hairline w-full p-2.5 text-xs text-gray-800 rounded-lg bg-white" placeholder="자막 문구">
                <textarea id="edit_sc_nar_${i}" rows="2" class="input-hairline w-full p-2.5 text-xs text-gray-600 rounded-lg bg-white" placeholder="나레이션 대본">${scene.narration || ''}</textarea>
            `;
            formArea.appendChild(div);
        });
    } else {
        (currentDraftData.slides || []).forEach((slide, i) => {
            const div = document.createElement('div');
            div.className = 'p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-2';
            div.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-black">Slide ${slide.slideNumber}: [${slide.badge}]</span>
                    <span class="circle-badge text-3xs">${slide.stepTitle}</span>
                </div>
                <input type="text" id="edit_sl_title_${i}" value="${slide.title.replace(/\n/g, ' ')}" class="input-hairline w-full p-2.5 text-xs font-bold text-black rounded-lg bg-white" placeholder="헤드라인">
                <input type="text" id="edit_sl_desc_${i}" value="${slide.desc || ''}" class="input-hairline w-full p-2.5 text-xs text-gray-700 rounded-lg bg-white" placeholder="설명 문구">
                <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="edit_sl_a_${i}" value="${slide.optionA || ''}" class="input-hairline p-2 text-xs text-black rounded-lg bg-white" placeholder="선택지 A">
                    <input type="text" id="edit_sl_b_${i}" value="${slide.optionB || ''}" class="input-hairline p-2 text-xs text-black rounded-lg bg-white" placeholder="선택지 B">
                </div>
            `;
            formArea.appendChild(div);
        });
    }

    const sheet = document.getElementById('bottomSheet');
    const backdrop = document.getElementById('bottomSheetBackdrop');
    backdrop.classList.remove('hidden');
    setTimeout(() => {
        sheet.classList.remove('translate-y-full');
    }, 10);
}

// 바텀 시트 닫기
function closeBottomSheet() {
    const sheet = document.getElementById('bottomSheet');
    const backdrop = document.getElementById('bottomSheetBackdrop');
    sheet.classList.add('translate-y-full');
    setTimeout(() => {
        backdrop.classList.add('hidden');
    }, 300);
}

// 바텀 시트 수정사항 저장
async function saveBottomSheetChanges() {
    if (!currentDraftId) return;

    if (currentContentType === 'video') {
        currentDraftData.scenes.forEach((scene, i) => {
            scene.title = document.getElementById(`edit_sc_title_${i}`)?.value || scene.title;
            scene.subtitle = document.getElementById(`edit_sc_sub_${i}`)?.value || scene.subtitle;
            scene.narration = document.getElementById(`edit_sc_nar_${i}`)?.value || scene.narration;
        });
    } else {
        currentDraftData.slides.forEach((slide, i) => {
            slide.title = document.getElementById(`edit_sl_title_${i}`)?.value || slide.title;
            slide.desc = document.getElementById(`edit_sl_desc_${i}`)?.value || slide.desc;
            slide.optionA = document.getElementById(`edit_sl_a_${i}`)?.value || slide.optionA;
            slide.optionB = document.getElementById(`edit_sl_b_${i}`)?.value || slide.optionB;
        });
    }

    try {
        const res = await fetch(`${API_BASE}/content/draft/${currentDraftId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: currentDraftData })
        });
        const result = await res.json();
        if (result.success) {
            document.getElementById('previewTextViewer').value = result.data.previewText;
            closeBottomSheet();
        }
    } catch (err) {
        alert('수정 반영 실패: ' + err.message);
    }
}

// [STEP 4] 내용 Fix(확정)
async function fixDraft() {
    if (!currentDraftId) return;

    try {
        const res = await fetch(`${API_BASE}/content/draft/${currentDraftId}/fix`, { method: 'POST' });
        const result = await res.json();
        if (!result.success) throw new Error(result.message);

        const statusBadge = document.getElementById('badgeDraftStatus');
        statusBadge.innerText = 'FIXED (확정됨)';
        statusBadge.className = 'tag-status fixed';

        document.getElementById('btnGenerateMedia').disabled = false;
        activateStepNav(4);
    } catch (err) {
        alert('Fix 확정 오류: ' + err.message);
    }
}

// [STEP 5] 게시글 / 영상 생성 버튼 누르기 (Media Render)
async function generateMedia() {
    if (!currentDraftId) return;

    const btn = document.getElementById('btnGenerateMedia');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> 미디어 렌더링 중...';

    try {
        const res = await fetch(`${API_BASE}/media/generate/${currentDraftId}`, { method: 'POST' });
        const result = await res.json();
        if (!result.success) throw new Error(result.message);

        const media = result.data.media;
        renderedMediaItems = media.files || media.scenes || [];
        currentSlideIndex = 0;

        // 인스타그램 모바일 목업에 실물 렌더링 표시
        renderInstagramMockup();

        // 게시 버튼 활성화
        document.getElementById('btnPublish').disabled = false;
        document.getElementById('btnTopPublish').disabled = false;
        activateStepNav(5);
    } catch (err) {
        alert('미디어 생성 오류: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-layer-group text-xs mr-2"></i><span>게시글 / 영상 생성 버튼 누르기 (Media Render)</span>';
    }
}

// 인스타그램 목업 렌더링 및 캐러셀 네비게이션
function renderInstagramMockup() {
    if (renderedMediaItems.length === 0) return;

    document.getElementById('canvasPlaceholder').classList.add('hidden');
    const imgEl = document.getElementById('renderedSlideImg');
    imgEl.classList.remove('hidden');

    if (currentContentType === 'video') {
        imgEl.className = 'w-full h-full object-contain bg-neutral-900';
    } else {
        imgEl.className = 'w-full h-full object-cover';
    }

    updateCurrentSlide();

    // 슬라이더 버튼 및 인디케이터 표시
    if (renderedMediaItems.length > 1) {
        document.getElementById('btnPrevSlide').classList.remove('hidden');
        document.getElementById('btnNextSlide').classList.remove('hidden');
        document.getElementById('slideCounterBadge').classList.remove('hidden');

        // 캐러셀 도트 생성
        const dotsContainer = document.getElementById('carouselDots');
        dotsContainer.innerHTML = '';
        renderedMediaItems.forEach((_, idx) => {
            const dot = document.createElement('span');
            dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlide(idx);
            dotsContainer.appendChild(dot);
        });
    }
}

function updateCurrentSlide() {
    const item = renderedMediaItems[currentSlideIndex];
    if (!item) return;

    const imgEl = document.getElementById('renderedSlideImg');
    imgEl.src = ASSET_BASE + item.publicUrl;

    const counter = document.getElementById('slideCounterBadge');
    counter.innerText = `${currentSlideIndex + 1} / ${renderedMediaItems.length}`;

    // 도트 업데이트
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
        if (idx === currentSlideIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function prevSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        updateCurrentSlide();
    }
}

function nextSlide() {
    if (currentSlideIndex < renderedMediaItems.length - 1) {
        currentSlideIndex++;
        updateCurrentSlide();
    }
}

function goToSlide(idx) {
    currentSlideIndex = idx;
    updateCurrentSlide();
}

// [STEP 6] SNS 최종 게시하기
function triggerPublishAction() {
    publishContent();
}

async function publishContent() {
    if (!currentDraftId) return;

    const channels = [];
    if (document.getElementById('chkInstagram').checked) channels.push('instagram');
    if (document.getElementById('chkYoutube').checked) channels.push('youtube');

    if (channels.length === 0) return alert('게시할 채널을 1개 이상 선택해주세요.');

    const timing = document.querySelector('input[name="timing"]:checked').value;

    const btn = document.getElementById('btnPublish');
    const btnTop = document.getElementById('btnTopPublish');
    btn.disabled = true;
    btnTop.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> SNS 게시 업로드 중...';

    try {
        const res = await fetch(`${API_BASE}/publish/${currentDraftId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channels, timing })
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message);

        // 결과 알림 바 표시
        const notiBar = document.getElementById('publishNotificationBar');
        const linksArea = document.getElementById('publishLinksArea');
        linksArea.innerHTML = '';

        const pub = result.data.publishResults?.channels || {};
        if (pub.instagram) {
            linksArea.innerHTML += `
                <div class="flex items-center justify-between py-1 border-b border-gray-200">
                    <span class="font-bold text-black"><i class="fa-brands fa-instagram mr-1.5"></i>인스타그램</span>
                    <a href="${pub.instagram.postUrl}" target="_blank" class="font-mono text-black underline text-3xs">${pub.instagram.postUrl}</a>
                </div>
            `;
        }
        if (pub.youtube) {
            if (pub.youtube.skipped) {
                linksArea.innerHTML += `
                    <div class="py-1 text-gray-400 text-3xs">
                        <i class="fa-brands fa-youtube mr-1.5"></i>유튜브: 카드뉴스 포맷은 건너뜀
                    </div>
                `;
            } else {
                linksArea.innerHTML += `
                    <div class="flex items-center justify-between py-1 border-b border-gray-200">
                        <span class="font-bold text-black"><i class="fa-brands fa-youtube mr-1.5"></i>유튜브 쇼츠</span>
                        <a href="${pub.youtube.videoUrl}" target="_blank" class="font-mono text-black underline text-3xs">${pub.youtube.videoUrl}</a>
                    </div>
                `;
            }
        }

        notiBar.classList.remove('hidden');
        activateStepNav(6);
        alert('인스타그램 및 유튜브에 게시가 성공적으로 완료되었습니다!');
    } catch (err) {
        alert('게시 중 오류: ' + err.message);
    } finally {
        btn.disabled = false;
        btnTop.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square text-xs mr-2"></i><span>SNS에 최종 게시하기 (Publish)</span>';
    }
}

// 상단 네비게이션 스텝 활성화
function activateStepNav(stepNum) {
    for (let i = 1; i <= 6; i++) {
        const el = document.getElementById(`navStep${i}`);
        if (!el) continue;
        const numSpan = el.querySelector('span');
        if (i <= stepNum) {
            el.className = 'text-black font-extrabold flex items-center';
            if (numSpan) numSpan.className = 'step-num-active mr-1.5';
        } else {
            el.className = 'flex items-center';
            if (numSpan) numSpan.className = 'step-num mr-1.5';
        }
    }
}
