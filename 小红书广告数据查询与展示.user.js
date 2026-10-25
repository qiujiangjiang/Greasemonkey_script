// ==UserScript==
// @name         qjjtools
// @namespace    npm/vite-plugin-monkey
// @version      20.0.20
// @author       qjj
// @description  qjjtools
// @license      MIT
// @icon         https://vitejs.dev/logo.svg
// @downloadURL  https://github.com/qiujiangjiang/Greasemonkey_script/raw/refs/heads/main/%E5%B0%8F%E7%BA%A2%E4%B9%A6%E5%B9%BF%E5%91%8A%E6%95%B0%E6%8D%AE%E6%9F%A5%E8%AF%A2%E4%B8%8E%E5%B1%95%E7%A4%BA.user.js
// @updateURL    https://github.com/qiujiangjiang/Greasemonkey_script/raw/refs/heads/main/%E5%B0%8F%E7%BA%A2%E4%B9%A6%E5%B9%BF%E5%91%8A%E6%95%B0%E6%8D%AE%E6%9F%A5%E8%AF%A2%E4%B8%8E%E5%B1%95%E7%A4%BA.user.js
// @match        *://*.xiaohongshu.com/*
// @match        *://*.xhslink.com/*
// @match        *://galaxy.alibaba-inc.com/*
// @match        *://ad.e.kuaishou.com/*
// @match        *://adstar.alimama.com/*
// @match        *://diy.cbd.alibaba-inc.com/*
// @match        *://ad.qq.com/*
// @match        *://ad.oceanengine.com/*
// @require      https://cdn.jsdelivr.net/npm/vue@3.5.18/dist/vue.global.prod.min.js
// @require      data:application/javascript,%3Bwindow.Vue%3DVue%3B
// @require      https://cdn.jsdelivr.net/npm/naive-ui@2.42.0/dist/index.prod.js
// @require      data:application/javascript,%3Bwindow.naive%3Dnaive%3B
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/system.min.js
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/extras/named-register.min.js
// @require      data:application/javascript,%3B(typeof%20System!%3D'undefined')%26%26(System%3Dnew%20System.constructor())%3B
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
(function () {
  "use strict";

  // --------------------------
  // 配置：仅监听匹配以下规则的URL
  // 支持字符串全匹配或正则表达式
  // 示例：
  // 1. 全匹配："https://api.example.com/data"
  // 2. 包含字符串：/api\.example\.com/
  // 3. 特定路径：/\/user\/\d+/
  console.log(unsafeWindow.location);
  // 配置需要监听的域名列表
  const LISTEN_DOMAINS = [
    {
      domain: "ad.e.kuaishou.com",
      targetUrlPattern: /createUnitAndCreative/,
      onRequest: function (requestData) {
        // 处理快手请求数据
        try {
          GM_setValue("kuaishou_requestData", JSON.stringify(requestData));
          console.log("快手请求数据已保存到 kuaishou_requestData");
        } catch (error) {
          console.error("保存快手请求数据失败:", error);
        }
      },
    },
       {
      domain: "ad.qq.com",
      targetUrlPattern: /dynamic_creatives\/add/,
      onRequest: function (requestData) {
        // 处理快手请求数据
        try {
          GM_setValue("tx_dynamic_creatives_requestData", JSON.stringify(requestData));
          console.log("腾讯请求数据已保存到 tx_dynamic_creatives_requestData");
        } catch (error) {
          console.error("保存腾讯请求数据失败:", error);
        }
      },
    },
        {
      domain: "ad.oceanengine.com",
      targetUrlPattern: /create_promotion/,
      onRequest: function (requestData) {
        // 处理快手请求数据
        try {
          GM_setValue("oceanengine_create_promotion_requestData", JSON.stringify(requestData));
          console.log("巨量引擎请求数据已保存到 oceanengine_create_promotion_requestData");
        } catch (error) {
          console.error("保存巨量引擎 请求数据失败:", error);
        }
      },
    },
       {
      domain: "ad.qq.com",
      targetUrlPattern: /adgroups\/add/,
      onRequest: function (requestData) {
        // 处理快手请求数据
        try {
          GM_setValue("tx_adgroups_requestData", JSON.stringify(requestData));
          console.log("腾讯请求数据已保存到 tx_adgroups_requestData");
        } catch (error) {
          console.error("保存腾讯请求数据失败:", error);
        }
      },
    },
  // {
  //     domain: "ad.e.kuaishou.com",
  //     targetUrlPattern: /rest\/dsp\/control-panel\/searchNew/,
  //     onResponse: function (requestData) {
  //       // 处理快手请求数据
  //       try {
  //         GM_setValue("kuaishou_panel", JSON.stringify(requestData));
  //         console.log("快手请求数据已保存到 kuaishou_panel");
  //       } catch (error) {
  //         console.error("保存快手请求数据失败:", error);
  //       }
  //     },
  //   },
   
    {
      domain: "diy.cbd.alibaba-inc.com",
      targetUrlPattern: /queryJobPs/,
      onResponse: async function (responseData) {
        // 处理阿里响应数据
        try {
          await saveToIndexedDB("alibaba_responseData", responseData);
          console.log("阿里响应数据已保存到 alibaba_responseData");
        } catch (error) {
          console.error("保存阿里响应数据失败:", error);
        }
      },
    },
  ];

  // 检查当前域名是否在监听列表中
  // 是否需要调整

  const shouldListen = LISTEN_DOMAINS.some((domain) =>
    unsafeWindow.location.href.includes(domain.domain),
  );

  if (!shouldListen) {
    console.log("当前域名不在监听列表中，跳过监听");
    return 0;
  }

  // IndexedDB 操作函数
  const initIndexedDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("RequestDataDB", 1);

      request.onerror = (event) => {
        console.error("IndexedDB 初始化失败:", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("requests")) {
          const objectStore = db.createObjectStore("requests", {
            keyPath: "id",
          });
          objectStore.createIndex("name", "name", { unique: false });
        }
      };
    });
  };

  const saveToIndexedDB = async (dataName, data) => {


    try {
      const db = await initIndexedDB();
      const transaction = db.transaction(["requests"], "readwrite");
      const objectStore = transaction.objectStore("requests");

      const requestData = {
        id: dataName,
        name: dataName,
        data: data,
        timestamp: new Date().getTime(),
      };

      const request = objectStore.put(requestData);

      request.onsuccess = () => {
        console.log(`${dataName} 数据已保存到 IndexedDB`);
      };

      request.onerror = (event) => {
        console.error(`${dataName} 数据保存失败:`, event.target.error);
      };

      db.close();
    } catch (error) {
      console.error("IndexedDB 操作失败:", error);
    }
  };

  console.log(
    "%c【XHR请求监听已启动】监听请求和响应",
    "color: #22C55E; font-weight: bold",
  );

  // 获取当前页面匹配的域名配置
  const getCurrentDomainConfigs = () => {
    return LISTEN_DOMAINS.filter((domain) =>
      unsafeWindow.location.href.includes(domain.domain),
    );
  };

  const CURRENT_DOMAIN_CONFIGS = getCurrentDomainConfigs();

  // --------------------------
  console.log(
    "监听URL规则：",
    CURRENT_DOMAIN_CONFIGS.map((c) => c.targetUrlPattern),
  );
  // 生成唯一请求ID
  const generateRequestId = () =>
    `xhr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // 安全打印请求信息
  const logRequestInfo = (reqId, type, data) => {
    const title = `[XHR监听] ${type} - ID: ${reqId}`;
    console.groupCollapsed(`%c${title}`, "color: #1E90FF; font-weight: 500");
    Object.entries(data).forEach(([key, value]) => {
      console.log(`%c${key}:`, "color: #666; font-weight: 600", value);
    });
    console.groupEnd();
  };

  // 获取匹配的域名配置
  const getMatchingDomainConfig = (url) => {
    return LISTEN_DOMAINS.find((domain) => {
      if (!domain.targetUrlPattern) return false;
      if (typeof domain.targetUrlPattern === "string") {
        return url.includes(domain.targetUrlPattern);
      } else if (domain.targetUrlPattern instanceof RegExp) {
        return domain.targetUrlPattern.test(url);
      }
      return false;
    });
  };

  // 检查URL是否匹配目标规则
  const isTargetUrl = (url) => {
    return LISTEN_DOMAINS.some((domain) => {
      if (!domain.targetUrlPattern) return false;
      if (typeof domain.targetUrlPattern === "string") {
        return url.includes(domain.targetUrlPattern);
      } else if (domain.targetUrlPattern instanceof RegExp) {
        return domain.targetUrlPattern.test(url);
      }
      return false;
    });
  };

  // 拦截XMLHttpRequest（监听请求和响应）
  const hookXHR = () => {
    const originalXHR = unsafeWindow.XMLHttpRequest;
    unsafeWindow.XMLHttpRequest = function () {
      const xhr = new originalXHR();
      const reqId = generateRequestId();
      let method, url;
      const headers = {};
      let isTarget = false;
      let matchedDomainConfig = null;

      // 监听open方法（判断是否为目标URL）
      const originalOpen = xhr.open;
      xhr.open = function (m, u, async = true) {
        method = m.toUpperCase();
        url = u;

        // 检查是否匹配目标URL规则
        isTarget = isTargetUrl(url);
        if (isTarget) {
          matchedDomainConfig = getMatchingDomainConfig(url);
          logRequestInfo(reqId, "请求初始化", {
            方法: method,
            URL: url,
            是否异步: async,
            匹配域名配置: matchedDomainConfig
              ? matchedDomainConfig.domain
              : "未找到",
          });
        }

        originalOpen.apply(xhr, arguments);
      };

      // 监听setRequestHeader（仅记录目标请求的头）
      const originalSetRequestHeader = xhr.setRequestHeader;
      xhr.setRequestHeader = function (header, value) {
        if (isTarget) {
          headers[header.toLowerCase()] = value;
        }
        originalSetRequestHeader.apply(xhr, arguments);
      };

      // 监听send方法（仅打印目标请求的发送信息）
      const originalSend = xhr.send;
      xhr.send = function (body) {
        if (isTarget) {
          // 处理请求体信息
          let bodyInfo = "无";
          if (body !== undefined && body !== null) {
            if (typeof body === "string") {
              bodyInfo = body;
            } else if (body instanceof FormData) {
              bodyInfo = "[FormData]";
            } else if (body instanceof Blob) {
              bodyInfo = "[Blob]";
            } else {
              try {
                bodyInfo = JSON.stringify(body);
              } catch (e) {
                bodyInfo = `[${Object.prototype.toString.call(body)}] 类型`;
              }
            }
          }

          const requestData = {
            method: method,
            url: unsafeWindow.location.origin + url,
            requestHeaders: headers,
            requestBody: bodyInfo,
          };

          // 使用配置中的onRequest处理器（如果存在）
          if (
            matchedDomainConfig &&
            typeof matchedDomainConfig.onRequest === "function"
          ) {
            try {
              matchedDomainConfig.onRequest(requestData);
            } catch (handlerError) {
              console.error(
                `处理 ${matchedDomainConfig.domain} 请求时出错:`,
                handlerError,
              );
            }
          } else {
            // 默认处理方式
            try {
              GM_setValue("kuaishou_requestData", JSON.stringify(requestData));
            } catch (error) {
              console.error("保存请求数据失败:", error);
            }
          }

          logRequestInfo(url + reqId, "请求发送", requestData);
        }

        originalSend.apply(xhr, arguments);

        // 添加响应监听
        if (isTarget) {
          const originalOnReadyStateChange = xhr.onreadystatechange;
          xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
              // 请求完成，处理响应
              let responseBody = xhr.responseText;
              try {
                responseBody = JSON.parse(xhr.responseText);
              } catch (e) {
                // 如果不是JSON格式，保持原样
              }

              const responseData = {
                status: xhr.status,
                statusText: xhr.statusText,
                responseURL: xhr.responseURL,
                responseType: xhr.responseType,
                response: responseBody,
                responseHeaders: xhr.getAllResponseHeaders(),
              };

              // 使用配置中的onResponse处理器（如果存在）
              if (
                matchedDomainConfig &&
                typeof matchedDomainConfig.onResponse === "function"
              ) {
                try {
                  matchedDomainConfig.onResponse(responseData);
                } catch (handlerError) {
                  console.error(
                    `处理 ${matchedDomainConfig.domain} 响应时出错:`,
                    handlerError,
                  );
                }
              } else {
                // 默认情况下只记录日志
                logRequestInfo(reqId, "响应接收", responseData);
              }
            }

            if (originalOnReadyStateChange) {
              originalOnReadyStateChange.apply(this, arguments);
            }
          };
        }
      };

      return xhr;
    };
  };

  // 初始化
  hookXHR();
})();



(a=>{if(typeof GM_addStyle=="function"){GM_addStyle(a);return}const o=document.createElement("style");o.textContent=a,document.head.append(o)})(' .app-page-container{padding:24px;max-width:1200px;margin:0 auto;background:#fff}.app-card{background:#fff;border-radius:16px;box-shadow:0 2px 8px #0000000f;border:1px solid #E5E7EB}.app-form-card{background:#fff;border-radius:16px;box-shadow:0 2px 8px #0000000f;border:1px solid #E5E7EB;margin-bottom:20px}.app-preview-card{background:#fff;border-radius:16px;box-shadow:0 2px 8px #0000000f;border:1px solid #E5E7EB}.app-stats-summary{display:flex;align-items:center;padding:16px;background:#f8f9fb;color:#1f2937;border-radius:12px;font-weight:600;font-size:18px;text-align:center;justify-content:center}.app-stats-item{display:flex;align-items:center;padding:12px 16px;background:#f8f9fb;border-radius:8px;border-left:4px solid #E5E7EB}.app-modal.n-card{width:60vw;max-width:90vw;min-width:400px;height:60vh;max-height:90vh;min-height:300px;display:flex;flex-direction:column}.app-modal.n-card .n-card-content{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important}.app-btn-modern{box-shadow:var(--shadow-sm);transition:all .2s ease}.app-btn-modern:hover{transform:translateY(-2px);box-shadow:var(--shadow-md)}.app-drawer-header{display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-md) var(--space-lg);font-size:16px;font-weight:600;color:var(--app-text)}.app-drawer-header .header-icon{font-size:22px;line-height:1}.app-drawer-header .header-title{flex:1}.app-tool-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;padding:var(--space-md) 0}.app-tool-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-xs);padding:var(--space-md);background:#fff;border-radius:12px;border:1px solid var(--app-border);box-shadow:var(--shadow-sm);cursor:pointer;transition:all .2s ease;text-align:center;min-height:80px}.app-tool-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-md);border-color:var(--app-primary-light)}.app-tool-card .card-icon{font-size:24px;line-height:1}.app-tool-card .card-label{font-size:13px;font-weight:500;color:var(--app-text)}.app-tool-group-title{font-size:14px;font-weight:600;color:var(--app-text-secondary);padding:var(--space-sm) 0;margin-top:var(--space-sm)}:root{--app-primary: #6B4CFF;--app-primary-light: #8B6DFF;--app-primary-pressed: #5A3FE0;--app-info: #4A7DFF;--app-bg: #FFFFFF;--app-surface: #F8F9FB;--app-text: #1F2937;--app-text-secondary: #6B7280;--app-border: #E5E7EB;--app-success: #52C41A;--app-warning: #FAAD14;--app-error: #F5222D;--radius-sm: 6px;--radius-md: 10px;--radius-lg: 16px;--radius-xl: 24px;--shadow-sm: 0 1px 3px rgba(0, 0, 0, .08);--shadow-md: 0 4px 12px rgba(0, 0, 0, .12);--shadow-lg: 0 8px 24px rgba(0, 0, 0, .16);--card-radius: 16px;--card-shadow: 0 2px 8px rgba(0, 0, 0, .06);--btn-radius: 8px;--space-xs: 4px;--space-sm: 8px;--space-md: 16px;--space-lg: 24px;--space-xl: 32px;--font-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;--glass-bg: rgba(107, 76, 255, .85);--glass-border: rgba(255, 255, 255, .25);--glass-blur: blur(12px);--float-btn-size: 48px}.default-component[data-v-4412aa0a]{display:flex;justify-content:center;align-items:center;height:100%;padding:var(--space-lg)}.draggable-float-btn[data-v-fe53c351]{position:fixed;z-index:10001;cursor:grab;-webkit-user-select:none;user-select:none;will-change:transform}.draggable-float-btn[data-v-fe53c351]:active{cursor:grabbing}.monkey-btn[data-v-fe53c351]{width:var(--float-btn-size);height:var(--float-btn-size);border-radius:50%;background:var(--app-primary);background:var(--glass-bg);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);border:1px solid var(--glass-border);color:#fff;font-size:20px;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-lg);transition:transform .2s ease,box-shadow .2s ease}.monkey-btn[data-v-fe53c351]:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 8px 24px #6b4cff59}.drawer-body[data-v-fe53c351]{min-height:100%}.drawer-content-wrapper[data-v-fe53c351]{background:var(--app-surface);border-radius:var(--radius-lg);padding:var(--space-md);min-height:calc(100% - var(--space-lg))}.platform-bg-white[data-v-fe53c351]{background:#fff}.button-container[data-v-69879f9c]{padding:var(--space-lg)}@media(max-width:768px){.button-container[data-v-69879f9c] .n-space{flex-direction:column!important}.button-container[data-v-69879f9c] .n-button{width:100%!important;margin:4px 0!important}}.button-container[data-v-3783bcb3]{padding:var(--space-lg)}.tool-btn[data-v-3783bcb3]{flex:1;min-width:150px;margin:var(--space-xs)}.alert-slot[data-v-3783bcb3]{margin-top:var(--space-md)}.tool-group[data-v-3783bcb3]{margin-bottom:var(--space-md)}.button-container[data-v-073a8fd0]{padding:var(--space-lg)}.kuaishou-container[data-v-b68b63b2]{padding:24px;max-width:1000px;margin:0 auto;background:#fff}.tool-card[data-v-b68b63b2] .n-card-content{padding:24px}[data-v-b68b63b2] .n-button{border-radius:8px;font-weight:500}[data-v-b68b63b2] .n-input{border-radius:8px}[data-v-b68b63b2] .n-form-item-label{font-weight:500;color:#333}[data-v-b68b63b2] .n-collapse,[data-v-b68b63b2] .n-table{border-radius:8px;overflow:hidden}.button-container[data-v-58cc9d22]{padding:var(--space-lg)}.button-container[data-v-17de9e4f]{padding:var(--space-lg);background:#fff}.kanban-table-container[data-v-dcd44f5a]{max-height:calc(100vh - 100px);overflow:auto}pre[data-v-dcd44f5a]{white-space:pre-wrap;word-wrap:break-word;background-color:#f5f5f5;padding:10px;border-radius:4px;max-height:60vh;overflow-y:auto;font-size:12px}[data-v-dcd44f5a] .n-data-table th,[data-v-dcd44f5a] .n-data-table td{padding:4px 8px!important;font-size:12px!important}[data-v-dcd44f5a] .n-card__content{padding:10px!important}.option-container[data-v-6b90735c]{padding:20px;max-width:800px;margin:0 auto}th[data-v-6b90735c],td[data-v-6b90735c]{text-align:left;padding:12px 8px}[data-v-6b90735c] .n-collapse-item__header-main{font-weight:500}[data-v-6b90735c] .n-dynamic-tags .n-tag{margin-right:8px;margin-bottom:8px}[data-v-6b90735c] .n-card__content{padding:20px!important}.button-container[data-v-38450320],.button-container[data-v-9fbe74fd],.button-container[data-v-cb8dcbab]{padding:var(--space-lg)}.n-progress[data-v-7024f4f4],.n-progress[data-v-05b68d92],.n-progress[data-v-27fa24ac]{margin:10px 0}.createrplan-container[data-v-b3536618]{padding:24px;max-width:1000px;margin:0 auto;background:#fff}.main-card[data-v-b3536618] .n-card-header{background:#fff;color:#333;border-bottom:1px solid #f0f0f0;border-radius:16px 16px 0 0;padding:20px 24px}.main-card[data-v-b3536618] .n-card-content{padding:24px}[data-v-b3536618] .n-button{border-radius:8px;font-weight:500}[data-v-b3536618] .n-input{border-radius:8px}[data-v-b3536618] .n-form-item-label{font-weight:500;color:#333}[data-v-b3536618] .n-tag{border-radius:20px;font-weight:500}pre[data-v-64a6b64a]{white-space:pre-wrap;word-wrap:break-word;font-size:12px}.auto-height-card[data-v-b235a5cb],.auto-height-card[data-v-b235a5cb] .n-card__content{flex:1;display:flex;flex-direction:column}.flex-card[data-v-b235a5cb]{flex:2}.extractor-wrapper[data-v-0b231740]{padding:8px}.config-group-item[data-v-0b231740]{background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:12px;margin-bottom:10px}.full-width[data-v-0b231740]{width:100%}.flex-1[data-v-0b231740]{flex:1}.mt-6[data-v-0b231740]{margin-top:6px}.mt-8[data-v-0b231740]{margin-top:8px}.mt-12[data-v-0b231740]{margin-top:12px}.label-secondary[data-v-0b231740]{white-space:nowrap;font-size:13px;color:#666}.account-list-label[data-v-0b231740]{margin-top:8px;font-size:12px;color:#666;font-weight:500}.table-small-text[data-v-0b231740]{font-size:12px}.jihua-container[data-v-07435d1f]{padding:20px;max-width:800px;margin:0 auto}.description[data-v-07435d1f]{background-color:#f5f5f5;padding:12px;border-radius:4px;margin-bottom:16px}.description pre[data-v-07435d1f]{background-color:#fff;padding:8px;border-radius:4px;margin:8px 0;white-space:pre-wrap}.plan-container[data-v-e3afed37]{padding:20px;max-width:800px;margin:0 auto}.description[data-v-e3afed37]{background-color:#f5f5f5;padding:12px;border-radius:4px;margin-bottom:16px}.description pre[data-v-e3afed37]{background-color:#fff;padding:8px;border-radius:4px;margin:8px 0;white-space:pre-wrap}.getchuangyi-container[data-v-6f59bfac]{padding:24px;max-width:1200px;margin:0 auto;background:#fff}.main-card[data-v-6f59bfac] .n-card-header{background:#fff;color:#333;border-bottom:1px solid #f0f0f0;border-radius:16px 16px 0 0;padding:20px 24px}.main-card[data-v-6f59bfac] .n-card-content{padding:24px}[data-v-6f59bfac] .n-button{border-radius:8px;font-weight:500}[data-v-6f59bfac] .n-date-picker,[data-v-6f59bfac] .n-input{border-radius:8px}[data-v-6f59bfac] .n-data-table{border-radius:8px;overflow:hidden}[data-v-6f59bfac] .n-tag{border-radius:20px;font-weight:500}.search-price-container[data-v-8e8c575e]{max-width:800px;margin:0 auto;padding:20px;background:#fff}.header[data-v-8e8c575e]{text-align:center;margin-bottom:30px;color:#333}.header h2[data-v-8e8c575e]{font-size:28px;margin-bottom:10px}.subtitle[data-v-8e8c575e]{font-size:16px;margin:0;color:#666}.button-group[data-v-8e8c575e]{display:flex;gap:12px;justify-content:center;margin-top:20px}.result-card[data-v-8e8c575e]{margin-bottom:20px;border-radius:16px;box-shadow:0 8px 32px #0000001a}.result-card.success[data-v-8e8c575e]{border-left:4px solid #18a058}.result-card.error[data-v-8e8c575e]{border-left:4px solid #d03050}.result-header[data-v-8e8c575e]{display:flex;align-items:center;gap:8px;margin-bottom:12px;font-weight:600;font-size:16px}.result-icon[data-v-8e8c575e]{font-size:20px}.error-message[data-v-8e8c575e]{color:#d03050;margin:0}.preview-header[data-v-8e8c575e]{font-weight:600;margin-bottom:16px;color:#333}.plan-ids-grid[data-v-8e8c575e]{display:flex;flex-wrap:wrap;gap:8px}@media(max-width:768px){.search-price-container[data-v-8e8c575e]{padding:16px}.button-group[data-v-8e8c575e]{flex-direction:column}.header h2[data-v-8e8c575e]{font-size:24px}}.note-match-container[data-v-5144ea78]{max-width:1200px;margin:0 auto;padding:20px;background:#fff}.header[data-v-5144ea78]{text-align:center;margin-bottom:30px;color:#333}.header h2[data-v-5144ea78]{font-size:28px;margin-bottom:10px}.subtitle[data-v-5144ea78]{font-size:16px;margin:0;color:#666}.main-card[data-v-5144ea78] .n-card-content{padding:24px}.result-card[data-v-5144ea78]{border-left:4px solid #f0f0f0}.result-card[data-v-5144ea78] .n-card-header{background:#fff;color:#333;border-bottom:1px solid #f0f0f0;border-radius:16px 16px 0 0}.result-card[data-v-5144ea78] .n-card-content{padding:24px}.match-stats-content[data-v-5144ea78]{padding:16px}.stats-item .stats-icon[data-v-5144ea78]{font-size:20px;margin-right:12px}.stats-item .stats-text[data-v-5144ea78]{font-size:16px;color:#333}.stats-summary .stats-icon[data-v-5144ea78]{font-size:24px;margin-right:12px}@media(max-width:768px){.note-match-container[data-v-5144ea78]{padding:16px}.header h2[data-v-5144ea78]{font-size:24px}.main-card[data-v-5144ea78] .n-card-content,.result-card[data-v-5144ea78] .n-card-content{padding:16px}}.search-price-container[data-v-24d8cee2]{max-width:800px;margin:0 auto;padding:20px;background:#fff}.header[data-v-24d8cee2]{text-align:center;margin-bottom:30px;color:#333}.header h2[data-v-24d8cee2]{font-size:28px;margin-bottom:10px}.subtitle[data-v-24d8cee2]{font-size:16px;margin:0;color:#666}.button-group[data-v-24d8cee2]{display:flex;gap:12px;justify-content:center;margin-top:20px}.result-card[data-v-24d8cee2]{margin-bottom:20px;border-radius:16px;box-shadow:0 8px 32px #0000001a}.result-card.success[data-v-24d8cee2]{border-left:4px solid #18a058}.result-card.error[data-v-24d8cee2]{border-left:4px solid #d03050}.result-header[data-v-24d8cee2]{display:flex;align-items:center;gap:8px;margin-bottom:12px;font-weight:600;font-size:16px}.result-icon[data-v-24d8cee2]{font-size:20px}.error-message[data-v-24d8cee2]{color:#d03050;margin:0}.preview-header[data-v-24d8cee2]{font-weight:600;margin-bottom:16px;color:#333}.plan-ids-grid[data-v-24d8cee2]{display:flex;flex-wrap:wrap;gap:8px}@media(max-width:768px){.search-price-container[data-v-24d8cee2]{padding:16px}.button-group[data-v-24d8cee2]{flex-direction:column}.header h2[data-v-24d8cee2]{font-size:24px}}.industry-combine-container[data-v-985d1878]{padding:16px}.action-link[data-v-985d1878]{color:var(--app-primary);text-decoration:none;font-size:13px;cursor:pointer;transition:opacity .2s ease}.action-link[data-v-985d1878]:hover{text-decoration:underline;opacity:.85}.action-link[data-v-985d1878]:active{opacity:.7}.kuaishou-container[data-v-208a2802]{padding:24px;max-width:1000px;margin:0 auto;background:#fff}.tool-card[data-v-208a2802] .n-card-content{padding:24px}[data-v-208a2802] .n-button{border-radius:8px;font-weight:500}[data-v-208a2802] .n-input{border-radius:8px}[data-v-208a2802] .n-form-item-label{font-weight:500;color:#333}[data-v-208a2802] .n-collapse,[data-v-208a2802] .n-table{border-radius:8px;overflow:hidden}.kuaishou-ad-creator[data-v-9ddd82be]{max-width:1000px;margin:0 auto;padding:20px;font-family:Arial,sans-serif}.form-section[data-v-9ddd82be]{margin-bottom:20px}.form-section h2[data-v-9ddd82be]{color:#333;margin-bottom:20px}.form-section h3[data-v-9ddd82be]{color:#555;margin:15px 0 10px}.form-group[data-v-9ddd82be]{margin-bottom:20px}.form-group label[data-v-9ddd82be]{display:block;margin-bottom:8px;font-weight:700;color:#444}.form-group textarea[data-v-9ddd82be]{width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;box-sizing:border border-box;font-family:monospace;font-size:14px}.form-group textarea[readonly][data-v-9ddd82be]{background-color:#f9f9f9;color:#666}.hint[data-v-9ddd82be]{margin-top:5px;font-size:12px;color:#666;font-style:italic}.action-section[data-v-9ddd82be]{margin:20px 0;text-align:center}button[data-v-9ddd82be]{padding:12px 30px;background-color:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;transition:background-color .3s}button[data-v-9ddd82be]:disabled{background-color:#ccc;cursor:not-allowed}button[data-v-9ddd82be]:hover:not(:disabled){background-color:#0056b3}.log-section[data-v-9ddd82be]{margin-top:20px}.log-content[data-v-9ddd82be]{height:300px;overflow-y:auto;padding:15px;background-color:#f8f9fa;border:1px solid #ddd;border-radius:4px;font-family:monospace;font-size:14px;white-space:pre-wrap}.info[data-v-9ddd82be]{color:#333}.success[data-v-9ddd82be]{color:green}.error[data-v-9ddd82be]{color:red}.warning[data-v-9ddd82be]{color:orange}.kuaishou-ad-creator[data-v-23a76b7e]{max-width:1000px;margin:0 auto;padding:20px;font-family:Arial,sans-serif}.form-section[data-v-23a76b7e]{margin-bottom:20px}.form-section h2[data-v-23a76b7e]{color:#333;margin-bottom:20px}.form-section h3[data-v-23a76b7e]{color:#555;margin:15px 0 10px}.form-group[data-v-23a76b7e]{margin-bottom:20px}.form-group label[data-v-23a76b7e]{display:block;margin-bottom:8px;font-weight:700;color:#444}.form-group textarea[data-v-23a76b7e]{width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;box-sizing:border border-box;font-family:monospace;font-size:14px}.form-group textarea[readonly][data-v-23a76b7e]{background-color:#f9f9f9;color:#666}.hint[data-v-23a76b7e]{margin-top:5px;font-size:12px;color:#666;font-style:italic}.action-section[data-v-23a76b7e]{margin:20px 0;text-align:center}button[data-v-23a76b7e]{padding:12px 30px;background-color:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;transition:background-color .3s}button[data-v-23a76b7e]:disabled{background-color:#ccc;cursor:not-allowed}button[data-v-23a76b7e]:hover:not(:disabled){background-color:#0056b3}.log-section[data-v-23a76b7e]{margin-top:20px}.log-content[data-v-23a76b7e]{height:300px;overflow-y:auto;padding:15px;background-color:#f8f9fa;border:1px solid #ddd;border-radius:4px;font-family:monospace;font-size:14px;white-space:pre-wrap}.info[data-v-23a76b7e]{color:#333}.success[data-v-23a76b7e]{color:green}.error[data-v-23a76b7e]{color:red}.warning[data-v-23a76b7e]{color:orange}.panel-data-table[data-v-da17cd85]{padding:20px;max-width:1400px;margin:0 auto}h2[data-v-da17cd85]{color:#333;margin-bottom:20px;font-size:20px}.action-bar[data-v-da17cd85]{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap}.stats[data-v-da17cd85]{margin-left:auto}.xingrengwu-processor-container[data-v-83ec270b]{padding:24px;max-width:1200px;margin:0 auto;background:#fff}.main-card[data-v-83ec270b] .n-card-content{padding:24px}[data-v-83ec270b] .n-button{border-radius:8px;font-weight:500}[data-v-83ec270b] .n-input{border-radius:8px}[data-v-83ec270b] .n-form-item-label{font-weight:500;color:#333}[data-v-83ec270b] .n-collapse,[data-v-83ec270b] .n-data-table{border-radius:8px;overflow:hidden}.tencent-ad-creator[data-v-73f276c5]{max-width:1000px;margin:0 auto;padding:20px;font-family:Arial,sans-serif}.form-section[data-v-73f276c5]{margin-bottom:20px}.form-section h2[data-v-73f276c5]{color:#333;margin-bottom:20px}.form-section h3[data-v-73f276c5]{color:#555;margin:15px 0 10px}.form-group[data-v-73f276c5]{margin-bottom:20px}.form-group label[data-v-73f276c5]{display:block;margin-bottom:8px;font-weight:700;color:#444}.form-group textarea[data-v-73f276c5]{width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;font-family:monospace;font-size:14px}.form-group textarea[readonly][data-v-73f276c5]{background-color:#f9f9f9;color:#666}.form-group textarea.error-state[data-v-73f276c5]{border-color:#dc3545}.hint[data-v-73f276c5]{margin-top:5px;font-size:12px;color:#666;font-style:italic}.error-message[data-v-73f276c5]{margin-top:5px;font-size:12px;color:#dc3545}.action-section[data-v-73f276c5]{margin:20px 0;text-align:center}button[data-v-73f276c5]{padding:12px 30px;background-color:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;transition:background-color .3s}button[data-v-73f276c5]:disabled{background-color:#ccc;cursor:not-allowed}button[data-v-73f276c5]:hover:not(:disabled){background-color:#0056b3}.log-section[data-v-73f276c5]{margin-top:20px}.log-content[data-v-73f276c5]{height:300px;overflow-y:auto;padding:15px;background-color:#f8f9fa;border:1px solid #ddd;border-radius:4px;font-family:monospace;font-size:14px;white-space:pre-wrap}.info[data-v-73f276c5]{color:#333}.success[data-v-73f276c5]{color:green}.error[data-v-73f276c5]{color:red}.warning[data-v-73f276c5]{color:orange}.tencent-ad-creator[data-v-7d323a89]{max-width:1000px;margin:0 auto;padding:20px;font-family:Arial,sans-serif}.form-section[data-v-7d323a89]{margin-bottom:20px}.form-section h2[data-v-7d323a89]{color:#333;margin-bottom:20px}.form-section h3[data-v-7d323a89]{color:#555;margin:15px 0 10px}.form-group[data-v-7d323a89]{margin-bottom:20px}.form-group label[data-v-7d323a89]{display:block;margin-bottom:8px;font-weight:700;color:#444}.form-group textarea[data-v-7d323a89]{width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;font-family:monospace;font-size:14px}.form-group textarea[readonly][data-v-7d323a89]{background-color:#f9f9f9;color:#666}.form-group textarea.error-state[data-v-7d323a89]{border-color:#dc3545}.hint[data-v-7d323a89]{margin-top:5px;font-size:12px;color:#666;font-style:italic}.error-message[data-v-7d323a89]{margin-top:5px;font-size:12px;color:#dc3545}.action-section[data-v-7d323a89]{margin:20px 0;text-align:center}button[data-v-7d323a89]{padding:12px 30px;background-color:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;transition:background-color .3s}button[data-v-7d323a89]:disabled{background-color:#ccc;cursor:not-allowed}button[data-v-7d323a89]:hover:not(:disabled){background-color:#0056b3}.log-section[data-v-7d323a89]{margin-top:20px}.log-content[data-v-7d323a89]{height:300px;overflow-y:auto;padding:15px;background-color:#f8f9fa;border:1px solid #ddd;border-radius:4px;font-family:monospace;font-size:14px;white-space:pre-wrap}.info[data-v-7d323a89]{color:#333}.success[data-v-7d323a89]{color:green}.error[data-v-7d323a89]{color:red}.warning[data-v-7d323a89]{color:orange}.douyin-ad-creator[data-v-f54fb7a2]{max-width:1000px;margin:0 auto;padding:20px;font-family:Arial,sans-serif}.form-section[data-v-f54fb7a2]{margin-bottom:20px}.form-section h2[data-v-f54fb7a2]{color:#333;margin-bottom:20px}.form-section h3[data-v-f54fb7a2]{color:#555;margin:15px 0 10px}.form-group[data-v-f54fb7a2]{margin-bottom:20px}.form-group label[data-v-f54fb7a2]{display:block;margin-bottom:8px;font-weight:700;color:#444}.form-group textarea[data-v-f54fb7a2]{width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;font-family:monospace;font-size:14px}.form-group textarea[readonly][data-v-f54fb7a2]{background-color:#f9f9f9;color:#666}.form-group textarea.error-state[data-v-f54fb7a2]{border-color:#ff4d4f}.hint[data-v-f54fb7a2]{margin-top:5px;font-size:12px;color:#666;font-style:italic}.error-message[data-v-f54fb7a2]{margin-top:5px;font-size:12px;color:#ff4d4f}.action-section[data-v-f54fb7a2]{margin:20px 0;text-align:center}button[data-v-f54fb7a2]{padding:12px 30px;background-color:#fe2c55;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;transition:background-color .3s}button[data-v-f54fb7a2]:disabled{background-color:#ccc;cursor:not-allowed}button[data-v-f54fb7a2]:hover:not(:disabled){background-color:#d92548}.log-section[data-v-f54fb7a2]{margin-top:20px}.log-content[data-v-f54fb7a2]{height:300px;overflow-y:auto;padding:15px;background-color:#f8f9fa;border:1px solid #ddd;border-radius:4px;font-family:monospace;font-size:14px;white-space:pre-wrap}.info[data-v-f54fb7a2]{color:#333}.success[data-v-f54fb7a2]{color:green}.error[data-v-f54fb7a2]{color:red}.warning[data-v-f54fb7a2]{color:orange} ');

System.addImportMap({ imports: {"vue":"user:vue","naive-ui":"user:naive-ui"} });
System.set("user:vue", (()=>{const _=Vue;('default' in _)||(_.default=_);return _})());
System.set("user:naive-ui", (()=>{const _=naive;('default' in _)||(_.default=_);return _})());

System.register("./__entry.js", ['./__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	return {
		setters: [null],
		execute: (function () {



		})
	};
}));

System.register("./__monkey.entry-uhykG5-y.js", ['vue', 'naive-ui'], (function (exports, module) {
	'use strict';
	var defineAsyncComponent, createApp, ref, computed, openBlock, createBlock, unref, withCtx, createVNode, createElementVNode, normalizeStyle, toDisplayString, normalizeClass, resolveDynamicComponent, createElementBlock, createTextVNode, y, NConfigProvider, NDialogProvider, NMessageProvider, NDrawer, NDrawerContent, NEmpty, NIcon;
	return {
		setters: [module => {
			defineAsyncComponent = module.defineAsyncComponent;
			createApp = module.createApp;
			ref = module.ref;
			computed = module.computed;
			openBlock = module.openBlock;
			createBlock = module.createBlock;
			unref = module.unref;
			withCtx = module.withCtx;
			createVNode = module.createVNode;
			createElementVNode = module.createElementVNode;
			normalizeStyle = module.normalizeStyle;
			toDisplayString = module.toDisplayString;
			normalizeClass = module.normalizeClass;
			resolveDynamicComponent = module.resolveDynamicComponent;
			createElementBlock = module.createElementBlock;
			createTextVNode = module.createTextVNode;
		}, module => {
			y = module.default;
			NConfigProvider = module.NConfigProvider;
			NDialogProvider = module.NDialogProvider;
			NMessageProvider = module.NMessageProvider;
			NDrawer = module.NDrawer;
			NDrawerContent = module.NDrawerContent;
			NEmpty = module.NEmpty;
			NIcon = module.NIcon;
		}],
		execute: (function () {

			const E=(e,t)=>{const n=e.__vccOpts||e;for(const[o,r]of t)n[o]=r;return n},j={class:"default-component"},L=E({__name:"DefaultComponent",setup:i=>(i,s)=>(openBlock(),createElementBlock("div",j,[createVNode(unref(NEmpty),{description:"暂无适配"},{icon:withCtx(()=>[createVNode(unref(NIcon),{size:"48"},{default:withCtx(()=>[...s[0]||(s[0]=[createTextVNode(" 📦 ",-1)])]),_:1})]),_:1})]))},[["__scopeId","data-v-4412aa0a"]]),O=function(){const e="undefined"!=typeof document&&document.createElement("link").relList;return e&&e.supports&&e.supports("modulepreload")?"modulepreload":"preload"}(),S={},R=function(e,t,n){let o=Promise.resolve();if(t&&t.length>0){let e=function(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:"fulfilled",value:e}),e=>({status:"rejected",reason:e}))))};document.getElementsByTagName("link");const n=document.querySelector("meta[property=csp-nonce]"),r=n?.nonce||n?.getAttribute("nonce");o=e(t.map(e=>{if((e=function(e){return "/"+e}(e))in S)return;S[e]=true;const t=e.endsWith(".css"),n=t?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${e}"]${n}`))return;const o=document.createElement("link");return o.rel=t?"stylesheet":O,t||(o.as="script"),o.crossOrigin="",o.href=e,r&&o.setAttribute("nonce",r),document.head.appendChild(o),t?new Promise((t,n)=>{o.addEventListener("load",t),o.addEventListener("error",()=>n(new Error(`Unable to preload CSS for ${e}`)));}):void 0}));}function r(e){const t=new Event("vite:preloadError",{cancelable:true});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return o.then(t=>{for(const e of t||[])"rejected"===e.status&&r(e.reason);return e().catch(r)})},M=[{test:e=>e.includes("xiaohongshu.com")||e.includes("xhslink.com"),component:defineAsyncComponent(()=>R(()=>module.import('./XHS-BFa4sA7T-DddofJSb.js').then(e=>e.X),void 0))},{test:e=>e.includes("galaxy.alibaba-inc.com"),component:defineAsyncComponent(()=>R(()=>module.import('./app-CNnHPG9F-KnIQ7wNG.js'),void 0))},{test:e=>e.includes("ad.e.kuaishou.com"),component:defineAsyncComponent(()=>R(()=>module.import('./app-Cl8xTo7X-VGmPsdJU.js'),void 0))},{test:e=>e.includes("adstar.alimama.com"),component:defineAsyncComponent(()=>R(()=>module.import('./app-DiZBVrAJ-Sj81A4g9.js'),void 0))},{test:e=>e.includes("diy.cbd.alibaba-inc.com"),component:defineAsyncComponent(()=>R(()=>module.import('./app-MDdjp93N-T1R4lgU6.js'),void 0))},{test:e=>e.includes("ad.qq.com"),component:defineAsyncComponent(()=>R(()=>module.import('./app-B8MPka1L-COSCN6WN.js'),void 0))},{test:e=>e.includes("ad.oceanengine.com"),component:defineAsyncComponent(()=>R(()=>module.import('./app-C3VNY4p4-CGKde64K.js'),void 0))}]; exports({ E, R });const T="qjjtools_float_pos",P=48;const A="#6B4CFF",D="#4A7DFF",N={xiaohongshu:{name:"小红书",shortName:"书",icon:"📕",primary:A,info:D,bgClass:"platform-bg-white"},kuaishou:{name:"快手",shortName:"手",icon:"🎬",primary:A,info:D,bgClass:"platform-bg-white"},oceanengine:{name:"抖音",shortName:"抖",icon:"🎵",primary:A,info:D,bgClass:"platform-bg-white"},"ad.qq":{name:"腾讯广告",shortName:"腾",icon:"💼",primary:A,info:D,bgClass:"platform-bg-white"},alimama:{name:"星任务",shortName:"星",icon:"⭐",primary:A,info:D,bgClass:"platform-bg-white"},zhitou:{name:"直投",shortName:"直",icon:"🎯",primary:A,info:D,bgClass:"platform-bg-white"},"diy.cbd":{name:"看板",shortName:"看",icon:"📊",primary:A,info:D,bgClass:"platform-bg-white"}};const k={class:"app-drawer-header"},F={class:"header-icon"},q={class:"header-title"},I={class:"drawer-content-wrapper"},B=E({__name:"App",setup(t){const{themeOverrides:a,platform:i}=function(){const e=window.location.href,t=Object.keys(N).find(t=>e.includes(t)),n=t?N[t]:N.xiaohongshu;return {themeOverrides:{common:{primaryColor:n.primary,primaryColorHover:n.info,primaryColorPressed:"#5A3FE0",primaryColorSuppl:n.info,infoColor:n.info,infoColorHover:"#3A6BE0",borderRadius:"10px",fontFamily:"var(--font-base)"},Button:{color:n.primary,colorHover:n.info,colorPressed:"#5A3FE0",textColor:"#fff",borderRadius:"12px"},Card:{borderRadius:"16px",color:"#fff",colorModal:"#fff"},Modal:{borderRadius:"16px"},Input:{borderRadius:"8px"},Form:{labelTextColor:"#1F2937",labelFontWeight:"500"},Tag:{borderRadius:"20px"},Table:{borderRadius:"8px"},Collapse:{borderRadius:"8px"},Drawer:{color:"#fff",headerColor:"#fff",headerFontSize:"16px",headerFontWeight:"600"}},platform:n}}(),h=ref(false),y=ref("right"),b=computed(()=>`${i.name}工具箱`),{currentComponent:v}={currentComponent:computed(()=>{const e=window.location.href,t=M.find(t=>t.test(e));return t?t.component:null})},E=computed(()=>v.value||L),{pos:j,onDragStart:O,hasMoved:S}=function(){const e=ref({x:window.innerWidth-P-24,y:window.innerHeight-P-24}),t=ref(false),n=ref(false),o=ref({x:0,y:0}),r=ref({x:0,y:0}),a=e=>{try{GM_setValue(T,JSON.stringify(i(e)));}catch{}},i=e=>({x:Math.max(0,Math.min(e.x,window.innerWidth-P)),y:Math.max(0,Math.min(e.y,window.innerHeight-P))}),s=a=>{if(!t.value)return;a.preventDefault();const i=a.touches?a.touches[0].clientX:a.clientX,s=a.touches?a.touches[0].clientY:a.clientY;(Math.abs(i-r.value.x)>3||Math.abs(s-r.value.y)>3)&&(n.value=true),e.value={x:Math.max(0,Math.min(i-o.value.x,window.innerWidth-P)),y:Math.max(0,Math.min(s-o.value.y,window.innerHeight-P))};},l=()=>{t.value=false,document.removeEventListener("mousemove",s),document.removeEventListener("mouseup",l),document.removeEventListener("touchmove",s),document.removeEventListener("touchend",l),a(e.value);};return (()=>{try{const t=GM_getValue(T);if(t){const n=JSON.parse(t);e.value=i(n);}}catch{}})(),{pos:e,savePos:a,clampPos:i,onDragStart:a=>{if("mousedown"===a.type&&0!==a.button)return;n.value=false,t.value=true;const i=a.touches?a.touches[0].clientX:a.clientX,c=a.touches?a.touches[0].clientY:a.clientY;r.value={x:i,y:c},o.value={x:i-e.value.x,y:c-e.value.y},document.addEventListener("mousemove",s),document.addEventListener("mouseup",l),document.addEventListener("touchmove",s,{passive:false}),document.addEventListener("touchend",l);},hasMoved:n,dragging:t}}(),R=()=>{var e;S.value||(e="right",h.value=true,y.value=e);};return (t,s)=>(openBlock(),createBlock(unref(NConfigProvider),{"theme-overrides":unref(a)},{default:withCtx(()=>[createVNode(unref(NDialogProvider),null,{default:withCtx(()=>[createVNode(unref(NMessageProvider),null,{default:withCtx(()=>[createElementVNode("div",{class:"draggable-float-btn",style:normalizeStyle({left:unref(j).x+"px",top:unref(j).y+"px",transform:"translate3d(0, 0, 0)"}),onMousedown:s[0]||(s[0]=(...e)=>unref(O)&&unref(O)(...e)),onTouchstart:s[1]||(s[1]=(...e)=>unref(O)&&unref(O)(...e))},[createElementVNode("div",{class:"monkey-btn",onClick:R},toDisplayString(unref(i).icon),1)],36),createVNode(unref(NDrawer),{show:h.value,"onUpdate:show":s[2]||(s[2]=e=>h.value=e),width:502,placement:y.value},{default:withCtx(()=>[createVNode(unref(NDrawerContent),{class:normalizeClass(["drawer-body",unref(i).bgClass])},{header:withCtx(()=>[createElementVNode("div",k,[createElementVNode("span",F,toDisplayString(unref(i).icon),1),createElementVNode("span",q,toDisplayString(b.value),1)])]),default:withCtx(()=>[createElementVNode("div",I,[(openBlock(),createBlock(resolveDynamicComponent(E.value)))])]),_:1},8,["class"])]),_:1},8,["show","placement"])]),_:1})]),_:1})]),_:1},8,["theme-overrides"]))}},[["__scopeId","data-v-fe53c351"]]);function V(e){if(!Array.isArray(e)||0===e.length)return "";const t=Object.keys(e[0]);return [t.join(","),...e.map(e=>t.map(t=>(e=>{if(null==e)return "";let t=e;return t="object"==typeof t?JSON.stringify(t):String(t),(t.includes(",")||t.includes('"')||t.includes("\n")||t.includes("\r"))&&(t=t.replace(/"/g,'""'),t=`"${t}"`),t})(e[t])).join(","))].join("\n")}async function $(e){const t=await async function(e){const t=await fetch("https://galaxy.alibaba-inc.com/assets/contentTag/list",{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",appname:"adcontent-op","bx-v":"2.5.37","content-type":"application/json",priority:"u=1, i"},referrer:"https://galaxy.alibaba-inc.com/",body:JSON.stringify({libraryId:Number(e),pageNo:1,pageSize:500,media:"RED_BOOK"}),method:"POST",mode:"cors",credentials:"include"});if(!t.ok)throw new Error(`HTTP ${t.status}: ${t.statusText}`);const n=await t.json();if(n.success&&n.model&&Array.isArray(n.model.result))return n.model.result;throw new Error(n.msgInfo||"获取笔记库数据失败")}(e);!function(e,t){const n=new Blob(["\ufeff",e],{type:"text/csv;charset=utf-8;"}),o=URL.createObjectURL(n),r=document.createElement("a");r.href=o,r.download=t,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(o);}(V(t),`笔记库_${e}_${(new Date).toISOString().slice(0,10)}.csv`);}function z(){const e=()=>{const e=document.querySelector(".ant-pro-table-list-toolbar-right.css-mncuj7");if(!e)return  false;if(e.querySelector(".qjj-note-library-download-btn"))return  true;const t=function(e){if(!e||"string"!=typeof e)return null;try{const t=e.indexOf("#"),n=-1!==t?e.slice(t+1):e,o=n.indexOf("?");return -1===o?null:new URLSearchParams(n.slice(o+1)).get("libraryId")}catch{return null}}(window.location.href);if(!t)return  false;const n=document.createElement("button");return n.className="qjj-note-library-download-btn",n.textContent="📥 下载笔记库",n.type="button",n.style.cssText="\n      margin-left: 8px;\n      padding: 4px 15px;\n      font-size: 14px;\n      line-height: 1.5;\n      border-radius: 6px;\n      border: 1px solid #d9d9d9;\n      background: #fff;\n      color: rgba(0,0,0,0.88);\n      cursor: pointer;\n      transition: all 0.2s;\n    ",n.onmouseenter=()=>{n.style.borderColor="#6B4CFF",n.style.color="#6B4CFF";},n.onmouseleave=()=>{n.style.borderColor="#d9d9d9",n.style.color="rgba(0,0,0,0.88)";},n.onclick=async()=>{n.disabled=true,n.textContent="⏳ 下载中...";try{await $(t),n.textContent="✅ 下载完成",setTimeout(()=>{n.textContent="📥 下载笔记库",n.disabled=!1;},2e3);}catch(e){n.textContent="❌ 下载失败",setTimeout(()=>{n.textContent="📥 下载笔记库",n.disabled=false;},2e3);}},e.appendChild(n),true};if(e())return;const t=new MutationObserver(()=>{e()&&t.disconnect();});t.observe(document.body,{childList:true,subtree:true});}function H(){(function(){const e=window.location.href;return e.includes("galaxy.alibaba-inc.com")&&e.includes("/myNoteRepository/noteDetailsList")})()&&z();}window.self===window.top&&(createApp(B).use(y).mount((()=>{const e=document.createElement("div");return e.style.position="absolute",e.style.top="0",e.style.left="0",e.style.zIndex="10000",document.body.append(e),e})()),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",H):H());

		})
	};
}));

System.register("./XHS-BFa4sA7T-DddofJSb.js", ['./__monkey.entry-uhykG5-y.js', 'vue', 'naive-ui'], (function (exports, module) {
	'use strict';
	var E, R, defineAsyncComponent, ref, computed, resolveComponent, openBlock, createElementBlock, createVNode, withCtx, Fragment, renderList, createBlock, createTextVNode, toDisplayString, resolveDynamicComponent, useMessage;
	return {
		setters: [module => {
			E = module.E;
			R = module.R;
		}, module => {
			defineAsyncComponent = module.defineAsyncComponent;
			ref = module.ref;
			computed = module.computed;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			Fragment = module.Fragment;
			renderList = module.renderList;
			createBlock = module.createBlock;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			resolveDynamicComponent = module.resolveDynamicComponent;
		}, module => {
			useMessage = module.useMessage;
		}],
		execute: (function () {

			class g{constructor(){this.isLoading=false,this.tableData=[],this.responseData=[],this.stats={totalCreativity:0,clickUrlCounts:[],expoUrlCounts:[]};}async checkLinks(){this.isLoading=true,this.clearData();try{const e=await this.fetchAllData();return this.responseData=e,this.tableData=e,this.processStats(e),{success:!0,data:e}}catch(e){return {success:false,error:e.message}}finally{this.isLoading=false;}}async fetchAllData(){let e=4,t=1,a=1,i=[];do{const n=this.getHeaders(),o=await fetch(`https://ad.xiaohongshu.com/api/leona/rtb/creativity/list?pageNum=${t}&pageSize=50`,{method:"POST",headers:n,body:JSON.stringify({startTime:(new Date).toISOString().split("T")[0],endTime:(new Date).toISOString().split("T")[0],pageNum:t,pageSize:50})}),s=await o.json();if(!(s&&s.data&&s.data.list))throw new Error("API 返回数据格式不正确");i=i.concat(s.data.list),a=s.data.totalPage,e=s.data.totalPage,t++;}while(t<=a&&t<=e);return i}getHeaders(){const e={accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json;charset=UTF-8",priority:"u=1, i","sec-ch-ua":'"Not A(Brand";v="8", "Chromium";v="132", "Microsoft Edge";v="132"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"Windows"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin",Referer:location.href,Origin:location.origin,"User-Agent":navigator.userAgent};return  -1!==location.href.indexOf("vSellerId")&&(e["v-seller-id"]=location.search.match(new RegExp("(?<=vSellerId=)[0-9a-z].*","g"))),e}processStats(e){this.stats.totalCreativity=new Set(e.map(e=>e.creativityId)).size;const t=(e,t)=>{const a={};return e.forEach(e=>{Array.isArray(e[t])&&e[t].forEach(e=>{e&&(a[e]=(a[e]||0)+1);});}),Object.entries(a).map(([e,t])=>({url:e,count:t,displayUrl:this.ellipsisUrl(e)}))};this.stats.clickUrlCounts=t(e,"clickUrls"),this.stats.expoUrlCounts=t(e,"expoUrls");}ellipsisUrl(e,t=30,a=30){return e.length<=t+a+3?e:e.slice(0,t)+"..."+e.slice(-a)}extractUrlParam(e){if(!e)return "";const t=e.match(/https:\/\/magellan\.alimama\.com\/(.*?)&/);return t?t[1]:e}clearData(){this.tableData=[],this.responseData=[],this.stats={totalCreativity:0,clickUrlCounts:[],expoUrlCounts:[]};}downloadCSV(){if(0===this.responseData.length)return;const e=[["创建时间","创意名","创意ID","点击链接","曝光链接","笔记id"].join(",")];this.responseData.forEach(t=>{const a=[t.creativityCreateTime||"",t.creativityName||"",t.creativityId||"",JSON.stringify(t.clickUrls)||"",JSON.stringify(t.expoUrls)||"",t.noteId+""||""].map(e=>"string"!=typeof e?e:e.includes(",")||e.includes('"')||e.includes("\n")?`"${e.replace(/"/g,'""')}"`:e);e.push(a.join(","));});const t="\ufeff"+e.join("\n"),a=new Blob([t],{type:"text/csv;charset=utf-8"}),i=URL.createObjectURL(a),n=document.createElement("a"),o=(new Date).toLocaleString().replace(/[/:]/g,"-");n.setAttribute("href",i),n.setAttribute("download",`data_${o}.csv`),document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(i);}getState(){return {isLoading:this.isLoading,tableData:this.tableData,stats:this.stats,hasData:this.responseData.length>0}}} exports("L", g);"undefined"!=typeof module&&module.exports?module.exports=g:"undefined"!=typeof window&&(window.LinkChecker=g);const b={class:"button-container"},k=E({__name:"XHS",setup(e){const k=defineAsyncComponent(()=>R(()=>module.import('./BatchRenameXhs-GgTlNBmJ-YGqe69UJ.js'),void 0)),_=defineAsyncComponent(()=>R(()=>module.import('./BatchPrice-B2HNhbVw-CH2sM9kl.js'),void 0)),v=defineAsyncComponent(()=>R(()=>module.import('./XhsPlanSettings-DmkwTgT4-BuITX90x.js'),void 0)),w=defineAsyncComponent(()=>R(()=>module.import('./CreateXhsPlan-DHxhkYlk-D0vnrJ9F.js'),void 0)),S=defineAsyncComponent(()=>R(()=>module.import('./XhsPlanBudget-Cn7qumAV-DP12Ny_a.js'),void 0)),P=defineAsyncComponent(()=>R(()=>module.import('./LinkCheckerComponent-cdgOnSHE-9AiZrZCa.js'),void 0)),x=defineAsyncComponent(()=>R(()=>module.import('./XhsDataExtractor-CMV8PoMO-C5TZ_BfD.js'),void 0)),E=new g,C=useMessage(),D=ref(false),O=ref(false);ref(false);const U=ref({rename:false,batchPrice:false,setPlan:false,createPlan:false,plan:false,linkChecker:false,dataExtractor:false}),j=ref({linkChecker:null}),L=[{key:"linkChecker",title:"链接检查结果",component:P},{key:"rename",title:"修改创意名称",component:k},{key:"batchPrice",title:"批量调价",component:_},{key:"setPlan",title:"创意关闭",component:v},{key:"createPlan",title:"红书半自动搭建计划",component:w},{key:"plan",title:"计划调预算",component:S},{key:"dataExtractor",title:"查询数据",component:x}],I=e=>{U.value[e]=true;},T=computed(()=>[{key:"checkLinks",type:"primary",icon:"✅",label:D.value?"检查中...":"检查链接",action:z,loadingRef:D},{key:"rename",type:"primary",icon:"✏️",label:"修改名称",action:()=>I("rename")},{key:"batchPrice",type:"primary",icon:"💰",label:"批量调价",action:()=>I("batchPrice"),disabled:true},{key:"setPlan",type:"primary",icon:"🚫",label:"关闭创意",action:()=>I("setPlan")},{key:"createPlan",type:"primary",icon:"➕",label:"半自动搭建创意",action:()=>I("createPlan")},{key:"plan",type:"primary",icon:"📉",label:"计划调预算",action:()=>I("plan")},{key:"dataExtractor",type:"primary",icon:"📊",label:"查询数据",action:()=>I("dataExtractor")},{key:"downloadExcel_info",type:"primary",icon:"📥",label:O.value?"下载中...":"下载创意数据",action:R$1,loadingRef:O},{key:"downloadExcel_dx",type:"primary",icon:"📥",label:"下载计划数据",action:A}]);async function A(){C.info("开始下载");const e=await fetch("https://ad.xiaohongshu.com/api/leona/rtb/target/template/query",{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Microsoft Edge";v="143", "Chromium";v="143", "Not A(Brand";v="24"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","v-seller-id":"693667934d79260023bfbf1d","x-b3-traceid":"106871e307dedbab"},body:'{"page":1,"pageSize":50}',method:"POST",mode:"cors",credentials:"include"}),t=(await e.json()).data.list;let a=[];for(let i=0;i<t.length;i++){const e=t[i];if(!(e.unitList&&e.unitList.length>0))continue;const n=e.unitList,o=[];for(let t=0;t<n.length;t++){const a={id:n[t],name:e.name};o.push(a);}a=a.concat(o);}}async function R$1(){C.info("开始下载"),O.value=true;try{let e=4,t=1,a=1,i=[];do{const e={accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json;charset=UTF-8",priority:"u=1, i","sec-ch-ua":'"Not A(Brand";v="8", "Chromium";v="132", "Microsoft Edge";v="132"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"Windows"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin",Referer:location.href,Origin:location.origin};-1!==location.href.indexOf("vSellerId")&&(e["v-seller-id"]=location.search.match(new RegExp("(?<=vSellerId=)[0-9a-z].*","g")));const n=await fetch(`https://ad.xiaohongshu.com/api/leona/rtb/creativity/list?pageNum=${t}&pageSize=50`,{method:"POST",headers:e,body:JSON.stringify({startTime:(new Date).toISOString().split("T")[0],endTime:(new Date).toISOString().split("T")[0],pageNum:t,pageSize:50}),mode:"cors",credentials:"include"}),o=await n.json();if(!(o&&o.data&&o.data.list))throw new Error("API 返回数据格式不正确");i=i.concat(o.data.list),a=o.data.totalPage,t++;}while(t<=a&&t<=e);C.success("读取成功");}catch(e){C.error("读取报错，可能是没有配置或网络问题");}finally{O.value=false;}}async function z(){D.value=true;try{const e=await E.checkLinks();e.success?(j.value.linkChecker=e.data,I("linkChecker"),C.success("成功",{duration:3e3,closable:!0})):C.info("失败",{duration:3e3,closable:!0});}catch{C.error("失败",{duration:3e3,closable:true});}finally{D.value=false;}}return (e,t)=>{const a=resolveComponent("n-icon"),i=resolveComponent("n-button"),n=resolveComponent("n-space"),f=resolveComponent("n-modal");return openBlock(),createElementBlock("div",b,[createVNode(n,{justify:"space-between",wrap:""},{default:withCtx(()=>[(openBlock(true),createElementBlock(Fragment,null,renderList(T.value,e=>(openBlock(),createBlock(i,{key:e.key,type:e.type,size:"large",style:{flex:"1","min-width":"150px",margin:"4px"},onClick:e.action,loading:!!e.loadingRef&&e.loadingRef.value,disabled:e.disabled||false},{icon:withCtx(()=>[createVNode(a,null,{default:withCtx(()=>[createTextVNode(toDisplayString(e.icon),1)]),_:2},1024)]),default:withCtx(()=>[createTextVNode(" "+toDisplayString(e.label),1)]),_:2},1032,["type","onClick","loading","disabled"]))),128))]),_:1}),(openBlock(),createElementBlock(Fragment,null,renderList(L,e=>createVNode(f,{key:e.key,show:U.value[e.key],"onUpdate:show":t=>U.value[e.key]=t,preset:"card",class:"app-modal",title:e.title,bordered:false,"mask-closable":true,"close-on-esc":true},{default:withCtx(()=>[(openBlock(),createBlock(resolveDynamicComponent(e.component),{show:U.value[e.key],data:j.value[e.key],"onUpdate:show":t=>U.value[e.key]=t},null,40,["show","data","onUpdate:show"]))]),_:2},1032,["show","onUpdate:show","title"])),64))])}}},[["__scopeId","data-v-69879f9c"]]),_=exports("X", Object.freeze(Object.defineProperty({__proto__:null,default:k},Symbol.toStringTag,{value:"Module"})));

		})
	};
}));

System.register("./app-CNnHPG9F-KnIQ7wNG.js", ['./__monkey.entry-uhykG5-y.js', 'vue', './PlatformLauncher-NGbjfHii-CQ6BdTX0.js', 'naive-ui'], (function (exports, module) {
	'use strict';
	var E, R, defineAsyncComponent, ref, resolveComponent, openBlock, createBlock, withCtx, createTextVNode, createVNode, createCommentVNode, U;
	return {
		setters: [module => {
			E = module.E;
			R = module.R;
		}, module => {
			defineAsyncComponent = module.defineAsyncComponent;
			ref = module.ref;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createBlock = module.createBlock;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			createVNode = module.createVNode;
			createCommentVNode = module.createCommentVNode;
		}, module => {
			U = module.U;
		}, null],
		execute: (function () {

			const u=exports("default", E({__name:"app",setup(e){const u=defineAsyncComponent(()=>R(()=>module.import('./ZhitouCreative-BqZ8YslW-D_gU7Xvh.js'),void 0)),m=defineAsyncComponent(()=>R(()=>module.import('./ZhitouPlan-Lgy35ku--C7Szsnx-.js'),void 0)),y=defineAsyncComponent(()=>R(()=>module.import('./ZhitouCreativeFetcher-ECoK2xK5-v9iXXqKi.js'),void 0)),h=defineAsyncComponent(()=>R(()=>module.import('./ZhitouSearch-B1zWKDqu-BOugsqxw.js'),void 0)),E=defineAsyncComponent(()=>R(()=>module.import('./ZhitouNoteMatcher-ttQqTTpq-wHmcMgtF.js'),void 0)),b=defineAsyncComponent(()=>R(()=>module.import('./ZhitouFeedFlow-CebUiKUa-BgcKGvbR.js'),void 0)),j=defineAsyncComponent(()=>R(()=>module.import('./ZhitouIndustryCombine-zmJOpn2H-yTVHsxf2.js'),void 0)),P=ref(false),f=[{key:"chuangyi",label:"创意关闭/开启",type:"primary",icon:"🚫",component:u,title:"批量关闭创意"},{key:"jihua",label:"计划关闭/调预算",type:"info",icon:"💰",component:m,title:"计划批量关闭/调价操作"},{key:"getchuangyi",label:"查看计划",type:"success",icon:"👁️",component:y,title:"查看计划"},{key:"sosuo",label:"调搜索出价",type:"warning",icon:"🔍",component:h,title:"调整搜索出价"},{key:"noteMatch",label:"笔记匹配",type:"success",icon:"🔗",component:E,title:"笔记匹配"},{key:"xingxiliu",label:"信息流出价",type:"warning",icon:"📢",component:b,title:"信息流出价"},{key:"industryCombine",label:"行业合集笔记",type:"success",icon:"📒",component:j,title:"行业合集笔记ID查询"}];return (e,t)=>{const o=resolveComponent("n-icon"),i=resolveComponent("n-alert");return openBlock(),createBlock(U,{tools:f},{alert:withCtx(()=>[P.value?(openBlock(),createBlock(i,{key:0,type:"info",closable:""},{icon:withCtx(()=>[createVNode(o,null,{default:withCtx(()=>[...t[0]||(t[0]=[createTextVNode("🔊",-1)])]),_:1})]),default:withCtx(()=>[t[1]||(t[1]=createTextVNode(" 正在监听中...捕获到的queryJobPs请求将显示在浏览器控制台 ",-1))]),_:1})):createCommentVNode("",true)]),_:1})}}},[["__scopeId","data-v-073a8fd0"]]));

		})
	};
}));

System.register("./app-Cl8xTo7X-VGmPsdJU.js", ['./__monkey.entry-uhykG5-y.js', 'vue', './PlatformLauncher-NGbjfHii-CQ6BdTX0.js', 'naive-ui'], (function (exports, module) {
	'use strict';
	var E, R, defineAsyncComponent, openBlock, createBlock, ref, onMounted, resolveComponent, createElementBlock, createVNode, withCtx, createTextVNode, createElementVNode, Fragment, renderList, toDisplayString, createCommentVNode, U, useMessage;
	return {
		setters: [module => {
			E = module.E;
			R = module.R;
		}, module => {
			defineAsyncComponent = module.defineAsyncComponent;
			openBlock = module.openBlock;
			createBlock = module.createBlock;
			ref = module.ref;
			onMounted = module.onMounted;
			resolveComponent = module.resolveComponent;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			createElementVNode = module.createElementVNode;
			Fragment = module.Fragment;
			renderList = module.renderList;
			toDisplayString = module.toDisplayString;
			createCommentVNode = module.createCommentVNode;
		}, module => {
			U = module.U;
		}, module => {
			useMessage = module.useMessage;
		}],
		execute: (function () {

			const g={class:"kuaishou-container"},b=E({__name:"kuaishou",setup(e){const t=useMessage(),f=ref({batchData:""}),v=ref(false),b=ref([]),k=ref([]),w=['input[placeholder="请输入广告计划名称"]',"#ad_from_unitName_unitName input.ant-input",'input[placeholder="请输入创意名称"]'],E=['input[placeholder="填写后使用直达链接，不填则会使用落地页"]'],S=['input[placeholder="请填写https://开头的链接；如投放原生广告，配置落地页应具备调起APP能力"]'];onMounted(()=>{x(),D("快手广告填表工具已启动");});const x=()=>{f.value.batchData=localStorage.getItem("ks_batchData")||"";},D=e=>{const t=(new Date).toLocaleTimeString();b.value.unshift(`[${t}] ${e}`),b.value.length>50&&(b.value=b.value.slice(0,50));},L=()=>f.value.batchData.trim().split("\n").map((e,t)=>{const a=e.trim().split("\t");return a.length>=3?{index:t+1,title:a[0]||"",h5Link:a[1]||"",directLink:a[2]||"",isIOS:true}:null}).filter(Boolean),I=()=>{k.value=L(),0!==k.value.length?(D(`解析完成，共 ${k.value.length} 条数据`),t.success(`已解析 ${k.value.length} 条数据`)):t.warning("请先输入有效的批量数据");},C=(e,t)=>{let a=0;return e.forEach(e=>{try{const l=document.querySelector(e);if(l){l.value=t;const e=new Event("change",{bubbles:!0});l.dispatchEvent(e);const n=new Event("input",{bubbles:!0});l.dispatchEvent(n);const i=Object.keys(l).find(e=>e.startsWith("__reactEventHandlers"));i&&l[i]&&l[i].onChange&&l[i].onChange(e),a++;}}catch(l){}}),a},O=e=>new Promise(t=>setTimeout(t,e)),P=async()=>{const e=document.querySelector('div[data-substep="3-nativeAdvertising"]').innerText;if(f.value.batchData.trim()){v.value=true;try{const a=L();if(0===a.length)return void t.warning("没有有效的数据可以处理");D(`开始批量填充，共 ${a.length} 条数据`);const l=a.filter(t=>e.includes(t.title))[0],n=C(w,l.title);D(`填充标题: ${l.title} (成功 ${n} 个字段)`),await O(300);const i=C(E,l.directLink);if(D(`填充直达链接: ${l.directLink} (成功 ${i} 个字段)`),await O(300),l.isIOS){const e=C(S,l.h5Link);D(`检测到iOS，填充H5链接: ${l.h5Link} (成功 ${e} 个字段)`);}t.success("表单填充完成"),D("批量填充操作完成"),await async function(){document.querySelectorAll('label:has(input[type="checkbox"])').forEach(e=>{if(e.textContent.includes("显示素材名称")){const t=e.querySelector('input[type="checkbox"]');t&&t.click();}});let e=null,t=0;for(;!e&&t<3;)t++,e=document.querySelector('div.ant-typography[rows="2"]:has(span[aria-hidden="true"])'),!e&&t<3&&await new Promise(e=>setTimeout(e,500));if(e){let t=e.textContent.trim();t.length>26&&(t=t.slice(0,26)+"...",C(['div[placeholder="请输入广告语或使用推荐的广告语，回车或点击「添加广告语」可新增"]'],t));}}();}catch(a){t.error("填充表单失败: "+a.message),D("填充失败: "+a.message);}finally{v.value=false;}}else t.warning("请先输入批量数据");},A=()=>{localStorage.removeItem("ks_batchData"),f.value.batchData="",k.value=[],b.value=[],t.success("已清除所有数据");};return (e,t)=>{const a=resolveComponent("n-input"),l=resolveComponent("n-text"),y=resolveComponent("n-form-item"),w=resolveComponent("n-button"),E=resolveComponent("n-grid-item"),S=resolveComponent("n-grid"),x=resolveComponent("n-tag"),D=resolveComponent("n-table"),L=resolveComponent("n-collapse-item"),C=resolveComponent("n-collapse"),O=resolveComponent("n-log"),$=resolveComponent("n-space"),z=resolveComponent("n-card");return openBlock(),createElementBlock("div",g,[createVNode(z,{title:"快手广告填表工具",class:"app-card tool-card"},{default:withCtx(()=>[createVNode($,{vertical:"",size:16},{default:withCtx(()=>[createVNode(y,{label:"批量数据输入"},{feedback:withCtx(()=>[createVNode(l,{depth:"3",style:{"font-size":"12px"}},{default:withCtx(()=>[...t[2]||(t[2]=[createTextVNode(" 格式示例：达人昵称-计划信息 h5 dp ",-1)])]),_:1})]),default:withCtx(()=>[createVNode(a,{value:f.value.batchData,"onUpdate:value":[t[0]||(t[0]=e=>f.value.batchData=e),t[1]||(t[1]=e=>{return t="batchData",a=e,void localStorage.setItem(`ks_${t}`,a);var t,a;})],type:"textarea",placeholder:"请按格式输入：达人昵称[TAB]H5链接[TAB]直达链接，每行一条数据",autosize:{minRows:4,maxRows:8}},null,8,["value"])]),_:1}),createVNode(S,{cols:3,"x-gap":12,"y-gap":12},{default:withCtx(()=>[createVNode(E,null,{default:withCtx(()=>[createVNode(w,{type:"primary",block:"",size:"large",onClick:P,loading:v.value},{icon:withCtx(()=>[...t[3]||(t[3]=[createElementVNode("span",{style:{"font-size":"16px"}},"✏️",-1)])]),default:withCtx(()=>[t[4]||(t[4]=createTextVNode(" 批量填充表单 ",-1))]),_:1},8,["loading"])]),_:1}),createVNode(E,null,{default:withCtx(()=>[createVNode(w,{type:"default",block:"",size:"large",onClick:A},{icon:withCtx(()=>[...t[5]||(t[5]=[createElementVNode("span",{style:{"font-size":"16px"}},"🗑️",-1)])]),default:withCtx(()=>[t[6]||(t[6]=createTextVNode(" 清除所有数据 ",-1))]),_:1})]),_:1}),createVNode(E,null,{default:withCtx(()=>[createVNode(w,{type:"primary",block:"",size:"large",onClick:I},{icon:withCtx(()=>[...t[7]||(t[7]=[createElementVNode("span",{style:{"font-size":"16px"}},"👁️",-1)])]),default:withCtx(()=>[t[8]||(t[8]=createTextVNode(" 预览解析数据 ",-1))]),_:1})]),_:1})]),_:1}),k.value.length>0?(openBlock(),createBlock(C,{key:0},{default:withCtx(()=>[createVNode(L,{title:"数据预览",name:"preview"},{default:withCtx(()=>[createVNode(D,{bordered:false,"single-line":false,size:"small"},{default:withCtx(()=>[t[9]||(t[9]=createElementVNode("thead",null,[createElementVNode("tr",null,[createElementVNode("th",null,"序号"),createElementVNode("th",null,"标题名称"),createElementVNode("th",null,"H5链接"),createElementVNode("th",null,"直达链接"),createElementVNode("th",null,"是否iOS")])],-1)),createElementVNode("tbody",null,[(openBlock(true),createElementBlock(Fragment,null,renderList(k.value,(e,t)=>(openBlock(),createElementBlock("tr",{key:t},[createElementVNode("td",null,toDisplayString(t+1),1),createElementVNode("td",null,toDisplayString(e.title),1),createElementVNode("td",null,toDisplayString(e.h5Link),1),createElementVNode("td",null,toDisplayString(e.directLink),1),createElementVNode("td",null,[createVNode(x,{type:e.isIOS?"success":"default",size:"small"},{default:withCtx(()=>[createTextVNode(toDisplayString(e.isIOS?"iOS":"普通"),1)]),_:2},1032,["type"])])]))),128))])]),_:1})]),_:1})]),_:1})):createCommentVNode("",true),b.value.length>0?(openBlock(),createBlock(C,{key:1},{default:withCtx(()=>[createVNode(L,{title:"操作日志",name:"logs"},{default:withCtx(()=>[createVNode(O,{log:b.value.join("\n"),rows:6},null,8,["log"])]),_:1})]),_:1})):createCommentVNode("",true)]),_:1})]),_:1})])}}},[["__scopeId","data-v-b68b63b2"]]),k=exports("default", E({__name:"app",setup(e){const a=defineAsyncComponent(()=>R(()=>module.import('./KuaishouPlanCloser-BjZjeetj-C0bRDj37.js'),void 0)),l=defineAsyncComponent(()=>R(()=>module.import('./KuaishouMixCut-C6lvl9ZD-BUIo0QcK.js'),void 0)),n=defineAsyncComponent(()=>R(()=>module.import('./KuaishouAdCreator-C1qxsiHV-B9JsQKpk.js'),void 0)),o=defineAsyncComponent(()=>R(()=>module.import('./KuaishouAdCreatorVariant-C8wa3np4-elzfLWyJ.js'),void 0)),u=defineAsyncComponent(()=>R(()=>module.import('./KuaishouPlanFetcher-LmCimDqM-CzNacT5Q.js'),void 0)),s=[{key:"kuaishou",label:"快手填表",type:"primary",icon:"📝",component:b,title:"快手广告填表工具"},{key:"close",label:"创意关闭",type:"error",icon:"🚫",component:a,title:"快手创意关闭"},{key:"hunjian",label:"混剪工具",type:"success",icon:"🎬",component:l,title:"快手混剪工具"},{key:"adCreator",label:"广告创建",type:"info",icon:"➕",component:n,title:"快手广告创建工具"},{key:"adCreatorYS",label:"广告创建_原生",type:"info",icon:"➕",component:o,title:"快手广告创建工具_原生"},{key:"get_plan",label:"获取今日计划",type:"primary",icon:"📋",component:u,title:"获取今日计划"}];return (e,t)=>(openBlock(),createBlock(U,{tools:s}))}},[["__scopeId","data-v-58cc9d22"]]));

		})
	};
}));

System.register("./app-DiZBVrAJ-Sj81A4g9.js", ['./__monkey.entry-uhykG5-y.js', 'vue', './PlatformLauncher-NGbjfHii-CQ6BdTX0.js', 'naive-ui'], (function (exports, module) {
	'use strict';
	var E, R, defineAsyncComponent, ref, resolveComponent, openBlock, createBlock, withCtx, createTextVNode, createVNode, createCommentVNode, U;
	return {
		setters: [module => {
			E = module.E;
			R = module.R;
		}, module => {
			defineAsyncComponent = module.defineAsyncComponent;
			ref = module.ref;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createBlock = module.createBlock;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			createVNode = module.createVNode;
			createCommentVNode = module.createCommentVNode;
		}, module => {
			U = module.U;
		}, null],
		execute: (function () {

			const u=exports("default", E({__name:"app",setup(e){const u=defineAsyncComponent(()=>R(()=>module.import('./XingrengwuBatchMixCut-DVpK_-k5-VXGHWqrF.js'),void 0)),c=defineAsyncComponent(()=>R(()=>module.import('./XingrengwuPreview-Xs9TMCXJ-D-27LdPe.js'),void 0)),f=ref(false),y=[{key:"hunjianpiliang",label:"混剪批量处理",type:"primary",icon:"🎬",component:u,title:"混剪批量处理"},{key:"ys",label:"原生批量处理",type:"primary",icon:"📹",component:c,title:"原生批量处理"}];return (e,t)=>{const n=resolveComponent("n-icon"),o=resolveComponent("n-alert");return openBlock(),createBlock(U,{tools:y},{alert:withCtx(()=>[f.value?(openBlock(),createBlock(o,{key:0,type:"info",closable:""},{icon:withCtx(()=>[createVNode(n,null,{default:withCtx(()=>[...t[0]||(t[0]=[createTextVNode("🔊",-1)])]),_:1})]),default:withCtx(()=>[t[1]||(t[1]=createTextVNode(" 正在监听中...捕获到的_tb_token_值将自动传递给混剪批量处理工具 ",-1))]),_:1})):createCommentVNode("",true)]),_:1})}}},[["__scopeId","data-v-17de9e4f"]]));

		})
	};
}));

System.register("./app-MDdjp93N-T1R4lgU6.js", ['vue', './PlatformLauncher-NGbjfHii-CQ6BdTX0.js', 'naive-ui', './excel-BvJYwHkl-BaK_RhZw.js', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var openBlock, createBlock, ref, watch, computed, onMounted, createElementBlock, createVNode, unref, withCtx, createElementVNode, createTextVNode, createCommentVNode, toDisplayString, Fragment, renderList, U, NCard, NSpace, NButton, NInput, NSwitch, NDataTable, NEmpty, NModal, NAlert, NForm, NFormItem, NScrollbar, NCollapse, NCollapseItem, NGrid, NGi, NDynamicTags, e, E$1;
	return {
		setters: [module => {
			openBlock = module.openBlock;
			createBlock = module.createBlock;
			ref = module.ref;
			watch = module.watch;
			computed = module.computed;
			onMounted = module.onMounted;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			unref = module.unref;
			withCtx = module.withCtx;
			createElementVNode = module.createElementVNode;
			createTextVNode = module.createTextVNode;
			createCommentVNode = module.createCommentVNode;
			toDisplayString = module.toDisplayString;
			Fragment = module.Fragment;
			renderList = module.renderList;
		}, module => {
			U = module.U;
		}, module => {
			NCard = module.NCard;
			NSpace = module.NSpace;
			NButton = module.NButton;
			NInput = module.NInput;
			NSwitch = module.NSwitch;
			NDataTable = module.NDataTable;
			NEmpty = module.NEmpty;
			NModal = module.NModal;
			NAlert = module.NAlert;
			NForm = module.NForm;
			NFormItem = module.NFormItem;
			NScrollbar = module.NScrollbar;
			NCollapse = module.NCollapse;
			NCollapseItem = module.NCollapseItem;
			NGrid = module.NGrid;
			NGi = module.NGi;
			NDynamicTags = module.NDynamicTags;
		}, module => {
			e = module.e;
		}, module => {
			E$1 = module.E;
		}],
		execute: (function () {

			const E={class:"kanban-table-container"},K={style:{"margin-bottom":"16px"}},q=E$1({__name:"KanbanDataTable",setup(y){const f=ref([]),m=ref(false),S=ref(null),j=ref(""),M=ref(""),O=ref(true);let w=null;watch(j,e=>{clearTimeout(w),w=setTimeout(()=>{M.value=e;},300);});const V={pageSize:20},F=computed(()=>{if(P.value&&0!==P.value.length)return Math.max(1200,150*P.value.length)}),z=async()=>{try{const e=await new Promise((e,t)=>{const a=indexedDB.open("RequestDataDB",1);a.onerror=e=>{t(e.target.error);},a.onsuccess=t=>{e(t.target.result);},a.onupgradeneeded=e=>{const t=e.target.result;t.objectStoreNames.contains("requests")||t.createObjectStore("requests",{keyPath:"id"}).createIndex("name","name",{unique:!1});};}),t=e.transaction(["requests"],"readonly"),a=t.objectStore("requests").getAll();a.onsuccess=t=>{const a=t.target.result.filter(e=>"alibaba_responseData"===e.name).map(e=>e.data);let l=null;try{const e=GM_getValue("exported_data");e&&(l=JSON.parse(e));}catch(n){}f.value=a,e.close();},a.onerror=t=>{e.close();};}catch(e){}},A=(e,t)=>{const a=t.split(".");let l=e;for(const n of a){if(!l||"object"!=typeof l||!(n in l))return;l=l[n];}return l},N=()=>{W.value&&0!==W.value.length?e(W.value,`alibaba_data_${(new Date).toISOString().slice(0,10)}`):alert("没有数据可导出");},q=[{condition:e=>e&&e.includes("信息流"),value:"信息流"},{condition:e=>e&&e.includes("搜索"),value:"搜索"},{condition:e=>e&&e.includes("视频流"),value:"视频流"},{condition:()=>true,value:"未匹配上"}],D=new Map,J=new Map,$=e=>(D.has(e)||D.set(e,(t,a)=>{const l=A(t,e),n=A(a,e);if("number"==typeof l&&"number"==typeof n)return l-n;const o=String(l||""),r=String(n||"");return o.localeCompare(r)}),D.get(e)),I=e=>(J.has(e)||J.set(e,t=>(e=>{if(null==e)return "N/A";if("object"==typeof e){const t=JSON.stringify(e);return t.length>100?t.substring(0,100)+"...":t}return "string"==typeof e&&e.length>100?e.substring(0,100)+"...":e})(A(t,e))),J.get(e)),P=computed(()=>{if(!W.value||0===W.value.length)return [];const e=W.value[0];if(!e)return [];return Object.keys(e).map(e=>({title:e,key:e,ellipsis:true,maxWidth:200,sorter:$(e),render:I(e)}))}),L=computed(()=>[{title:"分类字段",key:"category",ellipsis:true,maxWidth:200},{title:"记录数",key:"count",sorter:(e,t)=>e.count-t.count},{title:"总消耗",key:"totalCost",sorter:(e,t)=>e.totalCost-t.totalCost,render:e=>e.totalCost.toFixed(2)},{title:"平均消耗",key:"avgCost",sorter:(e,t)=>e.avgCost-t.avgCost,render:e=>e.avgCost.toFixed(2)},{title:"总UV",key:"totalUv",sorter:(e,t)=>e.totalUv-t.totalUv},{title:"平均UV成本",key:"avgUvCost",sorter:(e,t)=>e.avgUvCost-t.avgUvCost,render:e=>e.avgUvCost.toFixed(2)}]),T=computed(()=>{if(!M.value)return W.value;const e=M.value.toLowerCase();return W.value.filter(t=>Object.keys(t).slice(0,15).some(a=>{const l=A(t,a);return String(l).toLowerCase().includes(e)}))}),B=computed(()=>((e,t="星任务分类")=>{if(!e||0===e.length)return [];const a={};return e.forEach(e=>{const l=e[t]||"未分类";a[l]||(a[l]={category:l,count:0,totalCost:0,totalUv:0}),a[l].count+=1,a[l].totalCost+=parseFloat(e["消耗"])||0,a[l].totalUv+=parseFloat(e["3d_last_click_商品三级行业_标准搜索uv"])||0;}),Object.values(a).map(e=>{const t=e.totalUv>0?e.totalCost/e.totalUv:0;return {...e,avgCost:e.count>0?e.totalCost/e.count:0,avgUvCost:t}})})(W.value,"星任务分类")),W=computed(()=>{if(!f.value||0===f.value.length)return [];let e=[];f.value.forEach((t,a)=>{const l=t.response?.data;l&&(Array.isArray(l)?l.forEach(t=>{e.push({...t});}):e.push({...l}));});const t=(()=>{try{const e=GM_getValue("exported_data");if(e)return JSON.parse(e)}catch(e){}return null})();var a,l,n;return a="创意名称",l=q,n="type",e=e.map(e=>{const t=e[a];let o=null;for(const a of l)if(a.condition(t,e)){o=a.value;break}return null===o&&l.default&&(o="function"==typeof l.default?l.default(t,e):l.default),{...e,[n]:o}}),e=((e,t)=>{const a=new Map;return t&&Object.keys(t).forEach(e=>{const l=t[e];Array.isArray(l)&&l.forEach(t=>{"string"==typeof t?a.set(t,e):"number"==typeof t&&a.set(t.toString(),e);});}),e.map(e=>{const t=e["星任务id"];let l="未匹配";if(null!=t){const e=t.toString();a.has(e)&&(l=a.get(e));}return {...e,"星任务分类":l}})})(e,t),e=(e=>e.map(e=>{const t=parseFloat(e["消耗"])||0,a=parseFloat(e["3d_last_click_商品三级行业_标准搜索uv"])||0;if(0===t||0===a)return {...e,"uv成本":0};const l=t/a;return {...e,"uv成本":parseFloat(l).toFixed(2)}}))(e),e});return onMounted(()=>{z();}),(e,t)=>(openBlock(),createElementBlock("div",E,[createVNode(unref(NCard),{title:"阿里接口响应数据",size:"small"},{default:withCtx(()=>[createElementVNode("div",K,[createVNode(unref(NSpace),null,{default:withCtx(()=>[createVNode(unref(NButton),{onClick:N,size:"small"},{default:withCtx(()=>[...t[3]||(t[3]=[createTextVNode(" 📥 导出 CSV ",-1)])]),_:1}),createVNode(unref(NInput),{value:j.value,"onUpdate:value":t[0]||(t[0]=e=>j.value=e),placeholder:"搜索...",size:"small",style:{width:"200px"}},null,8,["value"]),createVNode(unref(NSwitch),{value:O.value,"onUpdate:value":t[1]||(t[1]=e=>O.value=e),size:"small"},{checked:withCtx(()=>[...t[4]||(t[4]=[createTextVNode(" 隐藏汇总 ",-1)])]),unchecked:withCtx(()=>[...t[5]||(t[5]=[createTextVNode(" 显示汇总 ",-1)])]),_:1},8,["value"])]),_:1})]),O.value&&B.value.length>0?(openBlock(),createBlock(unref(NCard),{key:0,title:"分类汇总数据",style:{"margin-bottom":"20px"},size:"small"},{default:withCtx(()=>[createVNode(unref(NDataTable),{columns:L.value,data:B.value,bordered:true,"single-line":false,style:{"font-size":"12px"}},null,8,["columns","data"])]),_:1})):createCommentVNode("",true),T.value.length>0?(openBlock(),createBlock(unref(NDataTable),{key:1,columns:P.value,data:T.value,pagination:V,bordered:true,"single-line":false,"scroll-x":F.value,style:{"font-size":"12px"}},null,8,["columns","data","scroll-x"])):(openBlock(),createBlock(unref(NEmpty),{key:2,description:"暂无数据"}))]),_:1}),createVNode(unref(NModal),{show:m.value,"onUpdate:show":t[2]||(t[2]=e=>m.value=e),preset:"card",class:"app-modal",segmented:{footer:"soft"}},{default:withCtx(()=>[createElementVNode("pre",null,toDisplayString(JSON.stringify(S.value,null,2)),1)]),_:1},8,["show"])]))}},[["__scopeId","data-v-dcd44f5a"]]),D={class:"option-container"},J={style:{display:"flex","align-items":"center","margin-bottom":"8px"}},$=E$1({__name:"KanbanOptions",setup(t){const a=ref({storageKey:"exported_data"}),p=ref([{key:"",values:[]}]),v=()=>{p.value.push({key:"",values:[]});},m=()=>{confirm("确定要重置所有配置吗？这将清除当前所有配置项！")&&(a.value.storageKey="exported_data",p.value=[{key:"",values:[]}]);},b=()=>{try{const e=GM_getValue(a.value.storageKey);if(e){const t=JSON.parse(e),a=[];Object.keys(t).forEach(e=>{a.push({key:e,values:Array.isArray(t[e])?t[e]:[t[e]]});}),p.value=a,alert(`成功从 GM_Value 读取配置，共加载 ${a.length} 项配置`);}else alert("未找到存储的数据");}catch(e){alert("读取配置失败，请查看控制台了解详情");}},x=()=>{try{if(p.value.some(e=>""===e.key.trim()))return void alert("请确保所有配置项都填写了键名");const e={};p.value.forEach(t=>{""!==t.key.trim()&&(e[t.key]=[...t.values]);}),GM_setValue(a.value.storageKey,JSON.stringify(e)),alert(`数据已成功保存到 GM_setValue，键名为: ${a.value.storageKey}`);}catch(e){alert("保存失败，请查看控制台了解详情");}};return onMounted(()=>{b();}),(e,t)=>(openBlock(),createElementBlock("div",D,[createVNode(unref(NAlert),{type:"info",closable:"",style:{"margin-bottom":"20px"}},{default:withCtx(()=>[...t[0]||(t[0]=[createTextVNode(" 记得点保存 ",-1)])]),_:1}),createVNode(unref(NForm),{model:a.value,"label-placement":"left","label-width":"100"},{default:withCtx(()=>[createVNode(unref(NFormItem),{label:"数据配置 📊"},{default:withCtx(()=>[createVNode(unref(NCard),{embedded:"",bordered:false,style:{"margin-bottom":"15px"}},{default:withCtx(()=>[0===p.value.length?(openBlock(),createBlock(unref(NEmpty),{key:0,description:"暂无配置项"},{extra:withCtx(()=>[createVNode(unref(NButton),{type:"primary",onClick:v},{default:withCtx(()=>[...t[1]||(t[1]=[createTextVNode(" ➕ 添加第一项配置 ",-1)])]),_:1})]),_:1})):(openBlock(),createBlock(unref(NScrollbar),{key:1,trigger:"none",style:{"max-height":"400px","padding-right":"10px"}},{default:withCtx(()=>[createVNode(unref(NCollapse),{"default-expanded-names":"0",accordion:true},{default:withCtx(()=>[(openBlock(true),createElementBlock(Fragment,null,renderList(p.value,(e,a)=>{return openBlock(),createBlock(unref(NCollapseItem),{key:a,name:a.toString(),title:`配置项 ${a+1}${e.key?": "+e.key:""} ${l=e.key,l?l.includes("name")||l.includes("title")?"📝":l.includes("id")||l.includes("num")?"🔢":l.includes("date")||l.includes("time")?"📅":l.includes("url")||l.includes("link")?"🔗":l.includes("email")?"📧":l.includes("phone")||l.includes("tel")?"📱":l.includes("price")||l.includes("cost")?"💰":l.includes("status")?"📌":"🏷️":""}`},{default:withCtx(()=>[createVNode(unref(NGrid),{cols:24,"x-gap":12,"y-gap":12},{default:withCtx(()=>[createVNode(unref(NGi),{span:24},{default:withCtx(()=>[createVNode(unref(NInput),{value:e.key,"onUpdate:value":t=>e.key=t,placeholder:"请输入键名",round:""},null,8,["value","onUpdate:value"])]),_:2},1024),createVNode(unref(NGi),{span:24},{default:withCtx(()=>[createElementVNode("div",J,[t[3]||(t[3]=createElementVNode("span",{style:{"margin-right":"10px"}},"值列表 📋:",-1)),createVNode(unref(NButton),{text:"",onClick:e=>(e=>{const t=["示例值1","示例值2","示例值3"],a=t[Math.floor(Math.random()*t.length)];p.value[e].values.push(a);})(a)},{default:withCtx(()=>[...t[2]||(t[2]=[createTextVNode(" 💡 添加示例值 ",-1)])]),_:1},8,["onClick"])]),createVNode(unref(NDynamicTags),{value:e.values,"onUpdate:value":t=>e.values=t,placeholder:"请输入值并按回车确认，可添加多个值",round:""},null,8,["value","onUpdate:value"])]),_:2},1024),createVNode(unref(NGi),{span:24},{default:withCtx(()=>[createVNode(unref(NSpace),{justify:"end"},{default:withCtx(()=>[createVNode(unref(NButton),{strong:"",secondary:"",type:"default",onClick:e=>(e=>{p.value.splice(e,1);})(a)},{default:withCtx(()=>[...t[4]||(t[4]=[createTextVNode(" 🗑️ 删除此项 ",-1)])]),_:1},8,["onClick"])]),_:2},1024)]),_:2},1024)]),_:2},1024)]),_:2},1032,["name","title"]);var l;}),128))]),_:1})]),_:1}))]),_:1})]),_:1}),createVNode(unref(NButton),{type:"primary",dashed:"",block:"",style:{"margin-top":"10px"},onClick:v},{default:withCtx(()=>[...t[5]||(t[5]=[createTextVNode(" ➕ 添加配置项 ",-1)])]),_:1}),createVNode(unref(NSpace),{justify:"end"},{default:withCtx(()=>[createVNode(unref(NButton),{strong:"",secondary:"",onClick:b},{default:withCtx(()=>[...t[6]||(t[6]=[createTextVNode(" 📥 从 GM_Value 读取 ",-1)])]),_:1}),createVNode(unref(NButton),{strong:"",secondary:"",onClick:m},{default:withCtx(()=>[...t[7]||(t[7]=[createTextVNode(" 🔄 重置 ",-1)])]),_:1}),createVNode(unref(NButton),{type:"primary",onClick:x},{default:withCtx(()=>[...t[8]||(t[8]=[createTextVNode(" 💾 保存到 GM_setValue ",-1)])]),_:1})]),_:1})]),_:1},8,["model"])]))}},[["__scopeId","data-v-6b90735c"]]),I=exports("default", E$1({__name:"app",setup(e){const t=[{key:"table",label:"表格",type:"primary",icon:"📊",component:q,title:"表格"},{key:"option",label:"选项",type:"primary",icon:"⚙️",component:$,title:"选项"}];return (e,a)=>(openBlock(),createBlock(U,{tools:t}))}},[["__scopeId","data-v-38450320"]]));

		})
	};
}));

System.register("./app-B8MPka1L-COSCN6WN.js", ['./__monkey.entry-uhykG5-y.js', 'vue', './PlatformLauncher-NGbjfHii-CQ6BdTX0.js', './excel-BvJYwHkl-BaK_RhZw.js', 'naive-ui'], (function (exports, module) {
	'use strict';
	var E, R, defineAsyncComponent, openBlock, createBlock, U, e;
	return {
		setters: [module => {
			E = module.E;
			R = module.R;
		}, module => {
			defineAsyncComponent = module.defineAsyncComponent;
			openBlock = module.openBlock;
			createBlock = module.createBlock;
		}, module => {
			U = module.U;
		}, module => {
			e = module.e;
		}, null],
		execute: (function () {

			function c(e){const t=new RegExp("(^| )"+e+"=([^;]*)(;|$)"),a=document.cookie.match(t);return a&&a.length>2?unescape(a[2]):""}function s(){return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){const t=16*Math.random()|0;return ("x"===e?t:3&t|8).toString(16)})}async function _(e){const{account_id:t,page_index:a=1,page_size:n=20,from:r,to:i,start_create_time:o,end_create_time:_,report_field:m=["view_count","valid_click_count","ctr","cpc","cost","thousand_display_price","conversions_count","conversions_rate"],media_generation_list:d=["RESOURCE_AGGREGATION_ALL"],use_v3_report:p=true,need_aigc_flag:l=true}=e,x=Math.floor(Date.now()/1e3),u=`https://ad.qq.com/api/v3.0/material_media_list/get?${new URLSearchParams({nonce:x,timestamp:x,page_index:a,page_size:n,report_field:JSON.stringify(m),use_v3_report:p,need_aigc_flag:l,media_generation_list:JSON.stringify(d),from:r,to:i,start_create_time:o,end_create_time:_,account_id:t}).toString()}`,g=s(),f=s(),h=function(){const e=c("skey")||c("gdt_protect")||"";let t=5381;for(let a=0;a<e.length;a++)t+=(t<<5)+e.charCodeAt(a);return 2147483647&t}(),y=await fetch(u,{headers:{accept:"*/*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","cache-control":"max-age=0","content-type":"application/json","g-tk":String(h),priority:"u=1, i","sec-ch-ua":'"Not:A-Brand";v="99", "Microsoft Edge";v="145", "Chromium";v="145"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-site","x-trace-id":g,"x-trans-id":f,"x-tsa-client-authentication":"true"},referrer:"https://chuangyi.qq.com/",method:"GET",mode:"cors",credentials:"include"});return await y.json()}function m(e){const t=new Date(e);return `${t.getFullYear()}${String(t.getMonth()+1).padStart(2,"0")}${String(t.getDate()).padStart(2,"0")}`}const d=exports("default", E({__name:"app",setup(e$1){const c=[{key:"example",label:"下载前100条素材信息",type:"primary",icon:"📥",action:async function(){const e$1=(await async function(){const e=new Date,t=new Date(e);t.setDate(t.getDate()-30);const a=e,n=function(e=7){const t=new Date,a=new Date(t);a.setDate(a.getDate()-e),a.setHours(0,0,0,0);const n=new Date(t);return n.setHours(23,59,59,999),{start:Math.floor(a.getTime()/1e3),end:Math.floor(n.getTime()/1e3)}}(30),r=await _({account_id:location.href.match(new RegExp("(?<=\\/)[0-9]*(?=\\/)","g"))[1],page_index:1,page_size:100,from:m(t),to:m(a),start_create_time:n.start,end_create_time:n.end});if(r.data&&r.data.list_str){return JSON.parse(r.data.list_str)}return r}()).map(e=>({"标题":e.mediaDescription,"标签id":e.materialPackageLabels[0]?.labelId,"视频id":e.mediaId,material_id:e.materialId,coverImageId:e.coverImageId}));e(e$1,`素材列表${(new Date).toISOString().slice(0,10)}`);}},{key:"tx",label:"腾讯广告工具",type:"primary",icon:"🛠️",component:defineAsyncComponent(()=>R(()=>module.import('./CreateTxPlan-CUAd9dfO-BJuS2O-z.js'),void 0)),title:"创建计划"},{key:"txz",label:"腾讯广告工具1",type:"primary",icon:"🛠️",component:defineAsyncComponent(()=>R(()=>module.import('./CreateTxPlanVariant-WicKG1mT-Br27kYLU.js'),void 0)),title:"创建计划1"}];return (e,t)=>(openBlock(),createBlock(U,{tools:c}))}},[["__scopeId","data-v-9fbe74fd"]]));

		})
	};
}));

System.register("./excel-BvJYwHkl-BaK_RhZw.js", [], (function (exports, module) {
	'use strict';
	return {
		execute: (function () {

			exports("e", e);

			function e(e,n){if(!Array.isArray(e)||0===e.length)return;const t=[...new Set(e.flatMap(e=>Object.keys(e)))],c=[];c.push(t.join(","));for(const a of e){const e=t.map(e=>{let n=a[e];return n=null==n?"":"object"==typeof n?JSON.stringify(n):String(n),n=n.replace(/"/g,'""').replace(/\n/g,"\\n").replace(/\r/g,"\\r"),(n.includes(",")||n.includes('"')||n.includes("\n"))&&(n=`"${n}"`),n});c.push(e.join(","));}const o=c.join("\n"),r=new Blob(["\ufeff"+o],{type:"text/csv;charset=utf-8"}),l=URL.createObjectURL(r),s=document.createElement("a");s.href=l,s.download=`${n}.csv`,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(l);}

		})
	};
}));

System.register("./app-C3VNY4p4-CGKde64K.js", ['./__monkey.entry-uhykG5-y.js', 'vue', './PlatformLauncher-NGbjfHii-CQ6BdTX0.js', 'naive-ui'], (function (exports, module) {
	'use strict';
	var E, R, defineAsyncComponent, openBlock, createBlock, U;
	return {
		setters: [module => {
			E = module.E;
			R = module.R;
		}, module => {
			defineAsyncComponent = module.defineAsyncComponent;
			openBlock = module.openBlock;
			createBlock = module.createBlock;
		}, module => {
			U = module.U;
		}, null],
		execute: (function () {

			const p=exports("default", E({__name:"app",setup(a){const p=[{key:"plan",label:"广告创建",type:"primary",icon:"➕",component:defineAsyncComponent(()=>R(()=>module.import('./CreateDouyinPlan-DrXwipkT-S7FiUJU9.js'),void 0)),title:"抖音广告创建工具"}];return (a,o)=>(openBlock(),createBlock(U,{tools:p}))}},[["__scopeId","data-v-cb8dcbab"]]));

		})
	};
}));

System.register("./PlatformLauncher-NGbjfHii-CQ6BdTX0.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, computed, openBlock, createElementBlock, Fragment, renderList, createElementVNode, toDisplayString, createBlock, unref, withCtx, createTextVNode, createVNode, renderSlot, resolveDynamicComponent, mergeProps, NSpace, NButton, NIcon, NModal, E$1;
	return {
		setters: [module => {
			ref = module.ref;
			computed = module.computed;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			Fragment = module.Fragment;
			renderList = module.renderList;
			createElementVNode = module.createElementVNode;
			toDisplayString = module.toDisplayString;
			createBlock = module.createBlock;
			unref = module.unref;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			createVNode = module.createVNode;
			renderSlot = module.renderSlot;
			resolveDynamicComponent = module.resolveDynamicComponent;
			mergeProps = module.mergeProps;
		}, module => {
			NSpace = module.NSpace;
			NButton = module.NButton;
			NIcon = module.NIcon;
			NModal = module.NModal;
		}, module => {
			E$1 = module.E;
		}],
		execute: (function () {

			const h={class:"button-container"},w={class:"app-tool-group-title"},C={class:"app-tool-grid"},j=["onClick"],E={class:"card-icon"},P={class:"card-label"},R={class:"alert-slot"},U=exports("U", E$1({__name:"PlatformLauncher",props:{tools:{type:Array,required:true}},setup(_){const U=_,q=ref(Object.fromEntries(U.tools.map(o=>[o.key,false]))),x=computed(()=>U.tools.some(o=>o.group&&""!==o.group.trim())),z=computed(()=>{if(!x.value)return {};const o={};return U.tools.forEach(e=>{const l=e.group||"常用功能";o[l]||(o[l]=[]),o[l].push(e);}),o});function A(o){var e;o.action?o.action():(e=o.key,q.value[e]=true);}return (o,e)=>(openBlock(),createElementBlock("div",h,[x.value?(openBlock(true),createElementBlock(Fragment,{key:0},renderList(z.value,(o,e)=>(openBlock(),createElementBlock("div",{key:e,class:"tool-group"},[createElementVNode("div",w,toDisplayString(e),1),createElementVNode("div",C,[(openBlock(true),createElementBlock(Fragment,null,renderList(o,o=>(openBlock(),createElementBlock("div",{key:o.key,class:"app-tool-card",onClick:()=>A(o)},[createElementVNode("span",E,toDisplayString(o.icon),1),createElementVNode("span",P,toDisplayString(o.label),1)],8,j))),128))])]))),128)):(openBlock(),createBlock(unref(NSpace),{key:1,justify:"space-between",wrap:""},{default:withCtx(()=>[(openBlock(true),createElementBlock(Fragment,null,renderList(_.tools,o=>(openBlock(),createBlock(unref(NButton),{key:o.key,type:o.type,size:"large",class:"tool-btn app-btn-modern",onClick:()=>A(o),loading:!!o.loadingRef&&o.loadingRef.value,disabled:o.disabled||false},{icon:withCtx(()=>[createVNode(unref(NIcon),null,{default:withCtx(()=>[createTextVNode(toDisplayString(o.icon),1)]),_:2},1024)]),default:withCtx(()=>[createTextVNode(" "+toDisplayString(o.label),1)]),_:2},1032,["type","onClick","loading","disabled"]))),128))]),_:1})),createElementVNode("div",R,[renderSlot(o.$slots,"alert",{},void 0,true)]),(openBlock(true),createElementBlock(Fragment,null,renderList(_.tools,o=>(openBlock(),createBlock(unref(NModal),{key:o.key,show:q.value[o.key],"onUpdate:show":e=>q.value[o.key]=e,preset:"card",class:"app-modal",title:o.title||o.label,bordered:false,"mask-closable":true,"close-on-esc":true},{default:withCtx(()=>[(openBlock(),createBlock(resolveDynamicComponent(o.component),mergeProps({ref_for:true},o.props||{}),null,16))]),_:2},1032,["show","onUpdate:show","title"]))),128))]))}},[["__scopeId","data-v-3783bcb3"]]));

		})
	};
}));

System.register("./BatchRenameXhs-GgTlNBmJ-YGqe69UJ.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, computed, resolveComponent, openBlock, createElementBlock, createVNode, withCtx, createBlock, createCommentVNode, createTextVNode, toDisplayString, useMessage, E;
	return {
		setters: [module => {
			ref = module.ref;
			computed = module.computed;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createBlock = module.createBlock;
			createCommentVNode = module.createCommentVNode;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
		}, module => {
			useMessage = module.useMessage;
		}, module => {
			E = module.E;
		}],
		execute: (function () {

			async function v(e,a){const t={accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json;charset=UTF-8",priority:"u=1, i","sec-ch-ua":'"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-b3-traceid":"dee287ce9b6526cc"};return  -1!=location.href.indexOf("vSellerId")&&(t["v-seller-id"]=location.search.match(new RegExp("(?<=vSellerId=)[0-9a-z].*","g"))),fetch("https://ad.xiaohongshu.com/api/leona/rtb/creativity/batch/update/name",{headers:t,referrerPolicy:"strict-origin-when-cross-origin",body:`{"creativityId":${e},"creativityName":"${a}"}`,method:"POST",mode:"cors",credentials:"include"})}const h=exports("default", E({__name:"BatchRenameXhs",props:{show:{type:Boolean,default:false}},emits:["update:show"],setup(d,{emit:h}){const m=h,f=useMessage(),g=ref(false),y=ref(""),w=ref(""),S=ref(0),x=ref(0),I=ref(0),b=computed(()=>I.value>0?`正在处理: ${x.value}/${I.value} (${S.value}%)`:"正在处理中...");async function _(){if(y.value){g.value=true,S.value=0,x.value=0,I.value=0;try{await async function(e,a,t){const n=location.href.match(/[0-9]{1,20}/g),c={accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json;charset=UTF-8",priority:"u=1, i","sec-ch-ua":'"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"};-1!=location.href.indexOf("vSellerId")&&(c["v-seller-id"]=location.search.match(new RegExp("(?<=vSellerId=)[0-9a-z].*","g")));const i=await fetch("https://ad.xiaohongshu.com/api/leona/rtb/creativity/list",{headers:c,referrerPolicy:"strict-origin-when-cross-origin",body:`{"campaignId":${n[0]},"unitId":${n[1]},"startTime":"${(new Date).toISOString().split("T")[0]}","endTime":"${(new Date).toISOString().split("T")[0]}","pageNum":1,"pageSize":50}`,method:"POST",mode:"cors",credentials:"include"}),l=(await i.json()).data.list,o=l.length;t&&t(0,0,o);for(let r=0;r<o;r++){const n=l[r],c=n.creativityName.replace(new RegExp(e,"g"),a);if(await v(n.creativityId,c),t){const e=(r+1)/o*100;t(Math.round(e),r+1,o);}}}(y.value,w.value,(e,a,t)=>{S.value=e,x.value=a,I.value=t;}),f.success("批量重命名操作已完成！"),y.value="",w.value="",m("update:show",!1);}catch(e){f.error("重命名过程中发生错误");}finally{g.value=false;}}else f.warning("请输入要被替换的旧字符");}function $(){y.value="",w.value="",S.value=0,x.value=0,I.value=0,m("update:show",false);}return (e,a)=>{const p=resolveComponent("n-input"),d=resolveComponent("n-progress"),v=resolveComponent("n-text"),h=resolveComponent("n-space"),m=resolveComponent("n-button");return openBlock(),createElementBlock("div",null,[createVNode(h,{vertical:""},{default:withCtx(()=>[createVNode(p,{value:y.value,"onUpdate:value":a[0]||(a[0]=e=>y.value=e),placeholder:"输入要被替换的旧字符"},null,8,["value"]),createVNode(p,{value:w.value,"onUpdate:value":a[1]||(a[1]=e=>w.value=e),placeholder:"输入用于替换的新字符"},null,8,["value"]),g.value?(openBlock(),createBlock(d,{key:0,type:"line",percentage:S.value,"indicator-placement":"inside",processing:""},null,8,["percentage"])):createCommentVNode("",true),g.value?(openBlock(),createBlock(v,{key:1,depth:"3",style:{"text-align":"center"}},{default:withCtx(()=>[createTextVNode(toDisplayString(b.value),1)]),_:1})):createCommentVNode("",true)]),_:1}),createVNode(h,{justify:"end",style:{"margin-top":"20px"}},{default:withCtx(()=>[createVNode(m,{onClick:$},{default:withCtx(()=>[...a[2]||(a[2]=[createTextVNode("取消",-1)])]),_:1}),createVNode(m,{type:"primary",onClick:_,loading:g.value},{default:withCtx(()=>[createTextVNode(toDisplayString(g.value?"处理中...":"确认替换"),1)]),_:1},8,["loading"])]),_:1})])}}},[["__scopeId","data-v-7024f4f4"]]));

		})
	};
}));

System.register("./BatchPrice-B2HNhbVw-CH2sM9kl.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, reactive, watch, resolveComponent, openBlock, createElementBlock, Fragment, createVNode, withCtx, withDirectives, vShow, createTextVNode, toDisplayString, useMessage, E;
	return {
		setters: [module => {
			ref = module.ref;
			reactive = module.reactive;
			watch = module.watch;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			Fragment = module.Fragment;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			withDirectives = module.withDirectives;
			vShow = module.vShow;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
		}, module => {
			useMessage = module.useMessage;
		}, module => {
			E = module.E;
		}],
		execute: (function () {

			const g=exports("default", E({__name:"BatchPrice",props:{show:{type:Boolean,default:false}},emits:["update:show"],setup(h,{emit:g}){const f=h,v=g,w=useMessage(),y=ref(null),b=ref(false),I=ref(false),S=ref(false),T=ref(0),_=ref(""),x=reactive({mode:"all",price:null,unitIds:""}),E=[{label:"全部调价",value:"all"},{label:"指定单元ID调价",value:"uid"}],N={mode:{required:true,message:"请选择调价模式",trigger:"change"},price:{required:true,validator:(e,t)=>t||0===t?!(t<0)||new Error("价格不能为负数"):new Error("请输入调整价格"),trigger:["input","blur"]},unitIds:{trigger:["input","blur"],validator(e,t){if("uid"===x.mode){if(!t)return new Error("请输入单元ID列表");if(0===t.trim().split(/\s+/).length)return new Error("请输入有效的单元ID")}return  true}}};watch(()=>f.show,e=>{b.value=e;}),watch(b,e=>{v("update:show",e);});const B=e=>{x.mode=e;},k=()=>{b.value=false,y.value?.restoreValidation();},q=()=>Math.floor(Date.now()/1e3),D=(e,t)=>(e.removeBind=0,e.sourceFlag="web",e.pageEnterTime=q()-10,e.pageSubmitTime=q(),e.keywordWithBid&&Array.isArray(e.keywordWithBid)&&e.keywordWithBid.forEach(e=>{e.bid=100*t;}),e),O=async e=>{const t={};["sourceFlag","unitId","unitName","promotionTarget","keywordWithBid","targetConfig","phraseMatchTypeUpgrade","removeBind","noteIds","keywordGenType","pageEnterTime","pageSubmitTime"].forEach(a=>{if(e.hasOwnProperty(a))if("pageEnterTime"===a||"pageSubmitTime"===a){const o=e[a];"number"==typeof o&&10===o.toString().length?t[a]=1e3*o:t[a]=o;}else t[a]=e[a];}),t.keywordGenType=0;const a=Date.now();t.pageSubmitTime=a;const o={accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-t":a};-1!==location.href.indexOf("vSellerId")&&(o["v-seller-id"]=location.search.match(new RegExp("(?<=vSellerId=)[0-9a-z].*","g")));try{const e=await fetch("https://ad.xiaohongshu.com/api/leona/rtb/unit",{headers:o,referrerPolicy:"strict-origin-when-cross-origin",body:JSON.stringify(t),method:"PUT",mode:"cors",credentials:"include"});return await e.json()}catch(i){throw i}},U=e=>{e.preventDefault(),y.value?.validate(async e=>{if(e)w.error("请检查表单填写是否正确");else {S.value=true,I.value=true,T.value=0,_.value="正在获取单元数据...";try{const e=await(async()=>{const e={accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Chromium";v="134", "Not:A-Brand";v="24", "Microsoft Edge";v="134"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"Windows"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"};-1!==location.href.indexOf("vSellerId")&&(e["v-seller-id"]=location.search.match(new RegExp("(?<=vSellerId=)[0-9a-z].*","g")));let t=[],a=1,o=1;do{const i=await fetch("https://ad.xiaohongshu.com/api/leona/rtb/unit/search",{headers:e,referrer:"https://ad.xiaohongshu.com/aurora/ad/manage/creativity",referrerPolicy:"strict-origin-when-cross-origin",body:JSON.stringify({startTime:(new Date).toISOString().split("T")[0],endTime:(new Date).toISOString().split("T")[0],pageNum:a,pageSize:100,placementList:[2]}),method:"POST",mode:"cors",credentials:"include"}),n=await i.json();if(!n.data)throw new Error("返回数据异常");t=t.concat(n.data.list),o=n.data.totalPage,a++;}while(a<=o);return t})();w.info(`获取到 ${e.length} 个单元`);let a=[];"all"===x.mode?a=e:(a=((e,t)=>{const a=t.trim().split(/\s+/);return e.filter(e=>a.includes(String(e.unitId)))})(e,x.unitIds),w.info(`筛选出 ${a.length} 个指定单元`));const o=[];for(let n=0;n<a.length;n++){const e=a[n];T.value=Math.round((n+1)/a.length*100),_.value=`正在调整单元: ${e.unitName} (${n+1}/${a.length})`;try{const t=D({...e},x.price),a=await O(t);o.push({unitName:e.unitName,unitId:e.unitId,success:"成功"===a.msg,message:a.msg}),await new Promise(e=>setTimeout(e,700));}catch(t){o.push({unitName:e.unitName,unitId:e.unitId,success:!1,message:t.message||"请求失败"});}}const i=o.filter(e=>e.success).length;w.success(`调整完成！成功: ${i}/${o.length}`),b.value=!1;}catch(t){w.error("操作失败: "+(t.message||"未知错误"));}finally{S.value=false,I.value=false;}}});};return (e,t)=>{const a=resolveComponent("n-select"),m=resolveComponent("n-form-item"),h=resolveComponent("n-input-number"),g=resolveComponent("n-input"),f=resolveComponent("n-form"),v=resolveComponent("n-button"),w=resolveComponent("n-space"),q=resolveComponent("n-modal"),D=resolveComponent("n-text"),O=resolveComponent("n-progress");return openBlock(),createElementBlock(Fragment,null,[createVNode(q,{show:b.value,"onUpdate:show":t[3]||(t[3]=e=>b.value=e),preset:"card",class:"app-modal",title:"批量调整出价","mask-closable":false,"close-on-esc":false},{footer:withCtx(()=>[createVNode(w,{justify:"end"},{default:withCtx(()=>[createVNode(v,{onClick:k},{default:withCtx(()=>[...t[5]||(t[5]=[createTextVNode("取消",-1)])]),_:1}),createVNode(v,{type:"primary",onClick:U,loading:S.value},{default:withCtx(()=>[createTextVNode(toDisplayString(S.value?"调整中...":"确认调整"),1)]),_:1},8,["loading"])]),_:1})]),default:withCtx(()=>[createVNode(f,{model:x,rules:N,ref_key:"formRef",ref:y},{default:withCtx(()=>[createVNode(m,{label:"调价模式",path:"mode"},{default:withCtx(()=>[createVNode(a,{value:x.mode,"onUpdate:value":[t[0]||(t[0]=e=>x.mode=e),B],options:E},null,8,["value"])]),_:1}),createVNode(m,{label:"调整价格",path:"price"},{default:withCtx(()=>[createVNode(h,{value:x.price,"onUpdate:value":t[1]||(t[1]=e=>x.price=e),"show-button":false,placeholder:"请输入要调整的价格",style:{width:"100%"}},null,8,["value"])]),_:1}),withDirectives(createVNode(m,{label:"单元ID列表",path:"unitIds"},{default:withCtx(()=>[createVNode(g,{value:x.unitIds,"onUpdate:value":t[2]||(t[2]=e=>x.unitIds=e),type:"textarea",placeholder:"请输入单元ID，每行一个",autosize:{minRows:3,maxRows:6}},null,8,["value"])]),_:1},512),[[vShow,"uid"===x.mode]])]),_:1},8,["model"])]),_:1},8,["show"]),createVNode(q,{show:I.value,"onUpdate:show":t[4]||(t[4]=e=>I.value=e),preset:"card",class:"app-modal",title:"调整进度","mask-closable":false,"close-on-esc":false},{default:withCtx(()=>[createVNode(w,{vertical:""},{default:withCtx(()=>[createVNode(D,null,{default:withCtx(()=>[...t[6]||(t[6]=[createTextVNode("正在调整出价，请稍候...",-1)])]),_:1}),createVNode(O,{type:"line",percentage:T.value,"indicator-placement":"inside",processing:""},null,8,["percentage"]),createVNode(D,{depth:"3"},{default:withCtx(()=>[createTextVNode(toDisplayString(_.value),1)]),_:1})]),_:1})]),_:1},8,["show"])],64)}}},[["__scopeId","data-v-05b68d92"]]));

		})
	};
}));

System.register("./XhsPlanSettings-DmkwTgT4-BuITX90x.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, reactive, resolveComponent, openBlock, createElementBlock, createVNode, withCtx, createTextVNode, toDisplayString, createBlock, Fragment, renderList, createCommentVNode, useMessage, E;
	return {
		setters: [module => {
			ref = module.ref;
			reactive = module.reactive;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			createBlock = module.createBlock;
			Fragment = module.Fragment;
			renderList = module.renderList;
			createCommentVNode = module.createCommentVNode;
		}, module => {
			useMessage = module.useMessage;
		}, module => {
			E = module.E;
		}],
		execute: (function () {

			const m=exports("default", E({__name:"XhsPlanSettings",props:{show:{type:Boolean,default:false}},emits:["update:show"],setup(g,{emit:m}){const v=m,f=useMessage(),y=ref(null),w=ref(false),T=ref(false),S=ref(0),I=ref(""),b=ref(""),x=ref([]),_=ref([]),$=ref(false),O=reactive({searchType:"creativeId",actionType:"2",inputContent:""}),q=[{label:"创意ID",value:"creativeId"},{label:"文字匹配",value:"name"},{label:"笔记ID",value:"noteId"}],C=[{label:"关闭",value:"2"},{label:"开启",value:"1"}],N={searchType:{required:true,message:"请选择搜索方式",trigger:"change"},actionType:{required:true,message:"请选择操作类型",trigger:"change"},inputContent:{required:true,trigger:["input","blur"],validator(e,a){if(!a)return new Error("请输入内容");return 0!==a.trim().split(/\r?\n/).filter(e=>""!==e.trim()).length||new Error("请输入有效内容")}}},j=(e,a)=>{const t=[];for(let n=0;n<e.length;n+=a)t.push(e.slice(n,n+a));return t},z=async(e,a)=>{const t="1"===a?"开启":"关闭",n={accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json;charset=UTF-8",priority:"u=1, i","sec-ch-ua":'"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"};-1!==location.href.indexOf("vSellerId")&&(n["v-seller-id"]=location.search.match(new RegExp("(?<=vSellerId=)[0-9a-z].*","g")));for(let i=0;i<e.length;i++){const r=e[i];let o=true,s=0;const c=3;for(S.value=Math.round((i+1)/e.length*100),I.value=`正在${t}创意... (${i+1}/${e.length})`,b.value=`正在处理ID: [${r.join(", ")}]`;o&&s<c;)try{const e=await fetch("https://ad.xiaohongshu.com/api/leona/rtb/creativity/batch/status",{headers:n,referrer:"https://ad.xiaohongshu.com/aurora/ad/manage/creativity",referrerPolicy:"strict-origin-when-cross-origin",body:JSON.stringify({ids:r,actionType:parseInt(a)}),method:"PUT",mode:"cors",credentials:"include"}),l=await e.json();"成功"===l.msg?(f.success(`${t}创意成功: ${JSON.stringify(r)}`),o=!1):(s++,s>=c?(f.error(`${t}创意失败: ${l.msg}, ID: ${JSON.stringify(r)}`),o=!1):await new Promise(e=>setTimeout(e,500)));}catch(l){s++,s>=c?(f.error(`${t}创意出错: ${l.message}, ID: ${JSON.stringify(r)}`),o=false):await new Promise(e=>setTimeout(e,500));}}},D=async()=>{$.value=true;try{const e={accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json",priority:"u=1, i"};-1!==location.href.indexOf("vSellerId")&&(e["v-seller-id"]=location.search.match(new RegExp("(?<=vSellerId=)[0-9a-z].*","g")));const a=(new Date).toISOString().split("T")[0],t=await fetch("https://ad.xiaohongshu.com/api/light/campaigngroup/data/list",{headers:e,referrer:"https://ad.xiaohongshu.com/aurora/ad/manage/campaigngroup",body:JSON.stringify({page:{pageIndex:1,pageSize:100},filter:{},columns:["fee","impression","click"],startTime:a,endTime:a}),method:"POST",mode:"cors",credentials:"include"}),n=await t.json();if(0!==n.code||!n.success||!Array.isArray(n.data?.dataList))throw new Error(n.msg||"接口返回异常");{const e=n.data.dataList.map(e=>e.campaignGroupName).filter(Boolean);x.value=[...new Set(e)],f.success(`已加载 ${x.value.length} 个组`);}}catch(e){f.error("加载组列表失败: "+(e.message||"未知错误")),x.value=[];}finally{$.value=false;}},k=e=>{e.preventDefault(),y.value?.validate(async e=>{if(e)f.error("请检查表单填写是否正确");else {T.value=true,w.value=true,S.value=0,I.value="开始处理...",b.value="";try{const e=O.inputContent.trim().split(/\r?\n/).map(e=>e.trim()).filter(e=>""!==e);if(0===e.length)return void f.error("请输入有效内容");if("creativeId"===O.searchType){const a=j(e,50);await z(a,O.actionType);}else {if("noteId"===O.searchType){const a=e.filter(e=>e.split("\t")[0].length<=11);if(a.length>0)return void f.error(`以下内容不符合笔记ID格式: ${a.join(", ")}`)}await(async(e,a,t)=>{const n={accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json;charset=UTF-8",priority:"u=1, i","sec-ch-ua":'"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"};-1!==location.href.indexOf("vSellerId")&&(n["v-seller-id"]=location.search.match(new RegExp("(?<=vSellerId=)[0-9a-z].*","g")));for(let i=0;i<e.length;i++){const r=e[i];S.value=Math.round((i+1)/e.length*100),I.value=`正在处理: ${r} (${i+1}/${e.length})`;try{let e=r,l=null;if(-1!==r.indexOf("\t")){const a=r.split("\t");e=a[0];const t=a[1];l="信息流"===t?[1]:"搜索"===t?[2]:null;}const i={startTime:(new Date).toISOString().split("T")[0],endTime:(new Date).toISOString().split("T")[0],[t]:e,pageNum:1,pageSize:50};l&&(i.placementList=l);const o=await fetch("https://ad.xiaohongshu.com/api/leona/rtb/creativity/list",{headers:n,referrer:"https://ad.xiaohongshu.com/aurora/ad/manage/creativity",referrerPolicy:"strict-origin-when-cross-origin",body:JSON.stringify(i),method:"POST",mode:"cors",credentials:"include"}),s=await o.json();if(s.data?.list?.length>0){let t=s.data.list;_.value.length>0&&(t=t.filter(e=>_.value.includes(e.campaignGroupName)));const n=t.map(e=>e.creativityId);if(0===n.length){f.warning(`未找到匹配的创意: ${e}`);continue}f.info(`找到 ${n.length} 个创意ID`);const l=j(n,50);await z(l,a);}else f.warning(`未找到匹配的创意: ${e}`);}catch(l){f.error(`处理 ${r} 时出错: ${l.message}`);}}})(e,O.actionType,O.searchType);}f.success("操作完成"),v("update:show",!1);}catch(a){f.error("操作失败: "+(a.message||"未知错误"));}finally{T.value=false,w.value=false;}}});},U=()=>{v("update:show",false),y.value?.restoreValidation?.();};return (e,a)=>{const h=resolveComponent("n-select"),g=resolveComponent("n-form-item"),m=resolveComponent("n-button"),v=resolveComponent("n-checkbox"),f=resolveComponent("n-space"),j=resolveComponent("n-checkbox-group"),z=resolveComponent("n-text"),E=resolveComponent("n-input"),P=resolveComponent("n-form"),B=resolveComponent("n-progress"),J=resolveComponent("n-modal");return openBlock(),createElementBlock("div",null,[createVNode(P,{model:O,rules:N,ref_key:"formRef",ref:y},{default:withCtx(()=>[createVNode(g,{label:"搜索方式",path:"searchType"},{default:withCtx(()=>[createVNode(h,{value:O.searchType,"onUpdate:value":a[0]||(a[0]=e=>O.searchType=e),options:q},null,8,["value"])]),_:1}),createVNode(g,{label:"操作类型",path:"actionType"},{default:withCtx(()=>[createVNode(h,{value:O.actionType,"onUpdate:value":a[1]||(a[1]=e=>O.actionType=e),options:C},null,8,["value"])]),_:1}),createVNode(g,{label:"组名筛选"},{default:withCtx(()=>[createVNode(f,{vertical:""},{default:withCtx(()=>[createVNode(m,{type:"primary",size:"small",loading:$.value,onClick:D},{default:withCtx(()=>[createTextVNode(toDisplayString($.value?"加载中...":"加载组列表"),1)]),_:1},8,["loading"]),x.value.length>0?(openBlock(),createBlock(j,{key:0,value:_.value,"onUpdate:value":a[2]||(a[2]=e=>_.value=e)},{default:withCtx(()=>[createVNode(f,null,{default:withCtx(()=>[(openBlock(true),createElementBlock(Fragment,null,renderList(x.value,e=>(openBlock(),createBlock(v,{key:e,value:e,label:e},null,8,["value","label"]))),128))]),_:1})]),_:1},8,["value"])):createCommentVNode("",true),0===x.value.length?(openBlock(),createBlock(z,{key:1,depth:"3"},{default:withCtx(()=>[...a[5]||(a[5]=[createTextVNode(" 点击上方按钮加载可选的组名（未勾选则不限制组名） ",-1)])]),_:1})):createCommentVNode("",true)]),_:1})]),_:1}),createVNode(g,{label:"输入内容",path:"inputContent"},{default:withCtx(()=>[createVNode(E,{value:O.inputContent,"onUpdate:value":a[3]||(a[3]=e=>O.inputContent=e),type:"textarea",placeholder:"请输入内容，多个内容请换行分隔",autosize:{minRows:4,maxRows:10}},null,8,["value"]),createVNode(z,{depth:"3",style:{"margin-top":"8px",display:"block"}},{default:withCtx(()=>[...a[6]||(a[6]=[createTextVNode(" 提示：使用创意ID时每行一个；使用笔记ID或文字匹配时，如需指定位置可在内容后加制表符(Tab)和位置(如：信息流、搜索) ",-1)])]),_:1})]),_:1})]),_:1},8,["model"]),createVNode(f,{justify:"end",style:{"margin-top":"20px"}},{default:withCtx(()=>[createVNode(m,{onClick:U},{default:withCtx(()=>[...a[7]||(a[7]=[createTextVNode("取消",-1)])]),_:1}),createVNode(m,{type:"primary",onClick:k,loading:T.value},{default:withCtx(()=>[createTextVNode(toDisplayString(T.value?"处理中...":"确认执行"),1)]),_:1},8,["loading"])]),_:1}),createVNode(J,{show:w.value,"onUpdate:show":a[4]||(a[4]=e=>w.value=e),preset:"card",class:"app-modal",title:"执行进度","mask-closable":false,"close-on-esc":false},{default:withCtx(()=>[createVNode(f,{vertical:""},{default:withCtx(()=>[createVNode(z,null,{default:withCtx(()=>[createTextVNode(toDisplayString(I.value),1)]),_:1}),createVNode(B,{type:"line",percentage:S.value,"indicator-placement":"inside",processing:""},null,8,["percentage"]),createVNode(z,{depth:"3"},{default:withCtx(()=>[createTextVNode(toDisplayString(b.value),1)]),_:1})]),_:1})]),_:1},8,["show"])])}}},[["__scopeId","data-v-27fa24ac"]]));

		})
	};
}));

System.register("./CreateXhsPlan-DHxhkYlk-D0vnrJ9F.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, onMounted, resolveComponent, openBlock, createElementBlock, createVNode, withCtx, createTextVNode, createElementVNode, toDisplayString, h, useMessage, useDialog, E;
	return {
		setters: [module => {
			ref = module.ref;
			onMounted = module.onMounted;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			createElementVNode = module.createElementVNode;
			toDisplayString = module.toDisplayString;
			h = module.h;
		}, module => {
			useMessage = module.useMessage;
			useDialog = module.useDialog;
		}, module => {
			E = module.E;
		}],
		execute: (function () {

			const v={class:"createrplan-container"},f={style:{"font-size":"14px"}},y={style:{"font-size":"16px"}},g=exports("default", E({__name:"CreateXhsPlan",setup(m){const g=useMessage(),h$1=ref("old"),k=ref({autoOptimize:false,searchComponent:false,updateNames:false,addKeywords:false,addTracking:false}),w=ref(false),x=ref(""),b={old:{autoOptimize:".flexible.align-center",searchComponent:".d-grid.d-radio-main-label",creativeNameInput:'input[placeholder="请输入你的创意名称"]',item:".item",commentInput:'input[placeholder="请输入置顶评论文案"]',searchWordInput:'input[placeholder="请输入搜索词"]',linkButton:".link-text",addAction:".add-action",linkInput:'input[placeholder="请输入链接"]',saveButton:".d-button-content .d-text"},new:{autoOptimize:".form-item-main button",searchComponent:"span",creativeNameInput:'input[placeholder="请输入创意名称"]',item:".creativity-list-container",commentInput:'input[placeholder="请输入置顶评论文案"]',searchWordInput:'input[placeholder="请输入搜索词"]',linkButton:".form-item-main button",addAction:".add-action",linkInput:'input[placeholder="请输入链接"]',saveButton:".d-modal-footer button"}},I=()=>b[h$1.value],_=ref({baseCreativeName:"",exposureLink:"",clickLink:"",noteMatchingInfo:""});onMounted(()=>{_.value.baseCreativeName=localStorage.getItem("baseCreativeName")||"",_.value.exposureLink=localStorage.getItem("exposureLink")||"",_.value.clickLink=localStorage.getItem("clickLink")||"",_.value.noteMatchingInfo=localStorage.getItem("noteMatchingInfo")||"",h$1.value=localStorage.getItem("currentVersion")||"old",x.value=localStorage.getItem("customOptions")||"";});const C=()=>{h$1.value="old"===h$1.value?"new":"old",localStorage.setItem("currentVersion",h$1.value),g.success("已切换到"+("old"===h$1.value?"老版本":"新版本"));},T=(e,t)=>{localStorage.setItem(e,t);},E=e=>new Promise(t=>setTimeout(t,e)),S=async(e,t=null,a=1e4)=>{const n=Date.now();for(;Date.now()-n<a;){const a=Array.from(document.querySelectorAll(e)).find(e=>!t||e.innerText.includes(t));if(a)return a;await E(100);}throw new Error(`等待元素 ${e}${t?` (${t})`:""} 超时`)},A=async(e,t,a=1e4)=>{const n=Date.now();for(;Date.now()-n<a;){const a=document.querySelectorAll(e);if(a.length>=t)return a;await E(100);}throw new Error(`等待元素 ${e} 数量 >= ${t} 超时`)},z=()=>_.value.noteMatchingInfo.trim().split("\n").map(e=>e.trim().split("\t")),N=async()=>{k.value.autoOptimize=true;try{const e=I();document.querySelectorAll(e.autoOptimize).forEach(e=>{"关闭"===e.innerText&&e.click();}),g.success(`已关闭自动优化 (${h$1.value}版本)`);}catch(e){g.error("关闭自动优化失败: "+e.message);}finally{k.value.autoOptimize=false;}},q=async()=>{k.value.searchComponent=true;try{const e=I();document.querySelectorAll(e.searchComponent).forEach(e=>{"搜索组件"===e.innerText&&e.click();}),g.success(`已点击搜索组件 (${h$1.value}版本)`);}catch(e){g.error("点击搜索组件失败: "+e.message);}finally{k.value.searchComponent=false;}},L=useDialog(),B=async()=>{if("new"===h$1.value){const e=I(),t=_.value.baseCreativeName;if(!t)return void g.warning("请先输入基础创意名称");const a=document.querySelectorAll(".promotion-note-content-info span:nth-child(3)"),n=document.querySelectorAll(e.creativeNameInput);for(let l=0;l<n.length;l++){const e=n[l];e.value=t.replace("达人昵称",a[l].innerText.split(" ")[0]),e.dispatchEvent(new Event("input"));}}else {k.value.updateNames=true;try{const e=_.value.baseCreativeName,t=z(),a=I();if(!e)return void g.warning("请先输入基础创意名称");document.querySelectorAll(a.item).forEach(n=>{const l=n.querySelectorAll("td");if(l.length>=4){const o=l[1].innerText,i=l[3].innerText,c=t.find(e=>e[1]===o)?.[0];if(c){const t=n.querySelector(a.creativeNameInput);if(t){const a=e.replace("达人昵称",i).replace("场景",c);t.value=a,t.dispatchEvent(new Event("input"));}}else {const t=n.querySelector(a.creativeNameInput);if(t){const a=e.replace("达人昵称",i);t.value=a,t.dispatchEvent(new Event("input"));}}}}),g.success(`已完成创意名称修改 (${h$1.value}版本)`);}catch(e){g.error("修改创意名称失败: "+e.message);}finally{k.value.updateNames=false;}}},O=async()=>{k.value.addKeywords=true;try{const{commentText:e,keywordText:t}=await new Promise((e,t)=>{const a={commentText:"",keywordText:""},n=h("div",{style:{marginBottom:"15px"}},[h("div",{style:{marginBottom:"15px"}},[h("label",{style:{display:"block",marginBottom:"5px",fontWeight:"bold",color:"#555"}},"评论文案:"),h("input",{placeholder:"请输入评论文案",style:{width:"100%"},onInput:e=>{a.commentText=e.target.value;}})]),h("div",{style:{marginBottom:"15px"}},[h("label",{style:{display:"block",marginBottom:"5px",fontWeight:"bold",color:"#555"}},"搜索词:"),h("input",{placeholder:"请输入搜索词",style:{width:"100%"},onInput:e=>{a.keywordText=e.target.value;}})])]);L.warning({title:"输入评论文案和搜索词",content:()=>n,positiveText:"确认",negativeText:"取消",onPositiveClick:async()=>{const t=a.commentText||"",n=a.keywordText||"";if(!t||!n)return g.warning("请填写完整信息"),!1;e({commentText:t,keywordText:n});},onNegativeClick:()=>{t(new Error("用户取消"));}});}),a=(z(),I());document.querySelectorAll(a.commentInput).forEach(t=>{t.value=e,t.dispatchEvent(new Event("input",{bubbles:!0,cancelable:!0,composed:!0}));}),document.querySelectorAll(a.searchWordInput).forEach(e=>{e.value=t,e.dispatchEvent(new Event("input",{bubbles:!0,cancelable:!0,composed:!0}));});}catch(e){g.error("添加搜索词失败: "+e.message);}finally{k.value.addKeywords=false;}},$=async()=>{k.value.addTracking=true;try{const e=[_.value.exposureLink,_.value.clickLink],t=I();if(!e[0]||!e[1])return void g.warning("请先输入曝光链接和点击链接");const a=Array.from(document.querySelectorAll(t.linkButton)).filter(e=>"添加监测链接"===e.innerText||"去配置"===e.innerText);for(const n of a){n.click(),await A(t.addAction,2),document.querySelectorAll(t.addAction).forEach(e=>e.click()),await E(1e3);(await A(t.linkInput,2)).forEach((t,a)=>{e[a]&&(t.value=e[a],t.dispatchEvent(new Event("input")));}),await E(1e3);(await S(t.saveButton,"保存")).click(),await E(1e3);}g.success(`已完成监测链接添加 (${h$1.value}版本)`);}catch(e){g.error("添加监测链接失败: "+e.message);}finally{k.value.addTracking=false;}},M=async()=>{x.value=localStorage.getItem("customOptions")||"",w.value=true;},U=()=>{x.value.trim()?(localStorage.setItem("customOptions",x.value),g.success("设置已保存")):(localStorage.removeItem("customOptions"),g.info("已清空设置")),w.value=false;},D=async()=>{const e=[];document.querySelectorAll(".promotion-note-content-info").forEach(t=>{const a=t.textContent.match(new RegExp("(?<=ID\\s).*?(?=\\s)"));a&&e.push(a[0]);});try{const t=localStorage.getItem("customOptions");if(!t)return g.error("请先设置监测链接"),void(k.value.addTracking=!1);const a=t.trim().split("\n").map(e=>e.split("\t")),n=I(),l=document.querySelectorAll(".creativity-list-container-content  .form-item-content button"),o=[];for(let e=0;e<l.length;e++){const t=l[e];"去配置"!==t.innerText&&"去修改"!==t.innerText||o.push(t);}for(let i=0;i<o.length;i++){const t=o[i];if("添加监测链接"===t.innerText||"去配置"===t.innerText){const l=e[i].trim(),o=a.filter(e=>e[0]===l);if(0===o.length){g.warning(`未找到监测链接组 ${l}`);continue}const c=[o[0][1],o[0][2]];t.click(),await A(n.addAction,2),document.querySelectorAll(n.addAction).forEach(e=>e.click()),await E(1e3);(await A(n.linkInput,2)).forEach((e,t)=>{c[t]&&(e.value=c[t],e.dispatchEvent(new Event("input")));}),await E(1e3);(await S(n.saveButton,"保存")).click(),await E(1e3);}}g.success(`已完成监测链接添加 (${h$1.value}版本)`);}catch(t){g.error("添加监测链接失败: "+t.message);}finally{k.value.addTracking=false;}},W=()=>{try{["baseCreativeName","exposureLink","clickLink","noteMatchingInfo"].forEach(e=>{localStorage.removeItem(e),_.value[e]="";}),g.success("已清除所有数据");}catch(e){g.error("清除数据失败: "+e.message);}};return (e,t)=>{const s=resolveComponent("n-tag"),d=resolveComponent("n-input"),p=resolveComponent("n-form-item"),m=resolveComponent("n-button"),g=resolveComponent("n-grid-item"),b=resolveComponent("n-grid"),I=resolveComponent("n-space"),E=resolveComponent("n-card"),S=resolveComponent("n-modal");return openBlock(),createElementBlock("div",v,[createVNode(E,{title:"小红书创意计划工具1.2",class:"app-card main-card"},{"header-extra":withCtx(()=>[createVNode(s,{type:"old"===h$1.value?"warning":"success",size:"large"},{icon:withCtx(()=>[createElementVNode("span",f,toDisplayString("old"===h$1.value?"🕰️":"🚀"),1)]),default:withCtx(()=>[createTextVNode(" "+toDisplayString("old"===h$1.value?"老版本":"新版本"),1)]),_:1},8,["type"])]),default:withCtx(()=>[createVNode(I,{vertical:""},{default:withCtx(()=>[createVNode(p,{label:"基础创意名称"},{default:withCtx(()=>[createVNode(d,{value:_.value.baseCreativeName,"onUpdate:value":[t[0]||(t[0]=e=>_.value.baseCreativeName=e),t[1]||(t[1]=e=>T("baseCreativeName",e))],placeholder:"请输入基础创意名称 【达人昵称】-信息流"},null,8,["value"])]),_:1}),createVNode(p,{label:"曝光链接"},{default:withCtx(()=>[createVNode(d,{value:_.value.exposureLink,"onUpdate:value":[t[2]||(t[2]=e=>_.value.exposureLink=e),t[3]||(t[3]=e=>T("exposureLink",e))],placeholder:"请输入曝光链接"},null,8,["value"])]),_:1}),createVNode(p,{label:"点击链接"},{default:withCtx(()=>[createVNode(d,{value:_.value.clickLink,"onUpdate:value":[t[4]||(t[4]=e=>_.value.clickLink=e),t[5]||(t[5]=e=>T("clickLink",e))],placeholder:"请输入点击链接"},null,8,["value"])]),_:1}),createVNode(p,{label:"笔记匹配信息"},{default:withCtx(()=>[createVNode(d,{value:_.value.noteMatchingInfo,"onUpdate:value":[t[6]||(t[6]=e=>_.value.noteMatchingInfo=e),t[7]||(t[7]=e=>T("noteMatchingInfo",e))],type:"textarea",placeholder:"直接从EXCEL中复制格式：\n小红书笔记id 达人昵称 ",autosize:{minRows:4,maxRows:6}},null,8,["value"])]),_:1}),createVNode(b,{cols:3,"x-gap":12,"y-gap":12},{default:withCtx(()=>[createVNode(g,null,{default:withCtx(()=>[createVNode(m,{type:"primary",block:"",onClick:N,loading:k.value.autoOptimize},{icon:withCtx(()=>[...t[11]||(t[11]=[createElementVNode("span",{style:{"font-size":"16px"}},"⚙️",-1)])]),default:withCtx(()=>[t[12]||(t[12]=createTextVNode(" 关闭自动优化 ",-1))]),_:1},8,["loading"])]),_:1}),createVNode(g,null,{default:withCtx(()=>[createVNode(m,{type:"primary",block:"",onClick:q,loading:k.value.searchComponent},{icon:withCtx(()=>[...t[13]||(t[13]=[createElementVNode("span",{style:{"font-size":"16px"}},"🔍",-1)])]),default:withCtx(()=>[t[14]||(t[14]=createTextVNode(" 点击搜索组件 ",-1))]),_:1},8,["loading"])]),_:1}),createVNode(g,null,{default:withCtx(()=>[createVNode(m,{type:"primary",block:"",onClick:C},{icon:withCtx(()=>[createElementVNode("span",y,toDisplayString("old"===h$1.value?"🚀":"🕰️"),1)]),default:withCtx(()=>[createTextVNode(" 切换到"+toDisplayString("old"===h$1.value?"新版本":"老版本"),1)]),_:1})]),_:1}),createVNode(g,null,{default:withCtx(()=>[createVNode(m,{type:"primary",block:"",onClick:B,loading:k.value.updateNames},{icon:withCtx(()=>[...t[15]||(t[15]=[createElementVNode("span",{style:{"font-size":"16px"}},"✏️",-1)])]),default:withCtx(()=>[t[16]||(t[16]=createTextVNode(" 修改创意名称 ",-1))]),_:1},8,["loading"])]),_:1}),createVNode(g,null,{default:withCtx(()=>[createVNode(m,{type:"primary",block:"",onClick:O,loading:k.value.addKeywords},{icon:withCtx(()=>[...t[17]||(t[17]=[createElementVNode("span",{style:{"font-size":"16px"}},"🏷️",-1)])]),default:withCtx(()=>[t[18]||(t[18]=createTextVNode(" 添加搜索词 ",-1))]),_:1},8,["loading"])]),_:1}),createVNode(g,null,{default:withCtx(()=>[createVNode(m,{type:"primary",block:"",onClick:$,loading:k.value.addTracking},{icon:withCtx(()=>[...t[19]||(t[19]=[createElementVNode("span",{style:{"font-size":"16px"}},"🔗",-1)])]),default:withCtx(()=>[t[20]||(t[20]=createTextVNode(" 添加监测链接 ",-1))]),_:1},8,["loading"])]),_:1}),createVNode(g,null,{default:withCtx(()=>[createVNode(m,{type:"primary",block:"",onClick:D,loading:k.value.addTracking},{icon:withCtx(()=>[...t[21]||(t[21]=[createElementVNode("span",{style:{"font-size":"16px"}},"🔗",-1)])]),default:withCtx(()=>[t[22]||(t[22]=createTextVNode(" 添加监测链接(根据option) ",-1))]),_:1},8,["loading"])]),_:1}),createVNode(g,null,{default:withCtx(()=>[createVNode(m,{type:"default",block:"",onClick:W},{icon:withCtx(()=>[...t[23]||(t[23]=[createElementVNode("span",{style:{"font-size":"16px"}},"🗑️",-1)])]),default:withCtx(()=>[t[24]||(t[24]=createTextVNode(" 清除所有数据 ",-1))]),_:1})]),_:1}),createVNode(g,null,{default:withCtx(()=>[createVNode(m,{type:"default",block:"",onClick:M},{icon:withCtx(()=>[...t[25]||(t[25]=[createElementVNode("span",{style:{"font-size":"16px"}},"⚙",-1)])]),default:withCtx(()=>[t[26]||(t[26]=createTextVNode(" option ",-1))]),_:1})]),_:1})]),_:1})]),_:1})]),_:1}),createVNode(S,{show:w.value,"onUpdate:show":t[10]||(t[10]=e=>w.value=e),preset:"card",title:"自定义设置",class:"app-modal"},{default:withCtx(()=>[createVNode(d,{value:x.value,"onUpdate:value":t[8]||(t[8]=e=>x.value=e),type:"textarea",placeholder:"请输入设置内容（支持多行） 笔记id 曝光链接 点击链接",autosize:{minRows:6}},null,8,["value"]),createVNode(I,{justify:"end",style:{"margin-top":"16px"}},{default:withCtx(()=>[createVNode(m,{onClick:t[9]||(t[9]=e=>w.value=false)},{default:withCtx(()=>[...t[27]||(t[27]=[createTextVNode("取消",-1)])]),_:1}),createVNode(m,{type:"primary",onClick:U},{default:withCtx(()=>[...t[28]||(t[28]=[createTextVNode("保存",-1)])]),_:1})]),_:1})]),_:1},8,["show"])])}}},[["__scopeId","data-v-b3536618"]]));

		})
	};
}));

System.register("./XhsPlanBudget-Cn7qumAV-DP12Ny_a.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, openBlock, createBlock, unref, withCtx, createVNode, createElementVNode, createTextVNode, toDisplayString, createElementBlock, createCommentVNode, NCard, NForm, NFormItem, NInput, NRow, NCol, NButton, NAlert, E;
	return {
		setters: [module => {
			ref = module.ref;
			openBlock = module.openBlock;
			createBlock = module.createBlock;
			unref = module.unref;
			withCtx = module.withCtx;
			createVNode = module.createVNode;
			createElementVNode = module.createElementVNode;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			createElementBlock = module.createElementBlock;
			createCommentVNode = module.createCommentVNode;
		}, module => {
			NCard = module.NCard;
			NForm = module.NForm;
			NFormItem = module.NFormItem;
			NInput = module.NInput;
			NRow = module.NRow;
			NCol = module.NCol;
			NButton = module.NButton;
			NAlert = module.NAlert;
		}, module => {
			E = module.E;
		}],
		execute: (function () {

			const _={style:{display:"flex","justify-content":"flex-end"}},w={key:0,style:{"margin-top":"10px",padding:"10px",background:"#f5f5f5","border-radius":"4px","max-height":"200px",overflow:"auto"}},b=exports("default", E({__name:"XhsPlanBudget",setup(D){const b=ref(null),x=ref(false),I=ref(null),B=ref({campaignData:"",limitDayBudget:true,smartSwitch:false}),S={campaignData:{required:true,trigger:["input","blur"],validator(a,e){if(!e)return new Error("请输入计划ID和预算");const t=e.split(/\n/).filter(a=>""!==a.trim());for(const i of t){const a=i.trim().split(/[\s,]+/);if(a.length<2)return new Error("每行需要包含计划ID和预算金额");const e=a[0],t=a[1];if(!/^\d+$/.test(e))return new Error(`计划ID "${e}" 不是有效的数字`);if(!/^\d+$/.test(t))return new Error(`预算金额 "${t}" 不是有效的数字`)}return  true}}},$=async a=>{a.preventDefault();try{await(b.value?.validate()),x.value=!0,I.value=null;const a=(a=>{const e=a.split("\n").filter(a=>""!==a.trim()),t=[];for(const i of e){const a=i.trim().split(/[\s,]+/);a.length>=2&&t.push({campaignId:parseInt(a[0]),campaignDayBudget:100*parseInt(a[1])});}return t})(B.value.campaignData),e={budgetList:a.map(a=>({campaignId:a.campaignId,limitDayBudget:B.value.limitDayBudget?1:0,campaignDayBudget:a.campaignDayBudget,smartSwitch:B.value.smartSwitch?1:0}))},t=await fetch("https://ad.xiaohongshu.com/api/leona/rtb/campaign/batch/budget",{method:"PUT",headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin",referrer:"https://ad.xiaohongshu.com/aurora/ad/manage/campaign?vSellerId=68d51ba511fe6b0015a32390"},body:JSON.stringify(e),credentials:"include"}),i=await t.json();if(!t.ok)throw new Error(i.message||`❌ 请求失败 (${t.status})`);I.value={success:!0,message:`✅ 成功修改 ${a.length} 个计划的预算`,details:i};}catch(e){I.value={success:false,message:`❌ ${e.message||"网络请求失败"}`,details:e};}finally{x.value=false;}};return (a,D)=>(openBlock(),createBlock(unref(NCard),{title:"批量修改计划预算"},{default:withCtx(()=>[createVNode(unref(NForm),{model:B.value,rules:S,ref_key:"formRef",ref:b},{default:withCtx(()=>[createVNode(unref(NFormItem),{label:"计划ID和预算",path:"campaignData"},{default:withCtx(()=>[createVNode(unref(NInput),{value:B.value.campaignData,"onUpdate:value":D[0]||(D[0]=a=>B.value.campaignData=a),type:"textarea",autosize:{minRows:5},placeholder:"每行输入一个计划ID和预算，用空格或逗号分隔\n例如:\n150859569 50000\n150886366 90000"},null,8,["value"])]),_:1}),createVNode(unref(NRow),{gutter:[0,12]},{default:withCtx(()=>[createVNode(unref(NCol),{span:24},{default:withCtx(()=>[createElementVNode("div",_,[createVNode(unref(NButton),{type:"primary",onClick:$,loading:x.value},{default:withCtx(()=>[...D[1]||(D[1]=[createTextVNode(" 🚀 批量修改预算 ",-1)])]),_:1},8,["loading"])])]),_:1})]),_:1})]),_:1},8,["model"]),I.value?(openBlock(),createBlock(unref(NCard),{key:0,title:"请求结果",style:{"margin-top":"20px"}},{default:withCtx(()=>[createVNode(unref(NAlert),{type:I.value.success?"success":"error"},{icon:withCtx(()=>[createTextVNode(toDisplayString(I.value.success?"✅":"❌"),1)]),default:withCtx(()=>[createTextVNode(" "+toDisplayString(I.value.message),1)]),_:1},8,["type"]),I.value.details?(openBlock(),createElementBlock("pre",w,"        "+toDisplayString(JSON.stringify(I.value.details,null,2))+"\n      ",1)):createCommentVNode("",true)]),_:1})):createCommentVNode("",true)]),_:1}))}},[["__scopeId","data-v-64a6b64a"]]));

		})
	};
}));

System.register("./LinkCheckerComponent-cdgOnSHE-9AiZrZCa.js", ['vue', './XHS-BFa4sA7T-DddofJSb.js', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, reactive, watch, resolveComponent, openBlock, createElementBlock, createVNode, withCtx, createElementVNode, createBlock, createCommentVNode, Fragment, renderList, createTextVNode, toDisplayString, g, useMessage, E;
	return {
		setters: [module => {
			ref = module.ref;
			reactive = module.reactive;
			watch = module.watch;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createElementVNode = module.createElementVNode;
			createBlock = module.createBlock;
			createCommentVNode = module.createCommentVNode;
			Fragment = module.Fragment;
			renderList = module.renderList;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
		}, module => {
			g = module.L;
		}, module => {
			useMessage = module.useMessage;
		}, module => {
			E = module.E;
		}],
		execute: (function () {

			const _={class:"modal-content"},h=exports("default", E({__name:"LinkCheckerComponent",props:{show:Boolean,data:Object},emits:["update:show"],setup(g$1,{emit:h}){const x=g$1,k=new g;useMessage();const U=ref([]),C=ref(null),w=[{title:"创建时间",key:"creativityCreateTime",width:150},{title:"创意名",key:"creativityName",resizable:true},{title:"创意ID",key:"creativityId",width:120},{title:"点击链接",key:"clickUrls",render:e=>e.clickUrls?e.clickUrls.map(e=>k.extractUrlParam(e)).join("\n"):""},{title:"曝光链接",key:"expoUrls",render:e=>e.expoUrls?e.expoUrls.map(e=>k.extractUrlParam(e)).join("\n"):""}];function b(){U.value&&U.value.length>0&&(k.responseData=U.value,k.downloadCSV());}const S=reactive({page:1,pageSize:10,showSizePicker:true,pageSizes:[10,20,50],prefix:({itemCount:e})=>`总共有 ${e} 条数据`,onChange:e=>{S.page=e;},onUpdatePageSize:e=>{S.pageSize=e,S.page=1;}});return watch(()=>x.data,e=>{if(e){U.value=e;const t=new g;t.processStats(e),C.value=t.stats;}},{immediate:true}),(e,t)=>{const l=resolveComponent("n-button"),f=resolveComponent("n-statistic"),y=resolveComponent("n-card"),g=resolveComponent("n-grid-item"),h=resolveComponent("n-grid"),x=resolveComponent("n-ellipsis"),k=resolveComponent("n-list-item"),z=resolveComponent("n-list"),j=resolveComponent("n-scrollbar"),P=resolveComponent("n-data-table");return openBlock(),createElementBlock("div",null,[createVNode(y,null,{"header-extra":withCtx(()=>[createVNode(l,{strong:"",secondary:"",onClick:b},{default:withCtx(()=>[...t[0]||(t[0]=[createTextVNode(" 下载数据 ",-1)])]),_:1})]),default:withCtx(()=>[createElementVNode("div",_,[C.value&&C.value.totalCreativity>0?(openBlock(),createBlock(h,{key:0,cols:3,responsive:"screen","x-gap":12,"y-gap":12},{default:withCtx(()=>[createVNode(g,null,{default:withCtx(()=>[createVNode(y,{title:"总创意数"},{default:withCtx(()=>[createVNode(f,{value:C.value.totalCreativity},null,8,["value"])]),_:1})]),_:1}),createVNode(g,null,{default:withCtx(()=>[createVNode(y,{title:"点击链接种类"},{default:withCtx(()=>[createVNode(f,{value:C.value.clickUrlCounts.length},null,8,["value"])]),_:1})]),_:1}),createVNode(g,null,{default:withCtx(()=>[createVNode(y,{title:"曝光链接种类"},{default:withCtx(()=>[createVNode(f,{value:C.value.expoUrlCounts.length},null,8,["value"])]),_:1})]),_:1})]),_:1})):createCommentVNode("",true),C.value&&C.value.clickUrlCounts.length>0?(openBlock(),createBlock(y,{key:1,title:"点击链接统计",style:{"margin-top":"16px"},class:"auto-height-card"},{default:withCtx(()=>[createVNode(j,{style:{"max-height":"150px"}},{default:withCtx(()=>[createVNode(z,null,{default:withCtx(()=>[(openBlock(true),createElementBlock(Fragment,null,renderList(C.value.clickUrlCounts,e=>(openBlock(),createBlock(k,{key:e.url},{default:withCtx(()=>[createVNode(x,{style:{"max-width":"100%"},tooltip:true},{default:withCtx(()=>[createTextVNode(toDisplayString(e.displayUrl)+" ："+toDisplayString(e.count)+" 条 ",1)]),_:2},1024)]),_:2},1024))),128))]),_:1})]),_:1})]),_:1})):createCommentVNode("",true),C.value&&C.value.expoUrlCounts.length>0?(openBlock(),createBlock(y,{key:2,title:"曝光链接统计",style:{"margin-top":"16px"}},{default:withCtx(()=>[createVNode(j,{style:{"max-height":"150px"}},{default:withCtx(()=>[createVNode(z,null,{default:withCtx(()=>[(openBlock(true),createElementBlock(Fragment,null,renderList(C.value.expoUrlCounts,e=>(openBlock(),createBlock(k,{key:e.url},{default:withCtx(()=>[createVNode(x,{style:{"max-width":"100%"},tooltip:true},{default:withCtx(()=>[createTextVNode(toDisplayString(e.displayUrl)+" ："+toDisplayString(e.count)+" 条 ",1)]),_:2},1024)]),_:2},1024))),128))]),_:1})]),_:1})]),_:1})):createCommentVNode("",true),createVNode(y,{title:"详细数据",style:{"margin-top":"16px",flex:"1"}},{default:withCtx(()=>[createVNode(P,{columns:w,data:U.value,pagination:S,striped:"",bordered:true},null,8,["data","pagination"])]),_:1}),U.value&&U.value.length>0?(openBlock(),createBlock(l,{key:3,onClick:b,type:"primary",style:{"margin-bottom":"16px",width:"100%"}},{default:withCtx(()=>[...t[1]||(t[1]=[createTextVNode(" 下载数据 ",-1)])]),_:1})):createCommentVNode("",true)])]),_:1})])}}},[["__scopeId","data-v-b235a5cb"]]));

		})
	};
}));

System.register("./XhsDataExtractor-CMV8PoMO-C5TZ_BfD.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, computed, h, onMounted, openBlock, createElementBlock, createVNode, unref, withCtx, createTextVNode, toDisplayString, createBlock, createCommentVNode, Fragment, renderList, createElementVNode, useMessage, NButton, NSpace, NFormItem, NSelect, NDatePicker, NCollapseTransition, NCard, NEmpty, NInput, NAlert, NDataTable, E$1;
	return {
		setters: [module => {
			ref = module.ref;
			computed = module.computed;
			h = module.h;
			onMounted = module.onMounted;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			unref = module.unref;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			createBlock = module.createBlock;
			createCommentVNode = module.createCommentVNode;
			Fragment = module.Fragment;
			renderList = module.renderList;
			createElementVNode = module.createElementVNode;
		}, module => {
			useMessage = module.useMessage;
			NButton = module.NButton;
			NSpace = module.NSpace;
			NFormItem = module.NFormItem;
			NSelect = module.NSelect;
			NDatePicker = module.NDatePicker;
			NCollapseTransition = module.NCollapseTransition;
			NCard = module.NCard;
			NEmpty = module.NEmpty;
			NInput = module.NInput;
			NAlert = module.NAlert;
			NDataTable = module.NDataTable;
		}, module => {
			E$1 = module.E;
		}],
		execute: (function () {

			const $={class:"extractor-wrapper"},L="xiaohongshuAccountGroups",E=exports("default", E$1({__name:"XhsDataExtractor",setup(T){const E=useMessage(),F=[{code:"date_key",name:"日期"},{code:"NAME",name:"姓名"},{code:"income_amt",name:"运营总消耗"},{code:"imp_cnt",name:"曝光量"},{code:"click_cnt",name:"点击量"},{code:"jj_return_amount",name:"竞价返货消耗"},{code:"jj_compensate_return_amount",name:"竞价赔付消耗"}],V={group_default_1:{name:"组合1",accounts:["【ZT-qjj】YL-新媒体-STYX-HC-服饰-信息流-rta-ocpx","【ZT-qjj】YL-新媒体-STYX-HC-服饰-搜索-rta-cpc","【ZT-qjj】YL-新媒体-STYX-HC-服饰-信息流-rta-cpc","【ZT-qjj】YL-新媒体-STYX-HC-服饰-信息流-无r-ocpx"],operatorName:"仇江江"}},D=ref({}),z=ref([]),O=ref(null),q=ref(false),A=ref(false),U=ref(""),M=ref([]),Y=ref([]),I=computed(()=>Object.entries(D.value).map(([e,a])=>({label:a.name||e,value:e}))),H=computed(()=>!(!O.value||2!==O.value.length)&&0!==z.value.length),X=computed(()=>[...F.map(e=>({title:e.name,key:e.code,width:110})),{title:"组合名",key:"_groupName",width:180},{title:"操作",key:"_action",width:80,render:e=>h(NButton,{size:"small",type:"primary",onClick:()=>function(e){const a=F.map(a=>e[a.code]);a.push(e._groupName);te(a.join("\t"),"单行已复制");}(e)},{default:()=>"复制"})}]);function Z(e){const a=new Date(e);return `${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`}function B(){return "group_"+Date.now()+"_"+Math.random().toString(36).substr(2,9)}function J(){return Math.random().toString(36).substr(2,16)+Math.random().toString(36).substr(2,16)}function P(){Y.value=Object.entries(D.value).map(([e,a])=>({_key:e,name:a.name||e,accounts:[...a.accounts||[]],operatorName:a.operatorName||"仇江江"}));}function G(){A.value=!A.value,A.value&&P();}function R(){Y.value.push({_key:B(),name:`新组合${Y.value.length+1}`,accounts:[""],operatorName:"仇江江"});}function K(){A.value=false,P(),U.value="";}function Q(){U.value="";const e=[],a={};var t;(Y.value.forEach((t,l)=>{const n=t.name.trim();if(!n)return void e.push(`第 ${l+1} 个组合名称不能为空`);const o=t.accounts.map(e=>e.trim()).filter(Boolean);0!==o.length?a[t._key||B()]={name:n,accounts:o,operatorName:t.operatorName.trim()||"仇江江"}:e.push(`组合 "${n}" 至少需要配置一个账户`);}),e.length)?U.value=e.join("；"):0!==Object.keys(a).length?(t=a,localStorage.setItem(L,JSON.stringify(t)),D.value=t,A.value=false,E.success("配置保存成功")):U.value="至少需要配置一个组合";}async function W(){if(!H.value)return;const e=Z(O.value[0]),a=Z(O.value[1]);q.value=true,M.value=[];try{const t=z.value.map(t=>{const l=D.value[t],n=l.accounts||[];if(!n.length)throw new Error(`组合 "${l.name||t}" 没有配置账户`);return async function(e,a,t){const l={accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json;charset=UTF-8","sec-ch-ua":'"Not=A?Brand";v="99", "Microsoft Edge";v="151", "Chromium";v="151"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-b3-traceid":J()},n={viewAlias:"partner_dataCenter_selfAnalysis_daiLiView",sorts:[],page:{pageNo:1,pageSize:10},frontFilterList:[{filterField:"time_dim",filterFieldName:"时间维度",require:1,filterType:20,selectFilter:{selectLabels:[{labelValue:"all_key",labelName:"合计",selected:0},{selected:1,labelValue:"date_key",labelName:"按天"},{labelValue:"week_key",labelName:"按周",selected:0},{labelValue:"month_key",labelName:"按月",selected:0}],selectType:10,selectShowType:0,valueSource:0},hide:0,foldType:0},{foldType:0,filterField:"date_key",filterFieldName:"",require:1,filterType:10,timeFilter:{limitMax:366,defaultDate:0,quickDates:[6,11,16,21,36,41,46,51],values:[a,t],pattern:10,timeShowType:11,disableRange:0,useDate:0},hide:0},{textFilter:{valueSource:2,fields:["virtual_seller_name","virtual_seller_id"],selectType:20,viewAlias:"partner_commonSearch_daiLiDimView",selectFileds:[],caseSensitive:0,defaultValue:"",mappingFields:["virtual_seller_name","virtual_seller_id"],operate:120,values:e,operateList:[],defaultOperate:120,customOperate:e.map(e=>({label:e,value:e,virtual_seller_name:e,virtual_seller_id:""}))},hide:0,foldType:2,filterField:"virtual_seller_name",filterFieldName:"子账号名称/ID",filterType:40}],dynamicTargets:["brand_company_name","income_amt","imp_cnt","click_cnt","jj_return_amount","jj_compensate_return_amount"],extra:null},o=await fetch("https://partner.xiaohongshu.com/api/vision/dashboard/target_detail_list",{method:"POST",headers:l,body:JSON.stringify(n),credentials:"include"}),r=await o.json();if(0===r.code&&r.success)return r.data;throw new Error(`API返回错误: ${r.msg}`)}(n,e,a).then(e=>({groupId:t,groupName:l.name||t,data:e,operatorName:l.operatorName||"仇江江"}))}),l=await Promise.allSettled(t),n=[],o=[];l.forEach((e,a)=>{if("fulfilled"===e.status)n.push(e.value);else {const e=z.value[a];o.push(e);}}),M.value=n.map(t=>{const l=e===a?e:`${e} ~ ${a}`,n=function(e,a,t){if(!e||!e.detailListVo||!e.detailListVo.detailVoList)return [];const l=e.detailListVo.detailVoList;return l.length?l.flatMap(e=>{const l=e.targetList;if(!l||!l.length)return [];const n={};l.forEach(e=>{n[e.targetCode]=e.targetValue||e.targetDownloadValue||"";});const o={};return F.forEach(e=>{o[e.code]="NAME"===e.code?t:n[e.code]||"";}),o._groupName=a,[o]}):[]}(t.data,t.groupName,t.operatorName);return {...t,dateLabel:l,rows:n}}),o.length>0&&E.warning(`部分组合提取失败: ${o.join(", ")}`),n.length>0?E.success(`数据提取完成，成功 ${n.length} 个组合`):E.error("所有组合数据提取失败");}catch(t){E.error("数据提取失败: "+t.message);}finally{q.value=false;}}function ee(e){const a=document.createElement("textarea");a.value=e,a.style.position="fixed",a.style.left="-9999px",a.style.top="0",document.body.appendChild(a),a.focus(),a.select();let t=false;try{t=document.execCommand("copy");}catch(l){}return document.body.removeChild(a),t}function ae(){if(!M.value.length)return void E.warning("没有数据可复制");const e=[[...F.map(e=>e.name),"组合名"].join("\t")];M.value.forEach(a=>{a.rows&&a.rows.forEach(a=>{const t=F.map(e=>a[e.code]);t.push(a._groupName),e.push(t.join("\t"));});}),e.length<=1?E.warning("没有数据可复制"):te(e.join("\n"),"所有组合已复制");}function te(e,a){navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(e).then(()=>E.success(a)).catch(()=>{ee(e)?E.success(a):E.error("复制失败，请手动复制");}):ee(e)?E.success(a):E.error("复制失败，请手动复制");}return onMounted(()=>{D.value=function(){try{const e=localStorage.getItem(L);if(e){const a=JSON.parse(e),t=Object.keys(a)[0];if(t&&a[t]&&void 0!==a[t].name)return a;const l={};for(const[e,n]of Object.entries(a))Array.isArray(n)?l[B()]={name:e,accounts:n,operatorName:"仇江江"}:l[B()]={name:e,accounts:n.accounts||[],operatorName:n.operatorName||"仇江江"};return l}}catch(e){}return {...V}}();const e=function(){const e=new Date;return e.setDate(e.getDate()-1),e.setHours(0,0,0,0),e.getTime()}();O.value=[e,e];}),(e,a)=>(openBlock(),createElementBlock("div",$,[createVNode(unref(NSpace),{vertical:"",size:16},{default:withCtx(()=>[createVNode(unref(NFormItem),{label:"选择账户组合 (可多选)"},{default:withCtx(()=>[createVNode(unref(NSelect),{value:z.value,"onUpdate:value":a[0]||(a[0]=e=>z.value=e),multiple:"",options:I.value,placeholder:"请选择账户组合"},null,8,["value","options"])]),_:1}),createVNode(unref(NFormItem),{label:"日期范围"},{default:withCtx(()=>[createVNode(unref(NDatePicker),{value:O.value,"onUpdate:value":a[1]||(a[1]=e=>O.value=e),type:"daterange",clearable:"",class:"full-width"},null,8,["value"])]),_:1}),createVNode(unref(NButton),{type:"primary",loading:q.value,disabled:!H.value,class:"full-width",onClick:W},{default:withCtx(()=>[...a[2]||(a[2]=[createTextVNode(" 提取数据 ",-1)])]),_:1},8,["loading","disabled"]),createVNode(unref(NButton),{text:"",type:"primary",onClick:G},{default:withCtx(()=>[createTextVNode(toDisplayString(A.value?"隐藏配置":"配置组合设置"),1)]),_:1}),createVNode(unref(NCollapseTransition),{show:A.value},{default:withCtx(()=>[createVNode(unref(NCard),{size:"small",embedded:""},{default:withCtx(()=>[0===Y.value.length?(openBlock(),createBlock(unref(NEmpty),{key:0,description:"暂无组合配置，点击下方按钮添加"})):createCommentVNode("",true),(openBlock(true),createElementBlock(Fragment,null,renderList(Y.value,(e,t)=>(openBlock(),createElementBlock("div",{key:e._key,class:"config-group-item"},[createVNode(unref(NSpace),{align:"center",wrap:false},{default:withCtx(()=>[createVNode(unref(NInput),{value:e.name,"onUpdate:value":a=>e.name=a,placeholder:"组合名称",class:"flex-1",status:e.name.trim()?"":"error"},null,8,["value","onUpdate:value","status"]),createVNode(unref(NButton),{type:"default",size:"small",onClick:e=>{return a=t,void Y.value.splice(a,1);var a;}},{default:withCtx(()=>[...a[3]||(a[3]=[createTextVNode(" 删除组合 ",-1)])]),_:1},8,["onClick"])]),_:2},1024),createVNode(unref(NSpace),{align:"center",wrap:false,class:"mt-8"},{default:withCtx(()=>[a[4]||(a[4]=createElementVNode("span",{class:"label-secondary"},"运营人姓名：",-1)),createVNode(unref(NInput),{value:e.operatorName,"onUpdate:value":a=>e.operatorName=a,placeholder:"请输入姓名"},null,8,["value","onUpdate:value"])]),_:2},1024),a[7]||(a[7]=createElementVNode("div",{class:"account-list-label"},"账户列表：",-1)),(openBlock(true),createElementBlock(Fragment,null,renderList(e.accounts,(l,o)=>(openBlock(),createBlock(unref(NSpace),{key:`${t}-${o}`,align:"center",wrap:false,class:"mt-6"},{default:withCtx(()=>[createVNode(unref(NInput),{value:e.accounts[o],"onUpdate:value":a=>e.accounts[o]=a,placeholder:"账户名称",class:"flex-1",status:l.trim()?"":"error"},null,8,["value","onUpdate:value","status"]),createVNode(unref(NButton),{text:"",type:"default",onClick:e=>function(e,a){Y.value[e].accounts.splice(a,1);}(t,o)},{default:withCtx(()=>[...a[5]||(a[5]=[createTextVNode(" × ",-1)])]),_:1},8,["onClick"])]),_:2},1024))),128)),createVNode(unref(NButton),{text:"",type:"primary",class:"mt-6 full-width",onClick:e=>function(e){Y.value[e].accounts.push("");}(t)},{default:withCtx(()=>[...a[6]||(a[6]=[createTextVNode(" + 添加账户 ",-1)])]),_:1},8,["onClick"])]))),128)),createVNode(unref(NButton),{type:"primary",dashed:"",class:"full-width mt-12",onClick:R},{default:withCtx(()=>[...a[8]||(a[8]=[createTextVNode(" + 添加新组合 ",-1)])]),_:1}),U.value?(openBlock(),createBlock(unref(NAlert),{key:1,type:"error","show-icon":false,class:"mt-8"},{default:withCtx(()=>[createTextVNode(toDisplayString(U.value),1)]),_:1})):createCommentVNode("",true),createVNode(unref(NSpace),{class:"mt-12"},{default:withCtx(()=>[createVNode(unref(NButton),{type:"primary",style:{flex:"2"},onClick:Q},{default:withCtx(()=>[...a[9]||(a[9]=[createTextVNode(" 保存配置 ",-1)])]),_:1}),createVNode(unref(NButton),{type:"default",style:{flex:"1"},onClick:K},{default:withCtx(()=>[...a[10]||(a[10]=[createTextVNode(" 取消 ",-1)])]),_:1})]),_:1})]),_:1})]),_:1},8,["show"]),createVNode(unref(NCollapseTransition),{show:M.value.length>0},{default:withCtx(()=>[createVNode(unref(NSpace),{vertical:"",size:12},{default:withCtx(()=>[M.value.length>0?(openBlock(),createBlock(unref(NButton),{key:0,type:"primary",size:"small",onClick:ae},{default:withCtx(()=>[...a[11]||(a[11]=[createTextVNode(" 复制所有组合 ",-1)])]),_:1})):createCommentVNode("",true),(openBlock(true),createElementBlock(Fragment,null,renderList(M.value,(e,t)=>(openBlock(),createBlock(unref(NCard),{key:`${e.groupId}-${e.dateLabel}-${t}`,size:"small",title:`组合: ${e.groupName} (${e.dateLabel})`},{"header-extra":withCtx(()=>[createVNode(unref(NButton),{size:"small",type:"primary",onClick:e=>function(e){const a=M.value[e];if(!a||!a.rows.length)return void E.warning("该组合暂无数据可复制");const t=[[...F.map(e=>e.name),"组合名"].join("\t")];a.rows.forEach(e=>{const a=F.map(a=>e[a.code]);a.push(e._groupName),t.push(a.join("\t"));}),te(t.join("\n"),"复制成功");}(t)},{default:withCtx(()=>[...a[12]||(a[12]=[createTextVNode(" 复制全部 ",-1)])]),_:1},8,["onClick"])]),default:withCtx(()=>[e.rows&&e.rows.length?(openBlock(),createBlock(unref(NDataTable),{key:0,columns:X.value,data:e.rows,"single-line":false,size:"small",pagination:false,class:"table-small-text"},null,8,["columns","data"])):(openBlock(),createBlock(unref(NEmpty),{key:1,description:"无详细数据"}))]),_:2},1032,["title"]))),128))]),_:1})]),_:1},8,["show"])]),_:1})]))}},[["__scopeId","data-v-0b231740"]]));

		})
	};
}));

System.register("./ZhitouCreative-BqZ8YslW-D_gU7Xvh.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, resolveComponent, openBlock, createElementBlock, createVNode, withCtx, createTextVNode, toDisplayString, useMessage, E;
	return {
		setters: [module => {
			ref = module.ref;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
		}, module => {
			useMessage = module.useMessage;
		}, module => {
			E = module.E;
		}],
		execute: (function () {

			const p={class:"jihua-container"},u=exports("default", E({__name:"ZhitouCreative",setup(l){const u=useMessage(),m=ref(""),d=ref(false),h=ref(false);function v(){if(m.value.trim()){d.value=true;try{const t=m.value.trim().split("\n").map(e=>e.trim().split("\t")),a=[],i=[];t.forEach(e=>{"信息流"===e[0]?a.push(e[1]):"搜索"===e[0]&&i.push(e[1]);});const n=[];a.length>0&&n.push((e=a,fetch("https://galaxy.alibaba-inc.com/creativePlan/automatedSetUp",{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",appname:"adcontent-op","bx-v":"2.5.31","content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"},referrer:"https://galaxy.alibaba-inc.com/",body:JSON.stringify({mediaCode:0,opType:2,taskOpType:7,taskType:3,name:h.value?"创意开启":"创意关闭",campaignSettings:'{"startTime":null}',unitSettings:"{}",creativeSettings:h.value?'{"status":1}':'{"status":2}',ext:'{"marketingTarget":4,"placement":1,"optimizeTarget":0,"type":"creative"}',mediaIdList:e}),method:"POST",mode:"cors",credentials:"include"}))),i.length>0&&n.push(function(e){return fetch("https://galaxy.alibaba-inc.com/creativePlan/automatedSetUp",{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",appname:"adcontent-op","bx-v":"2.5.31","content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"},referrer:"https://galaxy.alibaba-inc.com/",body:JSON.stringify({mediaCode:0,opType:2,taskOpType:7,taskType:3,name:h.value?"创意开启":"创意关闭",campaignSettings:'{"startTime":null}',unitSettings:"{}",creativeSettings:h.value?'{"status":1}':'{"status":2}',ext:'{"marketingTarget":4,"placement":2,"optimizeTarget":0,"type":"creative"}',mediaIdList:e}),method:"POST",mode:"cors",credentials:"include"})}(i)),Promise.all(n).then(()=>{u.success("操作已提交成功"),d.value=!1;}).catch(e=>{u.error("操作执行失败"),d.value=!1;});}catch(t){u.error("数据处理失败"),d.value=false;}var e;}else u.warning("请输入需要处理的数据");}return (e,r)=>{const l=resolveComponent("n-input"),u=resolveComponent("n-checkbox"),g=resolveComponent("n-button"),f=resolveComponent("n-space");return openBlock(),createElementBlock("div",p,[createVNode(f,{vertical:""},{default:withCtx(()=>[createVNode(l,{value:m.value,"onUpdate:value":r[0]||(r[0]=e=>m.value=e),type:"textarea",placeholder:"请输入数据\n\n示例：\n搜索\t2035614598\n信息流\t2033338178\n搜索\t2035670707",autosize:{minRows:10,maxRows:15},clearable:""},null,8,["value"]),createVNode(u,{checked:h.value,"onUpdate:checked":r[1]||(r[1]=e=>h.value=e)},{default:withCtx(()=>[...r[2]||(r[2]=[createTextVNode(" 启用创意 (取消勾选则关闭创意) ",-1)])]),_:1},8,["checked"]),createVNode(g,{type:"primary",onClick:v,loading:d.value,disabled:!m.value.trim()},{default:withCtx(()=>[createTextVNode(toDisplayString(d.value?"处理中...":"提交执行"),1)]),_:1},8,["loading","disabled"])]),_:1})])}}},[["__scopeId","data-v-07435d1f"]]));

		})
	};
}));

System.register("./ZhitouPlan-Lgy35ku--C7Szsnx-.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, computed, resolveComponent, openBlock, createElementBlock, createVNode, withCtx, createElementVNode, createTextVNode, createBlock, createCommentVNode, toDisplayString, useMessage, E;
	return {
		setters: [module => {
			ref = module.ref;
			computed = module.computed;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createElementVNode = module.createElementVNode;
			createTextVNode = module.createTextVNode;
			createBlock = module.createBlock;
			createCommentVNode = module.createCommentVNode;
			toDisplayString = module.toDisplayString;
		}, module => {
			useMessage = module.useMessage;
		}, module => {
			E = module.E;
		}],
		execute: (function () {

			const m={class:"plan-container"},g=exports("default", E({__name:"ZhitouPlan",setup(v){const g=useMessage(),f=ref("close"),y=ref(null),h=ref(""),b=ref(false);async function w(e,t,a){const n="close"===a.mode?"关闭":`调价至 ${a.budget}`;try{const l=function(e,t,a){const n={"信息流":1,"搜索":2}[e];if(void 0===n)throw new Error(`未知的计划类型: "${e}"`);let l={},u="";if("close"===a.mode)l={status:2},u="关闭";else if("adjust"===a.mode){if("number"!=typeof a.budget||a.budget<=0)throw new Error("预算金额无效。");l={campaignDayBudget:a.budget,startTime:"2025-08-01"},u=`调整预算至${a.budget}`;}const i=JSON.stringify(l),o=JSON.stringify({marketingTarget:4,placement:n,optimizeTarget:0,type:"plan"});return {mediaCode:0,opType:2,taskOpType:"close"===a.mode?4:3,taskType:1,name:u,campaignSettings:i,unitSettings:"{}",creativeSettings:"{}",ext:o,mediaIdList:t.map(e=>String(e))}}(e,t,a),u=await fetch("https://galaxy.alibaba-inc.com/creativePlan/automatedSetUp",{method:"POST",headers:{accept:"application/json, text/plain, */*","content-type":"application/json",appname:"adcontent-op"},body:JSON.stringify(l)});if(!u.ok)throw new Error(`HTTP 错误! 状态码: ${u.status}`);const i=await u.json();i.success||"200"===String(i.code)?g.success(`[${e}] 类型的计划已提交 [${n}] 操作`):g.error(`[${e}] 类型的计划操作失败`);}catch(l){g.error(`[${e}] 类型的计划请求异常`);}}const _=computed(()=>!!h.value.trim()&&!("adjust"===f.value&&!y.value));async function T(){if(h.value.trim())if("adjust"!==f.value||y.value){b.value=true;try{const t={mode:f.value,budget:y.value},a={"信息流":[],"搜索":[]};h.value.trim().split("\n").forEach(e=>{const t=e.trim().split(/\s+/);if(t.length>=2&&t[1]){const e=t[0],n=t[1];a[e]&&a[e].push(n);}});const n=a["信息流"],l=a["搜索"];if(0===n.length&&0===l.length)return g.error("未能解析出任何有效的任务，请检查数据格式"),void(b.value=!1);let u=!1;n.length>0&&(await w("信息流",n,t),u=!0),l.length>0&&(u&&await(e=1e3,new Promise(t=>setTimeout(t,e))),await w("搜索",l,t)),g.success("全部批量任务处理完毕！"),b.value=!1;}catch(t){g.error("数据处理失败"),b.value=false;}var e;}else g.warning("请输入日预算金额");else g.warning("请输入需要处理的数据");}return (e,t)=>{const p=resolveComponent("n-radio"),v=resolveComponent("n-space"),g=resolveComponent("n-radio-group"),w=resolveComponent("n-input-number"),S=resolveComponent("n-input"),j=resolveComponent("n-button");return openBlock(),createElementBlock("div",m,[createVNode(v,{vertical:""},{default:withCtx(()=>[t[6]||(t[6]=createElementVNode("div",{class:"description"},[createElementVNode("p",null,"请选择操作模式并输入需要处理的计划数据"),createElementVNode("p",null,"数据格式：平台 + Tab + 计划ID"),createElementVNode("p",null,"例如："),createElementVNode("pre",null,"搜索\t2035614598\n信息流\t2033338178\n搜索\t2035670707")],-1)),createVNode(g,{value:f.value,"onUpdate:value":t[0]||(t[0]=e=>f.value=e),name:"mode"},{default:withCtx(()=>[createVNode(v,null,{default:withCtx(()=>[createVNode(p,{value:"close"},{default:withCtx(()=>[...t[3]||(t[3]=[createTextVNode(" 批量关闭计划 ",-1)])]),_:1}),createVNode(p,{value:"adjust"},{default:withCtx(()=>[...t[4]||(t[4]=[createTextVNode(" 批量调整日预算 ",-1)])]),_:1})]),_:1})]),_:1},8,["value"]),"adjust"===f.value?(openBlock(),createBlock(w,{key:0,value:y.value,"onUpdate:value":t[1]||(t[1]=e=>y.value=e),placeholder:"请输入新的日预算金额",min:1,clearable:""},{prefix:withCtx(()=>[...t[5]||(t[5]=[createTextVNode(" ¥ ",-1)])]),_:1},8,["value"])):createCommentVNode("",true),createVNode(S,{value:h.value,"onUpdate:value":t[2]||(t[2]=e=>h.value=e),type:"textarea",placeholder:"请输入数据\n\n示例：\n搜索\t2035614598\n信息流\t2033338178\n搜索\t2035670707",autosize:{minRows:10,maxRows:15},clearable:""},null,8,["value"]),createVNode(j,{type:"primary",onClick:T,loading:b.value,disabled:!_.value},{default:withCtx(()=>[createTextVNode(toDisplayString(b.value?"处理中...":"提交执行"),1)]),_:1},8,["loading","disabled"])]),_:1})])}}},[["__scopeId","data-v-e3afed37"]]));

		})
	};
}));

System.register("./ZhitouCreativeFetcher-ECoK2xK5-v9iXXqKi.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, resolveComponent, openBlock, createElementBlock, createVNode, withCtx, createTextVNode, createElementVNode, createBlock, toDisplayString, createCommentVNode, h$1, useMessage, E;
	return {
		setters: [module => {
			ref = module.ref;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			createElementVNode = module.createElementVNode;
			createBlock = module.createBlock;
			toDisplayString = module.toDisplayString;
			createCommentVNode = module.createCommentVNode;
			h$1 = module.h;
		}, module => {
			useMessage = module.useMessage;
		}, module => {
			E = module.E;
		}],
		execute: (function () {

			const y={class:"getchuangyi-container"},h=exports("default", E({__name:"ZhitouCreativeFetcher",setup(p){const h=useMessage(),v=ref(false),g=ref(Date.now()),f=ref([]),w=[{title:"创意名称",key:"creativeName",width:200,ellipsis:{tooltip:true}},{title:"账户名称",key:"accountName",width:200,ellipsis:{tooltip:true}},{title:"计划名称",key:"campaignName",width:200,ellipsis:{tooltip:true}},{title:"创建时间",key:"createTime",width:150},{title:"状态",key:"statusDesc",width:100,render:e=>h$1("n-tag",{type:{"有效":"success","已被计划暂停":"warning","未知":"default"}[e.statusDesc]||"default",size:"small"},e.statusDesc)},{title:"审核状态",key:"auditStatusDesc",width:120,render:e=>h$1("n-tag",{type:{"审核通过":"success","审核拒绝":"error","更新待审核":"warning"}[e.auditStatusDesc]||"info",size:"small"},e.auditStatusDesc)},{title:"投放位置",key:"placementDesc",width:100},{title:"创意ID",key:"creativeId",width:120}],D=e=>e?new Date(e).toISOString().split("T")[0]:(new Date).toISOString().split("T")[0],b=async()=>{v.value=true;try{const e={media:"RED_BOOK",pageSize:500,startTime:D(g.value),endTime:D(g.value),pageNo:1},t=await fetch("https://galaxy.alibaba-inc.com/ad/manage/creative",{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",appname:"adcontent-op","bx-v":"2.5.31","content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"},referrer:"https://galaxy.alibaba-inc.com/",body:JSON.stringify(e),method:"POST",mode:"cors",credentials:"include"});if(!t.ok)throw new Error(`HTTP错误: ${t.status}`);const a=await t.json();if(!(a.success&&a.model&&a.model.result))throw new Error(a.msgInfo||"获取数据失败");{f.value=a.model.result;const e=new Date(g.value);new Date(e.getFullYear(),e.getMonth(),e.getDate());f.value=f.value.filter(t=>{const a=new Date(t.createTime);return a.getFullYear()===e.getFullYear()&&a.getMonth()===e.getMonth()&&a.getDate()===e.getDate()}),h.success(`获取成功! 共 ${f.value.length} 条数据`);}}catch(e){h.error("搜索失败: "+e.message);}finally{v.value=false;}},I=async()=>{try{await j("all"),h.success("数据已复制到剪贴板，可直接粘贴到Excel");}catch(e){h.error("复制失败: "+e.message);}},x=async()=>{try{await j("lastTwo"),h.success("创意ID和笔记id数据已复制到剪贴板，可直接粘贴到Excel");}catch(e){h.error("复制失败: "+e.message);}},j=async(e="all")=>{try{let t,a;"lastTwo"===e?(t=["创意ID","笔记id"],a=f.value.map(e=>[e.creativeId||"",e.contentId||""])):(t=["创意名称","账户名称","计划名称","创建时间","状态","审核状态","投放位置","创意ID","笔记id"],a=f.value.map(e=>[e.creativeName||"",e.accountName||"",e.campaignName||"",e.createTime||"",e.statusDesc||"",e.auditStatusDesc||"",e.placementDesc||"",e.creativeId||"",e.contentId||""]));const n=[t.join("\t"),...a.map(e=>e.join("\t"))].join("\n"),i=`\n      <table>\n        <thead>\n          <tr>${t.map(e=>`<th>${e}</th>`).join("")}</tr>\n        </thead>\n        <tbody>\n          ${a.map(e=>`<tr>${e.map(e=>`<td>${e}</td>`).join("")}</tr>`).join("")}\n        </tbody>\n      </table>\n    `,c=new ClipboardItem({"text/plain":new Blob([n],{type:"text/plain"}),"text/html":new Blob([i],{type:"text/html"})});await navigator.clipboard.write([c]);}catch(t){let a,n;"lastTwo"===e?(a=["创意ID","笔记id"],n=f.value.map(e=>[e.creativeId||"",e.contentId||""])):(a=["创意名称","账户名称","计划名称","创建时间","状态","审核状态","投放位置","创意ID","笔记id"],n=f.value.map(e=>[e.creativeName||"",e.accountName||"",e.campaignName||"",e.createTime||"",e.statusDesc||"",e.auditStatusDesc||"",e.placementDesc||"",e.creativeId||"",e.contentId||""]));const i=[a.join("\t"),...n.map(e=>e.join("\t"))].join("\n");await navigator.clipboard.writeText(i);}},z=()=>{try{const e=k(),t=new Blob([e],{type:"text/csv;charset=utf-8;"}),a=document.createElement("a");a.href=URL.createObjectURL(t);const n=D(g.value);a.download=`创意数据_${n}.csv`,document.body.appendChild(a),a.click(),document.body.removeChild(a),h.success("文件下载成功");}catch(e){h.error("下载失败: "+e.message);}},k=()=>{const e=f.value.map(e=>[`"${e.creativeName||""}"`,`"${e.accountName||""}"`,`"${e.campaignName||""}"`,e.createTime||"",e.statusDesc||"",e.auditStatusDesc||"",e.placementDesc||"",e.creativeId||"",e.contentId||""]);return [["创意名称","账户名称","计划名称","创建时间","状态","审核状态","投放位置","创意ID","笔记id"].join(","),...e.map(e=>e.join(","))].join("\n")};return (e,u)=>{const m=resolveComponent("n-date-picker"),p=resolveComponent("n-button"),h=resolveComponent("n-space"),D=resolveComponent("n-data-table"),j=resolveComponent("n-card");return openBlock(),createElementBlock("div",y,[createVNode(h,{vertical:"",size:16},{default:withCtx(()=>[createVNode(h,{align:"center",size:12},{default:withCtx(()=>[createVNode(m,{value:g.value,"onUpdate:value":u[0]||(u[0]=e=>g.value=e),type:"date",placeholder:"选择发布日期",format:"yyyy-MM-dd",style:{width:"200px"}},null,8,["value"]),createVNode(p,{type:"primary",onClick:b,loading:v.value},{icon:withCtx(()=>[...u[1]||(u[1]=[createElementVNode("span",{style:{"font-size":"16px"}},"🔍",-1)])]),default:withCtx(()=>[u[2]||(u[2]=createTextVNode(" 开始搜索 ",-1))]),_:1},8,["loading"])]),_:1}),f.value.length>0?(openBlock(),createBlock(j,{key:0,size:"small"},{header:withCtx(()=>[createVNode(h,{justify:"space-between",align:"center"},{default:withCtx(()=>[createElementVNode("span",null,"创意数据列表 (共 "+toDisplayString(f.value.length)+" 条)",1),createVNode(h,null,{default:withCtx(()=>[createVNode(p,{size:"small",onClick:I},{icon:withCtx(()=>[...u[3]||(u[3]=[createElementVNode("span",{style:{"font-size":"14px"}},"📋",-1)])]),default:withCtx(()=>[u[4]||(u[4]=createTextVNode(" 复制 ",-1))]),_:1}),createVNode(p,{size:"small",type:"primary",onClick:z},{icon:withCtx(()=>[...u[5]||(u[5]=[createElementVNode("span",{style:{"font-size":"14px"}},"📥",-1)])]),default:withCtx(()=>[u[6]||(u[6]=createTextVNode(" 下载 ",-1))]),_:1}),createVNode(p,{size:"small",type:"primary",onClick:x},{icon:withCtx(()=>[...u[7]||(u[7]=[createElementVNode("span",{style:{"font-size":"14px"}},"📥",-1)])]),default:withCtx(()=>[u[8]||(u[8]=createTextVNode(" 复制创意 ",-1))]),_:1})]),_:1})]),_:1})]),default:withCtx(()=>[createVNode(D,{columns:w,data:f.value,pagination:{pageSize:20},striped:"",size:"small","scroll-x":1400},null,8,["data"])]),_:1})):createCommentVNode("",true)]),_:1})])}}},[["__scopeId","data-v-6f59bfac"]]));

		})
	};
}));

System.register("./ZhitouSearch-B1zWKDqu-BOugsqxw.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, computed, watch, openBlock, createElementBlock, createElementVNode, createVNode, unref, withCtx, createTextVNode, toDisplayString, createBlock, normalizeClass, createCommentVNode, Fragment, renderList, useMessage, NCard, NForm, NFormItem, NInput, NInputNumber, NButton, NCollapse, NCollapseItem, NTag, E$1;
	return {
		setters: [module => {
			ref = module.ref;
			computed = module.computed;
			watch = module.watch;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createElementVNode = module.createElementVNode;
			createVNode = module.createVNode;
			unref = module.unref;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			createBlock = module.createBlock;
			normalizeClass = module.normalizeClass;
			createCommentVNode = module.createCommentVNode;
			Fragment = module.Fragment;
			renderList = module.renderList;
		}, module => {
			useMessage = module.useMessage;
			NCard = module.NCard;
			NForm = module.NForm;
			NFormItem = module.NFormItem;
			NInput = module.NInput;
			NInputNumber = module.NInputNumber;
			NButton = module.NButton;
			NCollapse = module.NCollapse;
			NCollapseItem = module.NCollapseItem;
			NTag = module.NTag;
		}, module => {
			E$1 = module.E;
		}],
		execute: (function () {

			const x={class:"search-price-container"},D={class:"button-group"},T={class:"result-header"},q={class:"result-icon"},z={class:"result-title"},O={class:"result-content"},C={key:0},E={key:1,class:"error-message"},U={class:"preview-header"},j={class:"plan-ids-grid"},J=exports("default", E$1({__name:"ZhitouSearch",setup(S){const J=useMessage(),$=ref(false),P=ref(null),A=ref(null),G=ref({planIds:"",keywordBid:1.5,startTime:Date.now(),taskName:"调整搜索出价"}),L={planIds:{required:true,message:"请输入计划ID",trigger:["blur","input"],validator:(e,a)=>{if(!a||!a.trim())return new Error("请输入计划ID");const l=M(a);return 0===l.length?new Error("请输入有效的计划ID"):!(l.length>50)||new Error("每次最多支持50个计划ID")}},keywordBid:{required:true,type:"number",message:"请输入有效的出价金额",trigger:["blur","change"]},taskName:{required:true,message:"请输入任务名称",trigger:["blur","input"]}},M=e=>{if(!e||!e.trim())return [];return e.split(/[\n\r,;，；]/).map(e=>e.trim()).filter(e=>e.length>0).filter(e=>/^\d+$/.test(e))},R=computed(()=>M(G.value.planIds)),V=computed(()=>R.value.length>0&&G.value.keywordBid>0&&G.value.startTime&&G.value.taskName.trim().length>0),Z=async()=>{try{await(P.value?.validate()),$.value=!0,A.value=null;const e={mediaCode:0,opType:2,taskOpType:5,taskType:1,name:G.value.taskName,unitSettings:JSON.stringify({keywordBid:G.value.keywordBid}),creativeSettings:"{}",ext:JSON.stringify({marketingTarget:4,placement:2,optimizeTarget:0,type:"plan"}),mediaIdList:R.value},a=await fetch("https://galaxy.alibaba-inc.com/creativePlan/automatedSetUp",{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",appname:"adcontent-op","bx-v":"2.5.31","content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"},referrer:"https://galaxy.alibaba-inc.com/",body:JSON.stringify(e),method:"POST",mode:"cors",credentials:"include"}),l=await a.json();if(!a.ok)throw new Error(l.message||"请求失败");A.value={success:!0,message:"任务提交成功",details:l},J.success(`成功提交${R.value.length}个计划的出价调整任务`);}catch(e){A.value={success:false,message:e.message||"网络请求失败",details:e},J.error("提交失败: "+(e.message||"未知错误"));}finally{$.value=false;}},F=()=>{G.value={planIds:"",keywordBid:G.value.keywordBid,startTime:Date.now(),taskName:"调整搜索出价"},A.value=null,P.value?.restoreValidation();};return watch(()=>G.value.planIds,()=>{R.value.length>0&&(G.value.taskName=`调整搜索出价${G.value.keywordBid}-${R.value.length}个计划`);},{immediate:true}),(e,a)=>(openBlock(),createElementBlock("div",x,[a[5]||(a[5]=createElementVNode("div",{class:"header"},[createElementVNode("h2",null,"🔍 搜索出价调整工具"),createElementVNode("p",{class:"subtitle"},"批量调整计划的搜索关键词出价")],-1)),createVNode(unref(NCard),{class:"app-form-card"},{default:withCtx(()=>[createVNode(unref(NForm),{model:G.value,ref_key:"formRef",ref:P,rules:L},{default:withCtx(()=>[createVNode(unref(NFormItem),{label:"📋 计划ID列表",path:"planIds"},{default:withCtx(()=>[createVNode(unref(NInput),{value:G.value.planIds,"onUpdate:value":a[0]||(a[0]=e=>G.value.planIds=e),type:"textarea",placeholder:"请输入计划ID，支持多个ID用换行、逗号、分号分隔\\n例如：\\n138676191\\n138676192\\n138676193",rows:6,clearable:""},null,8,["value"])]),_:1}),createVNode(unref(NFormItem),{label:"💰 关键词出价",path:"keywordBid"},{default:withCtx(()=>[createVNode(unref(NInputNumber),{value:G.value.keywordBid,"onUpdate:value":a[1]||(a[1]=e=>G.value.keywordBid=e),placeholder:"请输入出价金额",precision:2,min:.01,max:999.99,style:{width:"200px"}},{suffix:withCtx(()=>[...a[3]||(a[3]=[createTextVNode("元",-1)])]),_:1},8,["value"])]),_:1}),createVNode(unref(NFormItem),{label:"📝 任务名称",path:"taskName"},{default:withCtx(()=>[createVNode(unref(NInput),{value:G.value.taskName,"onUpdate:value":a[2]||(a[2]=e=>G.value.taskName=e),placeholder:"请输入任务名称",clearable:""},null,8,["value"])]),_:1}),createElementVNode("div",D,[createVNode(unref(NButton),{type:"primary",size:"large",loading:$.value,onClick:Z,disabled:!V.value},{default:withCtx(()=>[createTextVNode(" 🚀 "+toDisplayString($.value?"提交中...":"提交任务"),1)]),_:1},8,["loading","disabled"]),createVNode(unref(NButton),{size:"large",onClick:F,disabled:$.value},{default:withCtx(()=>[...a[4]||(a[4]=[createTextVNode(" 🔄 重置 ",-1)])]),_:1},8,["disabled"])])]),_:1},8,["model"])]),_:1}),A.value?(openBlock(),createBlock(unref(NCard),{key:0,class:normalizeClass(["result-card",{success:A.value.success,error:!A.value.success}])},{default:withCtx(()=>[createElementVNode("div",T,[createElementVNode("span",q,toDisplayString(A.value.success?"✅":"❌"),1),createElementVNode("span",z,toDisplayString(A.value.success?"提交成功":"提交失败"),1)]),createElementVNode("div",O,[A.value.success?(openBlock(),createElementBlock("p",C," 已成功提交 "+toDisplayString(R.value.length)+" 个计划的出价调整任务 ",1)):(openBlock(),createElementBlock("p",E,toDisplayString(A.value.message),1)),A.value.details?(openBlock(),createBlock(unref(NCollapse),{key:2},{default:withCtx(()=>[createVNode(unref(NCollapseItem),{title:"📄 详细信息",name:"details"},{default:withCtx(()=>[createElementVNode("pre",null,toDisplayString(JSON.stringify(A.value.details,null,2)),1)]),_:1})]),_:1})):createCommentVNode("",true)])]),_:1},8,["class"])):createCommentVNode("",true),R.value.length>0?(openBlock(),createBlock(unref(NCard),{key:1,class:"app-preview-card"},{default:withCtx(()=>[createElementVNode("div",U,[createElementVNode("span",null,"📊 计划ID预览 ("+toDisplayString(R.value.length)+" 个)",1)]),createElementVNode("div",j,[(openBlock(true),createElementBlock(Fragment,null,renderList(R.value.slice(0,20),(e,a)=>(openBlock(),createBlock(unref(NTag),{key:a,size:"small"},{default:withCtx(()=>[createTextVNode(toDisplayString(e),1)]),_:2},1024))),128)),R.value.length>20?(openBlock(),createBlock(unref(NTag),{key:0,size:"small"},{default:withCtx(()=>[createTextVNode(" ...还有"+toDisplayString(R.value.length-20)+"个 ",1)]),_:1})):createCommentVNode("",true)])]),_:1})):createCommentVNode("",true)]))}},[["__scopeId","data-v-8e8c575e"]]));

		})
	};
}));

System.register("./ZhitouNoteMatcher-ttQqTTpq-wHmcMgtF.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, computed, openBlock, createElementBlock, createElementVNode, createVNode, unref, withCtx, createTextVNode, toDisplayString, createBlock, createCommentVNode, Fragment, renderList, useMessage, NCard, NSpace, NFormItem, NButton, NTag, NSelect, NDataTable, NInput, NModal, E$1;
	return {
		setters: [module => {
			ref = module.ref;
			computed = module.computed;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createElementVNode = module.createElementVNode;
			createVNode = module.createVNode;
			unref = module.unref;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			createBlock = module.createBlock;
			createCommentVNode = module.createCommentVNode;
			Fragment = module.Fragment;
			renderList = module.renderList;
		}, module => {
			useMessage = module.useMessage;
			NCard = module.NCard;
			NSpace = module.NSpace;
			NFormItem = module.NFormItem;
			NButton = module.NButton;
			NTag = module.NTag;
			NSelect = module.NSelect;
			NDataTable = module.NDataTable;
			NInput = module.NInput;
			NModal = module.NModal;
		}, module => {
			E$1 = module.E;
		}],
		execute: (function () {

			const I={class:"note-match-container"},T={class:"match-stats-content"},S={class:"app-stats-item"},z={class:"stats-text"},j={class:"app-stats-item"},D={class:"stats-text"},E={class:"stats-item success"},q={class:"stats-text"},$={class:"stats-item warning"},C={class:"stats-text"},O={class:"app-stats-summary"},A={class:"stats-text"},B=exports("default", E$1({__name:"ZhitouNoteMatcher",setup(x){const B=useMessage(),U=ref(false),P=ref(false),L=ref(false),G=ref([]),M=ref(null),F=ref([]),H=ref([]),J=ref([]),K=ref("8273771"),R=ref(false),Z=ref({totalAccountNotes:0,totalLibraryNotes:0,matchedNotes:0,unmatchedNotes:0}),Q=computed(()=>{if(!K.value||!K.value.trim())return [];return K.value.split(",").map(e=>e.trim()).filter(e=>e.length>0).filter(e=>/^\d+$/.test(e))}),V=computed(()=>G.value.map(e=>({label:e,value:e}))),W=[{title:"笔记ID",key:"contentId",width:120},{title:"笔记标题",key:"contentTitle",ellipsis:{tooltip:true}},{title:"创建时间",key:"pubDate",width:180,render:e=>e.createTime?new Date(e.createTime).toLocaleString():"-"},{title:"链接",key:"contentUrl",width:100}],X=[{title:"创意ID",key:"creativeId",width:120},{title:"笔记ID",key:"contentId",width:120},{title:"创意名称",key:"creativeName",ellipsis:{tooltip:true}},{title:"状态",key:"statusDesc",width:100}],Y=[{title:"账号笔记ID",key:"accountNoteId",width:120},{title:"笔记库ID",key:"libraryNoteId",width:120},{title:"匹配度",key:"matchScore",width:100,render:e=>`${(100*e.matchScore).toFixed(1)}%`},{title:"账号笔记标题",key:"accountNoteTitle",ellipsis:{tooltip:true}},{title:"笔记库标题",key:"libraryNoteTitle",ellipsis:{tooltip:true}}],ee=()=>{!async function(){try{U.value=!0;const e=await fetch("https://galaxy.alibaba-inc.com/assets/tag/select/get",{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",appname:"adcontent-op","bx-v":"2.5.31",priority:"u=1, i","sec-ch-ua":'"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"},referrer:"https://galaxy.alibaba-inc.com/",method:"GET",mode:"cors",credentials:"include"});if(!e.ok)throw new Error(`HTTP ${e.status}: ${e.statusText}`);const t=await e.json();if(!(t.success&&t.model&&t.model.projectName))throw new Error(t.msgInfo||"获取项目列表失败");G.value=t.model.projectName,B.success(`获取成功！共 ${t.model.projectName.length} 个项目`);}catch(e){B.error("获取项目列表失败: "+e.message);}finally{U.value=false;}}();},te=()=>{M.value&&async function(e){try{P.value=!0;const t=await fetch("https://galaxy.alibaba-inc.com/assets/contentTag/list",{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",appname:"adcontent-op","bx-v":"2.5.31","content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"},referrer:"https://galaxy.alibaba-inc.com/",body:JSON.stringify({pageNo:1,pageSize:1e3,media:"RED_BOOK",projectName:e}),method:"POST",mode:"cors",credentials:"include"});if(!t.ok)throw new Error(`HTTP ${t.status}: ${t.statusText}`);const a=await t.json();if(!(a.success&&a.model&&a.model.result))throw new Error(a.msgInfo||"获取笔记库失败");F.value=a.model.result,B.success(`获取笔记库成功！共 ${a.model.result.length} 条笔记`);}catch(t){B.error("获取笔记库失败: "+t.message),F.value=[];}finally{P.value=false;}}(M.value);};const ae=()=>{!async function(){try{if(0===Q.value.length)return void B.warning("请输入有效的账号ID");L.value=!0;const e=await fetch("https://galaxy.alibaba-inc.com/ad/manage/creative",{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",appname:"adcontent-op","bx-v":"2.5.31","content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"},referrer:"https://galaxy.alibaba-inc.com/",body:JSON.stringify({media:"RED_BOOK",startTime:"2025-05-01",endTime:"2025-05-02",current:1,pageSize:1e3,marketingTarget:4,optimizeTarget:0,type:"creative",accountIdList:Q.value,pageNo:1}),method:"POST",mode:"cors",credentials:"include"});if(!e.ok)throw new Error(`HTTP ${e.status}: ${e.statusText}`);const t=await e.json();if(!(t.success&&t.model&&t.model.result))throw new Error(t.msgInfo||"获取账号笔记失败");H.value=t.model.result,B.success(`获取账号笔记成功！共 ${t.model.result.length} 条（账号：${Q.value.join(", ")}）`);}catch(e){B.error("获取账号笔记失败: "+e.message),H.value=[];}finally{L.value=false;}}();},le=()=>{try{const e=[],t=new Set;H.value.forEach(a=>{F.value.forEach(l=>{a.contentId===l.contentId&&(e.push({accountNoteId:a.contentId,libraryNoteId:l.contentId,matchScore:1,accountNoteTitle:a.creativeName,libraryNoteTitle:l.title}),t.add(a.contentId));});}),e.sort((e,t)=>t.matchScore-e.matchScore);const a=H.value.length,l=F.value.length,s=e.filter(e=>1===e.matchScore).length,o=a-s;Z.value={totalAccountNotes:a,totalLibraryNotes:l,matchedNotes:s,unmatchedNotes:o},J.value=e,R.value=!0,B.success(`匹配完成！找到 ${e.length} 条匹配结果`);}catch(e){B.error("匹配失败: "+e.message);}},se=async()=>{try{const e=[["账号笔记ID","笔记库ID","匹配度","账号笔记标题","笔记库标题"],...J.value.map(e=>[e.accountNoteId,e.libraryNoteId,`${(100*e.matchScore).toFixed(1)}%`,e.accountNoteTitle,e.libraryNoteTitle])].map(e=>e.join("\t")).join("\n");await navigator.clipboard.writeText(e),B.success("结果已复制到剪贴板，可直接粘贴到Excel");}catch(e){B.error("导出失败: "+e.message);}},oe=()=>{J.value=[],B.info("已清空匹配结果");};return (e,t)=>(openBlock(),createElementBlock("div",I,[t[23]||(t[23]=createElementVNode("div",{class:"header"},[createElementVNode("h2",null,"📚 笔记库匹配工具"),createElementVNode("p",{class:"subtitle"},"选择项目并匹配笔记库中的内容")],-1)),createVNode(unref(NCard),{class:"app-card main-card"},{default:withCtx(()=>[createVNode(unref(NSpace),{vertical:"",size:"large"},{default:withCtx(()=>[createVNode(unref(NFormItem),{label:"🚀 初始化"},{default:withCtx(()=>[createVNode(unref(NSpace),null,{default:withCtx(()=>[createVNode(unref(NButton),{type:"primary",size:"large",loading:U.value,onClick:ee,disabled:G.value.length>0},{default:withCtx(()=>[createTextVNode(" 📋 "+toDisplayString(U.value?"加载中...":"获取项目列表"),1)]),_:1},8,["loading","disabled"]),G.value.length>0?(openBlock(),createBlock(unref(NTag),{key:0,type:"success"},{default:withCtx(()=>[createTextVNode(" ✅ 已加载 "+toDisplayString(G.value.length)+" 个项目 ",1)]),_:1})):createCommentVNode("",true)]),_:1})]),_:1}),G.value.length>0?(openBlock(),createBlock(unref(NFormItem),{key:0,label:"🎯 选择项目",required:""},{default:withCtx(()=>[createVNode(unref(NSpace),{vertical:"",style:{width:"100%"}},{default:withCtx(()=>[createVNode(unref(NSelect),{value:M.value,"onUpdate:value":t[0]||(t[0]=e=>M.value=e),placeholder:"请选择项目",options:V.value,clearable:""},null,8,["value","options"]),M.value?(openBlock(),createBlock(unref(NButton),{key:0,type:"primary",loading:P.value,onClick:te,disabled:F.value.length>0},{default:withCtx(()=>[createTextVNode(" 📚 "+toDisplayString(P.value?"加载中...":"获取笔记库内容"),1)]),_:1},8,["loading","disabled"])):createCommentVNode("",true)]),_:1})]),_:1})):createCommentVNode("",true),F.value.length>0?(openBlock(),createBlock(unref(NFormItem),{key:1,label:"📝 笔记库内容"},{default:withCtx(()=>[createVNode(unref(NSpace),{vertical:"",style:{width:"100%"}},{default:withCtx(()=>[createVNode(unref(NTag),{type:"info"},{default:withCtx(()=>[createTextVNode(" 📊 已加载 "+toDisplayString(F.value.length)+" 条笔记 ",1)]),_:1}),createVNode(unref(NDataTable),{columns:W,data:F.value,pagination:{pageSize:10,showSizePicker:true,pageSizes:[10,20,50]},bordered:false,"single-line":false,size:"small","max-height":"400px"},null,8,["data"])]),_:1})]),_:1})):createCommentVNode("",true),F.value.length>0?(openBlock(),createBlock(unref(NFormItem),{key:2,label:"👤 账号笔记"},{default:withCtx(()=>[createVNode(unref(NSpace),{vertical:"",style:{width:"100%"}},{default:withCtx(()=>[createVNode(unref(NFormItem),{label:"🏷️ 账号ID列表",required:""},{default:withCtx(()=>[createVNode(unref(NInput),{value:K.value,"onUpdate:value":t[1]||(t[1]=e=>K.value=e),placeholder:"请输入账号ID，多个ID用英文逗号分隔\\n例如：8273771,8273772,8273773",clearable:"",style:{width:"100%"}},null,8,["value"]),Q.value.length>0?(openBlock(),createBlock(unref(NSpace),{key:0,style:{"margin-top":"8px"}},{default:withCtx(()=>[(openBlock(true),createElementBlock(Fragment,null,renderList(Q.value.slice(0,10),(e,t)=>(openBlock(),createBlock(unref(NTag),{key:t,type:"info",size:"small"},{default:withCtx(()=>[createTextVNode(toDisplayString(e),1)]),_:2},1024))),128)),Q.value.length>10?(openBlock(),createBlock(unref(NTag),{key:0,type:"warning",size:"small"},{default:withCtx(()=>[createTextVNode(" ...还有"+toDisplayString(Q.value.length-10)+"个 ",1)]),_:1})):createCommentVNode("",true)]),_:1})):createCommentVNode("",true)]),_:1}),createVNode(unref(NSpace),null,{default:withCtx(()=>[createVNode(unref(NButton),{type:"primary",loading:L.value,onClick:ae,disabled:0===Q.value.length},{default:withCtx(()=>[...t[4]||(t[4]=[createTextVNode(" 🔍 获取账号笔记 ",-1)])]),_:1},8,["loading","disabled"]),createVNode(unref(NButton),{type:"primary",disabled:!H.value.length,onClick:le},{default:withCtx(()=>[...t[5]||(t[5]=[createTextVNode(" 🔄 开始匹配 ",-1)])]),_:1},8,["disabled"])]),_:1}),H.value.length>0?(openBlock(),createBlock(unref(NTag),{key:0,type:"info",style:{"margin-top":"16px"}},{default:withCtx(()=>[createTextVNode(" 📊 账号下已加载 "+toDisplayString(H.value.length)+" 条笔记 ",1)]),_:1})):createCommentVNode("",true),H.value.length?(openBlock(),createBlock(unref(NDataTable),{key:1,columns:X,data:H.value,pagination:{pageSize:5},bordered:false,size:"small","max-height":"300px",style:{"margin-top":"16px"}},null,8,["data"])):createCommentVNode("",true)]),_:1})]),_:1})):createCommentVNode("",true)]),_:1})]),_:1}),J.value.length?(openBlock(),createBlock(unref(NCard),{key:0,class:"result-card"},{header:withCtx(()=>[createElementVNode("span",null,"🎉 匹配结果 ("+toDisplayString(J.value.length)+" 条)",1)]),default:withCtx(()=>[createVNode(unref(NDataTable),{columns:Y,data:J.value,pagination:{pageSize:10},bordered:false,size:"small"},null,8,["data"]),createVNode(unref(NSpace),{style:{"margin-top":"16px"}},{default:withCtx(()=>[createVNode(unref(NButton),{type:"primary",onClick:se},{default:withCtx(()=>[...t[6]||(t[6]=[createTextVNode(" 📊 导出结果 ",-1)])]),_:1}),createVNode(unref(NButton),{onClick:oe},{default:withCtx(()=>[...t[7]||(t[7]=[createTextVNode(" 🧹 清空结果 ",-1)])]),_:1})]),_:1})]),_:1})):createCommentVNode("",true),createVNode(unref(NModal),{show:R.value,"onUpdate:show":t[3]||(t[3]=e=>R.value=e),preset:"card",class:"app-modal",title:"📊 匹配统计结果",bordered:false,"mask-closable":true,"close-on-esc":true},{default:withCtx(()=>[createElementVNode("div",T,[createVNode(unref(NSpace),{vertical:"",size:"large"},{default:withCtx(()=>[createElementVNode("div",S,[t[10]||(t[10]=createElementVNode("span",{class:"stats-icon"},"📝",-1)),createElementVNode("span",z,[t[8]||(t[8]=createTextVNode("账号下总共有 ",-1)),createElementVNode("strong",null,toDisplayString(Z.value.totalAccountNotes),1),t[9]||(t[9]=createTextVNode(" 条笔记",-1))])]),createElementVNode("div",j,[t[13]||(t[13]=createElementVNode("span",{class:"stats-icon"},"📚",-1)),createElementVNode("span",D,[t[11]||(t[11]=createTextVNode("笔记库总共 ",-1)),createElementVNode("strong",null,toDisplayString(Z.value.totalLibraryNotes),1),t[12]||(t[12]=createTextVNode(" 条笔记",-1))])]),createElementVNode("div",E,[t[16]||(t[16]=createElementVNode("span",{class:"stats-icon"},"✅",-1)),createElementVNode("span",q,[t[14]||(t[14]=createTextVNode("账号下有 ",-1)),createElementVNode("strong",null,toDisplayString(Z.value.matchedNotes),1),t[15]||(t[15]=createTextVNode(" 条笔记在笔记库中",-1))])]),createElementVNode("div",$,[t[19]||(t[19]=createElementVNode("span",{class:"stats-icon"},"⚠️",-1)),createElementVNode("span",C,[t[17]||(t[17]=createTextVNode("有 ",-1)),createElementVNode("strong",null,toDisplayString(Z.value.unmatchedNotes),1),t[18]||(t[18]=createTextVNode(" 条笔记不在笔记库中",-1))])]),createElementVNode("div",O,[t[21]||(t[21]=createElementVNode("span",{class:"stats-icon"},"📈",-1)),createElementVNode("span",A,[t[20]||(t[20]=createTextVNode("匹配率：",-1)),createElementVNode("strong",null,toDisplayString(Z.value.totalAccountNotes>0?(Z.value.matchedNotes/Z.value.totalAccountNotes*100).toFixed(1):0)+"%",1)])])]),_:1}),createVNode(unref(NSpace),{justify:"center",style:{"margin-top":"24px"}},{default:withCtx(()=>[createVNode(unref(NButton),{type:"primary",onClick:t[2]||(t[2]=e=>R.value=false)},{default:withCtx(()=>[...t[22]||(t[22]=[createTextVNode(" 👍 知道了 ",-1)])]),_:1})]),_:1})])]),_:1},8,["show"])]))}},[["__scopeId","data-v-5144ea78"]]));

		})
	};
}));

System.register("./ZhitouFeedFlow-CebUiKUa-BgcKGvbR.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, computed, watch, openBlock, createElementBlock, createElementVNode, createVNode, unref, withCtx, createTextVNode, toDisplayString, createBlock, normalizeClass, createCommentVNode, Fragment, renderList, useMessage, NCard, NForm, NFormItem, NInput, NInputNumber, NButton, NCollapse, NCollapseItem, NTag, E$1;
	return {
		setters: [module => {
			ref = module.ref;
			computed = module.computed;
			watch = module.watch;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createElementVNode = module.createElementVNode;
			createVNode = module.createVNode;
			unref = module.unref;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			createBlock = module.createBlock;
			normalizeClass = module.normalizeClass;
			createCommentVNode = module.createCommentVNode;
			Fragment = module.Fragment;
			renderList = module.renderList;
		}, module => {
			useMessage = module.useMessage;
			NCard = module.NCard;
			NForm = module.NForm;
			NFormItem = module.NFormItem;
			NInput = module.NInput;
			NInputNumber = module.NInputNumber;
			NButton = module.NButton;
			NCollapse = module.NCollapse;
			NCollapseItem = module.NCollapseItem;
			NTag = module.NTag;
		}, module => {
			E$1 = module.E;
		}],
		execute: (function () {

			const D={class:"search-price-container"},S={class:"button-group"},T={class:"result-header"},q={class:"result-icon"},z={class:"result-title"},O={class:"result-content"},C={key:0},E={key:1,class:"error-message"},U={class:"preview-header"},j={class:"plan-ids-grid"},J=exports("default", E$1({__name:"ZhitouFeedFlow",setup(x){const J=useMessage(),$=ref(false),F=ref(null),P=ref(null),A=ref({planIds:"",eventBid:1.5,startTime:Date.now(),taskName:"调整信息流出价"}),G={planIds:{required:true,message:"请输入计划ID",trigger:["blur","input"],validator:(e,a)=>{if(!a||!a.trim())return new Error("请输入计划ID");const l=L(a);return 0===l.length?new Error("请输入有效的计划ID"):!(l.length>50)||new Error("每次最多支持50个计划ID")}},eventBid:{required:true,type:"number",message:"请输入有效的出价金额",trigger:["blur","change"]},taskName:{required:true,message:"请输入任务名称",trigger:["blur","input"]}},L=e=>{if(!e||!e.trim())return [];return e.split(/[\n\r,;，；]/).map(e=>e.trim()).filter(e=>e.length>0).filter(e=>/^\d+$/.test(e))},M=computed(()=>L(A.value.planIds)),R=computed(()=>M.value.length>0&&A.value.eventBid>0&&A.value.startTime&&A.value.taskName.trim().length>0),V=async()=>{try{await(F.value?.validate()),$.value=!0,P.value=null;const e={mediaCode:0,opType:2,taskOpType:5,taskType:1,name:A.value.taskName,unitSettings:JSON.stringify({eventBid:A.value.eventBid}),creativeSettings:"{}",ext:JSON.stringify({marketingTarget:4,placement:1,optimizeTarget:0,type:"plan"}),mediaIdList:M.value},a=await fetch("https://galaxy.alibaba-inc.com/creativePlan/automatedSetUp",{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",appname:"adcontent-op","bx-v":"2.5.31","content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin"},referrer:"https://galaxy.alibaba-inc.com/",body:JSON.stringify(e),method:"POST",mode:"cors",credentials:"include"}),l=await a.json();if(!a.ok)throw new Error(l.message||"请求失败");P.value={success:!0,message:"任务提交成功",details:l},J.success(`成功提交${M.value.length}个计划的出价调整任务`);}catch(e){P.value={success:false,message:e.message||"网络请求失败",details:e},J.error("提交失败: "+(e.message||"未知错误"));}finally{$.value=false;}},Z=()=>{A.value={planIds:"",eventBid:A.value.eventBid,startTime:Date.now(),taskName:"调整信息流出价"},P.value=null,F.value?.restoreValidation();};return watch(()=>A.value.planIds,()=>{M.value.length>0&&(A.value.taskName=`调整信息流出价${A.value.eventBid}-${M.value.length}个计划`);},{immediate:true}),(e,a)=>(openBlock(),createElementBlock("div",D,[a[5]||(a[5]=createElementVNode("div",{class:"header"},[createElementVNode("h2",null,"🔍 信息流出价调整工具"),createElementVNode("p",{class:"subtitle"},"批量调整计划的信息流关键词出价")],-1)),createVNode(unref(NCard),{class:"app-form-card"},{default:withCtx(()=>[createVNode(unref(NForm),{model:A.value,ref_key:"formRef",ref:F,rules:G},{default:withCtx(()=>[createVNode(unref(NFormItem),{label:"📋 计划ID列表",path:"planIds"},{default:withCtx(()=>[createVNode(unref(NInput),{value:A.value.planIds,"onUpdate:value":a[0]||(a[0]=e=>A.value.planIds=e),type:"textarea",placeholder:"请输入计划ID，支持多个ID用换行、逗号、分号分隔\\n例如：\\n138676191\\n138676192\\n138676193",rows:6,clearable:""},null,8,["value"])]),_:1}),createVNode(unref(NFormItem),{label:"💰 关键词出价",path:"eventBid"},{default:withCtx(()=>[createVNode(unref(NInputNumber),{value:A.value.eventBid,"onUpdate:value":a[1]||(a[1]=e=>A.value.eventBid=e),placeholder:"请输入出价金额",precision:2,min:.01,max:999.99,style:{width:"200px"}},{suffix:withCtx(()=>[...a[3]||(a[3]=[createTextVNode("元",-1)])]),_:1},8,["value"])]),_:1}),createVNode(unref(NFormItem),{label:"📝 任务名称",path:"taskName"},{default:withCtx(()=>[createVNode(unref(NInput),{value:A.value.taskName,"onUpdate:value":a[2]||(a[2]=e=>A.value.taskName=e),placeholder:"请输入任务名称",clearable:""},null,8,["value"])]),_:1}),createElementVNode("div",S,[createVNode(unref(NButton),{type:"primary",size:"large",loading:$.value,onClick:V,disabled:!R.value},{default:withCtx(()=>[createTextVNode(" 🚀 "+toDisplayString($.value?"提交中...":"提交任务"),1)]),_:1},8,["loading","disabled"]),createVNode(unref(NButton),{size:"large",onClick:Z,disabled:$.value},{default:withCtx(()=>[...a[4]||(a[4]=[createTextVNode(" 🔄 重置 ",-1)])]),_:1},8,["disabled"])])]),_:1},8,["model"])]),_:1}),P.value?(openBlock(),createBlock(unref(NCard),{key:0,class:normalizeClass(["result-card",{success:P.value.success,error:!P.value.success}])},{default:withCtx(()=>[createElementVNode("div",T,[createElementVNode("span",q,toDisplayString(P.value.success?"✅":"❌"),1),createElementVNode("span",z,toDisplayString(P.value.success?"提交成功":"提交失败"),1)]),createElementVNode("div",O,[P.value.success?(openBlock(),createElementBlock("p",C," 已成功提交 "+toDisplayString(M.value.length)+" 个计划的出价调整任务 ",1)):(openBlock(),createElementBlock("p",E,toDisplayString(P.value.message),1)),P.value.details?(openBlock(),createBlock(unref(NCollapse),{key:2},{default:withCtx(()=>[createVNode(unref(NCollapseItem),{title:"📄 详细信息",name:"details"},{default:withCtx(()=>[createElementVNode("pre",null,toDisplayString(JSON.stringify(P.value.details,null,2)),1)]),_:1})]),_:1})):createCommentVNode("",true)])]),_:1},8,["class"])):createCommentVNode("",true),M.value.length>0?(openBlock(),createBlock(unref(NCard),{key:1,class:"app-preview-card"},{default:withCtx(()=>[createElementVNode("div",U,[createElementVNode("span",null,"📊 计划ID预览 ("+toDisplayString(M.value.length)+" 个)",1)]),createElementVNode("div",j,[(openBlock(true),createElementBlock(Fragment,null,renderList(M.value.slice(0,20),(e,a)=>(openBlock(),createBlock(unref(NTag),{key:a,size:"small"},{default:withCtx(()=>[createTextVNode(toDisplayString(e),1)]),_:2},1024))),128)),M.value.length>20?(openBlock(),createBlock(unref(NTag),{key:0,size:"small"},{default:withCtx(()=>[createTextVNode(" ...还有"+toDisplayString(M.value.length-20)+"个 ",1)]),_:1})):createCommentVNode("",true)])]),_:1})):createCommentVNode("",true)]))}},[["__scopeId","data-v-24d8cee2"]]));

		})
	};
}));

System.register("./ZhitouIndustryCombine-zmJOpn2H-yTVHsxf2.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, resolveComponent, openBlock, createElementBlock, createVNode, withCtx, createTextVNode, createElementVNode, createBlock, toDisplayString, createCommentVNode, h$1, useMessage, E;
	return {
		setters: [module => {
			ref = module.ref;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			createElementVNode = module.createElementVNode;
			createBlock = module.createBlock;
			toDisplayString = module.toDisplayString;
			createCommentVNode = module.createCommentVNode;
			h$1 = module.h;
		}, module => {
			useMessage = module.useMessage;
		}, module => {
			E = module.E;
		}],
		execute: (function () {

			const g={class:"industry-combine-container"},h="https://galaxy.alibaba-inc.com/galaxy/industryCombine/list",v=exports("default", E({__name:"ZhitouIndustryCombine",setup(m){const v=useMessage(),y=ref(false),f=ref(false),k=ref(1),w=ref(10),z=ref(0),I=ref(0),b=ref([]),N=ref(null),_=ref(""),x=ref([]),j={accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",appname:"adcontent-op","bx-v":"2.5.37","content-type":"application/json",priority:"u=1, i"},S=[{title:"manageId",key:"manageId",width:100},{title:"合集名称",key:"name",width:220,ellipsis:{tooltip:true}},{title:"行业",key:"industryName",width:120},{title:"状态",key:"status",width:80,render:e=>h$1("n-tag",{type:1===e.status?"success":"default",size:"small"},{1:"进行中",2:"已结束"}[e.status]||e.status)},{title:"创意状态",key:"creativeStatus",width:120},{title:"预算",key:"totalBudget",width:120},{title:"操作",key:"actions",width:100,fixed:"right",render:e=>h$1("a",{href:"javascript:void(0);",class:"action-link",onClick:()=>P(e)},"查看笔记ID")}],T=[{title:"笔记ID",key:"noteId",width:220},{title:"达人名称",key:"talentName",width:150},{title:"内容组",key:"groupName",width:150},{title:"package名称",key:"packageName",width:180}],E=async()=>{y.value=true,f.value=true;try{const e=await fetch(h,{headers:j,referrer:"https://galaxy.alibaba-inc.com/",body:JSON.stringify({pageNo:k.value,pageSize:w.value,current:k.value}),method:"POST",mode:"cors",credentials:"include"});if(!e.ok)throw new Error(`HTTP错误: ${e.status}`);const a=await e.json();if(!a.success||!a.model)throw new Error(a.msgInfo||"获取数据失败");b.value=a.model.result||[],z.value=a.model.totalCount||0,I.value=a.model.totalPages||Math.ceil(z.value/w.value),v.success(`获取成功! 共 ${z.value} 条数据`);}catch(e){v.error("查询失败: "+e.message);}finally{y.value=false;}},C=e=>{k.value=e,E();},D=e=>{w.value=e,k.value=1,E();};let $=null;const P=e=>{$&&clearTimeout($),$=setTimeout(()=>{q(e);},300);},q=async e=>{N.value=e.manageId,_.value=e.name;try{const a=await fetch(h,{headers:j,referrer:"https://galaxy.alibaba-inc.com/",body:JSON.stringify({manageId:e.manageId,pageNo:1,pageSize:1}),method:"POST",mode:"cors",credentials:"include"});if(!a.ok)throw new Error(`HTTP错误: ${a.status}`);const t=await a.json();if(!(t.success&&t.model&&t.model.result))throw new Error(t.msgInfo||"获取详情失败");{const e=t.model.result[0];x.value=L(e),v.success(`共提取 ${x.value.length} 个笔记ID`);}}catch(a){v.error("获取笔记ID失败: "+a.message);}},L=e=>{const a=[];return (e?.accountList||[]).forEach(e=>{(e?.packageList||[]).forEach(e=>{(e?.noteGroupList||[]).forEach(t=>{(t?.noteList||[]).forEach(l=>{a.push({noteId:l.noteId||"",talentName:l.talentName||"",groupName:t.name||"",packageName:e.packageName||""});});});});}),a},O=async()=>{try{const e=["笔记ID","达人名称","内容组","package名称"],a=x.value.map(e=>[e.noteId,e.talentName,e.groupName,e.packageName]),t=[e.join("\t"),...a.map(e=>e.join("\t"))].join("\n");await navigator.clipboard.writeText(t),v.success(`复制成功! 共 ${x.value.length} 条笔记信息`);}catch(e){v.error("复制失败: "+e.message);}};return (e,d)=>{const p=resolveComponent("n-button"),m=resolveComponent("n-pagination"),h=resolveComponent("n-space"),v=resolveComponent("n-data-table"),N=resolveComponent("n-card"),j=resolveComponent("n-alert");return openBlock(),createElementBlock("div",g,[createVNode(h,{vertical:"",size:16},{default:withCtx(()=>[createVNode(h,{align:"center",size:12},{default:withCtx(()=>[createVNode(p,{"data-testid":"search-btn",type:"primary",onClick:E,loading:y.value},{icon:withCtx(()=>[...d[1]||(d[1]=[createElementVNode("span",{style:{"font-size":"16px"}},"🔍",-1)])]),default:withCtx(()=>[d[2]||(d[2]=createTextVNode(" 查询行业合集 ",-1))]),_:1},8,["loading"]),createVNode(m,{"data-testid":"pagination",page:k.value,"onUpdate:page":[d[0]||(d[0]=e=>k.value=e),C],"page-count":I.value,"page-size":w.value,"show-size-picker":"","page-sizes":[10,20,50],"onUpdate:pageSize":D},null,8,["page","page-count","page-size"])]),_:1}),b.value.length>0?(openBlock(),createBlock(N,{key:0,size:"small"},{header:withCtx(()=>[createVNode(h,{justify:"space-between",align:"center"},{default:withCtx(()=>[createElementVNode("span",null,"行业合集列表 (共 "+toDisplayString(z.value)+" 条)",1)]),_:1})]),default:withCtx(()=>[createVNode(v,{columns:S,data:b.value,pagination:false,striped:"",size:"small","scroll-x":1e3},null,8,["data"])]),_:1})):createCommentVNode("",true),x.value.length>0?(openBlock(),createBlock(N,{key:1,size:"small",title:`笔记ID列表 - ${_.value}`},{"header-extra":withCtx(()=>[createVNode(h,null,{default:withCtx(()=>[createVNode(p,{size:"small",type:"primary",onClick:O},{icon:withCtx(()=>[...d[3]||(d[3]=[createElementVNode("span",{style:{"font-size":"14px"}},"📋",-1)])]),default:withCtx(()=>[d[4]||(d[4]=createTextVNode(" 复制笔记ID ",-1))]),_:1})]),_:1})]),default:withCtx(()=>[createVNode(v,{columns:T,data:x.value,pagination:{pageSize:50},striped:"",size:"small"},null,8,["data"])]),_:1},8,["title"])):createCommentVNode("",true),f.value&&0===b.value.length&&!y.value?(openBlock(),createBlock(j,{key:2,type:"info"},{default:withCtx(()=>[...d[5]||(d[5]=[createTextVNode(" 暂无数据，请点击查询按钮 ",-1)])]),_:1})):createCommentVNode("",true)]),_:1})])}}},[["__scopeId","data-v-985d1878"]]));

		})
	};
}));

System.register("./KuaishouPlanCloser-BjZjeetj-C0bRDj37.js", [], (function (exports, module) {
	'use strict';
	return {
		execute: (function () {

			const e=exports("default", {__name:"KuaishouPlanCloser",setup(e){const a="\n169597390308\n169685376332\n169597006232\n169595328824\n168269398033\n169684625268\n168102001831\n168290494606\n169600912056\n169684001436\n168299019974\n168291195737\n169595521656\n169600026777\n168291009280\n168101654895\n168290834201\n168299214212\n168290922427\n168269622355\n168299405632\n169684283230\n167989923949\n168290390799\n169600254909\n".split("\n");return fetch("https://ad.e.kuaishou.com/rest/dsp/control-panel/creative/update/putStatus?kuaishou.ad.dsp_ph=6b97b016209b12efdb213024078faf279ce6",{headers:{accept:"application/json","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","account-id":"82275544","content-type":"application/json;charset=UTF-8","ktrace-str":"3|My42NTY4NDU2ODgzODAuMTc2Nzc5MzcuMTc1OTg0Mzg1Mjg1NC4xMTI1|My42NTY4NDU2ODgzODAuNDcxNTMzODYuMTc1OTg0Mzg1Mjg1NC4xMTI0|0|ad-dsp|ad|true|src:Js,seqn:7862,rsi:282af8ed-948c-4567-ba43-1490ef1d5aae,path:/manage,rpi:015d92efa9",priority:"u=1, i","sec-ch-ua":'"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","traffic-channel":"pc","x-fetch-time":Date.now().toString(),"x-fetchid":"m4A/cnwLrUTJxJemUlwq+WkAPJ5/+luqrHS3uqEShUQ=","x-requestid":"e6416d3b-0f21-4666-88d7-54ffed12c3ed"},referrer:"https://ad.e.kuaishou.com/manage?__accountId__=82275544&appId=0&templateId=0&advCardId=0&merchandiseId=0&playId=0&searchLevel=3&tab=creative&campaignIds=&unitIds=&creativeIds=&keywordIds=&name=168269398033",body:`{"creativeIds":${a},"putStatus":2}`,method:"POST",mode:"cors",credentials:"include"}),(e,a)=>null}});

		})
	};
}));

System.register("./KuaishouMixCut-C6lvl9ZD-BUIo0QcK.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, onMounted, resolveComponent, openBlock, createElementBlock, createVNode, withCtx, createTextVNode, createElementVNode, createBlock, Fragment, renderList, toDisplayString, createCommentVNode, useMessage, E;
	return {
		setters: [module => {
			ref = module.ref;
			onMounted = module.onMounted;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			createElementVNode = module.createElementVNode;
			createBlock = module.createBlock;
			Fragment = module.Fragment;
			renderList = module.renderList;
			toDisplayString = module.toDisplayString;
			createCommentVNode = module.createCommentVNode;
		}, module => {
			useMessage = module.useMessage;
		}, module => {
			E = module.E;
		}],
		execute: (function () {

			const m={class:"kuaishou-container"},g=exports("default", E({__name:"KuaishouMixCut",setup(f){const g=useMessage(),y=ref(""),_=ref({batchData:""}),b=ref(false),k=ref([]),w=ref([]),x=['input[placeholder="请输入广告计划名称"]',"#ad_from_unitName_unitName input.ant-input",'input[placeholder="请输入创意名称"]'],S=['input[placeholder="填写后使用直达链接，不填则会使用落地页"]'],$=['input[placeholder="请填写https://开头的链接；如投放原生广告，配置落地页应具备调起APP能力"]'];onMounted(()=>{z(),D("快手广告填表工具已启动");});const z=()=>{_.value.batchData=localStorage.getItem("ks_batchData")||"";},D=e=>{const t=(new Date).toLocaleTimeString();k.value.unshift(`[${t}] ${e}`),k.value.length>50&&(k.value=k.value.slice(0,50));},L=()=>_.value.batchData.trim().split("\n").map((e,t)=>{const l=e.trim().split("\t");return l.length>=3?{index:t+1,title:`${l[0]}_${l[4]}`||"",h5Link:l[6]||"",directLink:l[7]||"",id:l[2]||"",isIOS:true,videoTitle:l[5]}:null}).filter(Boolean),C=()=>{w.value=L(),0!==w.value.length?(D(`解析完成，共 ${w.value.length} 条数据`),g.success(`已解析 ${w.value.length} 条数据`)):g.warning("请先输入有效的批量数据");},I=(e,t)=>{let l=0;return e.forEach(e=>{try{const a=document.querySelector(e);if(a){a.value=t;const e=new Event("change",{bubbles:!0});a.dispatchEvent(e);const n=new Event("input",{bubbles:!0});a.dispatchEvent(n);const i=Object.keys(a).find(e=>e.startsWith("__reactEventHandlers"));i&&a[i]&&a[i].onChange&&a[i].onChange(e),l++;}}catch(a){}}),l},O=e=>new Promise(t=>setTimeout(t,e)),T=async()=>{const e=document.querySelector('div[data-substep="3-nativeAdvertising"]');if(e&&e.innerText,_.value.batchData.trim()){b.value=true;try{const e=L();if(0===e.length)return void g.warning("没有有效的数据可以处理");D(`开始批量填充，共 ${e.length} 条数据`);const t=e.filter(e=>y.value.includes(e.id))[0],l=I(S,t.directLink);if(D(`填充直达链接: ${t.directLink} (成功 ${l} 个字段)`),await O(300),t.isIOS){const e=I($,t.h5Link);D(`检测到iOS，填充H5链接: ${t.h5Link} (成功 ${e} 个字段)`);}const a=I(x,t.title);D(`填充标题: ${t.title} (成功 ${a} 个字段)`),await O(300);I(['input[placeholder="请输入广告语或使用推荐的广告语，回车或点击「添加广告语」可新增"],input[placeholder="请填写作品广告语，用来推广内容"]'],t.videoTitle);g.success("表单填充完成"),D("批量填充操作完成"),await async function(){document.querySelectorAll('label:has(input[type="checkbox"])').forEach(e=>{if(e.textContent.includes("显示素材名称")){const t=e.querySelector('input[type="checkbox"]');t&&t.click();}});let e=null,t=0;for(;!e&&t<3;)t++,e=document.querySelector('div.ant-typography[rows="2"]:has(span[aria-hidden="true"])'),!e&&t<3&&await new Promise(e=>setTimeout(e,500));if(e){let t=e.textContent.trim();t.length>26&&(t=t.slice(0,26)+"...",I(['div[placeholder="请输入广告语或使用推荐的广告语，回车或点击「添加广告语」可新增"]'],t));}}();}catch(t){g.error("填充表单失败: "+t.message),D("填充失败: "+t.message);}finally{b.value=false;}}else g.warning("请先输入批量数据");},E=()=>{localStorage.removeItem("ks_batchData"),_.value.batchData="",w.value=[],k.value=[],g.success("已清除所有数据");};return (e,t)=>{const v=resolveComponent("n-input"),f=resolveComponent("n-text"),g=resolveComponent("n-form-item"),x=resolveComponent("n-button"),S=resolveComponent("n-grid-item"),$=resolveComponent("n-grid"),z=resolveComponent("n-tag"),D=resolveComponent("n-table"),L=resolveComponent("n-collapse-item"),I=resolveComponent("n-collapse"),O=resolveComponent("n-log"),q=resolveComponent("n-space"),A=resolveComponent("n-card");return openBlock(),createElementBlock("div",m,[createVNode(A,{title:"快手广告填表工具",class:"app-card tool-card"},{default:withCtx(()=>[createVNode(q,{vertical:"",size:16},{default:withCtx(()=>[createVNode(g,{label:"批量数据输入"},{feedback:withCtx(()=>[createVNode(f,{depth:"3",style:{"font-size":"12px"}},{default:withCtx(()=>[...t[3]||(t[3]=[createTextVNode(" 格式示例：达人昵称-计划信息 h5 dp ",-1)])]),_:1})]),default:withCtx(()=>[createVNode(v,{value:_.value.batchData,"onUpdate:value":[t[0]||(t[0]=e=>_.value.batchData=e),t[1]||(t[1]=e=>{return t="batchData",l=e,void localStorage.setItem(`ks_${t}`,l);var t,l;})],type:"textarea",placeholder:"请按格式输入：达人昵称[TAB]H5链接[TAB]直达链接，每行一条数据",autosize:{minRows:4,maxRows:8}},null,8,["value"])]),_:1}),createVNode(v,{value:y.value,"onUpdate:value":t[2]||(t[2]=e=>y.value=e),placeholder:"id"},null,8,["value"]),createVNode($,{cols:3,"x-gap":12,"y-gap":12},{default:withCtx(()=>[createVNode(S,null,{default:withCtx(()=>[createVNode(x,{type:"primary",block:"",size:"large",onClick:T,loading:b.value},{icon:withCtx(()=>[...t[4]||(t[4]=[createElementVNode("span",{style:{"font-size":"16px"}},"✏️",-1)])]),default:withCtx(()=>[t[5]||(t[5]=createTextVNode(" 批量填充表单 ",-1))]),_:1},8,["loading"])]),_:1}),createVNode(S,null,{default:withCtx(()=>[createVNode(x,{type:"default",block:"",size:"large",onClick:E},{icon:withCtx(()=>[...t[6]||(t[6]=[createElementVNode("span",{style:{"font-size":"16px"}},"🗑️",-1)])]),default:withCtx(()=>[t[7]||(t[7]=createTextVNode(" 清除所有数据 ",-1))]),_:1})]),_:1}),createVNode(S,null,{default:withCtx(()=>[createVNode(x,{type:"primary",block:"",size:"large",onClick:C},{icon:withCtx(()=>[...t[8]||(t[8]=[createElementVNode("span",{style:{"font-size":"16px"}},"👁️",-1)])]),default:withCtx(()=>[t[9]||(t[9]=createTextVNode(" 预览解析数据 ",-1))]),_:1})]),_:1})]),_:1}),w.value.length>0?(openBlock(),createBlock(I,{key:0},{default:withCtx(()=>[createVNode(L,{title:"数据预览",name:"preview"},{default:withCtx(()=>[createVNode(D,{bordered:false,"single-line":false,size:"small"},{default:withCtx(()=>[t[10]||(t[10]=createElementVNode("thead",null,[createElementVNode("tr",null,[createElementVNode("th",null,"序号"),createElementVNode("th",null,"标题名称"),createElementVNode("th",null,"H5链接"),createElementVNode("th",null,"直达链接"),createElementVNode("th",null,"是否iOS")])],-1)),createElementVNode("tbody",null,[(openBlock(true),createElementBlock(Fragment,null,renderList(w.value,(e,t)=>(openBlock(),createElementBlock("tr",{key:t},[createElementVNode("td",null,toDisplayString(t+1),1),createElementVNode("td",null,toDisplayString(e.title),1),createElementVNode("td",null,toDisplayString(e.h5Link),1),createElementVNode("td",null,toDisplayString(e.directLink),1),createElementVNode("td",null,[createVNode(z,{type:e.isIOS?"success":"default",size:"small"},{default:withCtx(()=>[createTextVNode(toDisplayString(e.isIOS?"iOS":"普通"),1)]),_:2},1032,["type"])])]))),128))])]),_:1})]),_:1})]),_:1})):createCommentVNode("",true),k.value.length>0?(openBlock(),createBlock(I,{key:1},{default:withCtx(()=>[createVNode(L,{title:"操作日志",name:"logs"},{default:withCtx(()=>[createVNode(O,{log:k.value.join("\n"),rows:6},null,8,["log"])]),_:1})]),_:1})):createCommentVNode("",true)]),_:1})]),_:1})])}}},[["__scopeId","data-v-208a2802"]]));

		})
	};
}));

System.register("./KuaishouAdCreator-C1qxsiHV-B9JsQKpk.js", ['vue', './__monkey.entry-uhykG5-y.js', 'naive-ui'], (function (exports, module) {
	'use strict';
	var ref, watch, onMounted, computed, resolveComponent, openBlock, createElementBlock, createElementVNode, withDirectives, normalizeClass, vModelText, createCommentVNode, createVNode, withCtx, createTextVNode, toDisplayString, Fragment, renderList, E;
	return {
		setters: [module => {
			ref = module.ref;
			watch = module.watch;
			onMounted = module.onMounted;
			computed = module.computed;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createElementVNode = module.createElementVNode;
			withDirectives = module.withDirectives;
			normalizeClass = module.normalizeClass;
			vModelText = module.vModelText;
			createCommentVNode = module.createCommentVNode;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			Fragment = module.Fragment;
			renderList = module.renderList;
		}, module => {
			E = module.E;
		}, null],
		execute: (function () {

			const _={class:"kuaishou-ad-creator"},$={class:"form-section"},T={class:"form-group"},x={key:0,class:"error-message"},k={class:"form-group"},w={class:"form-group"},q={class:"action-section"},S=["disabled"],I={class:"log-section"},N="kuaishou_custom_titles",b=exports("default", E({__name:"KuaishouAdCreator",setup(y){const b=ref(""),C=ref(""),U=ref(false),D=ref([]),E=ref(""),G=ref("default"),O=ref(""),P=ref("全选"),z=ref("安卓"),B=()=>{try{GM_setValue(N,E.value),O.value=(new Date).toLocaleString("zh-CN");}catch(e){}};watch(G,(e,a)=>{A(`单选框选择变更：${a} -> ${e}`,"info");}),onMounted(()=>{const e=GM_getValue("kuaishou_requestData")||"";""!==e?(b.value=e,A("已成功加载保存的请求信息","success")):(A("未检测到保存的请求信息，请先在快手平台执行相关操作以获取请求信息","warning"),A("操作步骤：1. 打开快手广告平台 2. 执行创建广告操作 3. 返回此页面查看是否获取到请求","info"));});const M=computed(()=>!b.value||b.value.includes("ktrace-str")),L=ref(null),A=(e,a="info")=>{D.value.push({message:e,type:a}),setTimeout(()=>{L.value&&(L.value.scrollTop=L.value.scrollHeight);},0);};onMounted(()=>{const e=GM_getValue("kuaishou_requestData")||"";""!==e?(b.value=e,A("已成功加载保存的请求信息","success")):(A("未检测到保存的请求信息，请先在快手平台执行相关操作以获取请求信息","warning"),A("操作步骤：1. 打开快手广告平台 2. 执行创建广告操作 3. 返回此页面查看是否获取到请求","info"));});const J=()=>Date.now().toString(),R="undefined"!=typeof GM_xmlhttpRequest;A(R);const V=async(e,a,t,o,r)=>(A(`获取达人 ${a} 的视频信息...`),new Promise((s,n)=>{const u=`{"campaignType":7,"videoListType":1,"splash":false,"creativeMaterialTypes":[1,2],"createSourceType":1,"createType":0,"keyword":"${a}","photoSources":[],"sort":1,"photoTags":[],"createTimeRange":[],"photoDupStatus":[],"nativeGoodType":[],"lowQualityStatus":[],"photoPackageIds":[],"dcursor":0,"count":15,"photoAdInfoParam":{"age":[{"min":40,"max":75}],"gender":"","regionCategoryNames":[{"id":"64","name":"宁夏"},{"id":"65","name":"新疆"},{"id":"11","name":"北京"},{"id":"12","name":"天津"},{"id":"13","name":"河北"},{"id":"14","name":"山西"},{"id":"15","name":"内蒙古"},{"id":"21","name":"辽宁"},{"id":"22","name":"吉林"},{"id":"23","name":"黑龙江"},{"id":"31","name":"上海"},{"id":"32","name":"江苏"},{"id":"33","name":"浙江"},{"id":"34","name":"安徽"},{"id":"35","name":"福建"},{"id":"36","name":"江西"},{"id":"37","name":"山东"},{"id":"41","name":"河南"},{"id":"42","name":"湖北"},{"id":"43","name":"湖南"},{"id":"44","name":"广东"},{"id":"45","name":"广西"},{"id":"46","name":"海南"},{"id":"50","name":"重庆"},{"id":"51","name":"四川"},{"id":"52","name":"贵州"},{"id":"53","name":"云南"},{"id":"61","name":"陕西"},{"id":"62","name":"甘肃"},{"id":"63","name":"青海"}],"cpaBid":30000,"ocpxActionType":190,"bidType":10,"audience":[],"unitDayBudget":0,"unitBudgetSchedule":[],"campaignDayBudget":0,"campaignBudgetSchedule":[],"campaignType":7},"adDspPhotoCheckParam":{"videoListType":1,"createSourceType":1,"creativeMaterialTypes":[1,2],"createType":0,"campaignType":7},"ocpcActionType":190,"needToShowGuideUseNewMaterial":false}`;GM_xmlhttpRequest({method:"POST",url:`https://ad.e.kuaishou.com/rest/dsp/control-panel/photo/filter/list?kuaishou.ad.dsp_ph=${e}`,headers:{accept:"application/json","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","account-id":t,"content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Not/A)Brand";v="8", "Chromium";v="127", "Edge";v="127"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"Linux"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","traffic-channel":"pc","x-fetch-time":J(),"x-requestid":r,cookie:document.cookie,"ktrace-str":o},data:u,onload:e=>{try{const t=JSON.parse(e.responseText);A(`获取达人 ${a} 的视频信息成功${t.photos[0].photoId}`,"success"),s(t);}catch(t){A("解析响应失败: "+t.message,"error"),n(t);}},onerror:e=>{A(`请求失败: ${e.status} ${e.statusText}`,"error"),n(new Error(`Network error: ${e.status}`));},ontimeout:()=>{A("请求超时","error"),n(new Error("Request timeout"));},timeout:2e4});})),j=(e,a,t,o,r,s,n)=>{A("构造请求体...");try{let o=JSON.parse(e);if(o.campaignId=o.campaignId||"",o.unit.campaignId=o.campaignId||"",o.unit.schemaUri=r,o.unit.schemaUrl=r,o.unit.webUri=s,o.unit.name=`${a}-${P.value}-${z.value}_${(new Date).getTime()}`,o.customizedCreative&&o.customizedCreative.creativeListParam&&o.customizedCreative.creativeListParam.length>0){const e=o.customizedCreative.creativeListParam[0];if(e.coverUrl=t.photos[0].coverUrls[1].url,e.name=`${a}-${P.value}-${z.value}_${(new Date).getTime()}`,e.photoId=t.photos[0].photoId,"custom"==G.value){const a=E.value.split("\n");a.length>n?e.description=a[n]:e.description=a[n%a.length];}}return A("构造请求体成功","success"),JSON.stringify(o)}catch(u){return A(`构造请求体失败: ${u.message}`,"error"),e}},H=async(e,a,t,o,r)=>(A("发送广告创建请求..."),new Promise((s,n)=>{GM_xmlhttpRequest({method:"POST",url:`https://ad.e.kuaishou.com/rest/dsp/portal/createUnitAndCreative?kuaishou.ad.dsp_ph=${e}`,headers:{accept:"application/json","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","account-id":a,"content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Not/A)Brand";v="8", "Chromium";v="127", "Edge";v="127"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"Linux"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","traffic-channel":"pc","x-fetch-time":J(),"x-requestid":o,cookie:document.cookie,"ktrace-str":t},data:r,onload:e=>{try{const a=JSON.parse(e.responseText);s(a);}catch(a){A("解析响应失败: "+a.message,"error"),n(a);}},onerror:e=>{A(`请求失败: ${e.status} ${e.statusText}`,"error"),n(new Error(`Network error: ${e.status}`));},ontimeout:()=>{A("请求超时","error"),n(new Error("Request timeout"));},timeout:2e4});})),K=async()=>{if(U.value)A("正在执行中，请稍后再试","error");else {if(!b.value)return A("请先在快手平台执行相关操作以获取请求信息","error"),void alert("请先在快手平台执行相关操作以获取请求信息！");if(C.value){U.value=true,A("开始执行广告批量创建流程...");try{const a=(e=>{try{const a="string"==typeof e?JSON.parse(e):e,t=a.url,o=a.method||"POST",r=a.requestHeaders||{},s=r;if("object"!=typeof r)return JSON.parse(r),null;const n=a.requestBody,u=JSON.parse(n).campaignId,c=t.match(new RegExp("(?<=dsp_ph=).*"))[0];return {url:t,method:o,headers:r,body:n,requestid:s["x-requestid"],account:s["account-id"],ktrace:s["ktrace-str"],campaignId:u,dsp_ph:c}}catch(a){return A(`解析请求信息失败: ${a.message}`,"error"),null}})(b.value);if(!a)return void A("请求信息解析失败，请检查是否正确获取了请求信息","error");const t=(e=>{A("开始解析Excel数据...");try{const a=e.split("\n"),t=[];for(let e=0;e<a.length;e++){const o=a[e].trim();if(o){const e=o.split("\t");e.length>=4&&t.push({name:e[0],videoId:e[1],dp:e[3],h5:e[2]});}}return A(`解析Excel数据完成，共 ${t.length} 条记录`,"success"),t}catch(a){return A(`解析Excel数据失败: ${a.message}`,"error"),[]}})(C.value);if(0===t.length)return void A("Excel数据解析失败或无有效数据，请检查输入格式","error");const o=a.body;for(let r=0;r<t.length;r++){const s=t[r],n=r;A(`处理第 ${r+1}/${t.length} 项: ${s.name}`);try{const e=await V(a.dsp_ph,s.videoId,a.account,a.ktrace,a.requestid),t=j(o,s.name,e,s.videoId,s.dp,s.h5,n);await H(a.dsp_ph,a.account,a.ktrace,a.requestid,t),A(`处理第 ${r+1} 项完成`,"success");}catch(e){A(`处理第 ${r+1} 项失败: ${e.message}`,"error");}}A("广告批量创建流程执行完成","success");}catch(e){A(`执行过程中发生错误: ${e.message}`,"error");}finally{U.value=false;}}else A("请填写Excel数据表","error");}};return onMounted(()=>{(()=>{try{const e=GM_getValue(N)||"";e&&(E.value=e,O.value=(new Date).toLocaleString("zh-CN"));}catch(e){}})();}),(e,a)=>{const t=resolveComponent("n-radio"),o=resolveComponent("n-space"),y=resolveComponent("n-radio-group");return openBlock(),createElementBlock("div",_,[createElementVNode("div",$,[a[18]||(a[18]=createElementVNode("h2",null,"快手广告批量创建工具",-1)),createElementVNode("div",T,[a[6]||(a[6]=createElementVNode("label",{for:"requestInfo"},"发送请求信息:",-1)),withDirectives(createElementVNode("textarea",{id:"requestInfo","onUpdate:modelValue":a[0]||(a[0]=e=>b.value=e),placeholder:"从快手平台自动获取的请求信息，如未显示请先在快手平台执行相关操作",rows:"8",readonly:"",class:normalizeClass({"error-state":!M.value})},null,2),[[vModelText,b.value]]),a[7]||(a[7]=createElementVNode("div",{class:"hint"}," 💡 请求信息会自动从快手平台获取，如未显示请先在快手平台执行相关操作 ",-1)),!M.value&&b.value?(openBlock(),createElementBlock("div",x," 错误：未检测到 ktrace-str 数据，请重新在快手平台执行操作以获取完整请求信息 ")):createCommentVNode("",true)]),createElementVNode("div",k,[a[8]||(a[8]=createElementVNode("label",{for:"excelData"},"Excel数据表:",-1)),withDirectives(createElementVNode("textarea",{id:"excelData","onUpdate:modelValue":a[1]||(a[1]=e=>C.value=e),placeholder:"请输入Excel中的数据表（达人名称、视频ID、跳转链接、H5链接，用制表符分隔）",rows:"10"},null,512),[[vModelText,C.value]])]),createVNode(y,{value:P.value,"onUpdate:value":a[2]||(a[2]=e=>P.value=e),name:"adTypeGroup"},{default:withCtx(()=>[createVNode(o,null,{default:withCtx(()=>[createVNode(t,{value:"激励"},{default:withCtx(()=>[...a[9]||(a[9]=[createTextVNode("激励",-1)])]),_:1}),createVNode(t,{value:"上下滑"},{default:withCtx(()=>[...a[10]||(a[10]=[createTextVNode("上下滑",-1)])]),_:1}),createVNode(t,{value:"联盟"},{default:withCtx(()=>[...a[11]||(a[11]=[createTextVNode("联盟",-1)])]),_:1}),createVNode(t,{value:"全选"},{default:withCtx(()=>[...a[12]||(a[12]=[createTextVNode("全选",-1)])]),_:1})]),_:1})]),_:1},8,["value"]),a[19]||(a[19]=createElementVNode("br",null,null,-1)),createVNode(y,{value:z.value,"onUpdate:value":a[3]||(a[3]=e=>z.value=e),name:"phoneTypeGroup"},{default:withCtx(()=>[createVNode(o,null,{default:withCtx(()=>[createVNode(t,{value:"安卓"},{default:withCtx(()=>[...a[13]||(a[13]=[createTextVNode("安卓",-1)])]),_:1}),createVNode(t,{value:"IOS"},{default:withCtx(()=>[...a[14]||(a[14]=[createTextVNode("IOS",-1)])]),_:1})]),_:1})]),_:1},8,["value"]),a[20]||(a[20]=createElementVNode("br",null,null,-1)),createVNode(y,{value:G.value,"onUpdate:value":a[4]||(a[4]=e=>G.value=e),name:"radioGroup"},{default:withCtx(()=>[createVNode(o,null,{default:withCtx(()=>[createVNode(t,{value:"default"},{default:withCtx(()=>[...a[15]||(a[15]=[createTextVNode(" 使用默认标题 ",-1)])]),_:1}),createVNode(t,{value:"custom"},{default:withCtx(()=>[...a[16]||(a[16]=[createTextVNode(" 使用自定义标题 ",-1)])]),_:1})]),_:1})]),_:1},8,["value"]),createElementVNode("div",w,[withDirectives(createElementVNode("textarea",{id:"biaoti","onUpdate:modelValue":a[5]||(a[5]=e=>E.value=e),placeholder:"如果需要一一标题对应则填写",onInput:B,rows:"5"},null,544),[[vModelText,E.value]])]),createElementVNode("div",q,[createElementVNode("button",{onClick:K,disabled:U.value},toDisplayString(U.value?"执行中...":"开始执行"),9,S)]),createElementVNode("div",I,[a[17]||(a[17]=createElementVNode("h3",null,"执行日志",-1)),createElementVNode("div",{class:"log-content",ref_key:"logContent",ref:L},[(openBlock(true),createElementBlock(Fragment,null,renderList(D.value,(e,a)=>(openBlock(),createElementBlock("div",{key:a,class:normalizeClass(e.type)},toDisplayString(e.message),3))),128))],512)])])])}}},[["__scopeId","data-v-9ddd82be"]]));

		})
	};
}));

System.register("./KuaishouAdCreatorVariant-C8wa3np4-elzfLWyJ.js", ['vue', './__monkey.entry-uhykG5-y.js', 'naive-ui'], (function (exports, module) {
	'use strict';
	var ref, watch, onMounted, resolveComponent, openBlock, createElementBlock, createElementVNode, withDirectives, vModelText, createVNode, withCtx, createTextVNode, toDisplayString, Fragment, renderList, normalizeClass, E;
	return {
		setters: [module => {
			ref = module.ref;
			watch = module.watch;
			onMounted = module.onMounted;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createElementVNode = module.createElementVNode;
			withDirectives = module.withDirectives;
			vModelText = module.vModelText;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			Fragment = module.Fragment;
			renderList = module.renderList;
			normalizeClass = module.normalizeClass;
		}, module => {
			E = module.E;
		}, null],
		execute: (function () {

			const g={class:"kuaishou-ad-creator"},_={class:"form-section"},y={class:"form-group"},$={class:"form-group"},x={class:"form-group"},k={class:"action-section"},q=["disabled"],w={class:"log-section"},I="kuaishou_custom_titles",S=exports("default", E({__name:"KuaishouAdCreatorVariant",setup(f){const S=ref(""),b=ref(""),T=ref(false),U=ref([]),N=ref(null),C=ref(""),E=ref("default"),O=ref(""),G=ref("全选"),z=ref("安卓"),D=()=>{try{GM_setValue(I,C.value),O.value=(new Date).toLocaleString("zh-CN");}catch(e){}};watch(E,(e,t)=>{P(`单选框选择变更：${t} -> ${e}`,"info");});const P=(e,t="info")=>{U.value.push({message:e,type:t}),setTimeout(()=>{N.value&&(N.value.scrollTop=N.value.scrollHeight);},0);};onMounted(()=>{const e=GM_getValue("kuaishou_requestData")||"";""!==e?(S.value=e,P("已成功加载保存的请求信息","success")):(P("未检测到保存的请求信息，请先在快手平台执行相关操作以获取请求信息","warning"),P("操作步骤：1. 打开快手广告平台 2. 执行创建广告操作 3. 返回此页面查看是否获取到请求","info"));});const J=()=>Date.now().toString(),L="undefined"!=typeof GM_xmlhttpRequest;P(L);const V=async(e,t,a,o,r)=>(P(`获取达人 ${t} 的视频信息...`),new Promise((s,u)=>{const l=`{"authorId":${t},"kolUserType":3,"campaignType":2}`;GM_xmlhttpRequest({method:"POST",url:`https://ad.e.kuaishou.com/rest/dsp/kwai/order/photo/list?kuaishou.ad.dsp_ph=${e}`,headers:{accept:"application/json","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","account-id":a,"content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Not/A)Brand";v="8", "Chromium";v="127", "Edge";v="127"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"Linux"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","traffic-channel":"pc","x-fetch-time":J(),"x-requestid":r,cookie:document.cookie,"ktrace-str":o},data:l,onload:e=>{try{const a=JSON.parse(e.responseText);P(`获取达人 ${t} 的视频信息成功${a.data.photos[0].photoId}`,"success"),s(a.data);}catch(a){P("解析响应失败: "+a.message,"error"),u(a);}},onerror:e=>{P(`请求失败: ${e.status} ${e.statusText}`,"error"),u(new Error(`Network error: ${e.status}`));},ontimeout:()=>{P("请求超时","error"),u(new Error("Request timeout"));},timeout:2e4});})),j=(e,t,a,o,r,s,u)=>{P("构造请求体...");try{let l=JSON.parse(e);if(l.campaignId=l.campaignId||"",l.unit.campaignId=l.campaignId||"",l.unit.schemaUri=r,l.unit.schemaUrl=r,l.unit.webUri=s,l.unit.name=`${t}-${G.value}-${z.value}_${(new Date).getTime()}`,l.customizedCreative&&l.customizedCreative.creativeListParam&&l.customizedCreative.creativeListParam.length>0){const e=l.customizedCreative.creativeListParam[0];if(e.description=a.photos[0].caption.slice(0,29).trim(),"custom"==E.value){const t=C.value.split("\n");t.length>u?e.description=t[u]:e.description=t[u%t.length];}e.coverUrl=a.photos[0].coverThumbnailUrls[0].url,e.name=`${t}-${G.value}-${z.value}_${(new Date).getTime()}`,e.photoId=a.photos[0].photoId,e.kolUserId=o,e.coverWidth=a.photos[0].width,e.coverHeight=a.photos[0].height;}return P("构造请求体成功","success"),JSON.stringify(l)}catch(l){return P(`构造请求体失败: ${l.message}`,"error"),e}},M=async(e,t,a,o,r)=>(P("发送广告创建请求..."),new Promise((s,u)=>{GM_xmlhttpRequest({method:"POST",url:`https://ad.e.kuaishou.com/rest/dsp/portal/createUnitAndCreative?kuaishou.ad.dsp_ph=${e}`,headers:{accept:"application/json","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","account-id":t,"content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Not/A)Brand";v="8", "Chromium";v="127", "Edge";v="127"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"Linux"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","traffic-channel":"pc","x-fetch-time":J(),"x-requestid":o,cookie:document.cookie,"ktrace-str":a},data:r,onload:e=>{try{const t=JSON.parse(e.responseText);s(t);}catch(t){P("解析响应失败: "+t.message,"error"),u(t);}},onerror:e=>{P(`请求失败: ${e.status} ${e.statusText}`,"error"),u(new Error(`Network error: ${e.status}`));},ontimeout:()=>{P("请求超时","error"),u(new Error("Request timeout"));},timeout:2e4});})),R=async()=>{if(T.value)P("正在执行中，请稍后再试","error");else {if(!S.value)return P("请先在快手平台执行相关操作以获取请求信息","error"),void alert("请先在快手平台执行相关操作以获取请求信息！");if(b.value){T.value=true,P("开始执行广告批量创建流程...");try{const t=(e=>{try{const t="string"==typeof e?JSON.parse(e):e,a=t.url,o=t.method||"POST",r=t.requestHeaders||{},s=r;if("object"!=typeof r)return JSON.parse(r),null;const u=t.requestBody,l=JSON.parse(u).campaignId,c=a.match(new RegExp("(?<=dsp_ph=).*"))[0];return {url:a,method:o,headers:r,body:u,requestid:s["x-requestid"],account:s["account-id"],ktrace:s["ktrace-str"],campaignId:l,dsp_ph:c}}catch(t){return P(`解析请求信息失败: ${t.message}`,"error"),null}})(S.value);if(!t)return void P("请求信息解析失败，请检查是否正确获取了请求信息","error");const a=(e=>{P("开始解析Excel数据...");try{const t=e.split("\n"),a=[];for(let e=0;e<t.length;e++){const o=t[e].trim();if(o){const e=o.split("\t");e.length>=4&&a.push({name:e[0],videoId:e[1],dp:e[3],h5:e[2]});}}return P(`解析Excel数据完成，共 ${a.length} 条记录`,"success"),a}catch(t){return P(`解析Excel数据失败: ${t.message}`,"error"),[]}})(b.value);if(0===a.length)return void P("Excel数据解析失败或无有效数据，请检查输入格式","error");const o=t.body;for(let r=0;r<a.length;r++){const s=a[r];P(`处理第 ${r+1}/${a.length} 项: ${s.name}`);const u=r;try{const e=await V(t.dsp_ph,s.videoId,t.account,t.ktrace,t.requestid),a=j(o,s.name,e,s.videoId,s.dp,s.h5,u);await M(t.dsp_ph,t.account,t.ktrace,t.requestid,a),P(`处理第 ${r+1} 项完成`,"success");}catch(e){P(`处理第 ${r+1} 项失败: ${e.message}`,"error");}}P("广告批量创建流程执行完成","success");}catch(e){P(`执行过程中发生错误: ${e.message}`,"error");}finally{T.value=false;}}else P("请填写Excel数据表","error");}};return onMounted(()=>{(()=>{try{const e=GM_getValue(I)||"";e&&(C.value=e,O.value=(new Date).toLocaleString("zh-CN"));}catch(e){}})();}),(e,t)=>{const a=resolveComponent("n-radio"),f=resolveComponent("n-space"),I=resolveComponent("n-radio-group");return openBlock(),createElementBlock("div",g,[createElementVNode("div",_,[t[18]||(t[18]=createElementVNode("h2",null,"快手广告批量创建工具",-1)),createElementVNode("div",y,[t[6]||(t[6]=createElementVNode("label",{for:"requestInfo"},"发送请求信息:",-1)),withDirectives(createElementVNode("textarea",{id:"requestInfo","onUpdate:modelValue":t[0]||(t[0]=e=>S.value=e),placeholder:"从快手平台自动获取的请求信息，如未显示请先在快手平台执行相关操作",rows:"8",readonly:""},null,512),[[vModelText,S.value]]),t[7]||(t[7]=createElementVNode("div",{class:"hint"}," 💡 请求信息会自动从快手平台获取，如未显示请先在快手平台执行相关操作 ",-1))]),createElementVNode("div",$,[t[8]||(t[8]=createElementVNode("label",{for:"excelData"},"Excel数据表:",-1)),withDirectives(createElementVNode("textarea",{id:"excelData","onUpdate:modelValue":t[1]||(t[1]=e=>b.value=e),placeholder:"请输入Excel中的数据表（达人名称、视频ID、跳转链接、H5链接，用制表符分隔）",rows:"10"},null,512),[[vModelText,b.value]])]),createVNode(I,{value:G.value,"onUpdate:value":t[2]||(t[2]=e=>G.value=e),name:"adTypeGroup"},{default:withCtx(()=>[createVNode(f,null,{default:withCtx(()=>[createVNode(a,{value:"激励"},{default:withCtx(()=>[...t[9]||(t[9]=[createTextVNode("激励",-1)])]),_:1}),createVNode(a,{value:"上下滑"},{default:withCtx(()=>[...t[10]||(t[10]=[createTextVNode("上下滑",-1)])]),_:1}),createVNode(a,{value:"联盟"},{default:withCtx(()=>[...t[11]||(t[11]=[createTextVNode("联盟",-1)])]),_:1}),createVNode(a,{value:"全选"},{default:withCtx(()=>[...t[12]||(t[12]=[createTextVNode("全选",-1)])]),_:1})]),_:1})]),_:1},8,["value"]),t[19]||(t[19]=createElementVNode("br",null,null,-1)),createVNode(I,{value:z.value,"onUpdate:value":t[3]||(t[3]=e=>z.value=e),name:"phoneTypeGroup"},{default:withCtx(()=>[createVNode(f,null,{default:withCtx(()=>[createVNode(a,{value:"安卓"},{default:withCtx(()=>[...t[13]||(t[13]=[createTextVNode("安卓",-1)])]),_:1}),createVNode(a,{value:"IOS"},{default:withCtx(()=>[...t[14]||(t[14]=[createTextVNode("IOS",-1)])]),_:1})]),_:1})]),_:1},8,["value"]),t[20]||(t[20]=createElementVNode("br",null,null,-1)),createVNode(I,{value:E.value,"onUpdate:value":t[4]||(t[4]=e=>E.value=e),name:"radioGroup"},{default:withCtx(()=>[createVNode(f,null,{default:withCtx(()=>[createVNode(a,{value:"default"},{default:withCtx(()=>[...t[15]||(t[15]=[createTextVNode(" 使用默认标题 ",-1)])]),_:1}),createVNode(a,{value:"custom"},{default:withCtx(()=>[...t[16]||(t[16]=[createTextVNode(" 使用自定义标题 ",-1)])]),_:1})]),_:1})]),_:1},8,["value"]),createElementVNode("div",x,[withDirectives(createElementVNode("textarea",{id:"biaoti","onUpdate:modelValue":t[5]||(t[5]=e=>C.value=e),placeholder:"如果需要一一标题对应则填写",onInput:D,rows:"5"},null,544),[[vModelText,C.value]])]),createElementVNode("div",k,[createElementVNode("button",{onClick:R,disabled:T.value},toDisplayString(T.value?"执行中...":"开始执行"),9,q)]),createElementVNode("div",w,[t[17]||(t[17]=createElementVNode("h3",null,"执行日志",-1)),createElementVNode("div",{class:"log-content",ref_key:"logContent",ref:N},[(openBlock(true),createElementBlock(Fragment,null,renderList(U.value,(e,t)=>(openBlock(),createElementBlock("div",{key:t,class:normalizeClass(e.type)},toDisplayString(e.message),3))),128))],512)])])])}}},[["__scopeId","data-v-23a76b7e"]]));

		})
	};
}));

System.register("./KuaishouPlanFetcher-LmCimDqM-CzNacT5Q.js", ['vue', './__monkey.entry-uhykG5-y.js', 'naive-ui'], (function (exports, module) {
	'use strict';
	var ref, onMounted, resolveComponent, openBlock, createElementBlock, Fragment, createElementVNode, createVNode, toDisplayString, unref, withCtx, createTextVNode, E;
	return {
		setters: [module => {
			ref = module.ref;
			onMounted = module.onMounted;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			Fragment = module.Fragment;
			createElementVNode = module.createElementVNode;
			createVNode = module.createVNode;
			toDisplayString = module.toDisplayString;
			unref = module.unref;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
		}, module => {
			E = module.E;
		}, null],
		execute: (function () {

			const m={class:"input-section"},h={class:"input-group"},v={class:"format-hint"},y={class:"input-group"},f={class:"format-hint"},g={class:"action-bar"},I=exports("default", E({__name:"KuaishouPlanFetcher",setup(p){const I=ref(null),w=ref("");let k="20260318",b=["87967688","87967689","82275545"];function C(e){const t=String(e);return t.includes(",")||t.includes("\n")||t.includes('"')||t.includes("\r")?'"'+t.replace(/"/g,'""')+'"':t}function _(e){e&&(k=function(e){if(!e)return "";const t=new Date(e);return t.getFullYear()+String(t.getMonth()+1).padStart(2,"0")+String(t.getDate()).padStart(2,"0")}(e),"undefined"!=typeof GM_setValue&&GM_setValue("kuaishou_date_range",k));}function D(e){w.value=e,b=e.split("\n").map(e=>e.trim()).filter(e=>e.length>0),"undefined"!=typeof GM_setValue&&GM_setValue("kuaishou_id_range",e);}const M=[{title:"创意 ID",key:"creativeId",width:120,fixed:"left"},{title:"创意名称",key:"creativeName",width:200,ellipsis:{tooltip:true}},{title:"账户 ID",key:"accountId",width:100},{title:"创建时间",key:"创建时间",width:100},{title:"计划 ID",key:"campaignId",width:100},{title:"计划名称",key:"campaignName",width:150,ellipsis:{tooltip:true}},{title:"单元 ID",key:"unitId",width:100},{title:"单元名称",key:"unitName",width:150,ellipsis:{tooltip:true}}];const S=new Blob(["\n    self.onmessage = async function(e) {\n        const { type, data } = e.data;\n        \n        if (type === 'fetchAndProcess') {\n            try {\n                const response = await fetch(data.url, data.options);\n                const result = await response.json();\n\n                // 数据处理函数\n                function timestampToYYYYMMDD(timestamp) {\n                    const date = new Date(timestamp);\n                    const year = date.getFullYear();\n                    const month = String(date.getMonth() + 1).padStart(2, '0');\n                    const day = String(date.getDate()).padStart(2, '0');\n                    return year + month + day;\n                }\n\n                if (result.data) {\n                    result.data.forEach(a => {\n                        a[\"创建时间\"] = timestampToYYYYMMDD(a.creativeCreateTime);\n                        a[\"accountId\"] = data.accountId; // 为了区分不同账号的数据，建议加上 ID\n                    });\n                }\n\n                self.postMessage({ \n                    type: 'result', \n                    data: result,\n                    accountId: data.accountId // 携带 ID 回来\n                });\n            } catch (error) {\n                self.postMessage({ \n                    type: 'error', \n                    error: error.message,\n                    accountId: data.accountId\n                });\n            }\n        }\n    };\n"],{type:"application/javascript"}),L=URL.createObjectURL(S),j=new Worker(L);function Y(e){return new Promise((t,a)=>{const n=o=>{o.data.accountId===e&&(j.removeEventListener("message",n),"result"===o.data.type?t(o.data.data):a({accountId:e,error:o.data.error}));};j.addEventListener("message",n),j.postMessage({type:"fetchAndProcess",data:{url:"https://ad.e.kuaishou.com/rest/dsp/control-panel/searchNew",options:{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9","account-id":e,"content-type":"application/json;charset=UTF-8"},body:JSON.stringify({searchParam:{creativeListType:1,periodicDays:[],projectType:0,tab:"creative",name:"",campaignIds:[],unitIds:[],creativeIds:[],sortingColumn:"",order:0,fromAppPage:false,appId:0,photoId:"",advCardId:0,merchandiseId:0,merchandiseType:"",playId:0,status:{campaign:{value:[]},unit:{value:[]},creative:{value:[]},dawnProject:{value:[]},keywords:{value:[]}},autoMode:[],target:{transform:{value:[]},deep:{value:[]}},scope:{value:[]},adScope:[],nativeTypes:[],relevanceScoreAvg:{value:[]},adPutType:{value:[]},aiRepairTypeList:[],searchLevel:3,chargeMode:[],search:true,selectedColumns:["actionCost","actionNewRatio","actionRatio","actionbarClick","adShow","backflowCvLower","campaignId","campaignName","click","click1kCost","conversionCostLower","createLine","creativeId","creativeName","eventOrderSubmitCost","impression","impression1kCost","liveEventGoodsView","liveEventGoodsViewCost","livePlay3sCost","livePlayed3s","photoClick","photoClickCost","photoClickRatio","photoDupStatus","totalCharge","unitId","unitName","viewStatus"],relatedTemplateId:[0],periodicDeliverScene:false},pageInfo:{currentPage:1,pageSize:1e3,totalCount:0}}),method:"POST",mode:"cors",credentials:"include"},accountId:e}});})}async function T(){const e=[];try{for(const a of b){try{const t=await Y(a);if(t.data){const a=t.data.filter(e=>e["创建时间"]===k);e.push(...a);}}catch(t){}0;}!function(e){if(!e||0===e.length)return void alert("数据为空");const t=Object.keys(e[0]);let a="\ufeff";a+=t.map(e=>C(e)).join(",")+"\n",e.forEach(e=>{const n=t.map(t=>C(null!=e[t]?e[t]:""));a+=n.join(",")+"\n";});const n=new Blob([a],{type:"text/csv;charset=utf-8;"}),o=document.createElement("a"),i=URL.createObjectURL(n);o.setAttribute("href",i),o.setAttribute("download","data_export_"+(new Date).getTime()+".csv"),document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i);}(function(e,t){if(!Array.isArray(e)||!Array.isArray(t))return [];const a={};return t.forEach(e=>{e.key&&e.title&&(a[e.key]=e.title);}),e.map(e=>{const t={};return Object.keys(e).forEach(n=>{a[n]&&(t[a[n]]=e[n]);}),t})}(e,M));}catch(a){}}return onMounted(()=>{if("undefined"!=typeof GM_getValue){const e=GM_getValue("kuaishou_date_range",null),t=GM_getValue("kuaishou_id_range",null);if(e){k=e;const t=e.substring(0,4),a=e.substring(4,6),n=e.substring(6,8);I.value=`${t}-${a}-${n}`;}t&&(w.value=t,b=t.split("\n").map(e=>e.trim()).filter(e=>e.length>0));}}),(e,t)=>{const p=resolveComponent("n-date-picker"),C=resolveComponent("n-input"),M=resolveComponent("n-button");return openBlock(),createElementBlock(Fragment,null,[createElementVNode("div",m,[createElementVNode("div",h,[t[2]||(t[2]=createElementVNode("label",{class:"input-label"},"日期选择（格式：YYYYMMDD）",-1)),createVNode(p,{value:I.value,"onUpdate:value":[t[0]||(t[0]=e=>I.value=e),_],type:"date","value-format":"yyyy-MM-dd",placeholder:"选择日期",style:{width:"200px"}},null,8,["value"]),createElementVNode("span",v,"当前筛选："+toDisplayString(unref(k)),1)]),createElementVNode("div",y,[t[3]||(t[3]=createElementVNode("label",{class:"input-label"},"ID 范围（每行一个 account-id）",-1)),createVNode(C,{value:w.value,"onUpdate:value":[t[1]||(t[1]=e=>w.value=e),D],type:"textarea",placeholder:"请输入 account-id，每行一个",rows:5,maxlength:5e3,"show-count":""},null,8,["value"]),createElementVNode("span",f,"当前 ID 数量："+toDisplayString(unref(b).length),1)])]),createElementVNode("div",g,[createVNode(M,{type:"primary",onClick:T,loading:e.isLoading},{default:withCtx(()=>[...t[4]||(t[4]=[createTextVNode(" 开始获取数据 ",-1)])]),_:1},8,["loading"])])],64)}}},[["__scopeId","data-v-da17cd85"]]));

		})
	};
}));

System.register("./XingrengwuBatchMixCut-DVpK_-k5-VXGHWqrF.js", ['vue', './XingrengwuBaseProcessor-CH-4mIMF-w-rPQ4s4.js', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var openBlock, createBlock, T;
	return {
		setters: [module => {
			openBlock = module.openBlock;
			createBlock = module.createBlock;
		}, module => {
			T = module.T;
		}, null, null],
		execute: (function () {

			const r=exports("default", {__name:"XingrengwuBatchMixCut",props:{tbToken:{type:String,default:""}},setup(r){const o=r,a=[{title:"素材ID",key:"remixMaterialId",width:150},{title:"达人唯一标识",key:"koxUniqId",width:150},{title:"达人昵称",key:"koxNickname",width:150},{title:"商品ID列表",key:"itemIds",width:200}],n=e=>({logLabel:e[0]||"",resultItem:{remixMaterialId:e[0]||"",koxUniqId:e[1]||"",itemIds:e[2]||"",remixEditor:e[3]||"",koxNickname:e[4]||""},remixMaterialId:e[0],koxUniqId:e[1],itemIds:e[2],remixEditor:e[3],customKoxNickname:e[4]}),d=async(e,t)=>{const{remixMaterialId:i,koxUniqId:r,itemIds:o,remixEditor:a,customKoxNickname:n}=e,{xrwMedia:d,remixMaterialSrcMedia:m,cpid:s,token:c,eventId:l,createHeaders:u,getReferrer:x}=t,k="TENCENT"===m,I=d,p=s,h=o.split(",")[0];let w=null;if(!k){const e=await fetch("https://adstar.alimama.com/openapi/json2/1/gateway.unionpub/union.kox.summary.query.json?bizCode=adstar&_tb_token_="+c+"&uidList="+r+"&mediaBpCode="+m,{method:"GET",headers:u(c),referrer:x(l),mode:"cors",credentials:"include"}),t=await e.json();if(!t.success||!t.model||0===t.model.length)throw new Error("请求1失败：未获取到有效的达人数据");w=t.model[0];}const f={eventId:l,media:I,isRemix:true,remixMaterialSrcMedia:m,koxNickname:k?n:w.nick,koxUniqId:k?r:w.uniqId,remixEditor:a,cpId:p,remixMaterialId:i,koxId:k?r:w.uid,stickyItemId:h,extraInfo:"{}"},y="_data_="+encodeURIComponent(JSON.stringify(f)),b=await fetch("https://adstar.alimama.com/openapi/param2/1/gateway.unionpub/union.adcontent.kox.link.record.add.json?_tb_token_="+c,{method:"POST",headers:u(c),referrer:x(l),body:y,mode:"cors",credentials:"include"});return await b.json()};return (r,m)=>(openBlock(),createBlock(T,{title:"混剪批量处理工具",placeholder:"请输入数据，格式：素材id 达人标识 商品id 剪辑师 [达人昵称]\n注：腾讯视频号需在剪辑师后增加第5列「达人昵称」","tb-token":o.tbToken,"show-remix-src-media":true,"result-columns":a,"parse-record":n,"execute-request":d},null,8,["tb-token"]))}});

		})
	};
}));

System.register("./XingrengwuPreview-Xs9TMCXJ-D-27LdPe.js", ['vue', './XingrengwuBaseProcessor-CH-4mIMF-w-rPQ4s4.js', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var openBlock, createBlock, T;
	return {
		setters: [module => {
			openBlock = module.openBlock;
			createBlock = module.createBlock;
		}, module => {
			T = module.T;
		}, null, null],
		execute: (function () {

			const i=exports("default", {__name:"XingrengwuPreview",props:{tbToken:{type:String,default:""}},setup(i){const n=i,r=[{title:"达人唯一标识",key:"koxUniqId",width:150},{title:"商品ID列表",key:"itemIds",width:200}],a=e=>({logLabel:e[0]||"",resultItem:{koxUniqId:e[0]||"",itemIds:e[1]||""},koxUniqId:e[0],itemIds:e[1]}),d=async(e,t)=>{const{koxUniqId:o,itemIds:i}=e,{xrwMedia:n,cpid:r,token:a,eventId:d,createHeaders:s,getReferrer:m}=t,c=n,u=r,l=i.split(",")[0],p=await fetch("https://adstar.alimama.com/openapi/json2/1/gateway.unionpub/union.kox.summary.query.json?bizCode=adstar&_tb_token_="+a+"&uidList="+o+"&mediaBpCode="+c,{method:"GET",headers:s(a),referrer:m(d),mode:"cors",credentials:"include"}),k=await p.json();if(!k.success||!k.model||0===k.model.length)throw new Error("请求1失败：未获取到有效的达人数据");const I=k.model[0],w={eventId:d,media:c,isRemix:false,koxNickname:I.nick,koxUniqId:I.uniqId,cpId:u,koxId:I.uid,stickyItemId:l,extraInfo:"{}"},x="_data_="+encodeURIComponent(JSON.stringify(w)),h=await fetch("https://adstar.alimama.com/openapi/param2/1/gateway.unionpub/union.adcontent.kox.link.record.add.json?_tb_token_="+a,{method:"POST",headers:s(a),referrer:m(d),body:x,mode:"cors",credentials:"include"});return await h.json()};return (i,s)=>(openBlock(),createBlock(T,{title:"原生批量处理工具",placeholder:"请输入数据，格式：达人标识 商品id","tb-token":n.tbToken,"show-remix-src-media":false,"result-columns":r,"parse-record":a,"execute-request":d},null,8,["tb-token"]))}});

		})
	};
}));

System.register("./XingrengwuBaseProcessor-CH-4mIMF-w-rPQ4s4.js", ['vue', 'naive-ui', './__monkey.entry-uhykG5-y.js'], (function (exports, module) {
	'use strict';
	var ref, computed, onMounted, h, openBlock, createElementBlock, createVNode, unref, withCtx, createTextVNode, createBlock, createCommentVNode, createElementVNode, useMessage, NCard, NSpace, NFormItem, NInput, NText, NSelect, NButton, NProgress, NGrid, NGridItem, NStatistic, NCollapse, NCollapseItem, NDataTable, NLog, E;
	return {
		setters: [module => {
			ref = module.ref;
			computed = module.computed;
			onMounted = module.onMounted;
			h = module.h;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createVNode = module.createVNode;
			unref = module.unref;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			createBlock = module.createBlock;
			createCommentVNode = module.createCommentVNode;
			createElementVNode = module.createElementVNode;
		}, module => {
			useMessage = module.useMessage;
			NCard = module.NCard;
			NSpace = module.NSpace;
			NFormItem = module.NFormItem;
			NInput = module.NInput;
			NText = module.NText;
			NSelect = module.NSelect;
			NButton = module.NButton;
			NProgress = module.NProgress;
			NGrid = module.NGrid;
			NGridItem = module.NGridItem;
			NStatistic = module.NStatistic;
			NCollapse = module.NCollapse;
			NCollapseItem = module.NCollapseItem;
			NDataTable = module.NDataTable;
			NLog = module.NLog;
		}, module => {
			E = module.E;
		}],
		execute: (function () {

			const $=[{isDefault:true,label:"小红书",value:"RED_BOOK"},{label:"B站",value:"BILIBILI"},{label:"抖音",value:"DOUYIN"},{label:"快手",value:"KUAISHOU"},{label:"腾讯视频号",value:"TENCENT"}];const M={class:"xingrengwu-processor-container"},T=exports("T", E({__name:"XingrengwuBaseProcessor",props:{title:{type:String,required:true},placeholder:{type:String,required:true},tbToken:{type:String,default:""},showRemixSrcMedia:{type:Boolean,default:false},resultColumns:{type:Array,required:true},parseRecord:{type:Function,required:true},executeRequest:{type:Function,required:true}},setup(z){const T=z,E=function(t){const s=useMessage(),l=ref(""),r=ref("RED_BOOK"),u=ref(null),o=ref([]),n=ref(false),i=ref(false),c=ref([]),d=ref([]),p=ref(0),m=ref(0),v=computed(()=>m.value>0?Math.round(p.value/m.value*100):0),f=computed(()=>d.value.filter(e=>"success"===e.status).length),h=computed(()=>d.value.filter(e=>"error"===e.status).length),y=e=>{const a=(new Date).toLocaleTimeString();c.value.unshift(`[${a}] ${e}`),c.value.length>50&&(c.value=c.value.slice(0,50));},_=()=>t.tbToken||"ee3b737e1e7ee",b=()=>{const e=location.search.match(new RegExp("(?<=eventId=).*"));return e?e[0]:""},I=e=>"https://adstar.alimama.com/portal/v2/pages/tasks/detail/self_official.htm?eventId="+e,w=e=>({_tb_token_:e,accept:"*/*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","bx-v":"2.5.11","content-type":"application/x-www-form-urlencoded; charset=UTF-8",priority:"u=1, i","sec-ch-ua":'"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-requested-with":"XMLHttpRequest"});return {t:l,xrwMedia:r,cpid:u,cpOptions:o,isCpLoading:n,isProcessing:i,logs:c,processedItems:d,currentIndex:p,totalItems:m,progressPercentage:v,successCount:f,failureCount:h,addLog:y,clearData:()=>{l.value="",d.value=[],c.value=[],p.value=0,m.value=0,u.value=null,s.success("已清除所有数据"),y("清除所有数据");},fetchCpList:async()=>{const e=_(),a=b();n.value=true;try{const t=await fetch(`https://adstar.alimama.com/openapi/param2/1/gateway.unionpub/union.adcontent.bp.query.landing.page.list.json?bizCode=adstar&_tb_token_=${e}`,{method:"GET",headers:w(e),referrer:I(a),mode:"cors",credentials:"include"}),s=await t.json();if(!s.success||!Array.isArray(s.model))throw new Error(s.msgCode||"获取链接列表失败");o.value=s.model.map(e=>({label:e.pageName,value:e.cpId})),y(`成功加载 ${o.value.length} 个链接选项`);}catch(t){s.error("获取链接列表失败: "+t.message),y("获取链接列表失败: "+t.message);}finally{n.value=false;}},getToken:_,getEventId:b,getReferrer:I,createHeaders:w,message:s}}({tbToken:T.tbToken}),O=ref("RED_BOOK");onMounted(()=>{E.fetchCpList();});const S=computed(()=>[...T.resultColumns,{title:"状态",key:"status",width:100,render:e=>{const a="success"===e.status?"success":"error",t="success"===e.status?"成功":"失败",l="success"===e.status?"✅":"❌";return h("n-tag",{type:a,size:"small"},{default:()=>[l," ",t]})}},{title:"错误信息",key:"error",ellipsis:{tooltip:true}}]),B=async()=>{if(E.t.value.trim()){E.isProcessing.value=true,E.processedItems.value=[],E.currentIndex.value=0;try{const a=E.t.value.trim().split("\n").map(e=>e.split("\t"));E.totalItems.value=a.length;for(const t of a){let a;try{a=T.parseRecord(t);}catch(e){E.addLog(`解析记录 ${t[0]} 失败: ${e.message}`),E.processedItems.value.push({status:"error",error:e.message}),E.currentIndex.value++;continue}try{E.currentIndex.value++,E.addLog(`正在处理记录: ${a.logLabel||t[0]}`),await T.executeRequest(a,{xrwMedia:E.xrwMedia.value,remixMaterialSrcMedia:O.value,cpid:E.cpid.value,token:E.getToken(),eventId:E.getEventId(),createHeaders:E.createHeaders,getReferrer:E.getReferrer}),E.processedItems.value.push({...a.resultItem,status:"success",error:""}),await new Promise(e=>setTimeout(e,1e3));}catch(e){E.addLog(`处理记录 ${t[0]} 时出错: ${e.message}`),E.processedItems.value.push({...a.resultItem,status:"error",error:e.message});}}E.message.success(`批量处理完成! 成功 ${E.successCount.value} 条，失败 ${E.failureCount.value} 条`),E.addLog(`批量处理完成! 成功 ${E.successCount.value} 条，失败 ${E.failureCount.value} 条`);}catch(e){E.message.error("批量处理失败: "+e.message),E.addLog("批量处理失败: "+e.message);}finally{E.isProcessing.value=false;}}else E.message.warning("请先输入数据");};return (e,a)=>(openBlock(),createElementBlock("div",M,[createVNode(unref(NCard),{title:z.title,class:"app-card main-card"},{default:withCtx(()=>[createVNode(unref(NSpace),{vertical:"",size:16},{default:withCtx(()=>[createVNode(unref(NFormItem),{label:"数据输入"},{feedback:withCtx(()=>[createVNode(unref(NText),{depth:"3",style:{"font-size":"12px"}},{default:withCtx(()=>[...a[4]||(a[4]=[createTextVNode(" 每行一条数据，字段间用制表符分隔 ",-1)])]),_:1})]),default:withCtx(()=>[createVNode(unref(NInput),{value:e.t,"onUpdate:value":a[0]||(a[0]=a=>e.t=a),type:"textarea",placeholder:z.placeholder,autosize:{minRows:6,maxRows:12}},null,8,["value","placeholder"])]),_:1}),createVNode(unref(NFormItem),{label:"星任务平台"},{default:withCtx(()=>[createVNode(unref(NSelect),{value:e.xrwMedia,"onUpdate:value":a[1]||(a[1]=a=>e.xrwMedia=a),options:unref($),placeholder:"星任务平台"},null,8,["value","options"])]),_:1}),z.showRemixSrcMedia?(openBlock(),createBlock(unref(NFormItem),{key:0,label:"素材来源平台"},{default:withCtx(()=>[createVNode(unref(NSelect),{value:O.value,"onUpdate:value":a[2]||(a[2]=e=>O.value=e),options:unref($),placeholder:"请选择素材来源平台"},null,8,["value","options"])]),_:1})):createCommentVNode("",true),createVNode(unref(NFormItem),{label:"链接id"},{default:withCtx(()=>[createVNode(unref(NSelect),{value:e.cpid,"onUpdate:value":a[3]||(a[3]=a=>e.cpid=a),options:e.cpOptions,placeholder:"请选择链接",loading:e.isCpLoading,clearable:""},null,8,["value","options","loading"])]),_:1}),createVNode(unref(NSpace),{justify:"center"},{default:withCtx(()=>[createVNode(unref(NButton),{type:"primary",size:"large",onClick:B,loading:e.isProcessing,disabled:!e.t.trim()},{icon:withCtx(()=>[...a[5]||(a[5]=[createElementVNode("span",{style:{"font-size":"16px"}},"🚀",-1)])]),default:withCtx(()=>[a[6]||(a[6]=createTextVNode(" 开始批量处理 ",-1))]),_:1},8,["loading","disabled"]),createVNode(unref(NButton),{type:"default",size:"large",onClick:e.clearData},{icon:withCtx(()=>[...a[7]||(a[7]=[createElementVNode("span",{style:{"font-size":"16px"}},"🗑️",-1)])]),default:withCtx(()=>[a[8]||(a[8]=createTextVNode(" 清除数据 ",-1))]),_:1},8,["onClick"])]),_:1}),e.isProcessing?(openBlock(),createBlock(unref(NProgress),{key:1,type:"line",percentage:e.progressPercentage,"indicator-placement":"inside",processing:""},null,8,["percentage"])):createCommentVNode("",true),e.processedItems.length>0?(openBlock(),createBlock(unref(NGrid),{key:2,cols:3,"x-gap":12},{default:withCtx(()=>[createVNode(unref(NGridItem),null,{default:withCtx(()=>[createVNode(unref(NStatistic),{label:"总记录数",value:e.totalItems},null,8,["value"])]),_:1}),createVNode(unref(NGridItem),null,{default:withCtx(()=>[createVNode(unref(NStatistic),{label:"成功",value:e.successCount},{prefix:withCtx(()=>[...a[9]||(a[9]=[createElementVNode("span",null,"✅",-1)])]),_:1},8,["value"])]),_:1}),createVNode(unref(NGridItem),null,{default:withCtx(()=>[createVNode(unref(NStatistic),{label:"失败",value:e.failureCount},{prefix:withCtx(()=>[...a[10]||(a[10]=[createElementVNode("span",null,"❌",-1)])]),_:1},8,["value"])]),_:1})]),_:1})):createCommentVNode("",true),e.processedItems.length>0?(openBlock(),createBlock(unref(NCollapse),{key:3},{default:withCtx(()=>[createVNode(unref(NCollapseItem),{title:"处理结果详情",name:"results"},{default:withCtx(()=>[createVNode(unref(NDataTable),{columns:S.value,data:e.processedItems,pagination:{pageSize:10},size:"small",striped:""},null,8,["columns","data"])]),_:1})]),_:1})):createCommentVNode("",true),e.logs.length>0?(openBlock(),createBlock(unref(NCollapse),{key:4},{default:withCtx(()=>[createVNode(unref(NCollapseItem),{title:"操作日志",name:"logs"},{default:withCtx(()=>[createVNode(unref(NLog),{log:e.logs.join("\n"),rows:8},null,8,["log"])]),_:1})]),_:1})):createCommentVNode("",true)]),_:1})]),_:1},8,["title"])]))}},[["__scopeId","data-v-83ec270b"]]));

		})
	};
}));

System.register("./CreateTxPlan-CUAd9dfO-BJuS2O-z.js", ['vue', './fetchTencentMedia-Cl3y79HP-CoWXE-uL.js', './__monkey.entry-uhykG5-y.js', 'naive-ui'], (function (exports, module) {
	'use strict';
	var ref, computed, watch, onMounted, resolveComponent, openBlock, createElementBlock, createElementVNode, withDirectives, normalizeClass, vModelText, createCommentVNode, createVNode, withCtx, createTextVNode, toDisplayString, Fragment, renderList, e, E$1;
	return {
		setters: [module => {
			ref = module.ref;
			computed = module.computed;
			watch = module.watch;
			onMounted = module.onMounted;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createElementVNode = module.createElementVNode;
			withDirectives = module.withDirectives;
			normalizeClass = module.normalizeClass;
			vModelText = module.vModelText;
			createCommentVNode = module.createCommentVNode;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			Fragment = module.Fragment;
			renderList = module.renderList;
		}, module => {
			e = module.e;
		}, module => {
			E$1 = module.E;
		}, null],
		execute: (function () {

			const x={class:"tencent-ad-creator"},w={class:"form-section"},$={class:"form-group"},q={key:0,class:"error-message"},S={class:"form-group"},O={key:0,class:"error-message"},N={class:"form-group"},E={class:"form-group"},b={class:"action-section"},I=["disabled"],J={class:"log-section"},k="tencent_custom_titles",D=exports("default", E$1({__name:"CreateTxPlan",setup(y){const D=ref(""),T=ref(""),M=ref(""),j=ref(false),G=ref([]),R=ref(""),C=ref("default"),P=ref(""),V=ref(null),z=computed(()=>{if(!D.value)return  true;try{return JSON.parse(D.value),!0}catch{return  false}}),U=()=>{try{GM_setValue(k,R.value),P.value=(new Date).toLocaleString("zh-CN");}catch(e){}},B=(e,t="info")=>{G.value.push({message:e,type:t}),setTimeout(()=>{V.value&&(V.value.scrollTop=V.value.scrollHeight);},0);};watch(C,(e,t)=>{B(`单选框选择变更：${t} -> ${e}`,"info");});const H=e=>{try{const t="string"==typeof e?JSON.parse(e):e,a=(t.url,t.method,t.requestHeaders||{}),r=a;if("object"!=typeof a){JSON.parse(a);return null}const o=JSON.parse(t.requestBody).account_id;return {url:t.url,method:t.method||"POST",headers:t.requestHeaders||{},body:t.requestBody,gtk:r["g-tk"],xtraceid:r["x-trace-id"],xtransid:r["x-trans-id"],account_id:o}}catch(t){return B(`解析请求信息失败: ${t.message}`,"error"),null}},A=async(e,t,a,r,o,s,n)=>{B("发送广告创建请求...");let c=JSON.parse(o);return c.adgroup_name=s,c.material_package_id=parseInt(n),new Promise((o,s)=>{GM_xmlhttpRequest({method:"POST",url:e,headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json","g-tk":t,priority:"u=1, i","sec-ch-ua":'"Not:A-Brand";v="99", "Microsoft Edge";v="145", "Chromium";v="145"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-trace-id":a,"x-trans-id":r,"x-tsa-client-authentication":"true",method:"POST",mode:"cors",credentials:"include"},data:JSON.stringify(c),onload:e=>{try{const t=JSON.parse(e.responseText);o(t);}catch(t){B("解析响应失败: "+t.message,"error"),s(t);}},onerror:e=>{B(`请求失败: ${e.status} ${e.statusText}`,"error"),s(new Error(`Network error: ${e.status}`));},ontimeout:()=>{B("请求超时","error"),s(new Error("Request timeout"));},timeout:2e4});})},L=async(e,t,a,r,o,s,n,c)=>{B("发送广告创建请求...");let i=JSON.parse(o);const l=[];for(let u=0;u<c.length;u++){const o=c[u],d=[];for(let e=0;e<o.length;e++){const t=o[e],a=t.videoID,r=t.video,s=t.cover;d.push({component_id:parseInt(a),media_id:parseInt(r),cover_id:parseInt(s)});}const p=Math.floor(Date.now()/1e3);let m=e.replace(new RegExp("(?<=nonce=).*?(?=&)","g"),p).replace(new RegExp("(?<=timestamp=).*","g"),p);i.dynamic_creative_name=s+u,i.creative_components.video=d,i.adgroup_id=n;const v=await new Promise((e,o)=>{GM_xmlhttpRequest({method:"POST",url:m,headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json","g-tk":t,priority:"u=1, i","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-trace-id":a,"x-trans-id":r,"x-tsa-client-authentication":"true",method:"POST",mode:"cors",credentials:"include"},data:JSON.stringify(i),onload:t=>{try{const a=JSON.parse(t.responseText);e(a);}catch(a){B("解析响应失败: "+a.message,"error"),o(a);}},onerror:e=>{B(`请求失败: ${e.status} ${e.statusText}`,"error"),o(new Error(`Network error: ${e.status}`));},ontimeout:()=>{B("请求超时","error"),o(new Error("Request timeout"));},timeout:2e4});});l.push(v);}return l};async function X(e,t,a,r,o){for(let n=0;n<r.length;n++)try{const s=r[n];let c=Math.floor(Date.now()/1e3);const i=await fetch(`https://ad.qq.com/api/v3.0/components/add?nonce=${c}&timestamp=${c}`,{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json","g-tk":e,priority:"u=1, i","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-trace-id":t,"x-trans-id":a,"x-tsa-client-authentication":"true"},body:`{"account_id":${o},"component_sub_type":"VIDEO_9X16","component_value":{"video":{"value":{"video_id":"${s.video}","cover_id":"${s.cover}"}}}}`,method:"POST",mode:"cors",credentials:"include"}),l=await i.json();if(l.data&&l.data.component_id)B(`视频组件添加成功，component_id: ${l.data.component_id}`,"success"),r[n].videoID=l.data.component_id;else if(l.errors&&l.errors[0]&&l.errors[0].common_param_exception_spec){const e=l.errors[0].common_param_exception_spec.error_fields;if(e&&e.length>0){const t=e[0];B(`视频组件添加失败：${t} 报错信息：${JSON.stringify(l)}`,"error"),r[n].videoID=l.errors[0].common_param_exception_spec.error_fields[0];}}}catch(s){B(`视频组件添加失败：${s.message} `,"error");}return r}function F(e,t,a){const r=[];for(let o=0;o<t*a&&o<e.length;o+=a)r.push(e.slice(o,o+a));return r}const K=async()=>{if(j.value)B("正在执行中，请稍后再试","error");else {if(!D.value)return B("请先在腾讯广告平台执行相关操作以获取请求信息","error"),void alert("请先在腾讯广告平台执行相关操作以获取请求信息！");if(M.value){j.value=true,B("开始执行广告批量创建流程...");try{const t=H(D.value),a=H(D.value),r=H(T.value);if(!t)return void B("请求信息解析失败，请检查是否正确获取了请求信息","error");const o=(e=>{B("开始解析Excel数据...");try{const t=e.split("\n"),a=[];for(let e=0;e<t.length;e++){const r=t[e].trim();if(r){const e=r.split("\t");e.length>=1&&a.push({label:e[0],name:e[1]});}}return B(`解析Excel数据完成，共 ${a.length} 条记录`,"success"),a}catch(t){return B(`解析Excel数据失败: ${t.message}`,"error"),[]}})(M.value);if(0===o.length)return void B("Excel数据解析失败或无有效数据，请检查输入格式","error");let{gtk:s,xtraceid:n,xtransid:c,body:i,account_id:l}=a;for(let u=0;u<o.length;u++){const t=o[u];let a=t.name;B(`处理第 ${u+1}/${o.length} 项: ${t.name}`);const d=t.label;let p=(await e({accountId:l,labelId:d,gtk:s,xtraceid:n,xtransid:c})).data.list;p=p.map(e=>(e.cover=e.video.cover_image_id,e.video=e.video.video_id,e));try{let e=Math.floor(Date.now()/1e3),t="https://ad.qq.com/api/v3.0/adgroups/add?nonce=1773988008&timestamp=1773988008",o=t.replace(new RegExp("(?<=nonce=).*?(?=&)","g"),e).replace(new RegExp("(?<=timestamp=).*","g"),e),m=a+"计划"+e;t.match(/https:\/\/ad.qq.com/g)>=2&&(o=o.split("https://ad.qq.com")[2]),await A(o,s,n,c,i,m,d).then(async t=>{if(!t||!t.data||!t.data.adgroup_id)throw B("计划创建失败：响应数据缺少 adgroup_id 字段","error"),new Error(`响应数据结构异常：${JSON.stringify(t)}`);B(`计划创建成功: ${t.data.adgroup_id}`,"success"),p=await X(s,n,c,p,l);const o=F(p,10,5);let{url:i,body:u}=r,d=a+"_"+e;e=Math.floor(Date.now()/1e3);let m=i.replace(new RegExp("(?<=nonce=).*?(?=&)","g"),e).replace(new RegExp("(?<=timestamp=).*","g"),e);await L(m,s,n,c,u,d,t.data.adgroup_id,o).then(e=>{if(!e||!e.data||!e.data.dynamic_creative_id)throw B("创意创建失败：响应数据缺少 dynamic_creative_id 字段","error"),new Error(`响应数据结构异常：${JSON.stringify(e)}`);B(`创意创建成功: ${e.data.dynamic_creative_id}`,"success");}).catch(e=>{const t=e.response||e;B(`创意创建失败：${e.message} - ${JSON.stringify(t)}`,"error");});}),B(`处理第 ${u+1} 项完成`,"success");}catch(e){B(`处理第 ${u+1} 项失败: ${e.message} 报错信息：${JSON.stringify(e.response)}`,"error");}}B("广告批量创建流程执行完成","success");}catch(e){B(`执行过程中发生错误: ${e.message} 报错信息：${JSON.stringify(e.response)}`,"error");}finally{j.value=false;}}else B("请填写Excel数据表","error");}};return onMounted(()=>{(()=>{try{const e=GM_getValue(k)||"";e&&(R.value=e,P.value=(new Date).toLocaleString("zh-CN"));}catch(e){}})();const e=GM_getValue("tx_adgroups_requestData")||"",t=GM_getValue("tx_dynamic_creatives_requestData")||"";""!==e?(D.value=e,B("已成功加载保存的请求信息","success")):(B("未检测到保存的请求信息，请先在腾讯广告平台执行相关操作以获取请求信息","warning"),B("操作步骤：1. 打开腾讯广告平台 2. 执行创建广告操作 3. 返回此页面查看是否获取到请求","info")),""!==t?(T.value=t,B("已成功加载保存的请求信息","success")):(B("未检测到保存的请求信息，请先在腾讯广告平台执行相关操作以获取请求信息","warning"),B("操作步骤：1. 打开腾讯广告平台 2. 执行创建广告操作 3. 返回此页面查看是否获取到请求","info"));}),(e,t)=>{const a=resolveComponent("n-radio"),r=resolveComponent("n-space"),_=resolveComponent("n-radio-group");return openBlock(),createElementBlock("div",x,[createElementVNode("div",w,[t[13]||(t[13]=createElementVNode("h2",null,"腾讯广告批量创建工具",-1)),createElementVNode("div",$,[t[5]||(t[5]=createElementVNode("label",{for:"requestInfo"},"发送请求信息:",-1)),withDirectives(createElementVNode("textarea",{id:"requestInfo","onUpdate:modelValue":t[0]||(t[0]=e=>D.value=e),placeholder:"从腾讯广告平台自动获取的请求信息，如未显示请先在腾讯平台执行相关操作",rows:"8",readonly:"",class:normalizeClass({"error-state":!z.value})},null,2),[[vModelText,D.value]]),t[6]||(t[6]=createElementVNode("div",{class:"hint"}," 💡 请求信息会自动从腾讯广告平台获取，如未显示请先在腾讯平台执行相关操作 ",-1)),!z.value&&D.value?(openBlock(),createElementBlock("div",q," 错误：请求信息格式不正确，请重新在腾讯平台执行操作以获取完整请求信息 ")):createCommentVNode("",true)]),createElementVNode("div",S,[t[7]||(t[7]=createElementVNode("label",{for:"requestInfo"},"发送请求信息:",-1)),withDirectives(createElementVNode("textarea",{id:"requestInfo1","onUpdate:modelValue":t[1]||(t[1]=e=>T.value=e),placeholder:"从腾讯广告平台自动获取的请求信息，如未显示请先在腾讯平台执行相关操作",rows:"8",readonly:"",class:normalizeClass({"error-state":!z.value})},null,2),[[vModelText,T.value]]),t[8]||(t[8]=createElementVNode("div",{class:"hint"}," 💡 请求信息会自动从腾讯广告平台获取，如未显示请先在腾讯平台执行相关操作 ",-1)),!z.value&&D.value?(openBlock(),createElementBlock("div",O," 错误：请求信息格式不正确，请重新在腾讯平台执行操作以获取完整请求信息 ")):createCommentVNode("",true)]),createElementVNode("div",N,[t[9]||(t[9]=createElementVNode("label",{for:"excelData"},"Excel数据表:",-1)),withDirectives(createElementVNode("textarea",{id:"excelData","onUpdate:modelValue":t[2]||(t[2]=e=>M.value=e),placeholder:"标签 视频 封面 名称（自动增加混剪创意",rows:"10"},null,512),[[vModelText,M.value]])]),createVNode(_,{value:C.value,"onUpdate:value":t[3]||(t[3]=e=>C.value=e),name:"radioGroup"},{default:withCtx(()=>[createVNode(r,null,{default:withCtx(()=>[createVNode(a,{value:"default"},{default:withCtx(()=>[...t[10]||(t[10]=[createTextVNode(" 使用默认标题 ",-1)])]),_:1}),createVNode(a,{value:"custom"},{default:withCtx(()=>[...t[11]||(t[11]=[createTextVNode(" 使用自定义标题 ",-1)])]),_:1})]),_:1})]),_:1},8,["value"]),createElementVNode("div",E,[withDirectives(createElementVNode("textarea",{id:"biaoti","onUpdate:modelValue":t[4]||(t[4]=e=>R.value=e),placeholder:"如果需要一一标题对应则填写，每行一个标题",rows:"5",onInput:U},null,544),[[vModelText,R.value]])]),createElementVNode("div",b,[createElementVNode("button",{onClick:K,disabled:j.value},toDisplayString(j.value?"执行中...":"开始执行"),9,I)]),createElementVNode("div",J,[t[12]||(t[12]=createElementVNode("h3",null,"执行日志",-1)),createElementVNode("div",{class:"log-content",ref_key:"logContent",ref:V},[(openBlock(true),createElementBlock(Fragment,null,renderList(G.value,(e,t)=>(openBlock(),createElementBlock("div",{key:t,class:normalizeClass(e.type)},toDisplayString(e.message),3))),128))],512)])])])}}},[["__scopeId","data-v-73f276c5"]]));

		})
	};
}));

System.register("./CreateTxPlanVariant-WicKG1mT-Br27kYLU.js", ['vue', './fetchTencentMedia-Cl3y79HP-CoWXE-uL.js', './__monkey.entry-uhykG5-y.js', 'naive-ui'], (function (exports, module) {
	'use strict';
	var ref, computed, watch, onMounted, resolveComponent, openBlock, createElementBlock, createElementVNode, withDirectives, normalizeClass, vModelText, createCommentVNode, createVNode, withCtx, createTextVNode, toDisplayString, Fragment, renderList, e, E$1;
	return {
		setters: [module => {
			ref = module.ref;
			computed = module.computed;
			watch = module.watch;
			onMounted = module.onMounted;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createElementVNode = module.createElementVNode;
			withDirectives = module.withDirectives;
			normalizeClass = module.normalizeClass;
			vModelText = module.vModelText;
			createCommentVNode = module.createCommentVNode;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			Fragment = module.Fragment;
			renderList = module.renderList;
		}, module => {
			e = module.e;
		}, module => {
			E$1 = module.E;
		}, null],
		execute: (function () {

			const x={class:"tencent-ad-creator"},$={class:"form-section"},w={class:"form-group"},q={key:0,class:"error-message"},S={class:"form-group"},O={key:0,class:"error-message"},b={class:"form-group"},N={class:"form-group"},I={class:"action-section"},E=["disabled"],D={class:"log-section"},k="tencent_custom_titles",J=exports("default", E$1({__name:"CreateTxPlanVariant",setup(y){const J=ref(""),T=ref(""),V=ref(""),M=ref(false),j=ref([]),G=ref(""),C=ref("default"),U=ref(""),z=ref(null),P=computed(()=>{if(!J.value)return  true;try{return JSON.parse(J.value),!0}catch{return  false}}),R=()=>{try{GM_setValue(k,G.value),U.value=(new Date).toLocaleString("zh-CN");}catch(e){}},B=(e,t="info")=>{j.value.push({message:e,type:t}),setTimeout(()=>{z.value&&(z.value.scrollTop=z.value.scrollHeight);},0);};watch(C,(e,t)=>{B(`单选框选择变更：${t} -> ${e}`,"info");});const H=e=>{try{const t="string"==typeof e?JSON.parse(e):e,a=(t.url,t.method,t.requestHeaders||{}),r=a;if("object"!=typeof a){JSON.parse(a);return null}const o=JSON.parse(t.requestBody).account_id;return {url:t.url,method:t.method||"POST",headers:t.requestHeaders||{},body:t.requestBody,gtk:r["g-tk"],xtraceid:r["x-trace-id"],xtransid:r["x-trans-id"],account_id:o}}catch(t){return B(`解析请求信息失败: ${t.message}`,"error"),null}},L=async(e,t,a,r,o,s,n,c)=>{B("发送广告创建请求...");let l=JSON.parse(o);const i=[];for(let u=0;u<c.length;u++){const o=c[u],d=[];for(let e=0;e<o.length;e++){const t=o[e],a=t.videoID,r=t.video,s=t.cover;d.push({component_id:parseInt(a),media_id:parseInt(r),cover_id:parseInt(s)});}const p=Math.floor(Date.now()/1e3);let m=e.replace(new RegExp("(?<=nonce=).*?(?=&)","g"),p).replace(new RegExp("(?<=timestamp=).*","g"),p);l.dynamic_creative_name=s+u,l.creative_components.video=d,l.adgroup_id=n;const v=await new Promise((e,o)=>{GM_xmlhttpRequest({method:"POST",url:m,headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json","g-tk":t,priority:"u=1, i","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-trace-id":a,"x-trans-id":r,"x-tsa-client-authentication":"true",method:"POST",mode:"cors",credentials:"include"},data:JSON.stringify(l),onload:t=>{try{const a=JSON.parse(t.responseText);e(a);}catch(a){B("解析响应失败: "+a.message,"error"),o(a);}},onerror:e=>{B(`请求失败: ${e.status} ${e.statusText}`,"error"),o(new Error(`Network error: ${e.status}`));},ontimeout:()=>{B("请求超时","error"),o(new Error("Request timeout"));},timeout:2e4});});i.push(v);}return i};async function A(e,t,a,r,o){for(let n=0;n<r.length;n++)try{const s=r[n];let c=Math.floor(Date.now()/1e3);const l=await fetch(`https://ad.qq.com/api/v3.0/components/add?nonce=${c}&timestamp=${c}`,{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json","g-tk":e,priority:"u=1, i","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-trace-id":t,"x-trans-id":a,"x-tsa-client-authentication":"true"},body:`{"account_id":${o},"component_sub_type":"VIDEO_9X16","component_value":{"video":{"value":{"video_id":"${s.video}","cover_id":"${s.cover}"}}}}`,method:"POST",mode:"cors",credentials:"include"}),i=await l.json();if(i.data&&i.data.component_id)B(`视频组件添加成功，component_id: ${i.data.component_id}`,"success"),r[n].videoID=i.data.component_id;else if(i.errors&&i.errors[0]&&i.errors[0].common_param_exception_spec){const e=i.errors[0].common_param_exception_spec.error_fields;if(e&&e.length>0){const t=e[0];B(`视频组件添加失败：${t} 报错信息：${JSON.stringify(i)}`,"error"),r[n].videoID=i.errors[0].common_param_exception_spec.error_fields[0];}}}catch(s){B(`视频组件添加失败：${s.message} `,"error");}return r}function X(e,t,a){const r=[];for(let o=0;o<t*a&&o<e.length;o+=a)r.push(e.slice(o,o+a));return r}const F=async()=>{if(M.value)B("正在执行中，请稍后再试","error");else {if(!J.value)return B("请先在腾讯广告平台执行相关操作以获取请求信息","error"),void alert("请先在腾讯广告平台执行相关操作以获取请求信息！");if(V.value){M.value=true,B("开始执行广告批量创建流程...");try{const t=H(J.value),a=H(J.value),r=H(T.value);if(!t)return void B("请求信息解析失败，请检查是否正确获取了请求信息","error");const o=(e=>{B("开始解析Excel数据...");try{const t=e.split("\n"),a=[];for(let e=0;e<t.length;e++){const r=t[e].trim();if(r){const e=r.split("\t");e.length>=1&&a.push({label:e[0],name:e[1],adgroup_id:parseInt(e[2])});}}return B(`解析Excel数据完成，共 ${a.length} 条记录`,"success"),a}catch(t){return B(`解析Excel数据失败: ${t.message}`,"error"),[]}})(V.value);if(0===o.length)return void B("Excel数据解析失败或无有效数据，请检查输入格式","error");let{gtk:s,xtraceid:n,xtransid:c,body:l,account_id:i}=a;for(let u=0;u<o.length;u++){const t=o[u];let a=t.name;B(`处理第 ${u+1}/${o.length} 项: ${t.name}`);const l=t.label;let d=(await e({accountId:i,labelId:l,gtk:s,xtraceid:n,xtransid:c})).data.list;d=d.map(e=>(e.cover=e.video.cover_image_id,e.video=e.video.video_id,e));try{d=await A(s,n,c,d,i);const e=X(d,10,8);let{url:o,body:l}=r,p=Math.floor(Date.now()/1e3),m=a+"_"+p,v=o.replace(new RegExp("(?<=nonce=).*?(?=&)","g"),p).replace(new RegExp("(?<=timestamp=).*","g"),p);await L(v,s,n,c,l,m,t.adgroup_id,e).then(e=>{if(!e||!e.data||!e.data.dynamic_creative_id)throw B("创意创建失败：响应数据缺少 dynamic_creative_id 字段","error"),new Error(`响应数据结构异常：${JSON.stringify(e)}`);B(`创意创建成功: ${e.data.dynamic_creative_id}`,"success");}).catch(e=>{const t=e.response||e;B(`创意创建失败：${e.message} - ${JSON.stringify(t)}`,"error");}),B(`处理第 ${u+1} 项完成`,"success");}catch(e){B(`处理第 ${u+1} 项失败: ${e.message} 报错信息：${JSON.stringify(e.response)}`,"error");}}B("广告批量创建流程执行完成","success");}catch(e){B(`执行过程中发生错误: ${e.message} 报错信息：${JSON.stringify(e.response)}`,"error");}finally{M.value=false;}}else B("请填写Excel数据表","error");}};return onMounted(()=>{(()=>{try{const e=GM_getValue(k)||"";e&&(G.value=e,U.value=(new Date).toLocaleString("zh-CN"));}catch(e){}})();const e=GM_getValue("tx_adgroups_requestData")||"",t=GM_getValue("tx_dynamic_creatives_requestData")||"";""!==e?(J.value=e,B("已成功加载保存的请求信息","success")):(B("未检测到保存的请求信息，请先在腾讯广告平台执行相关操作以获取请求信息","warning"),B("操作步骤：1. 打开腾讯广告平台 2. 执行创建广告操作 3. 返回此页面查看是否获取到请求","info")),""!==t?(T.value=t,B("已成功加载保存的请求信息","success")):(B("未检测到保存的请求信息，请先在腾讯广告平台执行相关操作以获取请求信息","warning"),B("操作步骤：1. 打开腾讯广告平台 2. 执行创建广告操作 3. 返回此页面查看是否获取到请求","info"));}),(e,t)=>{const a=resolveComponent("n-radio"),r=resolveComponent("n-space"),_=resolveComponent("n-radio-group");return openBlock(),createElementBlock("div",x,[createElementVNode("div",$,[t[13]||(t[13]=createElementVNode("h2",null,"腾讯广告批量创建工具",-1)),createElementVNode("div",w,[t[5]||(t[5]=createElementVNode("label",{for:"requestInfo"},"发送请求信息:",-1)),withDirectives(createElementVNode("textarea",{id:"requestInfo","onUpdate:modelValue":t[0]||(t[0]=e=>J.value=e),placeholder:"从腾讯广告平台自动获取的请求信息，如未显示请先在腾讯平台执行相关操作",rows:"8",readonly:"",class:normalizeClass({"error-state":!P.value})},null,2),[[vModelText,J.value]]),t[6]||(t[6]=createElementVNode("div",{class:"hint"}," 💡 请求信息会自动从腾讯广告平台获取，如未显示请先在腾讯平台执行相关操作 ",-1)),!P.value&&J.value?(openBlock(),createElementBlock("div",q," 错误：请求信息格式不正确，请重新在腾讯平台执行操作以获取完整请求信息 ")):createCommentVNode("",true)]),createElementVNode("div",S,[t[7]||(t[7]=createElementVNode("label",{for:"requestInfo"},"发送请求信息:",-1)),withDirectives(createElementVNode("textarea",{id:"requestInfo1","onUpdate:modelValue":t[1]||(t[1]=e=>T.value=e),placeholder:"从腾讯广告平台自动获取的请求信息，如未显示请先在腾讯平台执行相关操作",rows:"8",readonly:"",class:normalizeClass({"error-state":!P.value})},null,2),[[vModelText,T.value]]),t[8]||(t[8]=createElementVNode("div",{class:"hint"}," 💡 请求信息会自动从腾讯广告平台获取，如未显示请先在腾讯平台执行相关操作 ",-1)),!P.value&&J.value?(openBlock(),createElementBlock("div",O," 错误：请求信息格式不正确，请重新在腾讯平台执行操作以获取完整请求信息 ")):createCommentVNode("",true)]),createElementVNode("div",b,[t[9]||(t[9]=createElementVNode("label",{for:"excelData"},"Excel数据表:",-1)),withDirectives(createElementVNode("textarea",{id:"excelData","onUpdate:modelValue":t[2]||(t[2]=e=>V.value=e),placeholder:"标签 id",rows:"10"},null,512),[[vModelText,V.value]])]),createVNode(_,{value:C.value,"onUpdate:value":t[3]||(t[3]=e=>C.value=e),name:"radioGroup"},{default:withCtx(()=>[createVNode(r,null,{default:withCtx(()=>[createVNode(a,{value:"default"},{default:withCtx(()=>[...t[10]||(t[10]=[createTextVNode(" 使用默认标题 ",-1)])]),_:1}),createVNode(a,{value:"custom"},{default:withCtx(()=>[...t[11]||(t[11]=[createTextVNode(" 使用自定义标题 ",-1)])]),_:1})]),_:1})]),_:1},8,["value"]),createElementVNode("div",N,[withDirectives(createElementVNode("textarea",{id:"biaoti","onUpdate:modelValue":t[4]||(t[4]=e=>G.value=e),placeholder:"如果需要一一标题对应则填写，每行一个标题",rows:"5",onInput:R},null,544),[[vModelText,G.value]])]),createElementVNode("div",I,[createElementVNode("button",{onClick:F,disabled:M.value},toDisplayString(M.value?"执行中...":"开始执行"),9,E)]),createElementVNode("div",D,[t[12]||(t[12]=createElementVNode("h3",null,"执行日志",-1)),createElementVNode("div",{class:"log-content",ref_key:"logContent",ref:z},[(openBlock(true),createElementBlock(Fragment,null,renderList(j.value,(e,t)=>(openBlock(),createElementBlock("div",{key:t,class:normalizeClass(e.type)},toDisplayString(e.message),3))),128))],512)])])])}}},[["__scopeId","data-v-7d323a89"]]));

		})
	};
}));

System.register("./fetchTencentMedia-Cl3y79HP-CoWXE-uL.js", [], (function (exports, module) {
	'use strict';
	return {
		execute: (function () {

			exports("e", e);

			async function e(e){const{accountId:t=78015411,page:a=1,pageSize:r=50,status:o="ADSTATUS_NORMAL",startDate:i="1771776000",endDate:c="1774367999",labelId:s="27396746",similarityStatus:n="SIMILARITY_STATUS_APPROVED",orderBy:d="created_time",start_date:_="2026-02-20",end_date:l="2026-03-24",gtk:p="",xtraceid:u,xtransid:f}=e,h=Math.floor(Date.now()/1e3),m=await fetch(`https://ad.qq.com/api/v3.0/integrated_media_list/get?nonce=${h}&timestamp=${h}`,{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json","g-tk":p,priority:"u=1, i","sec-ch-ua":'"Not:A-Brand";v="99", "Microsoft Edge";v="145", "Chromium";v="145"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-trace-id":u,"x-trans-id":f,"x-tsa-client-authentication":"true"},body:JSON.stringify({account_id:t,page:a,page_size:r,filtering:[{field:"status",operator:"EQUALS",values:[o]},{field:"owner_account_type",operator:"EQUALS",values:["ACCOUNT_TYPE_ADVERTISER"]},{field:"label_id",operator:"EQUALS",values:[s]},{field:"similarity_status",operator:"EQUALS",values:[n]}],or_filtering:[],date_range:{start_date:_,end_date:l},order_by:[{field:d,order:"ASCENDING"}],report_fields:["cost","view_count","order_roi","conversions_rate","ctr","conversions_cost","effective_leads_count","effective_cost","effect_leads_purchase_count","effect_leads_purchase_cost"],report_order_by:[]}),method:"POST",mode:"cors",credentials:"include"});return await m.json()}

		})
	};
}));

System.register("./CreateDouyinPlan-DrXwipkT-S7FiUJU9.js", ['vue', './__monkey.entry-uhykG5-y.js', 'naive-ui'], (function (exports, module) {
	'use strict';
	var ref, computed, watch, onMounted, resolveComponent, openBlock, createElementBlock, createElementVNode, withDirectives, normalizeClass, vModelText, createCommentVNode, createVNode, withCtx, createTextVNode, toDisplayString, Fragment, renderList, E$1;
	return {
		setters: [module => {
			ref = module.ref;
			computed = module.computed;
			watch = module.watch;
			onMounted = module.onMounted;
			resolveComponent = module.resolveComponent;
			openBlock = module.openBlock;
			createElementBlock = module.createElementBlock;
			createElementVNode = module.createElementVNode;
			withDirectives = module.withDirectives;
			normalizeClass = module.normalizeClass;
			vModelText = module.vModelText;
			createCommentVNode = module.createCommentVNode;
			createVNode = module.createVNode;
			withCtx = module.withCtx;
			createTextVNode = module.createTextVNode;
			toDisplayString = module.toDisplayString;
			Fragment = module.Fragment;
			renderList = module.renderList;
		}, module => {
			E$1 = module.E;
		}, null],
		execute: (function () {

			const y={class:"douyin-ad-creator"},w={class:"form-section"},x={class:"form-group"},b={key:0,class:"error-message"},k={class:"form-group"},T={class:"form-group"},$={class:"action-section"},E=["disabled"],q={class:"log-section"},C=exports("default", E$1({__name:"CreateDouyinPlan",setup(h){const C=ref(""),S=ref(""),j=ref(false),N=ref([]),O=ref(""),I=ref("default");ref("");const z=ref(null),G=computed(()=>!C.value||C.value.length>0),U=(e,o="info")=>{N.value.push({message:e,type:o}),setTimeout(()=>{z.value&&(z.value.scrollTop=z.value.scrollHeight);},0);};watch(I,(e,o)=>{U(`单选框选择变更：${o} -> ${e}`,"info");});const D={image_mode:"image_mode",material_name:"video_name","video_info.height":"video_info.height","video_info.width":"video_info.width","video_info.bitrate":"video_info.bitrate","video_info.duration":"video_info.duration","video_info.status":"video_info.status","video_info.initial_size":"video_info.initial_size","video_info.file_md5":"video_info.file_md5","video_info.video_id":"video_id","video_info.video_unique":"video_id","video_info.vid":"video_id","video_info.cover_url":"video_poster","video_info.cover_uri":"cover_uri","image_info.width":"image_info.width","image_info.height":"image_info.height","image_info.web_uri":"image_info.web_uri","image_info.sign_url":"sign_url"};async function P(e){const{aadvid:o,file_name:t,image_mode:a="5,15",sort_type:i="desc",metric_names:r="create_time,stat_cost,ctr",aweme_id:n="",aweme_account:s,auth_level:l=[5],landing_type:c=3,external_action:d=21,page:u=1,limit:m=32,version:_="v2",operation_platform:v=1,_signature:f="",csrfToken:g,sessionId:p,signature:h}=e,y=new URLSearchParams({_signature:f,aadvid:o,file_name:t,image_mode:a,sort_type:i,metric_names:r,aweme_id:n,aweme_account:s,landing_type:c,external_action:d,page:u,limit:m,version:_,operation_platform:v,csrfToken:g,sessionId:p,signature:h});l.forEach(e=>y.append("auth_level[]",e));const w=`https://ad.oceanengine.com/superior/api/v2/video/list?${y}`,x=await fetch(w,{headers:{accept:"application/json, text/plain, */*","accept-language":"zh-CN,zh;q=0.9",priority:"u=1, i","sec-ch-ua":'"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"macOS"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-csrftoken":e.csrfToken||"","x-sessionid":e.sessionId||"",_signature:e.signature||""},referrer:e.referrer||"",method:"GET",mode:"cors",credentials:"include"});return (await x.json()).data.videos[0]}const V=async(e,o,t,a,i,r,n,s=2e4)=>{const l=function(e,o,t){const a=(e,o)=>{const t=o.split(".");let a=e;for(const i of t){if(null==a)return;a=a[i];}return a},i=(e,o,t)=>{const a=o.split(".");let i=e;for(let r=0;r<a.length-1;r++) void 0!==i[a[r]]&&null!==i[a[r]]||(i[a[r]]={}),i=i[a[r]];i[a[a.length-1]]=t;};for(const[r,n]of Object.entries(t)){const t=a(o,n);void 0!==t&&i(e,r,t);}return e}((n="object"==typeof n?n:JSON.parse(n)).material_group.video_material_info[0],i,D);n.material_group.video_material_info=[l],n.name=r;const c=new Date;n.check_hash=c.getTime(),U("发送广告创建请求...");const d=`https://ad.oceanengine.com/superior/api/v2/promotion/create_promotion?_signature=${t}&aadvid=${a}`,u=new AbortController,m=setTimeout(()=>u.abort(),s);try{const t=await fetch(d,{method:"POST",signal:u.signal,headers:{accept:"application/json","accept-language":"zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6","content-type":"application/json",priority:"u=1, i","sec-ch-ua":'"Not/A)Brand";v="8", "Chromium";v="127", "Edge";v="127"',"sec-ch-ua-mobile":"?0","sec-ch-ua-platform":'"Linux"',"sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","traffic-channel":"pc","x-csrftoken":e,"x-sessionid":o,cookie:document.cookie,credentials:"omit"},body:JSON.stringify(n),credentials:"include"});if(clearTimeout(m),!t.ok)throw new Error(`HTTP error! status: ${t.status}`);const a=await t.json();return U(`创建视频信息成功${a.data.promotion_id}`,"success"),a}catch(_){if(clearTimeout(m),"AbortError"===_.name)throw U("请求超时","error"),new Error("Request timeout");throw U(`请求失败：${_.message}`,"error"),_}},A=async()=>{if(j.value)U("正在执行中，请稍后再试","error");else {if(!C.value)return U("请先在抖音平台执行相关操作以获取请求信息","error"),void alert("请先在抖音平台执行相关操作以获取请求信息！");if(S.value){j.value=true,U("开始执行广告批量创建流程...");try{const e=(e=>{try{const o="string"==typeof e?JSON.parse(e):e;return {url:o.url||"",method:o.method||"POST",headers:o.requestHeaders||{},body:o.requestBody||""}}catch(o){return U(`解析请求信息失败: ${o.message}`,"error"),null}})(C.value);if(!e)return void U("请求信息解析失败，请检查是否正确获取了请求信息","error");const o=(e=>{U("开始解析Excel数据...");try{const o=e.split("\n"),t=[];for(let e=0;e<o.length;e++){const a=o[e].trim();if(a){const e=a.split("\t");e.length>=1&&t.push({id:e[0]||"",name:e[1]||""});}}return U(`解析Excel数据完成，共 ${t.length} 条记录`,"success"),t}catch(o){return U(`解析Excel数据失败: ${o.message}`,"error"),[]}})(S.value);if(0===o.length)return void U("Excel数据解析失败或无有效数据，请检查输入格式","error");for(let t=0;t<o.length;t++){const a=o[t];U(`处理第 ${t+1}/${o.length} 项: ${a.id}`);const i=e.headers["x-csrftoken"],r=e.headers["x-sessionid"],n=e.url.match(new RegExp("(?<=_signature=).*?(?=&)","g"))[0],s=e.url.match(new RegExp("(?<=aadvid=).*","g"))[0],l=JSON.parse(e.body),c=l.promotion_data.native_info.ies_core_user_id,d=await P({aadvid:s,file_name:a.id,image_mode:"5,15",aweme_id:"swtsg",aweme_account:c,auth_level:[5],landing_type:3,external_action:21,page:1,limit:32,csrfToken:i,sessionId:r,signature:n});await V(i,r,n,s,d,a.name,l);}U("广告批量创建流程执行完成","success");}catch(e){U(`执行过程中发生错误: ${e.message}`,"error");}finally{j.value=false;}}else U("请填写Excel数据表","error");}};return onMounted(()=>{const e=GM_getValue("oceanengine_create_promotion_requestData")||"";""!==e?(C.value=e,U("已成功加载保存的请求信息","success")):U("未检测到保存的请求信息，请先在抖音平台执行相关操作","warning"),(()=>{try{const e=GM_getValue("douyin_custom_titles")||"";e&&(O.value=e);}catch(e){}})();}),(e,o)=>{const t=resolveComponent("n-radio"),a=resolveComponent("n-space"),h=resolveComponent("n-radio-group");return openBlock(),createElementBlock("div",y,[createElementVNode("div",w,[o[10]||(o[10]=createElementVNode("h2",null,"抖音广告批量创建工具",-1)),createElementVNode("div",x,[o[4]||(o[4]=createElementVNode("label",{for:"requestInfo"},"发送请求信息:",-1)),withDirectives(createElementVNode("textarea",{id:"requestInfo","onUpdate:modelValue":o[0]||(o[0]=e=>C.value=e),placeholder:"从抖音平台自动获取的请求信息，如未显示请先在抖音平台执行相关操作",rows:"8",readonly:"",class:normalizeClass({"error-state":!G.value})},null,2),[[vModelText,C.value]]),o[5]||(o[5]=createElementVNode("div",{class:"hint"}," 💡 请求信息会自动从抖音平台获取，如未显示请先在抖音平台执行相关操作 ",-1)),!G.value&&C.value?(openBlock(),createElementBlock("div",b," 错误：未检测到有效请求数据，请重新在抖音平台执行操作以获取完整请求信息 ")):createCommentVNode("",true)]),createElementVNode("div",k,[o[6]||(o[6]=createElementVNode("label",{for:"excelData"},"Excel数据表:",-1)),withDirectives(createElementVNode("textarea",{id:"excelData","onUpdate:modelValue":o[1]||(o[1]=e=>S.value=e),placeholder:"id 名称",rows:"10"},null,512),[[vModelText,S.value]])]),createVNode(h,{value:I.value,"onUpdate:value":o[2]||(o[2]=e=>I.value=e),name:"radioGroup"},{default:withCtx(()=>[createVNode(a,null,{default:withCtx(()=>[createVNode(t,{value:"default"},{default:withCtx(()=>[...o[7]||(o[7]=[createTextVNode(" 使用默认标题 ",-1)])]),_:1}),createVNode(t,{value:"custom"},{default:withCtx(()=>[...o[8]||(o[8]=[createTextVNode(" 使用自定义标题 ",-1)])]),_:1})]),_:1})]),_:1},8,["value"]),createElementVNode("div",T,[withDirectives(createElementVNode("textarea",{id:"biaoti","onUpdate:modelValue":o[3]||(o[3]=e=>O.value=e),placeholder:"如果需要一一标题对应则填写",rows:"5"},null,512),[[vModelText,O.value]])]),createElementVNode("div",$,[createElementVNode("button",{onClick:A,disabled:j.value},toDisplayString(j.value?"执行中...":"开始执行"),9,E)]),createElementVNode("div",q,[o[9]||(o[9]=createElementVNode("h3",null,"执行日志",-1)),createElementVNode("div",{class:"log-content",ref_key:"logContent",ref:z},[(openBlock(true),createElementBlock(Fragment,null,renderList(N.value,(e,o)=>(openBlock(),createElementBlock("div",{key:o,class:normalizeClass(e.type)},toDisplayString(e.message),3))),128))],512)])])])}}},[["__scopeId","data-v-f54fb7a2"]]));

		})
	};
}));

System.import("./__entry.js", "./");
