require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const supabaseService = require('./services/supabaseService');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-api-key']
}));

// Body Parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 생성된 미디어 파일 및 프론트엔드 정적 서빙
app.use('/generated', express.static(path.join(__dirname, 'public/generated')));
app.use(express.static(path.join(__dirname, 'public')));

// API 라우팅
app.use('/api', apiRoutes);

// Health Check & DB 상태 확인
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'UniMeet Social Content Studio Backend', 
        version: '2.1.0',
        supabase: supabaseService.getConnectionStatus(),
        timestamp: new Date() 
    });
});

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || '서버 내부 오류가 발생했습니다.'
    });
});

app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`🚀 UniMeet Auto Studio Backend Server running on http://localhost:${PORT}`);
    console.log(`📁 Static files serving at http://localhost:${PORT}/generated/`);
    console.log(`🌐 Interactive Studio Dashboard: http://localhost:${PORT}`);
    console.log(`====================================================`);
    
    // Supabase DB 초기화
    await supabaseService.init();
});
