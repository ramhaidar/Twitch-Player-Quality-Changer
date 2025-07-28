// ==UserScript==
// @name            Twitch Player Quality Changer
// @description     自動選擇來源畫質，並備援至其他選項.
// @downloadURL     https://github.com/ramhaidar/Twitch-Player-Quality-Changer/raw/main/TwitchPlayerQualityChanger_zh-tw.user.js
// @namespace       https://github.com/ramhaidar/Twitch-Player-Quality-Changer
// @version         0.0.9
// @author          ramhaidar (https://github.com/ramhaidar)
// @homepageURL     https://github.com/ramhaidar/Twitch-Player-Quality-Changer
// @icon            https://www.google.com/s2/favicons?sz=64&domain=twitch.tv
// @license         MIT
// @match           https://twitch.tv/*
// @match           https://www.twitch.tv/*
// @match           https://player.twitch.tv/*
// @match           https://m.twitch.tv/*
// @grant           none
// @run-at          document-end
// @updateURL       https://github.com/ramhaidar/Twitch-Player-Quality-Changer/raw/main/TwitchPlayerQualityChanger_zh-tw.user.js
// ==/UserScript==

(function () {
    'use strict';

    // --- 設定 ---
    const CONFIG = {
        // 可用畫質：1080p60, 936p60, 720p60, 720p, 480p, 360p, 160p
        // 在此處設定您偏好的畫質
        preferredQuality: '480p',
        qualities: ['1080p60', '936p60', '720p60', '720p', '480p', '360p', '160p'],
        selectors: {
            settingsButton: '[data-a-target="player-settings-button"]',
            qualityMenuItem: '[data-a-target="player-settings-menu-item-quality"]',
            qualityOptions: '[data-a-target="tw-radio"]',
            channelStatus: '.tw-channel-status-text-indicator, .channel-status-info'
        },
        pollInterval: 500, // 輪詢間隔（毫秒）
        maxAttempts: 25    // 最大嘗試次數
    };

    /**
     * 等待元素出現在 DOM 中
     * @param {string} selector - 元素的 CSS 選擇器
     * @param {number} maxAttempts - 尋找元素的最大嘗試次數
     * @param {Function} callback - 找到元素後執行的回呼函式
     */
    function waitForElement(selector, maxAttempts, callback) {
        let attempts = 0;
        const intervalId = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(intervalId);
                callback(element);
                return;
            }

            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(intervalId);
                console.warn(`❌ 在 ${maxAttempts} 次嘗試後未找到元素 "${selector}"`);
            }
        }, CONFIG.pollInterval);
    }

    /**
     * 檢查頻道是否正在直播或離線
     * @returns {boolean}
     */
    function isChannelActive() {
        const statusElement = document.querySelector(CONFIG.selectors.channelStatus);
        const status = statusElement?.textContent;
        return status === '直播中' || status === '離線';
    }

    /**
     * 將影片畫質設定為偏好選項
     * @param {NodeList} qualityInputs - 可用畫質選項的列表
     * @param {number} preferredIndex - 偏好畫質在 qualities 陣列中的索引
     */
    function setVideoQuality(qualityInputs, preferredIndex) {
        const availableQualities = Array.from(qualityInputs);
        const isPreferredQualityAvailable = availableQualities.some(input =>
            input.parentNode.textContent.includes(CONFIG.qualities[preferredIndex])
        );

        if (isPreferredQualityAvailable) {
            const preferredInput = availableQualities.find(input =>
                input.parentNode.textContent.includes(CONFIG.qualities[preferredIndex])
            );
            selectQualityAndClose(preferredInput);
        } else {
            // 若偏好畫質不可用，則備援至可用的最低畫質
            selectQualityAndClose(availableQualities[availableQualities.length - 1]);
        }
    }

    /**
     * 選擇一個畫質選項並關閉設定選單
     * @param {Element} qualityInput - 要選擇的畫質單選按鈕元素
     */
    function selectQualityAndClose(qualityInput) {
        qualityInput.checked = true;
        qualityInput.click();
        console.info(`🎯 已選擇畫質：${qualityInput.parentNode.querySelector('label').textContent}`);

        waitForElement(CONFIG.selectors.settingsButton, CONFIG.maxAttempts, button => {
            button.click();
            console.info('⚙️ 設定選單已關閉');
        });
    }

    /**
     * 初始化畫質選擇流程
     */
    function initializeQualitySelection() {
        if (!isChannelActive()) {
            console.warn('⚠️ 無法確定頻道的直播狀態，腳本已終止。');
            return;
        }

        console.info('✅ 頻道已經直播，正在選擇畫質...');

        // 開啟設定選單
        waitForElement(CONFIG.selectors.settingsButton, CONFIG.maxAttempts, button => {
            button.click();

            // 前往畫質子選單
            waitForElement(CONFIG.selectors.qualityMenuItem, CONFIG.maxAttempts, menuItem => {
                menuItem.click();

                // 選擇畫質
                waitForElement(CONFIG.selectors.qualityOptions, CONFIG.maxAttempts, () => {
                    const qualityInputs = document.querySelectorAll('input[type="radio"]');
                    const preferredIndex = CONFIG.qualities.indexOf(CONFIG.preferredQuality);
                    setVideoQuality(qualityInputs, preferredIndex);
                });
            });
        });
    }

    // 當頻道狀態元素可用時，初始化腳本
    waitForElement(CONFIG.selectors.channelStatus, CONFIG.maxAttempts, initializeQualitySelection);
})();
