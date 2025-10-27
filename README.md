# Nano Assistant - AI-Powered Chrome Extension

A powerful Chrome extension that brings AI assistance directly to your browsing experience. Get instant explanations and rephrase text using Google's Gemini Nano AI model.

## 🚀 Features

### 📝 Explain with AI

- **Context-aware explanations**: Right-click on any selected text to get detailed AI explanations
- **No selection mode**: Use the extension on any page to ask questions and get explanations
- **Interactive modal**: Clean, user-friendly interface for viewing explanations and asking follow-up questions

### ✨ Rephrase with AI

- **Instant text rephrasing**: Select any text and get AI-powered rephrasing suggestions
- **Smart text replacement**: Automatically replaces selected text with rephrased version
- **Multi-element support**: Works with input fields, textareas, and contenteditable elements
- **Duplicate prevention**: Advanced logic prevents duplicate AI calls and ensures clean output

## 🛠️ Technical Highlights

- **Chrome's Built-in AI**: Utilizes Chrome's experimental Gemini Nano API for on-device AI processing
- **No external API calls**: All AI processing happens locally for privacy and speed
- **Advanced text handling**: Sophisticated selection detection and text replacement logic
- **Error handling**: Robust error handling with user-friendly notifications
- **Clean architecture**: Well-organized code with separation of concerns

## 📋 Prerequisites

To test this extension, you need:

**Enable AI features** in Chrome:

- Go to `chrome://flags/`
- Enable "Prompt API for Gemini Nano"
- Enable "Enables optimization guide on device"
- Restart Chrome Canary

## 🔧 Installation Instructions

1. **Download the extension**:

   ```bash
   git clone https://github.com/andreipintilie/nano-assistant.git
   cd nano-assistant
   ```

2. **Load the extension in Chrome**:

   - Open Chrome Canary
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `nano-assistant` folder

3. **Verify installation**:
   - The Nano Assistant icon should appear in your extensions toolbar
   - Right-click on any webpage to see the context menu options

## 📁 Project Structure

```
nano-assistant/
├── manifest.json          # Extension manifest
├── background.js          # Background script for context menus
├── content.js            # Content script for AI functionality
├── utils.js              # Utility functions
├── assets/               # Extension icons and styles
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── overlay.css
├── README.md             # This file
└── LICENSE               # MIT License
```

## 🔒 Privacy & Security

- **Local processing**: All AI operations happen on-device using Chrome's built-in AI
- **No data collection**: The extension doesn't collect or transmit user data
- **No external dependencies**: No third-party APIs or services required
- **Secure by design**: Follows Chrome extension security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
