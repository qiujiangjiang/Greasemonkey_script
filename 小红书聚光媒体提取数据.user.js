// ==UserScript==
// @name         小红书数据提取器
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  提取小红书合作伙伴数据，支持多账户组合配置
// @author       qjj
// @match        https://partner.xiaohongshu.com/*
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';

    // 默认账户组合配置
    const defaultAccountGroups = {
        '组合1': [
            '【ZT-qjj】YL-新媒体-STYX-HC-服饰-信息流-rta-ocpx',
            '【ZT-qjj】YL-新媒体-STYX-HC-服饰-搜索-rta-cpc',
            '【ZT-qjj】YL-新媒体-STYX-HC-服饰-信息流-rta-cpc',
            '【ZT-qjj】YL-新媒体-STYX-HC-服饰-信息流-无r-ocpx'
        ]
    };

    // 从localStorage加载或使用默认配置
    let accountGroups = loadAccountGroups();

    // API请求头配置（需要从浏览器开发者工具中获取最新的x-s和x-t值）
    const getHeaders = () => {
        return {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'content-type': 'application/json;charset=UTF-8',
            'sec-ch-ua': '"Not=A?Brand";v="99", "Microsoft Edge";v="151", "Chromium";v="151"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'x-b3-traceid': generateTraceId(),
            // 注意：x-s和x-t需要动态获取或手动更新
            // 'x-s': 'YOUR_X_S_VALUE',
            // 'x-t': 'YOUR_X_T_VALUE'
        };
    };

    // 获取昨天日期 (t-1)
    function getYesterdayDate() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    // 生成traceid
    function generateTraceId() {
        return Math.random().toString(36).substr(2, 16) + Math.random().toString(36).substr(2, 16);
    }

    // 创建UI界面
    function createUI() {
        GM_addStyle(`
            #data-extractor-container {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            #data-extractor-container.collapsed {
                width: 200px;
                max-height: 44px;
                overflow: hidden;
            }
            .extractor-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                background: #fafafa;
                border-bottom: 1px solid #eee;
                border-radius: 8px 8px 0 0;
                cursor: move;
                user-select: none;
            }
            #data-extractor-container.collapsed .extractor-header {
                border-bottom: none;
                border-radius: 8px;
            }
            .extractor-header h3 {
                margin: 0;
                color: #333;
                font-size: 16px;
                flex: 1;
            }
            .header-actions {
                display: flex;
                gap: 8px;
            }
            .header-btn {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 16px;
                color: #666;
                padding: 2px 6px;
                border-radius: 4px;
                line-height: 1;
            }
            .header-btn:hover {
                background: #e0e0e0;
                color: #333;
            }
            .extractor-body {
                padding: 16px;
            }
            #data-extractor-container.collapsed .extractor-body {
                display: none;
            }
            #data-extractor-container h3 {
                margin: 0 0 12px 0;
                color: #333;
                font-size: 16px;
            }
            .group-selector, .config-section {
                margin-bottom: 12px;
            }
            .group-selector select, .config-input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
            }
            .date-range {
                margin-bottom: 12px;
                display: flex;
                gap: 8px;
                align-items: center;
            }
            .date-range label {
                font-size: 13px;
                color: #555;
                white-space: nowrap;
            }
            .date-range input[type="date"] {
                flex: 1;
                padding: 6px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 13px;
            }
            .config-input {
                min-height: 100px;
                resize: vertical;
            }
            .extract-btn, .save-config-btn {
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                width: 100%;
                transition: background 0.2s;
                margin-bottom: 8px;
            }
            .save-config-btn {
                background: #4CAF50;
            }
            .extract-btn:hover, .save-config-btn:hover {
                opacity: 0.9;
            }
            .extract-btn:disabled, .save-config-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            .loading {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid #ff6b6b;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .result-table {
                margin-top: 16px;
                border-collapse: collapse;
                width: 100%;
                font-size: 12px;
                table-layout: fixed;
            }
            .result-table th,
            .result-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                word-wrap: break-word;
                min-width: 80px;
            }
            .result-table th {
                background-color: #f5f5f5;
                font-weight: 600;
                position: sticky;
                top: 0;
                z-index: 1;
            }
            .result-table tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .copy-btn {
                background: #2196F3;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
                width: 60px;
            }
            .copy-btn:hover {
                background: #1976D2;
            }
            .group-selector select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
                min-height: 120px;
            }
            #result-container {
                max-height: 60vh;
                overflow-x: auto;
                margin-top: 16px;
                padding: 8px;
                border: 1px solid #eee;
                border-radius: 4px;
                background-color: #fafafa;
            }
            .result-group {
                margin-bottom: 24px;
            }
            .result-group h4, .result-group h5 {
                margin-top: 0;
                color: #333;
            }
            .toggle-config {
                text-align: right;
                font-size: 12px;
                color: #666;
                cursor: pointer;
                margin-bottom: 8px;
            }
            .toggle-config:hover {
                color: #ff6b6b;
            }
            .config-section {
                display: none;
            }
            .config-section.active {
                display: block;
            }
        `);

        const container = document.createElement('div');
        container.id = 'data-extractor-container';
        const yesterday = getYesterdayDate();
        container.innerHTML = `
            <div class="extractor-header" id="extractor-header">
                <h3>小红书数据提取器</h3>
                <div class="header-actions">
                    <button class="header-btn" id="collapse-btn" title="折叠/展开">−</button>
                </div>
            </div>
            <div class="extractor-body">
                <div class="toggle-config" id="toggle-config">配置组合设置</div>
                <div class="group-selector">
                    <label>选择账户组合 (可多选):</label>
                    <select id="group-selector" multiple size="4">
                        ${Object.keys(accountGroups).map(group => `<option value="${group}">${group}</option>`).join('')}
                    </select>
                </div>
                <div class="date-range">
                    <label>开始:</label>
                    <input type="date" id="date-start" value="${yesterday}">
                    <label>结束:</label>
                    <input type="date" id="date-end" value="${yesterday}">
                </div>
                <button class="extract-btn" id="extract-btn">提取数据</button>

                <div class="config-section" id="config-section">
                    <label>组合配置 (JSON格式):</label>
                    <textarea class="config-input" id="config-input" placeholder="输入JSON格式的组合配置"></textarea>
                    <button class="save-config-btn" id="save-config-btn">保存配置</button>
                </div>

                <div id="result-container"></div>
            </div>
        `;

        document.body.appendChild(container);

        // 绑定事件
        document.getElementById('extract-btn').addEventListener('click', extractData);
        document.getElementById('toggle-config').addEventListener('click', toggleConfigSection);
        document.getElementById('save-config-btn').addEventListener('click', saveConfig);
        document.getElementById('collapse-btn').addEventListener('click', toggleCollapse);

        // 初始化拖拽
        initDrag();

        // 初始化配置输入框
        updateConfigInput();
    }

    // 提取数据主函数
    async function extractData() {
        const groupSelector = document.getElementById('group-selector');
        const dateStartInput = document.getElementById('date-start');
        const dateEndInput = document.getElementById('date-end');
        const extractBtn = document.getElementById('extract-btn');
        const resultContainer = document.getElementById('result-container');

        // 支持多选组合
        const selectedGroups = [];
        for (let option of groupSelector.options) {
            if (option.selected) {
                selectedGroups.push(option.value);
            }
        }

        const dateStart = dateStartInput.value;
        const dateEnd = dateEndInput.value;

        if (!dateStart || !dateEnd) {
            alert('请选择开始和结束日期');
            return;
        }

        if (dateStart > dateEnd) {
            alert('开始日期不能晚于结束日期');
            return;
        }

        if (selectedGroups.length === 0) {
            alert('请选择至少一个账户组合');
            return;
        }

        // 显示加载状态
        extractBtn.disabled = true;
        extractBtn.innerHTML = '<span class="loading"></span> 提取中...';

        try {
            // 并发请求所有选中的组合
            const promises = selectedGroups.map(group => {
                const accounts = accountGroups[group];
                if (!accounts || accounts.length === 0) {
                    throw new Error(`组合 "${group}" 没有配置账户`);
                }
                return fetchData(accounts, dateStart, dateEnd).then(data => ({
                    group: group,
                    data: data
                }));
            });

            const results = await Promise.all(promises);
            displayResults(results, selectedGroups, dateStart, dateEnd);
        } catch (error) {
            console.error('数据提取失败:', error);
            alert('数据提取失败，请检查控制台错误信息: ' + error.message);
        } finally {
            extractBtn.disabled = false;
            extractBtn.textContent = '提取数据';
        }
    }

    // 发送API请求
    async function fetchData(accounts, dateStart, dateEnd) {
        const headers = getHeaders();

        // 构建请求体
        const requestBody = {
            "viewAlias": "partner_dataCenter_selfAnalysis_daiLiView",
            "sorts": [],
            "page": {
                "pageNo": 1,
                "pageSize": 10
            },
            "frontFilterList": [
                {
                    "filterField": "time_dim",
                    "filterFieldName": "时间维度",
                    "require": 1,
                    "filterType": 20,
                    "selectFilter": {
                        "selectLabels": [
                            {"labelValue": "all_key", "labelName": "合计", "selected": 0},
                            {"selected": 1, "labelValue": "date_key", "labelName": "按天"},
                            {"labelValue": "week_key", "labelName": "按周", "selected": 0},
                            {"labelValue": "month_key", "labelName": "按月", "selected": 0}
                        ],
                        "selectType": 10,
                        "selectShowType": 0,
                        "valueSource": 0
                    },
                    "hide": 0,
                    "foldType": 0
                },
                {
                    "foldType": 0,
                    "filterField": "date_key",
                    "filterFieldName": "",
                    "require": 1,
                    "filterType": 10,
                    "timeFilter": {
                        "limitMax": 366,
                        "defaultDate": 0,
                        "quickDates": [6, 11, 16, 21, 36, 41, 46, 51],
                        "values": [dateStart, dateEnd],
                        "pattern": 10,
                        "timeShowType": 11,
                        "disableRange": 0,
                        "useDate": 0
                    },
                    "hide": 0
                },
                {
                    "textFilter": {
                        "valueSource": 2,
                        "fields": ["virtual_seller_name", "virtual_seller_id"],
                        "selectType": 20,
                        "viewAlias": "partner_commonSearch_daiLiDimView",
                        "selectFileds": [],
                        "caseSensitive": 0,
                        "defaultValue": "",
                        "mappingFields": ["virtual_seller_name", "virtual_seller_id"],
                        "operate": 120,
                        "values": accounts,
                        "operateList": [],
                        "defaultOperate": 120,
                        "customOperate": accounts.map(account => ({
                            "label": account,
                            "value": account,
                            "virtual_seller_name": account,
                            "virtual_seller_id": "" // 实际使用时需要填充正确的ID
                        }))
                    },
                    "hide": 0,
                    "foldType": 2,
                    "filterField": "virtual_seller_name",
                    "filterFieldName": "子账号名称/ID",
                    "filterType": 40
                }
            ],
            "dynamicTargets": [
                "brand_company_name",
                "income_amt",
                "imp_cnt",
                "click_cnt",
                "jj_return_amount",
                "jj_compensate_return_amount"
            ],
            "extra": null
        };

        try {
            const response = await fetch("https://partner.xiaohongshu.com/api/vision/dashboard/target_detail_list", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(requestBody),
                credentials: "include"
            });

            const result = await response.json();

            if (result.code === 0 && result.success) {
                return result.data;
            } else {
                throw new Error(`API返回错误: ${result.msg}`);
            }
        } catch (error) {
            console.error('数据提取失败:', error);
            throw error;
        }
    }

    // 定义需要的列顺序及映射
    const FIELD_ORDER = [
        { code: 'date_key', name: '日期' },
        { code: 'NAME', name: '姓名', fixedValue: '仇江江' },
        { code: 'income_amt', name: '运营总消耗' },
        { code: 'imp_cnt', name: '曝光量' },
        { code: 'click_cnt', name: '点击量' },
        { code: 'jj_return_amount', name: '竞价返货消耗' },
        { code: 'jj_compensate_return_amount', name: '竞价赔付消耗' }
    ];

    // 显示结果表格
    function displayResults(results, groupNames, dateStart, dateEnd) {
        const resultContainer = document.getElementById('result-container');
        const dateLabel = dateStart === dateEnd ? dateStart : `${dateStart} ~ ${dateEnd}`;

        let html = '';

        results.forEach(resultItem => {
            const { group, data } = resultItem;

            if (!data || !data.detailListVo) {
                html += `<div><h4>组合: ${group} (${dateLabel})</h4><p>没有找到数据</p></div>`;
                return;
            }

            const detailList = data.detailListVo.detailVoList;

            html += `<div class="result-group">
                <h4>组合: ${group} (${dateLabel})</h4>`;

            // 只显示详细数据
            if (detailList && detailList.length > 0) {
                html += createTable(detailList.map(item => item.targetList), group);
            } else {
                html += '<p>无详细数据</p>';
            }

            html += '</div>';
        });

        resultContainer.innerHTML = html;

        // 绑定复制按钮事件
        addCopyEventListeners();
    }

    // 创建HTML表格
    function createTable(targetLists, groupName = '') {
        if (!targetLists || targetLists.length === 0) {
            return '<p>无数据</p>';
        }

        let html = '<table class="result-table">';

        // 表头: 按指定顺序 + 组合名
        const displayHeaders = [...FIELD_ORDER.map(f => f.name), '组合名'];

        html += '<thead><tr>';
        displayHeaders.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '<th>操作</th>';
        html += '</tr></thead>';

        // 表体
        html += '<tbody>';
        targetLists.forEach((targetList, index) => {
            // 将 targetList 转为 code -> value 的映射
            const valueMap = {};
            targetList.forEach(target => {
                valueMap[target.targetCode] = target.targetValue || target.targetDownloadValue || '';
            });

            html += '<tr>';

            // 按 FIELD_ORDER 顺序填充列
            FIELD_ORDER.forEach(field => {
                const val = field.fixedValue !== undefined ? field.fixedValue : (valueMap[field.code] || '');
                html += `<td>${val}</td>`;
            });

            // 组合名列
            html += `<td>${groupName}</td>`;

            // 复制按钮
            const copyData = FIELD_ORDER.map(field => {
                return field.fixedValue !== undefined ? field.fixedValue : (valueMap[field.code] || '');
            });
            copyData.push(groupName);
            const copyId = `copy-${groupName}-${index}`;
            html += `<td><button class="copy-btn" data-copy-id="${copyId}" data-copy-data="${encodeURIComponent(JSON.stringify(copyData))}">复制</button></td>`;

            html += '</tr>';
        });
        html += '</tbody></table>';

        return html;
    }

    // 持久化存储相关函数
    function loadAccountGroups() {
        try {
            const saved = localStorage.getItem('xiaohongshuAccountGroups');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('加载账户组合配置失败，使用默认配置');
        }
        return {...defaultAccountGroups};
    }

    function saveAccountGroups(groups) {
        try {
            localStorage.setItem('xiaohongshuAccountGroups', JSON.stringify(groups));
            accountGroups = groups;
            // 更新选择器
            updateGroupSelector();
            // 更新配置输入框
            updateConfigInput();
        } catch (e) {
            console.error('保存账户组合配置失败:', e);
            throw new Error('无法保存配置到本地存储');
        }
    }

    function updateGroupSelector() {
        const selector = document.getElementById('group-selector');
        if (selector) {
            selector.innerHTML = '';
            Object.keys(accountGroups).forEach(group => {
                const option = document.createElement('option');
                option.value = group;
                option.textContent = group;
                selector.appendChild(option);
            });
        }
    }

    function updateConfigInput() {
        const configInput = document.getElementById('config-input');
        if (configInput) {
            configInput.value = JSON.stringify(accountGroups, null, 2);
        }
    }

    // 折叠/展开窗口
    function toggleCollapse() {
        const container = document.getElementById('data-extractor-container');
        const btn = document.getElementById('collapse-btn');
        container.classList.toggle('collapsed');
        btn.textContent = container.classList.contains('collapsed') ? '+' : '−';
    }

    // 初始化窗口拖拽
    function initDrag() {
        const container = document.getElementById('data-extractor-container');
        const header = document.getElementById('extractor-header');
        if (!container || !header) return;

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        header.addEventListener('mousedown', function(e) {
            // 忽略按钮点击
            if (e.target.closest('.header-btn')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = container.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            container.style.right = 'auto';
            container.style.left = initialLeft + 'px';
            container.style.top = initialTop + 'px';

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            container.style.left = (initialLeft + dx) + 'px';
            container.style.top = (initialTop + dy) + 'px';
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }

    function toggleConfigSection() {
        const configSection = document.getElementById('config-section');
        configSection.classList.toggle('active');
        const toggleBtn = document.getElementById('toggle-config');
        toggleBtn.textContent = configSection.classList.contains('active') ? '隐藏配置' : '配置组合设置';
    }

    function saveConfig() {
        const configInput = document.getElementById('config-input');
        const saveBtn = document.getElementById('save-config-btn');

        try {
            const newConfig = JSON.parse(configInput.value);
            saveBtn.disabled = true;
            saveBtn.textContent = '保存中...';

            saveAccountGroups(newConfig);

            saveBtn.disabled = false;
            saveBtn.textContent = '保存配置';
            alert('配置保存成功！');

            // 隐藏配置区域
            document.getElementById('config-section').classList.remove('active');
            document.getElementById('toggle-config').textContent = '配置组合设置';

        } catch (e) {
            console.error('配置保存失败:', e);
            alert('配置格式错误，请检查JSON格式是否正确！\n错误信息: ' + e.message);
            saveBtn.disabled = false;
            saveBtn.textContent = '保存配置';
        }
    }

    // 添加复制按钮事件监听
    function addCopyEventListeners() {
        const copyButtons = document.querySelectorAll('.copy-btn');
        copyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const copyData = JSON.parse(decodeURIComponent(this.dataset.copyData));
                const csvContent = copyData.join('\t');

                // 复制到剪贴板
                navigator.clipboard.writeText(csvContent).then(() => {
                    // 显示成功提示
                    const originalText = this.textContent;
                    this.textContent = '已复制';
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('复制失败:', err);
                    alert('复制失败，请手动复制');
                });
            });
        });
    }

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }

})();
