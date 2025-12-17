// dingtalk-robot.js

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(exports)
    : typeof define === 'function' && define.amd
    ? define(['exports'], factory)
    : factory((global.DingTalkRobot = {}));
})(this, function (exports) {
  'use strict';

  /**
   * 使用 Web Crypto API 生成 HMAC-SHA256 签名（Base64 + URL 编码）
   * @param {string} timestamp - 时间戳（毫秒字符串）
   * @param {string} secret - 钉钉机器人密钥
   * @returns {Promise<string>} URL 编码后的 Base64 签名
   */
  async function createHmacSha256(timestamp, secret) {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available. This library must run in a secure browser context (HTTPS or localhost).');
    }

    const encoder = new TextEncoder();
    const secretBuffer = encoder.encode(secret);
    const stringToSign = `${timestamp}\n${secret}`;
    const stringToSignBuffer = encoder.encode(stringToSign);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      secretBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, stringToSignBuffer);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    return encodeURIComponent(signatureBase64);
  }

  /**
   * 发送钉钉机器人消息
   * @param {Object} options
   * @param {string} options.accessToken - 机器人 access_token
   * @param {string} options.secret - 机器人加签密钥
   * @param {Object} options.message - 消息体（符合钉钉格式）
   * @param {boolean} [options.debug=false] - 是否打印调试信息
   * @returns {Promise<Response>}
   */
  async function sendDingTalkMessage({ accessToken, secret, message, debug = false }) {
    const timestamp = String(Date.now());
    const sign = await createHmacSha256(timestamp, secret);

    const url = `https://oapi.dingtalk.com/robot/send?access_token=${accessToken}&timestamp=${timestamp}&sign=${sign}`;

    if (debug) {
      console.log('[DingTalkRobot] URL:', url);
      console.log('[DingTalkRobot] Message:', message);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DingTalk API error: ${response.status} ${errorText}`);
    }

    return response;
  }

  // 导出
  exports.createHmacSha256 = createHmacSha256;
  exports.sendDingTalkMessage = sendDingTalkMessage;
});
