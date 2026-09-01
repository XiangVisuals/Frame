<div align="center">
  
# 🖼️ XIANG FRAME 2.0

**高级画廊与胶片展示生成器**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)]()
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)]()

[English](#) | [简体中文](#)

</div>

## 📖 项目简介

**XIANG FRAME 2.0** 是一款纯前端的高级摄影作品排版与胶片展示生成工具。无需上传任何图片至服务器，所有图像渲染、EXIF 数据解析及色卡提取均在浏览器本地完成，极致保护用户隐私。

无论您是想要为摄影作品添加极简的画廊级留白，还是想要复刻经典的 35mm / 4x5 大画幅胶片边框，亦或是生成带有动态提取主色调的沉浸式海报，**XIANG FRAME 2.0** 都能一键为您实现。

<!-- 建议在这里放一张项目的预览图 -->
> 📸 **预览图**: *(将此处替换为您的实际项目截图，例如 `![UI Preview](./assets/preview.png)`)*

---

## ✨ 核心特性

*   🔒 **纯本地隐私计算**：基于 HTML5 `<canvas>` 渲染，无需后端，图片零上传。
*   📸 **智能 EXIF 提取**：自动读取相机的品牌、型号、镜头、焦距、光圈、快门、ISO、时间及 GPS 坐标（基于 `exifr`）。
*   🎨 **动态色卡引擎**：智能分析图片像素，提取主色调并生成对应的色卡（Color Palette）或沉浸式背景。
*   🖼️ **多维度艺术版式**：内置十余种专业排版风格，涵盖从极简画廊到复古胶片的多种需求。
*   🎛️ **丰富的细节调节**：
    *   自由调整画幅留白比例与阴影深度。
    *   Film Lab 滤镜：支持一键黑白（B&W）、色彩反转（Invert）以及添加逼真的胶片颗粒（Film Grain）。
    *   画廊墙面材质（背景色）切换。
*   📱 **完美适配移动端**：响应式布局，支持移动端手势拖拽排序（基于 `SortableJS`）与触觉反馈（Haptic Feedback）。
*   📦 **超清渲染与批量打包**：支持最高 4500px 级超清导出，并支持一键生成全套画册的 ZIP 压缩包（基于 `jszip`）。

---

## 🎨 内置版式 (Templates)

系统将版式分为三大美学系列：

### 1. 经典信息 (Raw Info)
*   **EXIF 原生**：经典的底部参数留白排版。
*   **色卡档案 (Color Archive)**：自动提取照片中的 4 种主色调并展示在底部。
*   **极简对角 (Diagonal Min)**：将文字信息分布在对角，现代且克制。

### 2. 前卫海报 (Avant-Garde)
*   **沉浸主色卡 (Immersive Solid Color)**：提取画面最高饱和度的色彩作为背景，打造强烈的视觉冲击。
*   **三联水印 (Triptych Poster)**：自动将单张图片智能裁剪/排版为三联画卷。

### 3. 胶片暗房 (Film Editions)
*   **35mm 单张**：带 DX 码和齿孔的标准 35mm 胶片边框。
*   **4x5 大画幅**：大画幅底片扫描边框。
*   **XPan 超宽全景**：致敬哈苏 XPan 的宽幅电影感排版。
*   **长卷相册 (Multi-image Contact Sheet)**：可自由拖拽多张图片，生成印样长条（Contact Sheet）。

### 4. 画廊展览 (Gallery Formats)
*   **极简细线留白 (Fine Art Line)**：极细边框加大量留白的艺术微喷风格。
*   **复古拍立得 (Polaroid)**：拍立得相纸质感加浮雕阴影。

---

## 🚀 快速开始

本项目为完全基于浏览器的静态单文件应用（Single File Application），无需任何构建工具或复杂的 Node.js 环境。

### 本地运行

1. 克隆本项目到本地：
   
```bash
   git clone [https://github.com/your-username/xiang-frame.git](https://github.com/your-username/xiang-frame.git)
