# Twitch Player Quality Changer (English & Traditional Chinese Versions)

This UserScript automatically changes the quality of the Twitch player to your preferred setting. It features a settings modal, draggable floating button, and automatic dark/light theme detection. Available in two language versions:
- English (`TwitchPlayerQualityChanger_en-us.user.js`)
- Traditional Chinese (`TwitchPlayerQualityChanger_zh-tw.user.js`)

Useful when you have a slow internet connection or want to conserve data.

## Installation

1. Install a UserScript manager like [TamperMonkey](https://www.tampermonkey.net/)
2. Install your preferred language version:
   - [English version](https://github.com/ramhaidar/Twitch-Player-Quality-Changer/raw/main/TwitchPlayerQualityChanger_en-us.user.js)
   - [Traditional Chinese version](https://github.com/ramhaidar/Twitch-Player-Quality-Changer/raw/main/TwitchPlayerQualityChanger_zh-tw.user.js)

## Usage

1. Open any Twitch stream or VOD
2. Click the purple gear button (floating button) in the corner of the screen (default: bottom-left)
3. Select your preferred quality from the dropdown menu and click "Save"
4. The script will automatically set the player to your preferred quality
5. You can drag the floating button to any position you prefer - the position is saved automatically

### Available Quality Options:
- 1080p60
- 936p60
- 720p60
- 720p
- 480p
- 360p
- 160p

### Features:
- **Settings Modal**: Click the gear icon to open a settings window where you can select your preferred video quality
- **Draggable Button**: The settings button can be dragged to any position on the screen - your position preference is saved
- **Auto Theme Detection**: The settings modal automatically adapts to Twitch's dark/light theme
- **Persistent Settings**: Your quality preference and button position are saved via localStorage
- **Reset Option**: Click "Reset All" to restore default settings
- **Automatic Fallback**: Uses the lowest available quality if your preferred quality isn't selectable

## Changelog

### Version 0.1.0 (Latest)
- **Added**: Settings modal for easier quality selection
- **Added**: Draggable floating settings button with position persistence
- **Added**: Automatic dark/light theme detection for the modal
- **Added**: LocalStorage support for saving quality preference and button position
- **Added**: "Reset All" button to restore default settings
- **Improved**: Updated description for better clarity

### Previous Versions
- 0.0.9 - Traditional Chinese localization update
- 0.0.8 - Enhanced configuration options
- 0.0.7 - Various improvements
## Credits

Traditional Chinese localization by [@asd8971](https://github.com/asd8971)

## License

MIT License - see [LICENSE file](https://github.com/ramhaidar/Twitch-Player-Quality-Changer/blob/main/LICENSE)
