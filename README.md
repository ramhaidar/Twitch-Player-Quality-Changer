# Twitch Player Quality Changer (English & Traditional Chinese Versions)

This UserScript automatically changes the quality of the Twitch player to your preferred setting. Available in two language versions:
- English (`TwitchPlayerQualityChanger_en-us.user.js`)
- Traditional Chinese (`TwitchPlayerQualityChanger_zh-tw.user.js`)

Useful when you have a slow internet connection or want to conserve data.

## Installation

1. Install a UserScript manager like [TamperMonkey](https://www.tampermonkey.net/)
2. Install your preferred language version:
   - [English version](https://github.com/ramhaidar/Twitch-Player-Quality-Changer/raw/main/TwitchPlayerQualityChanger_en-us.user.js)
   - [Traditional Chinese version](https://github.com/ramhaidar/Twitch-Player-Quality-Changer/raw/main/TwitchPlayerQualityChanger_zh-tw.user.js)

## Usage

1. Set your preferred quality by changing `PreferedQuality` in the script (Default: 480p). Available options:
   - 1080p60
   - 936p60
   - 720p60
   - 720p
   - 480p
   - 360p
   - 160p
2. Open any Twitch stream or VOD
3. The script will automatically set the player to your preferred quality

* Automatically uses lowest available quality if preferred quality isn't selectable

## Credits

Traditional Chinese localization by [@asd8971](https://github.com/asd8971)

## License

MIT License - see [LICENSE file](https://github.com/ramhaidar/Twitch-Player-Quality-Changer/blob/main/LICENSE)
