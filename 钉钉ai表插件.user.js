// ==UserScript==
// @name         钉钉AI表格透视表批量提取工具（支持合并单元格）
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  自动检测页面所有表格，正确处理合并单元格，每个表格左上角悬浮下载和复制按钮
// @author       You
// @match        *://alidocs.dingtalk.com/*
// @match        *://docs.dingtalk.com/*
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// ==/UserScript==

(function () {
    'use strict';

    // ==================== 工具函数 ====================

    /**
     * 核心：将带合并单元格的 HTML 表格解析为完整的二维数组
     * 通过构建虚拟网格，追踪 rowspan/colspan 占用的位置，将合并单元格的值填充到所有覆盖的坐标
     */
    function parseTableWithMergedCells(table) {
        const rows = Array.from(table.querySelectorAll('tr'));
        const grid = [];

        rows.forEach((rowEl, rowIndex) => {
            if (!grid[rowIndex]) grid[rowIndex] = [];
            let colIndex = 0;

            // 跳过被上一行 rowspan 占用的列
            while (grid[rowIndex][colIndex] !== undefined) {
                colIndex++;
            }

            const cells = rowEl.querySelectorAll('td, th');
            cells.forEach(cell => {
                // 继续跳过被占用的列
                while (grid[rowIndex][colIndex] !== undefined) {
                    colIndex++;
                }

                const text = cell.textContent.trim();
                const rowSpan = parseInt(cell.getAttribute('rowspan')) || 1;
                const colSpan = parseInt(cell.getAttribute('colspan')) || 1;

                // 将单元格的值填充到其覆盖的整个矩形区域
                for (let r = 0; r < rowSpan; r++) {
                    const targetRow = rowIndex + r;
                    if (!grid[targetRow]) grid[targetRow] = [];
                    for (let c = 0; c < colSpan; c++) {
                        const targetCol = colIndex + c;
                        // 只填充尚未被占用的位置（避免嵌套表格等边界情况覆盖已有值）
                        if (grid[targetRow][targetCol] === undefined) {
                            grid[targetRow][targetCol] = text;
                        }
                    }
                }
                colIndex += colSpan;
            });
        });

        // 过滤掉全空的行
        return grid.filter(row => row.some(cell => cell !== undefined && cell !== ''));
    }

    function parseGridToData(container) {
        let data = [];
        let rows = container.querySelectorAll('[class*="row"], [class*="Row"]');
        if (rows.length === 0) {
            let cells = container.querySelectorAll('[class*="cell"], [class*="Cell"]');
            if (cells.length > 0) {
                let rowData = Array.from(cells).map(cell => cell.innerText.trim());
                if (rowData.some(t => t.length > 0)) {
                    data.push(rowData);
                }
            }
        } else {
            for (let row of rows) {
                let cells = row.querySelectorAll('[class*="cell"], [class*="Cell"], td, th, div');
                let rowData = Array.from(cells)
                    .map(cell => cell.innerText.trim())
                    .filter((text, index, self) => self.indexOf(text) === index || text !== '');
                if (rowData.length > 0) {
                    data.push(rowData);
                }
            }
        }
        return data.length > 0 ? data : null;
    }

    function downloadExcel(data, filename) {
        if (!data || data.length === 0) {
            alert('未提取到数据！');
            return;
        }
        let ws = XLSX.utils.aoa_to_sheet(data);
        let colWidths = [];
        for (let col = 0; col < data[0].length; col++) {
            let maxLen = 10;
            for (let row = 0; row < data.length; row++) {
                let cellLen = String(data[row][col] || '').length;
                if (cellLen > maxLen) maxLen = cellLen;
            }
            colWidths.push({ wch: Math.min(maxLen + 2, 50) });
        }
        ws['!cols'] = colWidths;
        let wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '透视表数据');
        XLSX.writeFile(wb, filename || '钉钉透视表数据.xlsx');
    }

    function copyToClipboard(data) {
        if (!data || data.length === 0) {
            alert('未提取到数据！');
            return;
        }
        let text = data.map(row => row.join('\t')).join('\n');
        if (typeof GM_setClipboard === 'function') {
            GM_setClipboard(text, 'text');
        } else {
            navigator.clipboard.writeText(text).catch(err => {
                let textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                } catch (e) {
                    console.error('复制失败:', e);
                }
                document.body.removeChild(textarea);
            });
        }
        alert('已复制到剪贴板！可直接粘贴到 Excel 中。');
    }

    // ==================== 核心：检测并标注所有表格 ====================

    let processedTables = new WeakSet();
    let actionButtons = [];

    /**
     * 计算按钮组的安全位置，确保在可视区域内
     */
    function getSafePosition(buttonGroup, targetRect) {
        const BUTTON_HEIGHT = 36;
        const BUTTON_GAP = 8;

        let top = targetRect.top - BUTTON_HEIGHT - BUTTON_GAP;
        let left = targetRect.left;

        if (top < window.scrollY) {
            top = targetRect.top + BUTTON_GAP;
        }

        if (left < window.scrollX) {
            left = window.scrollX + BUTTON_GAP;
        }

        let btnWidth = buttonGroup.offsetWidth || 300;
        if (left + btnWidth > window.scrollX + window.innerWidth) {
            left = window.scrollX + window.innerWidth - btnWidth - BUTTON_GAP;
        }

        return { top, left };
    }

    /**
     * 为单个表格元素添加边框和操作按钮
     */
    function annotateTable(table, index) {
        if (processedTables.has(table)) return;
        processedTables.add(table);

        table.style.cssText += `
            border: 2px solid #667eea !important;
            border-collapse: collapse !important;
        `;
        let cells = table.querySelectorAll('td, th');
        cells.forEach(cell => {
            cell.style.cssText += `
                border: 1px solid #c7d2fe !important;
                padding: 4px 8px !important;
            `;
        });

        // 使用新的合并单元格解析函数
        let data = parseTableWithMergedCells(table);
        if (!data || data.length === 0) return;

        let buttonGroup = document.createElement('div');
        buttonGroup.className = 'pivot-action-group';
        buttonGroup.dataset.tableIndex = index;
        buttonGroup.style.cssText = `
            position: fixed;
            z-index: 2147483647;
            display: flex;
            gap: 6px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 4px 8px;
            border-radius: 6px;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            pointer-events: auto;
        `;

        let label = document.createElement('span');
        label.textContent = `表${index + 1} (${data.length}行×${data[0].length}列)`;
        label.style.cssText = `
            padding: 4px 8px;
            color: white;
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
            user-select: none;
        `;

        let copyBtn = document.createElement('button');
        copyBtn.textContent = ' 复制';
        copyBtn.style.cssText = `
            padding: 4px 12px;
            background: rgba(255,255,255,0.95);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            color: #333;
            transition: all 0.2s;
            white-space: nowrap;
        `;
        copyBtn.addEventListener('mouseenter', () => {
            copyBtn.style.background = '#fff';
            copyBtn.style.transform = 'scale(1.05)';
        });
        copyBtn.addEventListener('mouseleave', () => {
            copyBtn.style.background = 'rgba(255,255,255,0.95)';
            copyBtn.style.transform = 'scale(1)';
        });
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(data);
        });

        let downloadBtn = document.createElement('button');
        downloadBtn.textContent = ' 下载';
        downloadBtn.style.cssText = `
            padding: 4px 12px;
            background: rgba(255,255,255,0.95);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            color: #333;
            transition: all 0.2s;
            white-space: nowrap;
        `;
        downloadBtn.addEventListener('mouseenter', () => {
            downloadBtn.style.background = '#fff';
            downloadBtn.style.transform = 'scale(1.05)';
        });
        downloadBtn.addEventListener('mouseleave', () => {
            downloadBtn.style.background = 'rgba(255,255,255,0.95)';
            downloadBtn.style.transform = 'scale(1)';
        });
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            downloadExcel(data, `透视表_${index + 1}_${timestamp}.xlsx`);
        });

        buttonGroup.appendChild(label);
        buttonGroup.appendChild(copyBtn);
        buttonGroup.appendChild(downloadBtn);

        document.body.appendChild(buttonGroup);
        actionButtons.push(buttonGroup);

        let rect = table.getBoundingClientRect();
        let pos = getSafePosition(buttonGroup, rect);
        buttonGroup.style.top = pos.top + 'px';
        buttonGroup.style.left = pos.left + 'px';

        let updatePos = () => {
            let r = table.getBoundingClientRect();
            let p = getSafePosition(buttonGroup, r);
            buttonGroup.style.top = p.top + 'px';
            buttonGroup.style.left = p.left + 'px';
        };
        window.addEventListener('scroll', updatePos, { passive: true });
        window.addEventListener('resize', updatePos, { passive: true });
    }

    /**
     * 扫描页面中所有表格并标注
     */
    function scanAndAnnotate() {
        actionButtons.forEach(btn => btn.remove());
        actionButtons = [];
        processedTables = new WeakSet();

        let tableIndex = 0;

        // 查找标准 <table> 元素，排除嵌套表格
        let allTables = document.querySelectorAll('table');
        let topLevelTables = Array.from(allTables).filter(t => {
            let parent = t.parentElement;
            while (parent) {
                if (parent.tagName === 'TABLE') return false;
                parent = parent.parentElement;
            }
            return true;
        });

        topLevelTables.forEach(table => {
            if (table.rows.length > 1 && table.innerText.trim().length > 0) {
                annotateTable(table, tableIndex);
                tableIndex++;
            }
        });

        // 查找钉钉AI表格的 DOM 结构
        if (tableIndex === 0) {
            let pivotContainers = document.querySelectorAll(
                '[class*="pivot"], [class*="Pivot"], [class*="perspective"], ' +
                '[data-type="pivot"], [class*="table-container"], ' +
                '.dingtalk-ai-table, .smart-table'
            );
            pivotContainers.forEach(container => {
                let gridRows = container.querySelectorAll(
                    '[class*="row"], [class*="Row"], [class*="cell"], [class*="Cell"]'
                );
                if (gridRows.length > 0) {
                    let data = parseGridToData(container);
                    if (data && data.length > 0) {
                        container.style.cssText += `
                            border: 2px solid #667eea !important;
                            padding: 8px;
                        `;

                        let buttonGroup = document.createElement('div');
                        buttonGroup.className = 'pivot-action-group';
                        buttonGroup.style.cssText = `
                            position: fixed;
                            z-index: 2147483647;
                            display: flex;
                            gap: 6px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            padding: 4px 8px;
                            border-radius: 6px;
                            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5);
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            pointer-events: auto;
                        `;

                        let label = document.createElement('span');
                        label.textContent = `表${tableIndex + 1} (${data.length}行×${data[0].length}列)`;
                        label.style.cssText = `
                            padding: 4px 8px;
                            color: white;
                            font-size: 11px;
                            font-weight: 500;
                            white-space: nowrap;
                            user-select: none;
                        `;

                        let copyBtn = document.createElement('button');
                        copyBtn.textContent = ' 复制';
                        copyBtn.style.cssText = `
                            padding: 4px 12px;
                            background: rgba(255,255,255,0.95);
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: 500;
                            color: #333;
                            white-space: nowrap;
                        `;
                        copyBtn.addEventListener('click', () => copyToClipboard(data));

                        let downloadBtn = document.createElement('button');
                        downloadBtn.textContent = ' 下载';
                        downloadBtn.style.cssText = `
                            padding: 4px 12px;
                            background: rgba(255,255,255,0.95);
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: 500;
                            color: #333;
                            white-space: nowrap;
                        `;
                        downloadBtn.addEventListener('click', () => {
                            let timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                            downloadExcel(data, `透视表_${tableIndex + 1}_${timestamp}.xlsx`);
                        });

                        buttonGroup.appendChild(label);
                        buttonGroup.appendChild(copyBtn);
                        buttonGroup.appendChild(downloadBtn);
                        document.body.appendChild(buttonGroup);
                        actionButtons.push(buttonGroup);

                        let rect = container.getBoundingClientRect();
                        buttonGroup.style.top = (rect.top + 8) + 'px';
                        buttonGroup.style.left = (rect.left + 8) + 'px';

                        let updatePos = () => {
                            let r = container.getBoundingClientRect();
                            buttonGroup.style.top = (r.top + 8) + 'px';
                            buttonGroup.style.left = (r.left + 8) + 'px';
                        };
                        window.addEventListener('scroll', updatePos, { passive: true });
                        window.addEventListener('resize', updatePos, { passive: true });

                        tableIndex++;
                    }
                }
            });
        }

        console.log(`[钉钉透视表工具] 检测到 ${tableIndex} 个表格`);
    }

    // ==================== 初始化 ====================

    setTimeout(scanAndAnnotate, 2000);

    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(scanAndAnnotate, 1500);
        }
    }).observe(document, { subtree: true, childList: true });

    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand(' 重新扫描表格', scanAndAnnotate);
    }

})();
