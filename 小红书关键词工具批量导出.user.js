// ==UserScript==
// @name         qjj | 小红书关键词工具批量导出
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  小红书广告后台关键词推荐工具，批量请求、滑块过滤、筛选导出Excel
// @author       qjj
// @match        https://ad.xiaohongshu.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      ad.xiaohongshu.com
// @require      https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js
// ==/UserScript==

(function () {
    'use strict';

    // ==================== 配置区 ====================
    const ALLOWED_BAG_NAMES = ['人群', '风格', '品牌', '场景', '品类', '款式'];

    // ==================== 样式 - 科技深色风格 ====================
    GM_addStyle(`
        #xhs-keyword-panel {
            position: fixed;
            top: 80px;
            right: 20px;
            width: 400px;
            background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
            border: 1px solid rgba(56, 189, 248, 0.3);
            border-radius: 16px;
            box-shadow:
                0 0 20px rgba(56, 189, 248, 0.15),
                0 8px 32px rgba(0, 0, 0, 0.5);
            z-index: 99999;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            color: #e2e8f0;
            overflow: hidden;
        }
        #xhs-keyword-panel .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 18px;
            background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%);
            border-bottom: 1px solid rgba(56, 189, 248, 0.4);
            position: relative;
            overflow: hidden;
        }
        #xhs-keyword-panel .panel-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background:
                linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.1) 50%, transparent 100%);
            animation: scanline 4s linear infinite;
            pointer-events: none;
        }
        @keyframes scanline {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        #xhs-keyword-panel .panel-header-title {
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1;
        }
        #xhs-keyword-panel .panel-header-title .logo {
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #38bdf8, #818cf8);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 12px;
            color: #0f172a;
            box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
        }
        #xhs-keyword-panel .panel-header-title .title-text {
            font-weight: 700;
            font-size: 15px;
            color: #f0f9ff;
            letter-spacing: 0.5px;
            text-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
        }
        #xhs-keyword-panel .panel-header-title .title-text small {
            font-size: 11px;
            font-weight: 400;
            color: #bae6fd;
            opacity: 0.8;
        }
        #xhs-keyword-panel .panel-header .close-btn {
            cursor: pointer;
            font-size: 20px;
            color: #bae6fd;
            z-index: 1;
            transition: all 0.2s;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
        }
        #xhs-keyword-panel .panel-header .close-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
        }
        #xhs-keyword-panel .panel-body {
            padding: 18px;
            max-height: 540px;
            overflow-y: auto;
        }
        #xhs-keyword-panel .form-group {
            margin-bottom: 16px;
        }
        #xhs-keyword-panel label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #94a3b8;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        #xhs-keyword-panel textarea {
            width: 100%;
            min-height: 80px;
            padding: 12px;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(56, 189, 248, 0.25);
            border-radius: 10px;
            font-size: 13px;
            resize: vertical;
            box-sizing: border-box;
            font-family: inherit;
            color: #e2e8f0;
            transition: all 0.2s;
        }
        #xhs-keyword-panel textarea:focus {
            outline: none;
            border-color: #38bdf8;
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }
        #xhs-keyword-panel textarea::placeholder {
            color: #475569;
        }
        #xhs-keyword-panel input[type="text"] {
            width: 100%;
            padding: 10px 12px;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(56, 189, 248, 0.25);
            border-radius: 8px;
            font-size: 13px;
            box-sizing: border-box;
            color: #e2e8f0;
            transition: all 0.2s;
            font-family: inherit;
        }
        #xhs-keyword-panel input[type="text"]:focus {
            outline: none;
            border-color: #38bdf8;
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }
        #xhs-keyword-panel input[type="text"]::placeholder {
            color: #475569;
        }

        /* 滑块样式 */
        #xhs-keyword-panel .slider-group {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(56, 189, 248, 0.15);
            border-radius: 10px;
            padding: 14px;
        }
        #xhs-keyword-panel .slider-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        #xhs-keyword-panel .slider-value {
            background: linear-gradient(135deg, #0ea5e9, #6366f1);
            color: #fff;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            min-width: 50px;
            text-align: center;
            box-shadow: 0 0 8px rgba(14, 165, 233, 0.3);
        }
        #xhs-keyword-panel input[type="range"] {
            width: 100%;
            height: 6px;
            -webkit-appearance: none;
            appearance: none;
            background: linear-gradient(90deg, #1e3a5f 0%, #0ea5e9 100%);
            border-radius: 3px;
            outline: none;
            cursor: pointer;
        }
        #xhs-keyword-panel input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            background: linear-gradient(135deg, #38bdf8, #818cf8);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
            border: 2px solid #fff;
            transition: all 0.2s;
        }
        #xhs-keyword-panel input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 0 15px rgba(56, 189, 248, 0.8);
        }
        #xhs-keyword-panel input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: linear-gradient(135deg, #38bdf8, #818cf8);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
            border: 2px solid #fff;
        }

        #xhs-keyword-panel .hint {
            font-size: 11px;
            color: #64748b;
            margin-top: 5px;
        }
        #xhs-keyword-panel .btn-group {
            display: flex;
            gap: 10px;
            margin-top: 18px;
        }
        #xhs-keyword-panel button {
            flex: 1;
            padding: 11px;
            border: none;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            letter-spacing: 0.5px;
        }
        #xhs-keyword-panel .btn-primary {
            background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #6366f1 100%);
            color: #fff;
            box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
        }
        #xhs-keyword-panel .btn-primary:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
        }
        #xhs-keyword-panel .btn-primary:active:not(:disabled) {
            transform: translateY(0);
        }
        #xhs-keyword-panel .btn-primary:disabled {
            background: #334155;
            color: #64748b;
            cursor: not-allowed;
            box-shadow: none;
        }
        #xhs-keyword-panel .btn-secondary {
            background: rgba(30, 41, 59, 0.8);
            color: #94a3b8;
            border: 1px solid rgba(56, 189, 248, 0.2);
        }
        #xhs-keyword-panel .btn-secondary:hover {
            background: rgba(56, 189, 248, 0.1);
            color: #e2e8f0;
            border-color: rgba(56, 189, 248, 0.4);
        }
        #xhs-keyword-panel .log-area {
            margin-top: 16px;
            padding: 12px;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(56, 189, 248, 0.15);
            border-radius: 10px;
            min-height: 70px;
            max-height: 160px;
            overflow-y: auto;
            font-size: 12px;
            line-height: 1.7;
            color: #cbd5e1;
        }
        #xhs-keyword-panel .log-item {
            padding: 3px 0;
            border-bottom: 1px solid rgba(56, 189, 248, 0.08);
            display: flex;
            align-items: flex-start;
            gap: 6px;
        }
        #xhs-keyword-panel .log-item:last-child {
            border-bottom: none;
        }
        #xhs-keyword-panel .log-item::before {
            content: '›';
            color: #475569;
            font-weight: bold;
        }
        #xhs-keyword-panel .log-success { color: #4ade80; }
        #xhs-keyword-panel .log-success::before { color: #22c55e; }
        #xhs-keyword-panel .log-error { color: #f87171; }
        #xhs-keyword-panel .log-error::before { color: #ef4444; }
        #xhs-keyword-panel .log-info { color: #38bdf8; }
        #xhs-keyword-panel .log-info::before { color: #0ea5e9; }
        #xhs-keyword-panel .log-warn { color: #fbbf24; }
        #xhs-keyword-panel .log-warn::before { color: #f59e0b; }

        /* 统计卡片 */
        #xhs-keyword-panel .stats-bar {
            display: flex;
            gap: 8px;
            margin-bottom: 14px;
        }
        #xhs-keyword-panel .stat-card {
            flex: 1;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(56, 189, 248, 0.15);
            border-radius: 8px;
            padding: 8px;
            text-align: center;
        }
        #xhs-keyword-panel .stat-card .stat-num {
            font-size: 16px;
            font-weight: 700;
            color: #38bdf8;
        }
        #xhs-keyword-panel .stat-card .stat-label {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
            text-transform: uppercase;
        }

        /* 悬浮按钮 */
        #xhs-toggle {
            position: fixed;
            top: 80px;
            right: 20px;
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #0284c7 0%, #6366f1 100%);
            color: #fff;
            border: none;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            z-index: 99998;
            box-shadow: 0 4px 20px rgba(14, 165, 233, 0.4);
            display: none;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }
        #xhs-toggle:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(14, 165, 233, 0.6);
        }

        /* 滚动条美化 */
        #xhs-keyword-panel .panel-body::-webkit-scrollbar,
        #xhs-keyword-panel .log-area::-webkit-scrollbar {
            width: 5px;
        }
        #xhs-keyword-panel .panel-body::-webkit-scrollbar-track,
        #xhs-keyword-panel .log-area::-webkit-scrollbar-track {
            background: transparent;
        }
        #xhs-keyword-panel .panel-body::-webkit-scrollbar-thumb,
        #xhs-keyword-panel .log-area::-webkit-scrollbar-thumb {
            background: rgba(56, 189, 248, 0.3);
            border-radius: 3px;
        }
        #xhs-keyword-panel .panel-body::-webkit-scrollbar-thumb:hover,
        #xhs-keyword-panel .log-area::-webkit-scrollbar-thumb:hover {
            background: rgba(56, 189, 248, 0.5);
        }
    `);

    // ==================== 工具函数 ====================

    function log(msg, type = 'info') {
        const logArea = document.querySelector('#xhs-keyword-panel .log-area');
        if (!logArea) return;
        const div = document.createElement('div');
        div.className = `log-item log-${type}`;
        div.textContent = msg;
        logArea.appendChild(div);
        logArea.scrollTop = logArea.scrollHeight;
    }

    function updateStat(id, value) {
        const el = document.getElementById(`xhs-stat-${id}`);
        if (el) el.textContent = value;
    }

    // trackId 即 URL 中的 vSellerId
    function getTrackId() {
        return getVSellerId();
    }

    function getVSellerId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('vSellerId') || '';
    }

    function getHeaders() {
        const headers = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'content-type': 'application/json',
            'priority': 'u=1, i',
            'sec-ch-ua': '"Not=A?Brand";v="99", "Microsoft Edge";v="151", "Chromium";v="151"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'v-seller-id': getVSellerId(),
        };
        return headers;
    }

    async function fetchKeywords(keyword, trackId) {
        const url = 'https://ad.xiaohongshu.com/api/leona/rtb/tool/keyword/common/recommend';
        const headers = getHeaders();
        const traceId = generateTraceId();
        headers['x-b3-traceid'] = traceId;

        const body = {
            requestType: 'search',
            priceUplift: 0,
            keywordSearchList: [keyword],
            trackId: trackId,
            filterPurchasedWord: 0,
            platform: 11
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    function generateTraceId() {
        return Array.from({ length: 16 }, () =>
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join('');
    }

    // 筛选词包：bagName 包含指定关键词 + bagMonthPv >= 滑块值
    function filterWordBags(wordBagList, minBagMonthPv) {
        if (!Array.isArray(wordBagList)) return [];
        return wordBagList.filter(bag => {
            if (!bag.bagName) return false;
            const nameMatch = ALLOWED_BAG_NAMES.some(keyword => bag.bagName.includes(keyword));
            const pvMatch = (bag.bagMonthPv || 0) >= minBagMonthPv;
            return nameMatch && pvMatch;
        });
    }

    function extractWords(searchKeyword, bagName, wordListIterator) {
        if (!Array.isArray(wordListIterator)) return [];
        return wordListIterator.map(item => {
            const rawBid = item.bid;
            const bid = (typeof rawBid === 'number')
                ? (rawBid / 100).toFixed(2)
                : '';
            return {
                '搜索词_匹配词': `${searchKeyword}_${bagName}`,
                keyword: item.keyword || '',
                recommendReason: Array.isArray(item.recommendReason)
                    ? item.recommendReason.join(', ')
                    : (item.recommendReason || ''),
                competitionLevel: item.competitionLevel || '',
                monthpv: item.monthpv || 0,
                bid: bid
            };
        });
    }

    function downloadExcel(allData) {
        if (allData.length === 0) {
            log('没有数据可下载', 'warn');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(allData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '关键词');

        ws['!cols'] = [
            { wch: 30 },  // 搜索词_匹配词
            { wch: 25 },  // keyword
            { wch: 40 },  // recommendReason
            { wch: 15 },  // competitionLevel
            { wch: 15 },  // monthpv
            { wch: 12 }   // bid
        ];

        const today = new Date();
        const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const fileName = `qqj红薯关键词下载器_${dateStr}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================== 主逻辑 ====================

    async function processKeywords(keywords, trackId, delayMs, minBagMonthPv) {
        let totalBags = 0;
        let totalRows = 0;
        const allData = [];

        for (let i = 0; i < keywords.length; i++) {
            const keyword = keywords[i];
            log(`[${i + 1}/${keywords.length}] 正在处理: ${keyword}`, 'info');
            updateStat('current', `${i + 1}/${keywords.length}`);

            try {
                const res = await fetchKeywords(keyword, trackId);

                if (res.code !== 0 && res.code !== 200) {
                    log(`请求失败: ${res.msg || res.message || '未知错误'}`, 'error');
                    continue;
                }

                const wordBagList = res.data?.wordBagList || [];
                const filteredBags = filterWordBags(wordBagList, minBagMonthPv);

                log(`获取 ${wordBagList.length} 个词包 → 筛选后 ${filteredBags.length} 个 (bagMonthPv >= ${minBagMonthPv})`, 'success');

                if (filteredBags.length === 0) {
                    log(`"${keyword}" 无匹配词包`, 'warn');
                    continue;
                }

                for (const bag of filteredBags) {
                    const words = extractWords(keyword, bag.bagName, bag.wordListIterator || []);
                    if (words.length === 0) {
                        log(`词包 "${bag.bagName}" 为空`, 'warn');
                        continue;
                    }

                    log(`词包 "${bag.bagName}" 提取 ${words.length} 条`, 'info');
                    allData.push(...words);
                    totalRows += words.length;
                    totalBags++;
                    updateStat('bags', totalBags);
                    updateStat('files', totalRows);
                }

            } catch (err) {
                log(`"${keyword}" 出错: ${err.message}`, 'error');
            }

            if (i < keywords.length - 1) {
                await sleep(delayMs);
            }
        }

        return { totalBags, totalRows, allData };
    }

    // ==================== UI ====================

    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'xhs-keyword-panel';

        const trackId = getTrackId();
        const vSellerId = getVSellerId();

        panel.innerHTML = `
            <div class="panel-header">
                <div class="panel-header-title">
                    <div class="logo">Q</div>
                    <div class="title-text">
                        qjj<br>
                        <small>小红书关键词批量导出</small>
                    </div>
                </div>
                <div class="close-btn" id="xhs-close">&times;</div>
            </div>
            <div class="panel-body">
                <div class="stats-bar">
                    <div class="stat-card">
                        <div class="stat-num" id="xhs-stat-current">0/0</div>
                        <div class="stat-label">进度</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num" id="xhs-stat-bags">0</div>
                        <div class="stat-label">词包</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-num" id="xhs-stat-files">0</div>
                        <div class="stat-label">文件</div>
                    </div>
                </div>

                <div class="form-group">
                    <label>关键词列表（每行一个）</label>
                    <textarea id="xhs-keywords" placeholder="POLO衫&#10;连衣裙&#10;运动鞋"></textarea>
                    <div class="hint">多个关键词会逐个请求并分别导出</div>
                </div>

                <div class="form-group">
                    <label>Track ID</label>
                    <input type="text" id="xhs-trackid" value="${trackId || ''}" placeholder="自动获取失败请手动填写">
                    <div class="hint">${trackId ? '✓ 已从 URL 自动获取 (vSellerId)' : '✗ 未获取到，请检查 URL 是否包含 vSellerId'}</div>
                </div>

                <div class="form-group">
                    <div class="slider-group">
                        <div class="slider-header">
                            <label style="margin:0;">词包月搜索量过滤 (bagMonthPv)</label>
                            <span class="slider-value" id="xhs-slider-val">0</span>
                        </div>
                        <input type="range" id="xhs-bagpv" min="0" max="10000" step="100" value="0">
                        <div class="hint">只导出 bagMonthPv ≥ 该值的词包，拖动调整阈值</div>
                    </div>
                </div>

                <div class="form-group">
                    <label>请求间隔 (毫秒)</label>
                    <input type="text" id="xhs-delay" value="1500" placeholder="1500">
                    <div class="hint">建议 1000-2000ms，避免请求过快被限制</div>
                </div>

                <div class="btn-group">
                    <button class="btn-primary" id="xhs-start">开始导出</button>
                    <button class="btn-secondary" id="xhs-clear">清空日志</button>
                </div>

                <div class="log-area" id="xhs-log">
                    <div class="log-item log-info">就绪，请输入关键词后点击"开始导出"</div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // 滑块事件
        const slider = document.getElementById('xhs-bagpv');
        const sliderVal = document.getElementById('xhs-slider-val');
        slider.addEventListener('input', () => {
            const val = parseInt(slider.value);
            sliderVal.textContent = val.toLocaleString();
        });

        // 关闭
        document.getElementById('xhs-close').addEventListener('click', () => {
            panel.style.display = 'none';
            document.getElementById('xhs-toggle').style.display = 'flex';
        });

        // 开始导出
        document.getElementById('xhs-start').addEventListener('click', async () => {
            const keywordsText = document.getElementById('xhs-keywords').value.trim();
            const trackIdInput = document.getElementById('xhs-trackid').value.trim();
            const delayInput = parseInt(document.getElementById('xhs-delay').value) || 1500;
            const minBagMonthPv = parseInt(document.getElementById('xhs-bagpv').value) || 0;
            const btn = document.getElementById('xhs-start');

            if (!keywordsText) {
                log('请输入至少一个关键词', 'error');
                return;
            }

            const keywords = keywordsText.split(/[\n,，]/).map(s => s.trim()).filter(Boolean);
            if (keywords.length === 0) {
                log('请输入有效的关键词', 'error');
                return;
            }

            const finalTrackId = trackIdInput || getTrackId();
            if (!finalTrackId) {
                log('未能获取 trackId，请手动填写', 'error');
                return;
            }

            // 重置统计
            updateStat('current', `0/${keywords.length}`);
            updateStat('bags', '0');
            updateStat('files', '0');

            btn.disabled = true;
            btn.textContent = '导出中...';
            log(`开始处理 ${keywords.length} 个关键词，bagMonthPv 阈值: ${minBagMonthPv.toLocaleString()}`, 'info');

            try {
                const result = await processKeywords(keywords, finalTrackId, delayInput, minBagMonthPv);
                log(`共筛选 ${result.totalBags} 个词包，${result.totalRows} 条数据，开始下载...`, 'info');
                downloadExcel(result.allData);
                log(`下载完成: qqj红薯关键词下载器_日期.xlsx`, 'success');
            } catch (e) {
                log(`导出过程出错: ${e.message}`, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = '开始导出';
            }
        });

        // 清空日志
        document.getElementById('xhs-clear').addEventListener('click', () => {
            document.getElementById('xhs-log').innerHTML = '';
        });
    }

    function createToggleBtn() {
        const btn = document.createElement('button');
        btn.id = 'xhs-toggle';
        btn.innerHTML = 'Q';
        btn.style.display = 'none';
        btn.addEventListener('click', () => {
            const panel = document.getElementById('xhs-keyword-panel');
            panel.style.display = 'block';
            btn.style.display = 'none';
        });
        document.body.appendChild(btn);
    }

    // ==================== 初始化 ====================

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        if (document.getElementById('xhs-keyword-panel')) return;

        createPanel();
        createToggleBtn();

        log('qjj 关键词导出工具已加载', 'success');
        log(`vSellerId: ${getVSellerId() || '未获取'}`, 'info');
    }

    init();

    // SPA 路由监听
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            if (url.includes('/aurora/ad/tools/newKeywordTool')) {
                setTimeout(init, 1000);
            }
        }
    }).observe(document, { subtree: true, childList: true });

})();
