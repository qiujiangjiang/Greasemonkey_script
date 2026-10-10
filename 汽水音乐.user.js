// ==UserScript==
// @name         抖音音乐批量发行助手
// @namespace    douyin-batch-publish
// @version      1.1.0
// @description  在抖音音乐发行页(/console/complete-publish)批量上传歌曲并发布。支持点击「添加歌曲」添加多首、批量上传音频+歌词、自动填写专辑信息。
// @match        https://music.douyin.com/console/complete-publish*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    /* ============================================================
     * 工具函数
     * ============================================================ */
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const findByText = (selector, text, el = document) =>
        [...el.querySelectorAll(selector)].find(e => (e.textContent || '').trim() === text);
    const findByTextContains = (selector, text, el = document) =>
        [...el.querySelectorAll(selector)].find(e => (e.textContent || '').trim().includes(text));

    // 设置 input 的值（触发 React 事件）
    function setNativeValue(el, value) {
        if (!el) return;
        const win = el.ownerDocument.defaultView || window;
        const proto = el.tagName === 'TEXTAREA' ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
        if (descriptor?.set) {
            descriptor.set.call(el, value);
        } else {
            el.value = value;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 模拟文件上传（浏览器测试证实：基础方法即可成功）
    async function uploadFileToInput(file, inputEl) {
        if (!inputEl) throw new Error('找不到文件上传 input');

        const dt = new DataTransfer();
        dt.items.add(file);
        inputEl.files = dt.files;

        // 浏览器测试证实：只需触发 change 事件即可被 React 识别
        inputEl.dispatchEvent(new Event('change', {
            bubbles: true,
            cancelable: true
        }));
    }

    // 获取第 N 首歌曲的完整版音频上传 input
    // 策略：找到所有 audio file input，通过向上查找标题输入框确定所属歌曲，取每首的第一个（完整版）
    function getAudioInput(index) {
        // 1. 找到所有不含replace的audio input
        const allInputs = [...document.querySelectorAll('input[type="file"]')]
            .filter(f => {
                const cls = String(f.className || '');
                return f.accept?.includes('audio/') && !cls.includes('replace');
            });

        // 2. 为每个input确定所属歌曲索引（向上找包含songs[N][title]的祖先）
        const songMap = new Map(); // songIndex -> firstInput
        for (const inp of allInputs) {
            let el = inp;
            let songIndex = null;
            for (let i = 0; i < 10 && el; i++) {
                el = el.parentElement;
                if (el) {
                    const titleInput = el.querySelector('input[id^="songs["][id$="][title]"]');
                    if (titleInput) {
                        const match = titleInput.id.match(/songs\[(\d+)\]/);
                        if (match) {
                            songIndex = parseInt(match[1]);
                            break;
                        }
                    }
                }
            }
            if (songIndex !== null && !songMap.has(songIndex)) {
                songMap.set(songIndex, inp); // 每首歌曲取第一个（完整版）
            }
        }

        return songMap.get(index) || null;
    }

    /* ============================================================
     * 页面交互
     * ============================================================ */

    // 1. 选择「以下歌曲均使用AI创作」→「是」
    async function selectAICreation() {
        log('选择「以下歌曲均使用AI创作」→「是」...');
        // 找到「以下歌曲均使用AI创作」文字，然后找它后面最近的 radio group
        const labelEl = findByTextContains('*', '以下歌曲均使用AI创作');
        if (!labelEl) {
            log('⚠ 未找到「以下歌曲均使用AI创作」标签', 'warn');
            return false;
        }
        // 在 label 的父容器内找 radio
        const container = labelEl.closest('.douyin-music-form-field, [class*="form-field"]') || labelEl.parentElement;
        const radios = container ? container.querySelectorAll('input[type="radio"]') : [];
        // 找 label 文字为「是」的那个
        for (const radio of radios) {
            const radioLabel = radio.labels?.[0] || radio.closest('label') || radio.parentElement;
            const labelText = (radioLabel?.textContent || '').trim();
            if (labelText === '是' && !radio.checked) {
                radio.click();
                await sleep(300);
                log('已选择「是」');
                return true;
            }
        }
        log('⚠ 未找到或未选中「是」单选框', 'warn');
        return false;
    }

    // 2. 选择「使用的AI工具」→「其他」（如果当前不是「其他」）
    async function selectToolOther() {
        log('确认「使用的AI工具」为「其他」...');
        // 从扫描结果看，当前已选「其他」，但如果需要修改：
        // 这是一个自定义下拉组件，没有原生 select
        // 策略：找到显示当前选中值的元素，如果不是「其他」就点击打开下拉并选择
        const toolField = findByTextContains('*', '使用的AI工具')?.closest('.douyin-music-form-field, [class*="form-field"]');
        if (!toolField) {
            log('⚠ 未找到「使用的AI工具」字段', 'warn');
            return false;
        }
        // 找当前显示的文字
        const selectedText = toolField.querySelector('.douyin-music-select-selection-text, [class*="selection-text"]');
        if (selectedText && selectedText.textContent.trim() === '其他') {
            log('已经是「其他」，无需修改');
            return true;
        }
        // 需要点击打开下拉并选择「其他」
        const trigger = toolField.querySelector('.douyin-music-select, [role="combobox"], [class*="select"]');
        if (trigger) {
            trigger.click();
            await sleep(500);
            const otherOption = findByText('.douyin-music-select-option, [role="option"]', '其他');
            if (otherOption) {
                otherOption.click();
                await sleep(300);
                log('已选择「其他」');
                return true;
            }
        }
        log('⚠ 无法选择「其他」', 'warn');
        return false;
    }

    // 滚动页面到元素位置（确保虚拟滚动渲染）
    async function scrollToElement(el) {
        if (!el) return;
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
        await sleep(300);
    }

    async function scrollPageDown() {
        window.scrollTo(0, document.body.scrollHeight);
        await sleep(500);
    }

    // 3. 点击「添加歌曲」
    async function clickAddSong() {
        const btn = document.querySelector('.fYIL9');
        if (btn) {
            btn.click();
            await sleep(1000); // 等待新表单渲染
            // 滚动页面让新表单进入可视区域，确保按钮渲染到DOM
            await scrollToElement(btn);
            await scrollPageDown();
            return true;
        }
        log('⚠ 未找到「添加歌曲」按钮', 'warn');
        return false;
    }

    // 4. 填写一首歌曲
    async function fillSong(index, { audioFile, lyricFile, songName }) {
        log(`填写第 ${index + 1} 首: ${songName}`);

        // 4.1 上传完整版音频（直接操作 hidden input，不点击按钮，避免弹出文件对话框）
        const fullAudioInput = getAudioInput(index);
        if (fullAudioInput && audioFile) {
            await uploadFileToInput(audioFile, fullAudioInput);
            log(`  ✓ 已设置音频: ${audioFile.name}`);
            // 等待组件异步上传和UI更新
            await sleep(2000);
        } else if (audioFile) {
            log(`  ⚠ 找不到第 ${index + 1} 首的音频上传框`, 'warn');
        }

        // 4.2 填写歌曲名
        const titleInput = document.querySelector(`input[id="songs[${index}][title]"]`);
        if (titleInput && songName) {
            setNativeValue(titleInput, songName);
            await sleep(200);
        }

        // 4.3 填写歌词
        const lyricTextarea = document.querySelector(`textarea[id="songs[${index}][lyricText]"]`);
        if (lyricTextarea && lyricFile) {
            try {
                const content = await lyricFile.text();
                setNativeValue(lyricTextarea, content);
                log(`  ✓ 已填入歌词: ${lyricFile.name} (${content.length}字)`);
            } catch (e) {
                log(`  ⚠ 读取歌词失败: ${lyricFile.name}`, 'warn');
            }
            await sleep(200);
        }

        return true;
    }

    // 5. 填写专辑信息
    async function fillAlbumInfo(albumName, coverFile) {
        log('填写专辑信息...');
        // 专辑名称
        const albumInput = document.querySelector('input[id="album[albumName]"]');
        if (albumInput && albumName) {
            setNativeValue(albumInput, albumName);
            await sleep(200);
        }

        // 专辑封面上传（第6个 file input 或按 accept 筛选）
        if (coverFile) {
            const coverInputs = [...document.querySelectorAll('input[type="file"]')]
                .filter(f => f.accept && f.accept.includes('image'));
            if (coverInputs.length > 0) {
                await uploadFileToInput(coverFile, coverInputs[0]);
                log('  ✓ 已上传专辑封面');
                await sleep(1500);
            }
        }
    }

    // 6. 点击「下一步」
    async function clickNext() {
        const btn = findByText('button', '下一步');
        if (btn) {
            btn.click();
            log('已点击「下一步」');
            return true;
        }
        log('⚠ 未找到「下一步」按钮', 'warn');
        return false;
    }

    // 7. 点击「保存」
    async function clickSave() {
        const btn = findByText('button', '保存');
        if (btn) {
            btn.click();
            log('已点击「保存」');
            return true;
        }
        return false;
    }

    /* ============================================================
     * 文件配对
     * ============================================================ */
    function pairFiles(audioFiles, lyricFiles) {
        const lyricsMap = new Map();
        for (const f of lyricFiles) {
            const key = f.name.replace(/\.[^.]+$/, '').trim().toLowerCase();
            lyricsMap.set(key, f);
        }
        return audioFiles.map(audio => {
            const baseName = audio.name.replace(/\.[^.]+$/, '').trim();
            const key = baseName.toLowerCase();
            return {
                audioFile: audio,
                lyricFile: lyricsMap.get(key) || null,
                songName: baseName
            };
        });
    }

    /* ============================================================
     * 批量发布主流程
     * ============================================================ */
    const BATCH_SIZE = 10; // 每批最多10首（根据用户描述）

    async function batchPublish(audioFiles, lyricFiles, albumName, coverFile) {
        if (!audioFiles.length) { log('请先选择音频文件', 'error'); return; }

        const pairs = pairFiles(audioFiles, lyricFiles);
        log(`共 ${pairs.length} 首歌曲，每批最多 ${BATCH_SIZE} 首`);

        // 先处理创作方式（全局设置，每批只需做一次）
        await selectAICreation();
        await selectToolOther();
        await sleep(500);

        // 添加歌曲表单（默认已有1首，需要再添加 n-1 首）
        const needAdd = Math.max(0, pairs.length - 1);
        for (let i = 0; i < needAdd; i++) {
            const ok = await clickAddSong();
            if (!ok) {
                log(`添加第 ${i + 2} 首歌曲失败，停止`, 'error');
                return;
            }
        }
        log(`已添加 ${needAdd} 首歌曲，共 ${pairs.length} 首表单`);
        await sleep(1000);

        // 填写每首歌曲
        for (let i = 0; i < pairs.length; i++) {
            await fillSong(i, pairs[i]);
            await sleep(300);
        }

        // 填写专辑信息
        await fillAlbumInfo(albumName || `专辑 ${new Date().toLocaleDateString()}`, coverFile);

        // 保存或下一步
        log('所有信息已填写完成，请检查无误后手动点击「下一步」或「保存」');
        // 如需自动提交，取消下面注释：
        // await sleep(1000);
        // await clickNext();
    }

    /* ============================================================
     * UI 面板
     * ============================================================ */
    let logEl = null;
    function log(msg, type = 'info') {
        console.log(`[批量发行] ${msg}`);
        if (logEl) {
            const div = document.createElement('div');
            div.style.cssText = `padding:2px 0;border-bottom:1px solid #333;font-size:12px;${
                type === 'error' ? 'color:#ff6b6b;' :
                type === 'warn' ? 'color:#ffd93d;' :
                type === 'success' ? 'color:#6bcb77;' : 'color:#ccc;'
            }`;
            div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
            logEl.appendChild(div);
            logEl.scrollTop = logEl.scrollHeight;
        }
    }

    function createPanel() {
        if ($('#dbp-panel')) return;

        GM_addStyle(`
            #dbp-panel { position:fixed; top:80px; right:20px; width:380px; background:#1a1a2e; color:#eee; border:1px solid #333; border-radius:8px; z-index:999999; font-family:system-ui,-apple-system,sans-serif; font-size:13px; box-shadow:0 8px 32px rgba(0,0,0,0.4); }
            #dbp-panel .dbp-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#16213e; border-radius:8px 8px 0 0; font-weight:bold; }
            #dbp-panel .dbp-body { padding:12px 14px; max-height:420px; overflow-y:auto; }
            #dbp-panel .dbp-row { margin:8px 0; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
            #dbp-panel button { padding:6px 14px; background:#0f3460; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:12px; }
            #dbp-panel button:hover { background:#1a4a7a; }
            #dbp-panel button:disabled { background:#444; cursor:not-allowed; }
            #dbp-panel .dbp-file-btn { background:#533483; }
            #dbp-panel .dbp-start { background:#e94560; font-size:13px; padding:8px 20px; }
            #dbp-panel .dbp-log { max-height:180px; overflow-y:auto; background:#0f0f23; padding:8px; border-radius:4px; font-size:11px; margin-top:10px; }
            #dbp-panel input[type="text"] { background:#0f0f23; color:#fff; border:1px solid #444; border-radius:4px; padding:4px 8px; font-size:12px; width:140px; }
        `);

        const panel = document.createElement('div');
        panel.id = 'dbp-panel';
        panel.innerHTML = `
            <div class="dbp-header">
                <span>🎵 抖音批量发行助手 v1.1</span>
                <span style="cursor:pointer;font-size:16px;" id="dbp-close">×</span>
            </div>
            <div class="dbp-body">
                <div class="dbp-row">
                    <button class="dbp-file-btn" id="dbp-audio-btn">📁 音频(.wav/.mp3)</button>
                    <span id="dbp-audio-count">0 首</span>
                </div>
                <div class="dbp-row">
                    <button class="dbp-file-btn" id="dbp-lyric-btn">📄 歌词(.txt/.lrc)</button>
                    <span id="dbp-lyric-count">0 个</span>
                </div>
                <div class="dbp-row">
                    <label>专辑名:</label>
                    <input type="text" id="dbp-album-name" placeholder="留空自动生成">
                </div>
                <div class="dbp-row">
                    <button class="dbp-file-btn" id="dbp-cover-btn">🖼 专辑封面</button>
                    <span id="dbp-cover-name">未选择</span>
                </div>
                <div class="dbp-row">
                    <button class="dbp-start" id="dbp-start">▶ 开始批量填写</button>
                </div>
                <div class="dbp-log" id="dbp-log"></div>
            </div>
        `;
        document.body.appendChild(panel);

        logEl = $('#dbp-log');
        $('#dbp-close').addEventListener('click', () => panel.remove());

        // 文件选择器
        const audioInput = document.createElement('input');
        audioInput.type = 'file'; audioInput.multiple = true; audioInput.accept = 'audio/*';
        audioInput.style.display = 'none'; panel.appendChild(audioInput);

        const lyricInput = document.createElement('input');
        lyricInput.type = 'file'; lyricInput.multiple = true; lyricInput.accept = '.txt,.lrc';
        lyricInput.style.display = 'none'; panel.appendChild(lyricInput);

        const coverInput = document.createElement('input');
        coverInput.type = 'file'; coverInput.accept = 'image/*';
        coverInput.style.display = 'none'; panel.appendChild(coverInput);

        let audioFiles = [];
        let lyricFiles = [];
        let coverFile = null;

        $('#dbp-audio-btn').addEventListener('click', () => audioInput.click());
        audioInput.addEventListener('change', () => {
            audioFiles = Array.from(audioInput.files);
            $('#dbp-audio-count').textContent = `${audioFiles.length} 首`;
            log(`已选择 ${audioFiles.length} 首音频`);
        });

        $('#dbp-lyric-btn').addEventListener('click', () => lyricInput.click());
        lyricInput.addEventListener('change', () => {
            lyricFiles = Array.from(lyricInput.files);
            $('#dbp-lyric-count').textContent = `${lyricFiles.length} 个`;
            log(`已选择 ${lyricFiles.length} 个歌词文件`);
        });

        $('#dbp-cover-btn').addEventListener('click', () => coverInput.click());
        coverInput.addEventListener('change', () => {
            coverFile = coverInput.files[0] || null;
            $('#dbp-cover-name').textContent = coverFile ? coverFile.name : '未选择';
            log(coverFile ? `已选择封面: ${coverFile.name}` : '取消选择封面');
        });

        $('#dbp-start').addEventListener('click', async () => {
            if (!audioFiles.length) { log('请先选择音频文件', 'error'); return; }
            const albumName = $('#dbp-album-name').value.trim();
            $('#dbp-start').disabled = true;
            try {
                await batchPublish(audioFiles, lyricFiles, albumName || null, coverFile);
            } catch (e) {
                log(`❌ 错误: ${e.message}`, 'error');
                console.error(e);
            } finally {
                $('#dbp-start').disabled = false;
            }
        });

        log('面板已加载。请选择音频和歌词文件，然后点击「开始批量填写」。');
    }

    /* ============================================================
     * 启动
     * ============================================================ */
    if (location.href.includes('complete-publish')) {
        const timer = setInterval(() => {
            if (document.body && document.body.children.length > 2) {
                clearInterval(timer);
                createPanel();
            }
        }, 500);
        setTimeout(() => clearInterval(timer), 15000);
    }
})();
