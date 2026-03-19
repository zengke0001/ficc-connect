---
name: wechat-mini-app
description: Develop WeChat Mini Programs (微信小程序) with WXML, WXSS, JavaScript and WeChat APIs. Use when building mini-apps, WeChat applications, WXML/WXSS files, or when the user mentions WeChat development, 小程序, or mini-program.
---

# WeChat Mini-App Development

## Project Structure

Standard WeChat mini-app project layout:

```
project/
├── app.js              # App lifecycle and global data
├── app.json            # Global configuration (pages, window, tabBar)
├── app.wxss            # Global styles
├── pages/
│   └── index/
│       ├── index.js    # Page logic
│       ├── index.json  # Page configuration
│       ├── index.wxml  # Page template (WeChat Markup)
│       └── index.wxss  # Page styles (WeChat Style Sheets)
├── components/         # Reusable components
├── utils/              # Utility functions
├── images/             # Static assets
└── services/           # API services
```

## File Types

| Extension | Purpose | Notes |
|-----------|---------|-------|
| `.js` | JavaScript logic | Page/component logic, event handlers |
| `.wxml` | Template markup | Similar to HTML, WeChat-specific tags |
| `.wxss` | Styles | Similar to CSS, rpx unit for responsive design |
| `.json` | Configuration | Page/app-level config |

## Core Concepts

### App Lifecycle (app.js)

```javascript
App({
  onLaunch(options) {
    // App initialization, triggered once
  },
  onShow(options) {
    // App shown to foreground
  },
  onHide() {
    // App hidden to background
  },
  globalData: {
    userInfo: null
  }
})
```

### Page Lifecycle (page.js)

```javascript
Page({
  data: {
    message: 'Hello'
  },

  onLoad(options) {
    // Page loading, receive navigation params
  },
  onShow() {
    // Page displayed
  },
  onReady() {
    // Page rendering complete
  },
  onHide() {
    // Page hidden
  },
  onUnload() {
    // Page closed
  },

  // Event handlers
  handleTap() {
    this.setData({ message: 'Clicked!' })
  }
})
```

### WXML Template Syntax

```xml
<!-- Data binding -->
<view>{{message}}</view>

<!-- Conditionals -->
<view wx:if="{{condition}}">Show if true</view>
<view wx:elif="{{otherCondition}}">Else if</view>
<view wx:else>Else</view>

<!-- Lists -->
<view wx:for="{{items}}" wx:key="id">
  {{item.name}} - {{index}}
</view>

<!-- Events -->
<button bindtap="handleTap">Click me</button>
<input bindinput="handleInput" value="{{inputValue}}" />

<!-- Template import -->
<import src="../templates/header.wxml" />
<template is="header" data="{{title: 'Page Title'}}" />
```

### WXSS Styling

```css
/* rpx: responsive pixel, 750rpx = full screen width */
.container {
  width: 750rpx;
  padding: 20rpx;
  box-sizing: border-box;
}

/* Import external styles */
@import "common.wxss";

/* Flexbox layout */
.flex-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
```

## Common APIs

### Network Request

```javascript
wx.request({
  url: 'https://api.example.com/data',
  method: 'GET',
  data: { key: 'value' },
  success: (res) => {
    console.log(res.data)
  },
  fail: (err) => {
    console.error(err)
  }
})
```

### Storage

```javascript
// Synchronous
wx.setStorageSync('key', 'value')
const value = wx.getStorageSync('key')

// Asynchronous
wx.setStorage({
  key: 'key',
  data: 'value',
  success: () => {}
})
```

### Navigation

```javascript
// Navigate to page
wx.navigateTo({ url: '/pages/detail/detail?id=123' })

// Redirect (replace current page)
wx.redirectTo({ url: '/pages/login/login' })

// Navigate back
wx.navigateBack({ delta: 1 })

// Switch tab (for tabBar pages)
wx.switchTab({ url: '/pages/home/home' })
```

### User Info

```javascript
// Get user profile (requires user authorization)
wx.getUserProfile({
  desc: '用于完善会员资料',
  success: (res) => {
    console.log(res.userInfo)
  }
})

// Login
wx.login({
  success: (res) => {
    // Send res.code to backend
    console.log(res.code)
  }
})
```

## Configuration Files

### app.json

```json
{
  "pages": [
    "pages/index/index",
    "pages/logs/logs"
  ],
  "window": {
    "navigationBarTitleText": "Demo",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f8f8f8"
  },
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "Home" },
      { "pagePath": "pages/logs/logs", "text": "Logs" }
    ]
  },
  "usingComponents": {
    "custom-component": "components/custom/custom"
  }
}
```

### page.json

```json
{
  "navigationBarTitleText": "Page Title",
  "usingComponents": {
    "component-name": "path/to/component"
  }
}
```

## Best Practices

1. **Use rpx for responsive design** - 750rpx equals full screen width
2. **Always provide wx:key in lists** - Improves rendering performance
3. **Minimize setData calls** - Batch data updates when possible
4. **Use Component for reusability** - Extract common UI patterns
5. **Handle API failures gracefully** - Always implement fail callbacks
6. **Respect user privacy** - Request minimal permissions needed

## Common Components

| Component | Usage | Key Attributes |
|-----------|-------|----------------|
| `<view>` | Container | class, id, bindtap |
| `<text>` | Text content | selectable, space |
| `<image>` | Images | src, mode, lazy-load |
| `<button>` | Buttons | type, size, bindtap |
| `<input>` | Text input | type, placeholder, bindinput |
| `<scroll-view>` | Scrollable area | scroll-y, scroll-x |
| `<swiper>` | Carousel | indicator-dots, autoplay |
| `<navigator>` | Page links | url, open-type |

## Debugging

- Use WeChat Developer Tools for debugging
- Enable "Debug Mode" in developer console
- Use `console.log()` for logging
- Check Network tab for API requests
- Use Storage tab to inspect local storage
