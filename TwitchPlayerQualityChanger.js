// ==UserScript==
// @name        Twitch Player Quality Changer
// @namespace   https://github.com/ramhaidar/Twitch-Player-Quality-Changer
// @version     0.0.1
// @description Automatically change the quality of the Twitch player to your liking.
// @author      ramhaidar
// @match       https://www.twitch.tv/, https://player.twitch.tv/*
// @grant       none
// @icon        https://www.google.com/s2/favicons?sz=64&domain=twitch.tv
// @license     MIT
// @run-at      document-end
// @homepageURL https://github.com/ramhaidar/Twitch-Player-Quality-Changer
// @updateURL   https://github.com/ramhaidar/Twitch-Player-Quality-Changer
// ==/UserScript==

(function () {
    "use strict";

    function waitForElement(selector, maxAttempts = Infinity, callback) {
        var attempts = 0;
        var intervalId = setInterval(function () {
            var element = document.querySelector(selector);
            if (element) {
                clearInterval(intervalId);
                callback(element);
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                    console.warn(
                        "Element " + selector + " found after " + maxAttempts + " attempts"
                    );
                }
            }
        }, 1000);
    }

    function waitForElementWithText(
        selector,
        textContent,
        maxAttempts = Infinity,
        callback
    ) {
        var attempts = 0;
        var intervalId = setInterval(function () {
            var element = document.querySelector(selector);
            if (element && element.textContent === textContent) {
                clearInterval(intervalId);
                callback(element);
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                    console.warn(
                        "Element " + selector + " found after " + maxAttempts + " attempts"
                    );
                }
            }
        }, 1000);
    }

    // Mencari dimensi layar
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    // Menemukan koordinat tengah layar
    var middleX = screenWidth / 2;
    var middleY = screenHeight / 2;

    // Membuat klik pada koordinat tengah
    var clickEvent = new MouseEvent("click", {
        clientX: middleX,
        clientY: middleY,
        button: 0,
        buttons: 1,
    });

    // mencari elemen-elemen yang ingin dicari
    const elem1 = document.querySelector('p[data-a-target="stream-info-title"]');
    const elem2 = document.querySelector(
        'p[data-a-target="player-overlay-message"]'
    );

    // melakukan aksi saat elemen ditemukan
    function onElementFound(elem) {
        console.warn("Salah satu elemen ditemukan:", elem);
        main();
        // lakukan aksi pada elemen yang ditemukan di sini
    }

    // menunggu hingga salah satu elemen ditemukan
    function waitUntilOneElementExists(elem1, elem2, callback) {
        elem1 = document.querySelector('p[data-a-target="stream-info-title"]');
        elem2 = document.querySelector('p[data-a-target="player-overlay-message"]');
        if (elem1 !== null) {
            callback(elem1);
        } else if (elem2 !== null) {
            callback(elem2);
        } else {
            setTimeout(function () {
                waitUntilOneElementExists(elem1, elem2, callback);
            }, 100);
        }
    }

    waitUntilOneElementExists(elem1, elem2, onElementFound);

    //window.addEventListener('load', function() {
    //waitForElement('p.CoreText-sc-1txzju1-0.ecTWUv', Infinity, function(element) {
    function main() {
        //waitForElementWithText('p.CoreText-sc-1txzju1-0.ecTWUv', "LIVE", 10, function(element) {

        var LIVE = false;
        var Offline = false;
        if (
            document.querySelector('p[data-a-target="stream-info-title"]') &&
            document.querySelector('p[data-a-target="stream-info-title"]')
                .textContent === "LIVE"
        ) {
            LIVE = true;
        }
        if (
            document.querySelector('p[data-a-target="player-overlay-message"]') &&
            document.querySelector('p[data-a-target="player-overlay-message"]')
                .textContent === "Offline"
        ) {
            Offline = true;
        }

        if (LIVE && !Offline) {
            // Element exists and text content is "OFFLINE"
            console.warn("Channel is LIVE.");

            var AutoQuality = "480p";

            var settingsButton = null;
            var settingsMenuButton = null;
            var qualityOptions = null;

            waitForElement(
                '[data-a-target="player-settings-button"]',
                Infinity,
                function (element) {
                    settingsButton = element;
                    settingsButton.click();
                }
            );

            waitForElement(
                '[data-a-target="player-settings-menu-item-quality"]',
                Infinity,
                function (element) {
                    settingsMenuButton = element;
                    settingsMenuButton.click();
                }
            );

            waitForElement(
                '[data-a-target="tw-radio"]',
                Infinity,
                function (element) {
                    const inputs = document.querySelectorAll('input[type="radio"]');
                    for (let i = 0; i < inputs.length; i++) {
                        const label = inputs[i].parentNode.querySelector("label");
                        if (label && label.textContent.trim() === AutoQuality) {
                            inputs[i].checked = true;
                            inputs[i].click();

                            waitForElement(
                                '[data-a-target="player-settings-button"]',
                                Infinity,
                                function (element) {
                                    var settingsButton = element;
                                    settingsButton.click();
                                }
                            );

                            break;
                        }
                    }
                }
            );

            document.elementFromPoint(middleX, middleY).dispatchEvent(clickEvent);
        } else {
            console.warn("Channel is Offline.");
        }
    }
})();
