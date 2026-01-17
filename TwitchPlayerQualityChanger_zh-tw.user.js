// ==UserScript==
// @name            Twitch Player Quality Changer
// @description     自動選擇偏好畫質，若無法使用則自動切換至其他可用選項。
// @downloadURL     https://github.com/ramhaidar/Twitch-Player-Quality-Changer/raw/main/TwitchPlayerQualityChanger_zh-tw.user.js
// @namespace       https://github.com/ramhaidar/Twitch-Player-Quality-Changer
// @version         0.1.0
// @author          ramhaidar (https://github.com/ramhaidar)
// @homepageURL     https://github.com/ramhaidar/Twitch-Player-Quality-Changer
// @icon            https://www.google.com/s2/favicons?sz=64&domain=twitch.tv
// @license         MIT
// @match           https://twitch.tv/*
// @match           https://www.twitch.tv/*
// @match           https://player.twitch.tv/*
// @match           https://m.twitch.tv/*
// @grant           GM_addStyle
// @grant           GM_getResourceText
// @run-at          document-end
// @updateURL       https://github.com/ramhaidar/Twitch-Player-Quality-Changer/raw/main/TwitchPlayerQualityChanger_zh-tw.user.js
// ==/UserScript==

(function () {
    'use strict';

    // --- 配置設定 ---
    const CONFIG = {
        // 可選畫質：1080p60、936p60、720p60、720p、480p、360p、160p
        preferredQuality: localStorage.getItem('twitchQualityChanger_quality') || '480p',
        qualities: ['1080p60', '936p60', '720p60', '720p', '480p', '360p', '160p'],

        // 儲存鍵值
        storageKeys: {
            quality: 'twitchQualityChanger_quality',
            buttonTop: 'twitchQualityChanger_buttonTop',
            buttonLeft: 'twitchQualityChanger_buttonLeft'
        },

        // 預設位置（左下角）
        defaultPosition: {
            top: 'auto',
            bottom: '20px',
            left: '20px',
            right: 'auto'
        },

        // 按鈕顏色
        buttonColor: '#9146FF', // Twitch 紫色

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
     * 等待元素出現於 DOM 中
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
                console.warn(`[TPQC] ❌ 嘗試 ${maxAttempts} 次後仍未找到元素「${selector}」`);
            }
        }, CONFIG.pollInterval);
    }

    /**
     * 檢查頻道是否正在直播或處於活躍狀態
     * @returns {boolean}
     */
    function isChannelActive() {
        const statusElement = document.querySelector(CONFIG.selectors.channelStatus);
        if (!statusElement) return false;
        const status = statusElement.textContent.trim();
        // 支援中文及英文狀態文字，避免因語言設定導致腳本失效
        return status === '直播中' || status === '離線' || status === 'LIVE' || status === 'OFFLINE';
    }

    /**
     * 取得已儲存的畫質偏好
     * @returns {string}
     */
    function getSavedQuality() {
        return localStorage.getItem(CONFIG.storageKeys.quality) || '480p';
    }

    /**
     * 儲存畫質偏好設定
     * @param {string} quality - 要儲存的畫質
     */
    function saveQuality(quality) {
        CONFIG.preferredQuality = quality;
        localStorage.setItem(CONFIG.storageKeys.quality, quality);
        console.info(`[TPQC] 💾 已儲存畫質偏好設定：${quality}`);
    }

    /**
     * 將所有設定重設為預設值
     */
    function resetAllSettings() {
        // 重設畫質
        saveQuality('480p');

        // 重設按鈕位置
        localStorage.removeItem(CONFIG.storageKeys.buttonTop);
        localStorage.removeItem(CONFIG.storageKeys.buttonLeft);

        // 更新按鈕位置
        const button = document.getElementById('twitchQualityChangerButton');
        if (button) {
            Object.assign(button.style, CONFIG.defaultPosition);
        }

        console.info('[TPQC] 🔄 已將所有設定重設為預設值');

        // 套用預設畫質
        applyQuality();
    }

    /**
     * 將已儲存的畫質套用至影片播放器
     */
    function applyQuality() {
        const preferredQuality = getSavedQuality();

        if (!isChannelActive()) {
            console.warn('[TPQC] ⚠️ 無法判斷頻道的直播狀態');
            return;
        }

        console.info('[TPQC] ✅ 頻道正在直播，繼續進行畫質選擇');
        console.info(`[TPQC] 🎯 使用已儲存的畫質偏好：${preferredQuality}`);

        // 開啟設定選單
        waitForElement(CONFIG.selectors.settingsButton, CONFIG.maxAttempts, button => {
            button.click();

            // 進入畫質子選單
            waitForElement(CONFIG.selectors.qualityMenuItem, CONFIG.maxAttempts, menuItem => {
                menuItem.click();

                // 選擇畫質
                waitForElement(CONFIG.selectors.qualityOptions, CONFIG.maxAttempts, () => {
                    const qualityInputs = document.querySelectorAll('input[type="radio"]');
                    const preferredIndex = CONFIG.qualities.indexOf(preferredQuality);
                    setVideoQuality(qualityInputs, preferredIndex);
                });
            });
        });
    }

    /**
     * 將影片畫質設定為偏好選項
     * @param {NodeList} qualityInputs - 可用畫質選項清單
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
            // 若偏好畫質無法使用，則切換至可用的最低畫質
            selectQualityAndClose(availableQualities[availableQualities.length - 1]);
        }
    }

    /**
     * 選擇畫質選項並關閉設定選單
     * @param {Element} qualityInput - 要選擇的畫質單選按鈕元素
     */
    function selectQualityAndClose(qualityInput) {
        qualityInput.checked = true;
        qualityInput.click();
        console.info(`[TPQC] 🎯 已選擇畫質：${qualityInput.parentNode.querySelector('label').textContent}`);

        waitForElement(CONFIG.selectors.settingsButton, CONFIG.maxAttempts, button => {
            button.click();
            console.info('[TPQC] ⚙️ 已關閉設定選單');
        });
    }

    /**
     * 隱藏彈出視窗
     * @param {HTMLElement} modal - 要隱藏的彈出視窗元素
     */
    function hideModal(modal) {
        modal.style.display = 'none';
    }

    /**
     * 顯示彈出視窗
     * @param {HTMLElement} modal - 要顯示的彈出視窗元素
     */
    function showModal(modal) {
        modal.style.display = 'flex';
    }

    /**
     * 透過檢查 CSS 背景顏色變數來判斷 Twitch 是否為深色模式
     * @returns {boolean}
     */
    function isDarkModeByColor() {
        const styles = getComputedStyle(document.body);
        const bgColor = styles.getPropertyValue('--color-background-body').trim();
        // 深色模式使用 #0e0e10
        return bgColor === '#0e0e10';
    }

    /**
     * 根據 Twitch 的深色模式設定更新彈出視窗主題
     * @param {HTMLElement} modal - 彈出視窗元素
     */
    function updateModalTheme(modal) {
        if (!modal) return;
        // 根據 CSS 變數偵測主題（最可靠的方法）
        const isDarkMode = isDarkModeByColor();

        // 取得所有彈出視窗元素
        const content = modal.querySelector('.native-modal-content');
        const header = modal.querySelector('.native-modal-header');
        const modalBody = modal.querySelector('.native-modal-body');
        const footer = modal.querySelector('.native-modal-footer');
        const labels = modal.querySelectorAll('.native-form-label');
        const selects = modal.querySelectorAll('.native-form-select');
        const closeBtn = modal.querySelector('.native-modal-close');
        const secondaryBtn = modal.querySelector('.native-btn-secondary');

        // 從所有元素移除現有的主題類別
        const elements = [modal, content, header, modalBody, footer, closeBtn, secondaryBtn];
        elements.forEach(el => {
            if (el) el.classList.remove('dark-theme');
        });
        labels.forEach(l => l.classList.remove('dark-theme'));
        selects.forEach(s => s.classList.remove('dark-theme'));

        // 如需要則套用深色主題類別
        if (isDarkMode) {
            modal.classList.add('dark-theme');
            if (content) content.classList.add('dark-theme');
            if (header) header.classList.add('dark-theme');
            if (modalBody) modalBody.classList.add('dark-theme');
            if (footer) footer.classList.add('dark-theme');
            labels.forEach(l => l.classList.add('dark-theme'));
            selects.forEach(s => s.classList.add('dark-theme'));
            if (closeBtn) closeBtn.classList.add('dark-theme');
            if (secondaryBtn) secondaryBtn.classList.add('dark-theme');
        }
    }

    /**
     * 設定 MutationObserver 以偵測主題變化
     */
    function setupThemeObserver() {
        // 僅觀察 body 的類別變化（效能較佳）
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const modal = document.getElementById('twitchQualityChangerModal');
                    if (modal) {
                        updateModalTheme(modal);
                    }
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    /**
     * 確保在顯示彈出視窗時主題觀察器已啟動
     */
    function ensureThemeObserver() {
        // 主題觀察器已全域設定，僅需更新主題
        const modal = document.getElementById('twitchQualityChangerModal');
        if (modal) {
            updateModalTheme(modal);
        }
    }

    /**
     * 建立並顯示畫質設定彈出視窗
     */
    function showQualityModal() {
        let modal = document.getElementById('twitchQualityChangerModal');
        if (!modal) {
            // 使用原生樣式建立彈出視窗 HTML
            const modalHtml = `
                <div id="twitchQualityChangerModal" class="native-modal-overlay">
                    <div class="native-modal-dialog">
                        <div class="native-modal-content">
                            <div class="native-modal-header">
                                <h5 class="native-modal-title" id="twitchQualityChangerModalLabel">畫質設定</h5>
                                <button type="button" class="native-modal-close" aria-label="關閉">&times;</button>
                            </div>
                            <div class="native-modal-body">
                                <label for="qualitySelect" class="native-form-label">偏好畫質</label>
                                <select class="native-form-select" id="qualitySelect">
                                    ${CONFIG.qualities.map(q =>
                `<option value="${q}" ${q === getSavedQuality() ? 'selected' : ''}>${q}</option>`
            ).join('')}
                                </select>
                            </div>
                            <div class="native-modal-footer">
                                <button type="button" class="native-btn native-btn-secondary" id="resetAllBtn">全部重設</button>
                                <button type="button" class="native-btn native-btn-primary" id="saveQualityBtn" style="background-color: ${CONFIG.buttonColor}; border-color: ${CONFIG.buttonColor};">儲存</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            modal = document.getElementById('twitchQualityChangerModal');

            // 設定事件監聽器
            const saveBtn = document.getElementById('saveQualityBtn');
            const resetBtn = document.getElementById('resetAllBtn');
            const closeBtn = modal.querySelector('.native-modal-close');

            saveBtn.addEventListener('click', () => {
                const selectedQuality = document.getElementById('qualitySelect').value;
                saveQuality(selectedQuality);
                applyQuality();
                hideModal(modal);
            });

            resetBtn.addEventListener('click', () => {
                resetAllSettings();
                hideModal(modal);
            });

            closeBtn.addEventListener('click', () => {
                hideModal(modal);
            });

            // 點擊外部區域關閉彈出視窗
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    hideModal(modal);
                }
            });

            // 確保主題觀察器已啟動
            ensureThemeObserver();
        }

        // 顯示彈出視窗時一律更新主題（無論是新建或既有的）
        console.info('[TPQC] 🎨 根據目前 Twitch 主題更新彈出視窗外觀');
        updateModalTheme(modal);
        showModal(modal);
    }

    /**
     * 建立可拖曳的浮動按鈕
     */
    function createFloatingButton() {
        const button = document.createElement('button');
        button.id = 'twitchQualityChangerButton';
        button.className = 'twitch-quality-changer-btn';
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/></svg>';

        // 套用已儲存的位置或預設值
        const savedTop = localStorage.getItem(CONFIG.storageKeys.buttonTop);
        const savedLeft = localStorage.getItem(CONFIG.storageKeys.buttonLeft);

        if (savedTop !== null && savedLeft !== null) {
            button.style.top = savedTop + 'px';
            button.style.left = savedLeft + 'px';
            button.style.bottom = 'auto';
            button.style.right = 'auto';
        } else {
            Object.assign(button.style, CONFIG.defaultPosition);
        }

        // 按鈕樣式
        button.style.cssText += `
            position: fixed;
            z-index: 9999;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: none;
            background-color: ${CONFIG.buttonColor};
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: transform 0.1s, box-shadow 0.2s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        });

        // 拖曳功能
        setupDrag(button);

        document.body.appendChild(button);
        return button;
    }

    /**
     * 設定浮動按鈕的拖曳功能
     * @param {HTMLElement} button - 按鈕元素
     */
    function setupDrag(button) {
        let isDragging = false;
        let dragged = false;
        let startX, startY, initialLeft, initialTop;

        button.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragged = false;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = button.offsetLeft;
            initialTop = button.offsetTop;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            if (!dragged) {
                if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) {
                    dragged = true;
                    button.style.cursor = 'grabbing';
                    button.style.zIndex = '10000';
                }
            }

            if (dragged) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                const newLeft = initialLeft + deltaX;
                const newTop = initialTop + deltaY;

                // 邊界檢查
                const maxLeft = window.innerWidth - button.offsetWidth;
                const maxTop = window.innerHeight - button.offsetHeight;

                const clampedLeft = Math.max(0, Math.min(newLeft, maxLeft));
                const clampedTop = Math.max(0, Math.min(newTop, maxTop));

                button.style.left = clampedLeft + 'px';
                button.style.top = clampedTop + 'px';
                button.style.bottom = 'auto';
                button.style.right = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                if (dragged) {
                    button.style.cursor = 'pointer';
                    button.style.zIndex = '9999';
                    // 將位置儲存至 localStorage
                    localStorage.setItem(CONFIG.storageKeys.buttonTop, button.offsetTop);
                    localStorage.setItem(CONFIG.storageKeys.buttonLeft, button.offsetLeft);
                } else {
                    // 這是點擊操作，開啟彈出視窗
                    showQualityModal();
                }
            }
            isDragging = false;
            dragged = false;
        });
    }

    /**
     * 初始化畫質選擇流程
     */
    function initializeQualitySelection() {
        if (!isChannelActive()) {
            console.warn('[TPQC] ⚠️ 無法判斷頻道的直播狀態');
            return;
        }

        console.info('[TPQC] ✅ 頻道正在直播，繼續進行畫質選擇');

        // 使用已儲存的畫質偏好
        const preferredQuality = getSavedQuality();
        console.info(`[TPQC] 🎯 使用已儲存的畫質偏好：${preferredQuality}`);

        // 開啟設定選單
        waitForElement(CONFIG.selectors.settingsButton, CONFIG.maxAttempts, button => {
            button.click();

            // 進入畫質子選單
            waitForElement(CONFIG.selectors.qualityMenuItem, CONFIG.maxAttempts, menuItem => {
                menuItem.click();

                // 選擇畫質
                waitForElement(CONFIG.selectors.qualityOptions, CONFIG.maxAttempts, () => {
                    const qualityInputs = document.querySelectorAll('input[type="radio"]');
                    const preferredIndex = CONFIG.qualities.indexOf(preferredQuality);
                    setVideoQuality(qualityInputs, preferredIndex);
                });
            });
        });
    }

    /**
     * 主要初始化函式
     */
    function initialize() {
        // 建立浮動按鈕
        createFloatingButton();

        // 當頻道狀態可用時初始化畫質選擇
        waitForElement(CONFIG.selectors.channelStatus, CONFIG.maxAttempts, initializeQualitySelection);

        // 設定主題觀察器以偵測動態主題變化
        setupThemeObserver();

        console.info('[TPQC] 🚀 Twitch Player Quality Changer 已初始化完成');
        console.info(`[TPQC] 📍 按鈕位置：${localStorage.getItem(CONFIG.storageKeys.buttonLeft)}, ${localStorage.getItem(CONFIG.storageKeys.buttonTop)}`);
        console.info(`[TPQC] 🎯 已儲存的畫質：${getSavedQuality()}`);
    }

    // 新增原生 CSS 樣式
    const nativeModalCSS = `
        .native-modal-overlay {
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1050;
            animation: fadeIn 0.15s ease-in-out;
            align-items: center;
            justify-content: center;
        }

        .native-modal-dialog {
            position: relative;
            width: 90%;
            max-width: 400px;
            animation: slideIn 0.2s ease-out;
        }

        .native-modal-content {
            background-color: #ffffff;
            color: #333333;
            border: 1px solid #ddd;
            border-radius: 8px;
            position: relative;
            display: flex;
            flex-direction: column;
            pointer-events: auto;
            outline: 0;
        }

        .native-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            border-bottom: 1px solid #ddd;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }

        .native-modal-close {
            background: none;
            border: none;
            color: #333333;
            font-size: 24px;
            font-weight: bold;
            line-height: 1;
            cursor: pointer;
            padding: 0;
            margin: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        }

        .native-modal-close:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }

        .native-modal-body {
            padding: 15px;
            flex: 1;
        }

        .native-form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #333333;
        }

        .native-form-select {
            width: 100%;
            padding: 8px 12px;
            font-size: 14px;
            line-height: 1.5;
            color: #333;
            background-color: #fff;
            background-clip: padding-box;
            border: 1px solid #ccc;
            border-radius: 4px;
        }

        .native-form-select:focus {
            outline: 0;
            box-shadow: 0 0 0 0.2rem rgba(145, 70, 255, 0.25);
            border-color: #9146FF;
        }

        .native-modal-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding: 15px;
            border-top: 1px solid #ddd;
            gap: 10px;
        }

        .native-btn {
            display: inline-block;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.5;
            text-align: center;
            text-decoration: none;
            vertical-align: middle;
            cursor: pointer;
            user-select: none;
            border-radius: 4px;
            border: 1px solid transparent;
        }

        .native-btn:focus {
            outline: 0;
            box-shadow: 0 0 0 0.2rem rgba(145, 70, 255, 0.25);
        }

        .native-btn-primary {
            color: #fff;
            background-color: #9146FF;
            border-color: #9146FF;
            transition: all 0.2s ease;
        }

        .native-btn-primary:hover {
            background-color: #7d3fe1;
            border-color: #7d3fe1;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(145, 70, 255, 0.3);
        }

        .native-btn-primary:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(145, 70, 255, 0.3);
        }

        .native-btn-secondary {
            color: #333;
            background-color: #ffffff;
            border-color: #cccccc;
            transition: all 0.2s ease;
        }

        .native-btn-secondary:hover {
            background-color: #f8f9fa;
            border-color: #adb5bd;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .native-btn-secondary:active {
            transform: translateY(0);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideIn {
            from {
                transform: translateY(-50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        /* 深色主題樣式 */
        .native-modal-overlay.dark-theme {
            background-color: rgba(0, 0, 0, 0.7);
        }

        .native-modal-content.dark-theme {
            background-color: #2d2d2d;
            color: #e0e0e0;
            border-color: #404040;
        }

        .native-modal-header.dark-theme {
            border-bottom-color: #404040;
        }

        .native-modal-close.dark-theme {
            color: #e0e0e0;
        }

        .native-form-select.dark-theme {
            background-color: #3a3a3a;
            color: #e0e0e0;
            border-color: #555;
        }

        .native-modal-footer.dark-theme {
            border-top-color: #404040;
        }

        .native-btn-secondary.dark-theme {
            color: #e0e0e0;
            background-color: #404040;
            border-color: #555555;
            transition: all 0.2s ease;
        }

        .native-btn-secondary.dark-theme:hover {
            background-color: #4a4a4a;
            border-color: #666666;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .native-btn-secondary.dark-theme:active {
            transform: translateY(0);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .native-btn-primary.dark-theme {
            color: #fff;
            background-color: #9146FF;
            border-color: #9146FF;
            transition: all 0.2s ease;
        }

        .native-btn-primary.dark-theme:hover {
            background-color: #7d3fe1;
            border-color: #7d3fe1;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(145, 70, 255, 0.4);
        }

        .native-btn-primary.dark-theme:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(145, 70, 255, 0.4);
        }

        .native-form-label.dark-theme {
            color: #e0e0e0;
        }
    `;

    GM_addStyle(nativeModalCSS);

    // 啟動腳本
    initialize();
})();