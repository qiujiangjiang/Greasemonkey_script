// ==UserScript==
// @name         Galaxy 广告数据看板 - 小红书账户日报（高级版）
// @namespace    http://tampermonkey.net/*
// @version      2.0
// @description  支持自定义规则汇总、配置持久化、定时刷新、多Tab看板、多页面互斥
// @author       qjj
// @match        https://galaxy.alibaba-inc.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ==================== 常量 ====================
  const CONFIG_KEY = 'gm_galaxy_dashboard_config_v2';
  const DATA_CACHE_KEY = 'gm_galaxy_dashboard_data_cache';
  const MASTER_LOCK_KEY = 'gm_galaxy_dashboard_master_lock';
  const TAB_ID = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const HEARTBEAT_MS = 5000;
  const LOCK_TTL_MS = 15000;

  // ==================== 默认配置 ====================
  function getDefaultConfig() {
    return {
      version: 2,
      refreshIntervalMinutes: 10,
      defaultDateMode: 'today',      // today | yesterday | custom
      customStartDate: '',
      customEndDate: '',
      empName: '仇江江',
      accountIdList: ['11734921', '11738145'],
      rules: [
        { id: 'r1', name: '搜索计划汇总', matchType: 'nameContains', matchValue: '搜索' },
        { id: 'r2', name: '信息流计划汇总', matchType: 'nameContains', matchValue: '信息流' },
        { id: 'r3', name: '全部账户', matchType: 'all', matchValue: '' }
      ]
    };
  }

  // ==================== 配置管理 ====================
  function loadConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // 合并默认值，防止升级后缺字段
        return { ...getDefaultConfig(), ...parsed };
      }
    } catch (e) { console.error('[GalaxyDashboard] loadConfig error', e); }
    return getDefaultConfig();
  }

  function saveConfig(cfg) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }

  let config = loadConfig();

  // ==================== 状态 ====================
  let isMaster = false;
  let refreshTimer = null;
  let heartbeatTimer = null;
  let lockCheckTimer = null;
  let currentTab = 'composite';   // composite | raw
  let currentViewMode = 'dashboard'; // dashboard | config
  let lastFetchMeta = null;       // {startTime, endTime, ts}
  let cachedRawData = [];         // 最后一次获取的原始数据

  // ==================== 工具函数 ====================
  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const fmtNum = (n) => {
    if (n === undefined || n === null || n === '' || isNaN(n)) return '-';
    const num = Number(n);
    if (num === 0) return '0';
    if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿';
    if (num >= 10000) return (num / 10000).toFixed(2) + '万';
    if (num % 1 === 0) return num.toLocaleString();
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };
  const fmtMoney = (n) => {
    if (n === undefined || n === null || n === '' || isNaN(n)) return '-';
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const calcMetrics = (row) => {
    const imp = Number(row.impression) || 0;
    const clk = Number(row.click) || 0;
    const cost = Number(row.cost) || 0;
    const wup = Number(row.wakeupPv) || 0;
    const ent = Number(row.enterShopPv) || 0;
    const sea = Number(row.searchPv) || 0;
    return {
      ctr: imp > 0 ? (clk / imp * 100).toFixed(2) + '%' : '-',
      cpm: imp > 0 ? (cost / imp * 1000).toFixed(2) : '-',
      wakeupCost: wup > 0 ? (cost / wup).toFixed(2) : '-',
      enterCost: ent > 0 ? (cost / ent).toFixed(2) : '-',
      searchCost: sea > 0 ? (cost / sea).toFixed(2) : '-'
    };
  };

  // ==================== 日期策略 ====================
  function getDefaultDateRange() {
    const today = getToday();
    switch (config.defaultDateMode) {
      case 'yesterday':
        return { startTime: getYesterday(), endTime: getYesterday() };
      case 'custom':
        return {
          startTime: config.customStartDate || today,
          endTime: config.customEndDate || today
        };
      case 'today':
      default:
        return { startTime: today, endTime: today };
    }
  }

  // ==================== 多页面互斥（Master 选举）====================
  function updateLock() {
    if (!isMaster) return;
    localStorage.setItem(MASTER_LOCK_KEY, JSON.stringify({ tabId: TAB_ID, ts: Date.now() }));
  }

  function tryBecomeMaster() {
    if (isMaster) return;
    const raw = localStorage.getItem(MASTER_LOCK_KEY);
    const lock = raw ? JSON.parse(raw) : null;
    const now = Date.now();
    if (!lock || now - lock.ts > LOCK_TTL_MS) {
      localStorage.setItem(MASTER_LOCK_KEY, JSON.stringify({ tabId: TAB_ID, ts: now }));
      setTimeout(() => {
        const cur = JSON.parse(localStorage.getItem(MASTER_LOCK_KEY) || 'null');
        if (cur && cur.tabId === TAB_ID) {
          isMaster = true;
          startAutoRefresh();
          updateStatusBadge('🟢 主窗口（自动刷新中）');
        }
      }, 100);
    }
  }

  function releaseMaster() {
    if (!isMaster) return;
    const lock = JSON.parse(localStorage.getItem(MASTER_LOCK_KEY) || 'null');
    if (lock && lock.tabId === TAB_ID) {
      localStorage.removeItem(MASTER_LOCK_KEY);
    }
    isMaster = false;
    stopAutoRefresh();
    updateStatusBadge('⚪ 从窗口');
  }

  function initMasterElection() {
    // 定期检查锁状态
    lockCheckTimer = setInterval(() => {
      if (isMaster) {
        updateLock();
      } else {
        tryBecomeMaster();
      }
    }, HEARTBEAT_MS);

    // 监听其他页面释放锁
    window.addEventListener('storage', (e) => {
      if (e.key === MASTER_LOCK_KEY) {
        const newLock = e.newValue ? JSON.parse(e.newValue) : null;
        if (!newLock) {
          // 锁被释放了，尝试竞选
          setTimeout(tryBecomeMaster, 200);
        } else if (newLock.tabId !== TAB_ID && isMaster) {
          // 异常情况：有别人抢到了锁，我退位
          isMaster = false;
          stopAutoRefresh();
          updateStatusBadge('⚪ 从窗口');
        }
      }
      if (e.key === DATA_CACHE_KEY) {
        // 其他页面广播了新数据
        const wrapped = e.newValue ? JSON.parse(e.newValue) : null;
        if (wrapped && wrapped.tabId !== TAB_ID) {
          cachedRawData = wrapped.payload || [];
          lastFetchMeta = wrapped.meta || null;
          if (currentViewMode === 'dashboard') {
            renderDashboard();
          }
          updateStatusBadge(isMaster ? '🟢 主窗口（自动刷新中）' : '⚪ 从窗口（已同步）');
        }
      }
    });

    // 页面关闭前释放锁
    window.addEventListener('beforeunload', () => {
      releaseMaster();
    });

    // 首次尝试竞选
    setTimeout(tryBecomeMaster, 500);
  }

  // ==================== 数据获取 ====================
  async function doFetch(range) {
    const body = {
      media: 'RED_BOOK',
      pageSize: 100,
      startTime: range.startTime,
      endTime: range.endTime,
      pageNo: 1,
      //empName: config.empName,
      accountIdList: config.accountIdList
    };

    const res = await fetch('https://galaxy.alibaba-inc.com/ad/manage/account', {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'appname': 'adcontent-op',
        'bx-v': '2.5.37',
        'content-type': 'application/json',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
      },
      referrer: 'https://galaxy.alibaba-inc.com/',
      body: JSON.stringify(body),
      method: 'POST',
      mode: 'cors',
      credentials: 'include'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.msgInfo || data.msgCode || '接口返回失败');
    return data.model?.result || [];
  }

  function broadcastData(rawData, meta) {
    localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
      tabId: TAB_ID,
      ts: Date.now(),
      payload: rawData,
      meta: meta
    }));
  }

  // ==================== 定时刷新 ====================
  function startAutoRefresh() {
    stopAutoRefresh();
    const ms = Math.max(10000, (config.refreshIntervalMinutes || 10) * 60 * 1000);
    refreshTimer = setInterval(() => {
      onAutoRefreshTick();
    }, ms);
    console.log(`[GalaxyDashboard] Master auto refresh started: ${ms}ms`);
  }

  function stopAutoRefresh() {
    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  }

  async function onAutoRefreshTick() {
    if (!isMaster) return;
    console.log('[GalaxyDashboard] Auto refresh tick');
    // 自动刷新时，强制使用默认日期策略（恢复当天）
    const range = getDefaultDateRange();
    await executeFetch(range, true);
  }

  async function executeFetch(range, isAuto = false) {
    const statusEl = document.getElementById('gm-gd-status');
    if (statusEl && !isAuto) {
      statusEl.innerHTML = '<span style="color:#165dff;">⏳ 正在获取数据...</span>';
      statusEl.style.display = 'block';
    }

    try {
      const raw = await doFetch(range);
      cachedRawData = raw;
      lastFetchMeta = { ...range, ts: Date.now(), isAuto };

      // 广播给其他页面
      broadcastData(raw, lastFetchMeta);

      // 更新本页 UI
      if (currentViewMode === 'dashboard') {
        renderDashboard();
      }
      if (statusEl && !isAuto) statusEl.style.display = 'none';
      updateStatusBadge(isMaster ? '🟢 主窗口（自动刷新中）' : '🔵 手动刷新');
    } catch (err) {
      console.error('[GalaxyDashboard] fetch error', err);
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#f53f3f;">❌ ${err.message}</span>
          <div style="margin-top:6px;font-size:12px;color:#86909c;">请确认已登录且 Cookie 有效</div>`;
        statusEl.style.display = 'block';
      }
    }
  }

  // ==================== 规则引擎 ====================
  function matchRule(item, rule) {
    switch (rule.matchType) {
      case 'nameContains':
        return (item.accountName || '').includes(rule.matchValue);
      case 'nameEquals':
        return item.accountName === rule.matchValue;
      case 'idEquals':
        return String(item.accountId) === String(rule.matchValue);
      case 'idIn': {
        const ids = String(rule.matchValue).split(/[,，]/).map(s => s.trim()).filter(Boolean);
        return ids.includes(String(item.accountId));
      }
      case 'all':
      default:
        return true;
    }
  }

  function processByRules(rawList) {
    const fields = ['impression', 'click', 'cost', 'wakeupPv', 'enterShopPv', 'searchPv'];
    const groups = config.rules.map(rule => ({
      ruleId: rule.id,
      ruleName: rule.name,
      matchType: rule.matchType,
      items: [],
      impression: 0, click: 0, cost: 0,
      wakeupPv: 0, enterShopPv: 0, searchPv: 0
    }));

    rawList.forEach(item => {
      groups.forEach(g => {
        const rule = config.rules.find(r => r.id === g.ruleId);
        if (rule && matchRule(item, rule)) {
          g.items.push(item);
          fields.forEach(f => { g[f] += Number(item[f]) || 0; });
        }
      });
    });

    groups.forEach(g => { g.metrics = calcMetrics(g); });
    return groups;
  }

  // ==================== UI 构建 ====================
  function updateStatusBadge(text) {
    const el = document.getElementById('gm-gd-status-badge');
    if (el) el.textContent = text;
  }

  function initUI() {
    if (document.getElementById('gm-galaxy-dashboard')) return;

    const panel = document.createElement('div');
    panel.id = 'gm-galaxy-dashboard';
    panel.innerHTML = `
      <div class="gm-gd-header" id="gm-gd-header">
        <div class="gm-gd-title">📊 Galaxy 广告数据看板</div>
        <div class="gm-gd-subtitle">
          <span id="gm-gd-status-badge">⚪ 初始化中...</span>
          <span id="gm-gd-last-time" style="margin-left:8px;opacity:.8;"></span>
        </div>
        <div class="gm-gd-actions">
          <button id="gm-gd-btn-refresh" class="gm-gd-btn" title="使用当前日期选择器范围手动刷新">🔄 刷新</button>
          <button id="gm-gd-btn-config" class="gm-gd-btn gm-gd-btn-sec">⚙️ 配置</button>
          <button id="gm-gd-btn-fold" class="gm-gd-btn gm-gd-btn-sec">折叠</button>
        </div>
      </div>
      <div class="gm-gd-body" id="gm-gd-body"></div>
    `;

    const css = document.createElement('style');
    css.textContent = `
      #gm-galaxy-dashboard {
        position: fixed;
        top: 56px; right: 20px;
        width: 1150px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 80px);
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        z-index: 99999;
        font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
        font-size: 13px;
        color: #1f2329;
        overflow: hidden;
        display: flex; flex-direction: column;
        border: 1px solid #e5e6eb;
      }
      #gm-galaxy-dashboard.gm-gd-collapsed .gm-gd-body { display: none; }
      .gm-gd-header {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 14px;
        background: linear-gradient(90deg, #165dff 0%, #6aa1ff 100%);
        color: #fff; cursor: move; user-select: none;
      }
      .gm-gd-title { font-size: 15px; font-weight: 700; white-space: nowrap; }
      .gm-gd-subtitle { font-size: 11px; opacity: .95; margin-left: 4px; flex: 1; }
      .gm-gd-actions { display: flex; gap: 6px; }
      .gm-gd-btn {
        border: none; background: rgba(255,255,255,0.2); color: #fff;
        padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;
      }
      .gm-gd-btn:hover { background: rgba(255,255,255,0.35); }
      .gm-gd-btn-sec { background: rgba(255,255,255,0.12); }
      .gm-gd-body { padding: 12px 14px; overflow: auto; flex: 1; }

      /* Tab */
      .gm-gd-tabs { display: flex; gap: 4px; margin-bottom: 10px; border-bottom: 1px solid #e5e6eb; padding-bottom: 6px; }
      .gm-gd-tab { padding: 5px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #4e5969; border: none; background: transparent; }
      .gm-gd-tab:hover { background: #f2f3f5; }
      .gm-gd-tab.active { background: #e8f3ff; color: #165dff; font-weight: 600; }

      /* 日期栏 */
      .gm-gd-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
      .gm-gd-bar label { color: #4e5969; font-size: 12px; }
      .gm-gd-bar input { border: 1px solid #d9d9d9; border-radius: 6px; padding: 4px 8px; font-size: 12px; }
      .gm-gd-bar .gm-gd-hint { color: #86909c; font-size: 11px; margin-left: auto; }

      /* 表格 */
      .gm-gd-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .gm-gd-table th { background: #f2f3f5; color: #4e5969; font-weight: 600; padding: 9px 7px; text-align: right; white-space: nowrap; position: sticky; top: 0; }
      .gm-gd-table th:first-child, .gm-gd-table th:nth-child(2) { text-align: left; }
      .gm-gd-table td { padding: 9px 7px; border-bottom: 1px solid #e5e6eb; text-align: right; white-space: nowrap; }
      .gm-gd-table td:first-child, .gm-gd-table td:nth-child(2) { text-align: left; }
      .gm-gd-table tbody tr:hover { background: #f7f8fa; }
      .gm-gd-table .gm-gd-total { background: #fff7e6 !important; font-weight: 600; color: #d46b08; }
      .gm-gd-table .gm-gd-total td { border-top: 2px solid #ffbb52; }
      .gm-gd-num { font-family: "SF Mono", Monaco, "Cascadia Code", monospace; }
      .gm-gd-status { padding: 24px; text-align: center; color: #86909c; }

      /* 配置页 */
      .gm-gd-config-section { margin-bottom: 16px; }
      .gm-gd-config-section h4 { margin: 0 0 8px; font-size: 13px; color: #1f2329; border-left: 3px solid #165dff; padding-left: 8px; }
      .gm-gd-form-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
      .gm-gd-form-row label { min-width: 90px; color: #4e5969; font-size: 12px; text-align: right; }
      .gm-gd-form-row input, .gm-gd-form-row select { border: 1px solid #d9d9d9; border-radius: 6px; padding: 5px 8px; font-size: 12px; min-width: 160px; }
      .gm-gd-form-row input[type="number"] { min-width: 80px; }
      .gm-gd-rules-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px; }
      .gm-gd-rules-table th { background: #f7f8fa; padding: 7px; text-align: left; font-weight: 600; color: #4e5969; border-bottom: 1px solid #e5e6eb; }
      .gm-gd-rules-table td { padding: 6px 7px; border-bottom: 1px solid #f2f3f5; }
      .gm-gd-rules-table input, .gm-gd-rules-table select { border: 1px solid #d9d9d9; border-radius: 4px; padding: 4px 6px; font-size: 12px; width: 100%; box-sizing: border-box; }
      .gm-gd-btn-danger { color: #f53f3f; border: none; background: transparent; cursor: pointer; font-size: 12px; }
      .gm-gd-btn-danger:hover { background: #fff2f0; border-radius: 4px; }
      .gm-gd-btn-add { color: #165dff; border: 1px dashed #165dff; background: #fff; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-top: 6px; }
      .gm-gd-btn-add:hover { background: #e8f3ff; }
      .gm-gd-btn-save { background: #165dff; color: #fff; border: none; padding: 6px 18px; border-radius: 6px; cursor: pointer; font-size: 13px; }
      .gm-gd-btn-save:hover { background: #1256d9; }
    `;
    document.head.appendChild(css);
    document.body.appendChild(panel);

    // 拖拽
    let drag = false, sx, sy, sl, st;
    const header = panel.querySelector('.gm-gd-header');
    header.addEventListener('mousedown', e => {
      drag = true; sx = e.clientX; sy = e.clientY;
      const r = panel.getBoundingClientRect();
      sl = r.left; st = r.top;
      panel.style.transition = 'none';
    });
    document.addEventListener('mousemove', e => {
      if (!drag) return;
      panel.style.left = (sl + e.clientX - sx) + 'px';
      panel.style.top = (st + e.clientY - sy) + 'px';
      panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => { drag = false; panel.style.transition = ''; });

    // 事件绑定
    document.getElementById('gm-gd-btn-refresh').addEventListener('click', () => {
      // 手动刷新：使用页面上日期选择器的当前值
      const s = document.getElementById('gm-gd-date-start')?.value || getToday();
      const e = document.getElementById('gm-gd-date-end')?.value || getToday();
      executeFetch({ startTime: s, endTime: e }, false);
    });
    document.getElementById('gm-gd-btn-config').addEventListener('click', () => {
      currentViewMode = currentViewMode === 'config' ? 'dashboard' : 'config';
      renderBody();
    });
    document.getElementById('gm-gd-btn-fold').addEventListener('click', () => {
      panel.classList.toggle('gm-gd-collapsed');
    });

    renderBody();
  }

  function renderBody() {
    const body = document.getElementById('gm-gd-body');
    if (currentViewMode === 'config') {
      body.innerHTML = '';
      body.appendChild(buildConfigPage());
    } else {
      body.innerHTML = '';
      body.appendChild(buildDashboardPage());
      renderDashboard();
    }
  }

  // ==================== Dashboard 页面 ====================
  function buildDashboardPage() {
    const wrap = document.createElement('div');
    const today = getToday();
    wrap.innerHTML = `
      <div class="gm-gd-tabs">
        <button class="gm-gd-tab ${currentTab === 'composite' ? 'active' : ''}" data-tab="composite">📈 复合视图（按规则汇总）</button>
        <button class="gm-gd-tab ${currentTab === 'raw' ? 'active' : ''}" data-tab="raw">📋 原始明细</button>
      </div>
      <div class="gm-gd-bar">
        <label>开始日期</label><input type="date" id="gm-gd-date-start" value="${today}">
        <label>结束日期</label><input type="date" id="gm-gd-date-end" value="${today}">
        <span class="gm-gd-hint">
          💡 手动改日期后点"刷新"可查历史；定时刷新会自动恢复为<strong>${config.defaultDateMode === 'today' ? '今天' : config.defaultDateMode === 'yesterday' ? '昨天' : '自定义默认'}</strong>
        </span>
      </div>
      <div id="gm-gd-status" class="gm-gd-status" style="display:none;"></div>
      <div id="gm-gd-content"></div>
    `;
    wrap.querySelectorAll('.gm-gd-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        renderDashboard();
        // 重新渲染 tab 样式
        wrap.querySelectorAll('.gm-gd-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === currentTab));
      });
    });
    return wrap;
  }

  function renderDashboard() {
    const content = document.getElementById('gm-gd-content');
    const status = document.getElementById('gm-gd-status');
    const timeEl = document.getElementById('gm-gd-last-time');
    if (!content) return;

    if (!cachedRawData || cachedRawData.length === 0) {
      content.innerHTML = '';
      if (status) {
        status.style.display = 'block';
        status.innerHTML = '暂无数据，点击右上角"🔄 刷新"获取当日数据';
      }
      return;
    }
    if (status) status.style.display = 'none';
    if (timeEl && lastFetchMeta) {
      const d = new Date(lastFetchMeta.ts);
      timeEl.textContent = `更新于 ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    }

    if (currentTab === 'composite') {
      content.innerHTML = '';
      content.appendChild(renderCompositeTable());
    } else {
      content.innerHTML = '';
      content.appendChild(renderRawTable());
    }
  }

  function renderCompositeTable() {
    const groups = processByRules(cachedRawData);
    const div = document.createElement('div');
    let html = `<table class="gm-gd-table"><thead><tr>
      <th>规则名称</th><th>记录数</th>
      <th>曝光</th><th>点击</th><th>消耗(元)</th>
      <th>唤端PV</th><th>进店PV</th><th>搜索PV</th>
      <th>CTR</th><th>CPM</th><th>唤端成本</th><th>进店成本</th><th>搜索成本</th>
    </tr></thead><tbody>`;

    groups.forEach(g => {
      const m = g.metrics;
      html += `<tr>
        <td><strong>${g.ruleName}</strong><span style="color:#86909c;font-size:11px;margin-left:6px;">${g.matchType}</span></td>
        <td>${g.items.length}</td>
        <td class="gm-gd-num">${fmtNum(g.impression)}</td>
        <td class="gm-gd-num">${fmtNum(g.click)}</td>
        <td class="gm-gd-num" style="color:#d46b08;font-weight:600;">${fmtMoney(g.cost)}</td>
        <td class="gm-gd-num">${fmtNum(g.wakeupPv)}</td>
        <td class="gm-gd-num">${fmtNum(g.enterShopPv)}</td>
        <td class="gm-gd-num">${fmtNum(g.searchPv)}</td>
        <td class="gm-gd-num">${m.ctr}</td>
        <td class="gm-gd-num">${m.cpm}</td>
        <td class="gm-gd-num">${m.wakeupCost}</td>
        <td class="gm-gd-num">${m.enterCost}</td>
        <td class="gm-gd-num">${m.searchCost}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    div.innerHTML = html;
    return div;
  }

  function renderRawTable() {
    const div = document.createElement('div');
    const fields = ['accountName','accountId','empName','impression','click','cost','interaction','searchPv','wakeupPv','enterShopPv','payPv','payAmount','ctr','cpc','cpm','statusDesc','createTime'];
    const titles = {accountName:'账号名称',accountId:'账号ID',empName:'负责人',impression:'曝光',click:'点击',cost:'消耗',interaction:'互动',searchPv:'搜索PV',wakeupPv:'唤端PV',enterShopPv:'进店PV',payPv:'支付PV',payAmount:'支付金额',ctr:'CTR',cpc:'CPC',cpm:'CPM',statusDesc:'状态',createTime:'创建时间'};

    let html = `<div style="overflow:auto;"><table class="gm-gd-table"><thead><tr>`;
    fields.forEach(f => { html += `<th>${titles[f] || f}</th>`; });
    html += `</tr></thead><tbody>`;

    cachedRawData.forEach(item => {
      html += `<tr>`;
      fields.forEach(f => {
        let val = item[f];
        if (val === null || val === undefined || val === '') val = '-';
        if (['impression','click','cost','interaction','searchPv','wakeupPv','enterShopPv','payPv','payAmount'].includes(f)) {
          val = f === 'cost' || f === 'payAmount' ? fmtMoney(val) : fmtNum(val);
          html += `<td class="gm-gd-num">${val}</td>`;
        } else {
          html += `<td>${val}</td>`;
        }
      });
      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    div.innerHTML = html;
    return div;
  }

  // ==================== 配置页面 ====================
  function buildConfigPage() {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:15px;">⚙️ 配置中心</h3>
        <div>
          <button id="gm-gd-cfg-save" class="gm-gd-btn-save">💾 保存配置</button>
          <button id="gm-gd-cfg-back" class="gm-gd-btn" style="margin-left:8px;background:#f2f3f5;color:#4e5969;">↩️ 返回看板</button>
        </div>
      </div>

      <div class="gm-gd-config-section">
        <h4>基础设置</h4>
        <div class="gm-gd-form-row">
          <label>自动刷新间隔</label>
          <input type="number" id="cfg-interval" value="${config.refreshIntervalMinutes}" min="1" max="1440"> 分钟
        </div>
        <div class="gm-gd-form-row">
          <label>默认日期策略</label>
          <select id="cfg-date-mode">
            <option value="today" ${config.defaultDateMode === 'today' ? 'selected' : ''}>当天（每次刷新恢复）</option>
            <option value="yesterday" ${config.defaultDateMode === 'yesterday' ? 'selected' : ''}>昨天</option>
            <option value="custom" ${config.defaultDateMode === 'custom' ? 'selected' : ''}>自定义固定范围</option>
          </select>
        </div>
        <div class="gm-gd-form-row" id="cfg-custom-date-row" style="${config.defaultDateMode !== 'custom' ? 'display:none;' : ''}">
          <label>自定义范围</label>
          <input type="date" id="cfg-custom-start" value="${config.customStartDate}"> 至
          <input type="date" id="cfg-custom-end" value="${config.customEndDate}">
        </div>
      </div>

      <div class="gm-gd-config-section">
        <h4>汇总规则（按顺序匹配，一条记录可命中多条规则）</h4>
        <table class="gm-gd-rules-table">
          <thead><tr>
            <th style="width:160px;">规则名称</th>
            <th style="width:130px;">匹配类型</th>
            <th style="width:200px;">匹配值</th>
            <th style="width:50px;">操作</th>
          </tr></thead>
          <tbody id="cfg-rules-tbody"></tbody>
        </table>
        <button id="cfg-add-rule" class="gm-gd-btn-add">+ 添加规则</button>
      </div>

      <div class="gm-gd-config-section">
        <h4>查询参数</h4>
        <div class="gm-gd-form-row">
          <label>负责人</label>
          <input type="text" id="cfg-empName" value="${config.empName}">
        </div>
        <div class="gm-gd-form-row">
          <label>账号ID列表</label>
          <input type="text" id="cfg-accountIds" value="${config.accountIdList.join(',')}" placeholder="逗号分隔，如 11734921,11738145">
        </div>
      </div>
    `;

    // 渲染规则列表
    const tbody = div.querySelector('#cfg-rules-tbody');
    function renderRuleRows() {
      tbody.innerHTML = '';
      config.rules.forEach((rule, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input type="text" class="cfg-r-name" data-idx="${idx}" value="${rule.name}"></td>
          <td>
            <select class="cfg-r-type" data-idx="${idx}">
              <option value="nameContains" ${rule.matchType === 'nameContains' ? 'selected' : ''}>名称包含</option>
              <option value="nameEquals" ${rule.matchType === 'nameEquals' ? 'selected' : ''}>名称等于</option>
              <option value="idEquals" ${rule.matchType === 'idEquals' ? 'selected' : ''}>ID 等于</option>
              <option value="idIn" ${rule.matchType === 'idIn' ? 'selected' : ''}>ID 在列表中</option>
              <option value="all" ${rule.matchType === 'all' ? 'selected' : ''}>全部匹配</option>
            </select>
          </td>
          <td><input type="text" class="cfg-r-val" data-idx="${idx}" value="${rule.matchValue}" placeholder="${rule.matchType === 'all' ? '无需填写' : ''}"></td>
          <td><button class="gm-gd-btn-danger cfg-r-del" data-idx="${idx}">删除</button></td>
        `;
        tbody.appendChild(tr);
      });

      // 绑定删除
      tbody.querySelectorAll('.cfg-r-del').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx);
          config.rules.splice(idx, 1);
          renderRuleRows();
        });
      });
    }
    renderRuleRows();

    // 事件
    div.querySelector('#cfg-add-rule').addEventListener('click', () => {
      config.rules.push({ id: 'r' + Date.now(), name: '新规则', matchType: 'nameContains', matchValue: '' });
      renderRuleRows();
    });

    div.querySelector('#cfg-date-mode').addEventListener('change', (e) => {
      div.querySelector('#cfg-custom-date-row').style.display = e.target.value === 'custom' ? 'flex' : 'none';
    });

    div.querySelector('#gm-gd-cfg-back').addEventListener('click', () => {
      currentViewMode = 'dashboard';
      renderBody();
    });

    div.querySelector('#gm-gd-cfg-save').addEventListener('click', () => {
      // 收集基础设置
      config.refreshIntervalMinutes = parseInt(div.querySelector('#cfg-interval').value) || 10;
      config.defaultDateMode = div.querySelector('#cfg-date-mode').value;
      config.customStartDate = div.querySelector('#cfg-custom-start').value;
      config.customEndDate = div.querySelector('#cfg-custom-end').value;

      // 收集规则
      const names = div.querySelectorAll('.cfg-r-name');
      const types = div.querySelectorAll('.cfg-r-type');
      const vals = div.querySelectorAll('.cfg-r-val');
      config.rules = [];
      for (let i = 0; i < names.length; i++) {
        config.rules.push({
          id: 'r' + i + '_' + Date.now(),
          name: names[i].value || '未命名',
          matchType: types[i].value,
          matchValue: vals[i].value
        });
      }

      // 收集查询参数
      config.empName = div.querySelector('#cfg-empName').value;
      const idsStr = div.querySelector('#cfg-accountIds').value;
      config.accountIdList = idsStr.split(/[,，]/).map(s => s.trim()).filter(Boolean);

      saveConfig(config);
      alert('配置已保存');

      // 如果当前是 master，重启定时器以应用新间隔
      if (isMaster) {
        stopAutoRefresh();
        startAutoRefresh();
      }

      currentViewMode = 'dashboard';
      renderBody();
    });

    return div;
  }

  // ==================== 启动 ====================
  function init() {
    initUI();
    initMasterElection();
    // 首次延迟加载（等待选举完成）
    setTimeout(() => {
      // 尝试从缓存恢复数据
      try {
        const cached = JSON.parse(localStorage.getItem(DATA_CACHE_KEY) || 'null');
        if (cached && cached.payload) {
          cachedRawData = cached.payload;
          lastFetchMeta = cached.meta || null;
          renderDashboard();
        }
      } catch (e) {}
      // 如果是 master，立即执行首次自动刷新
      if (isMaster) {
        onAutoRefreshTick();
      }
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
