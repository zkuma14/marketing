exports.getBrandAssets = (req, res) => {
    const assets = {
        photoroomLogo: {
            id: 'photoroomLogo',
            name: 'Logo-Photoroom.png (투명 로고)',
            url: 'https://raw.githubusercontent.com/zkuma14/zkuma14.github.io/main/Logo-Photoroom.png',
            type: 'png',
            usage: '질문/밸런스 슬라이드 워터마크'
        },
        mainLogo: {
            id: 'mainLogo',
            name: 'Logo.png (메인 로고)',
            url: 'https://raw.githubusercontent.com/zkuma14/zkuma14.github.io/main/Logo.png',
            type: 'png',
            usage: '아웃트로 & 브랜드 CTA'
        },
        wordmark: {
            id: 'wordmark',
            name: 'Unimeet.jpg (텍스트 워드마크)',
            url: 'https://raw.githubusercontent.com/zkuma14/zkuma14.github.io/main/Unimeet.jpg',
            type: 'jpg',
            usage: '표지 헤더 및 대표 브랜드 카드'
        }
    };

    res.status(200).json({
        success: true,
        data: assets
    });
};