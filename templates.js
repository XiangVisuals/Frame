/**
 * XIANG FRAME 4.0 GLASS EDITION - Curatorial Template Engine (21 Editions)
 * 独立完整版：直接全选保存为 templates.js
 */
window.XiangTemplates = {
    async renderScene(app, ctx, imgData, targetWidth, targetHeight) {
        const { style, wallColor, matMultiplier, shadowMultiplier, invertAmount, grainAmount, bwAmount, vectorCols } = app.state.settings;
        const { width: imgW, height: imgH, textLeft, textRight, exifTime, exifCamera, exifLens, exifParams, filmName } = imgData;

        const shortEdge = Math.min(imgW, imgH);
        let wallPaddingX = imgW * 0.25;
        let wallPaddingY = imgH * 0.25;
        let sceneW, sceneH;
        let drawLogic = () => {};
        app.hitboxes = [];
        let dragDrawOperation = null;

        const drawBackground = (sc) => {
            ctx.fillStyle = wallColor;
            ctx.fillRect(0, 0, sceneW * sc, sceneH * sc);
        };

        const setTrack = (px) => {
            try { ctx.letterSpacing = `${px}px`; } catch (e) {}
        };

        // 1. 高定色卡档案 (REFINED EXIF PALETTE)
        if (style === 'exif_palette') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.085 * matMultiplier;
            const padTop = shortEdge * 0.11 * matMultiplier;
            const padBot = shortEdge * 0.28 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = padTop + imgH + padBot;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;
                const sTop = padTop * scale, sBot = padBot * scale;

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sW, sH);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                ctx.strokeStyle = 'rgba(10, 10, 10, 0.12)';
                ctx.lineWidth = Math.max(1, shortEdge * 0.0012 * scale);
                ctx.strokeRect(iX, iY, iW, iH);

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.0145 * scale;
                    const topBarY = iY - sTop * 0.38;

                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#71717a';
                    ctx.font = `500 ${fBase * 0.78}px "JetBrains Mono", monospace`;
                    setTrack(fBase * 0.16);
                    ctx.fillText(`CHROMATIC ARCHIVE // ${(exifTime || '2026').toUpperCase()}`, iX, topBarY);

                    ctx.textAlign = 'right';
                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `600 ${fBase * 0.78}px "JetBrains Mono", monospace`;
                    ctx.fillText((textRight || '© XIANGVISUALS').toUpperCase(), iX + iW, topBarY);
                    setTrack(0);

                    ctx.strokeStyle = '#e4e4e7';
                    ctx.lineWidth = Math.max(1, scale * 0.8);
                    ctx.beginPath();
                    ctx.moveTo(iX, iY - sTop * 0.18);
                    ctx.lineTo(iX + iW, iY - sTop * 0.18);
                    ctx.stroke();

                    const botStartY = iY + iH + sBot * 0.24;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `600 ${fBase * 1.55}px "Cormorant Garamond", "Noto Serif SC", serif`;
                    ctx.fillText(textLeft || 'UNTITLED ARTWORK', iX, botStartY);

                    ctx.font = `600 ${fBase * 0.85}px "JetBrains Mono", monospace`;
                    ctx.fillText(`${(exifCamera || 'DIGITAL CAMERA').toUpperCase()}  —  ${(exifLens || 'STANDARD LENS').toUpperCase()}`, iX, botStartY + fBase * 2.15);

                    ctx.fillStyle = '#71717a';
                    ctx.font = `400 ${fBase * 0.8}px "JetBrains Mono", monospace`;
                    ctx.fillText(`${exifParams || '24mm   f/2.8   1/125s   ISO 400'}   ·   ${imgData.location || ''}`, iX, botStartY + fBase * 3.5);

                    if (imgData.palette && imgData.palette.length > 0) {
                        const swatchCount = imgData.palette.length;
                        const swGap = fBase * 0.65, swW = fBase * 3.6, swH = fBase * 2.15;
                        const startX = iX + iW - (swatchCount * swW + (swatchCount - 1) * swGap);

                        imgData.palette.forEach((c, idx) => {
                            const sx = startX + idx * (swW + swGap);
                            const sy = botStartY + fBase * 0.25;
                            ctx.fillStyle = c.rgbStr || c.hex;
                            ctx.fillRect(sx, sy, swW, swH);
                            ctx.strokeStyle = 'rgba(10,10,10,0.1)';
                            ctx.lineWidth = Math.max(0.75, scale * 0.6);
                            ctx.strokeRect(sx, sy, swW, swH);

                            ctx.textAlign = 'center';
                            ctx.fillStyle = '#52525b';
                            ctx.font = `500 ${fBase * 0.64}px "JetBrains Mono", monospace`;
                            ctx.fillText((c.hex || '#000000').toUpperCase(), sx + swW / 2, sy + swH + fBase * 0.48);
                        });
                    }
                }
            };

        // 2. 黄金极简对角 (REFINED EXIF MINIMAL)
        } else if (style === 'exif_minimal') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.095 * matMultiplier;
            const padY = shortEdge * 0.145 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padY * 2;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const iX = padX * scale, iY = padY * scale, iW = imgW * scale, iH = imgH * scale;
                const sPadY = padY * scale;

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sW, sH);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.0145 * scale;
                    const topY = iY - sPadY * 0.56;

                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fillRect(iX, topY + fBase * 0.15, Math.max(2, fBase * 0.14), fBase * 2.25);

                    const textOffsetX = iX + fBase * 0.85;
                    ctx.font = `italic 600 ${fBase * 1.35}px "Cormorant Garamond", "Noto Serif SC", serif`;
                    ctx.fillText(textLeft || 'UNTITLED ARTWORK', textOffsetX, topY - fBase * 0.1);

                    ctx.fillStyle = '#71717a';
                    ctx.font = `500 ${fBase * 0.72}px "JetBrains Mono", monospace`;
                    setTrack(fBase * 0.12);
                    ctx.fillText(`${(exifTime || '2026').toUpperCase()}   //   ${(textRight || '© XIANGVISUALS').toUpperCase()}`, textOffsetX, topY + fBase * 1.55);
                    setTrack(0);

                    const botY = iY + iH + sPadY * 0.25;
                    ctx.textAlign = 'right';
                    ctx.strokeStyle = '#d4d4d8';
                    ctx.lineWidth = Math.max(1, scale * 0.75);
                    ctx.beginPath();
                    ctx.moveTo(iX + iW - fBase * 12, botY - fBase * 0.35);
                    ctx.lineTo(iX + iW, botY - fBase * 0.35);
                    ctx.stroke();

                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `600 ${fBase * 0.88}px "JetBrains Mono", monospace`;
                    ctx.fillText(`${(exifCamera || 'CAMERA').toUpperCase()}   ·   ${(exifLens || 'LENS').toUpperCase()}`, iX + iW, botY + fBase * 0.15);

                    ctx.fillStyle = '#71717a';
                    ctx.font = `400 ${fBase * 0.78}px "JetBrains Mono", monospace`;
                    ctx.fillText(exifParams || '24mm   f/2.8   1/125s   ISO 400', iX + iW, botY + fBase * 1.55);
                }
            };

        // 3. 杂志社论跨页 (EDITORIAL MAGAZINE)
        } else if (style === 'editorial_magazine') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.085 * matMultiplier;
            const padTop = shortEdge * 0.13 * matMultiplier;
            const padBot = shortEdge * 0.28 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padTop + padBot;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;
                const sTop = padTop * scale, sBot = padBot * scale;

                ctx.fillStyle = '#fbfaf8';
                ctx.fillRect(0, 0, sW, sH);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.015 * scale;
                    const ruleY = iY - sTop * 0.32;

                    ctx.strokeStyle = '#0a0a0a';
                    ctx.lineWidth = Math.max(1, scale);
                    ctx.beginPath();
                    ctx.moveTo(iX, ruleY);
                    ctx.lineTo(iX + iW, ruleY);
                    ctx.stroke();

                    ctx.fillStyle = '#0a0a0a';
                    ctx.textBaseline = 'bottom';
                    ctx.font = `600 ${fBase * 0.72}px "JetBrains Mono", monospace`;
                    setTrack(fBase * 0.18);
                    ctx.textAlign = 'left';
                    ctx.fillText('ISSUE NO. 04  —  VISUAL MONOGRAPH', iX, ruleY - fBase * 0.45);
                    ctx.textAlign = 'right';
                    ctx.fillText((exifTime || 'AUTUMN / WINTER 2026').toUpperCase(), iX + iW, ruleY - fBase * 0.45);
                    setTrack(0);

                    const botY = iY + iH + sBot * 0.22;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `italic 600 ${fBase * 2.15}px "Cormorant Garamond", "Noto Serif SC", serif`;
                    ctx.fillText(textLeft || 'The Silence of Light', iX, botY - fBase * 0.2);

                    ctx.fillStyle = '#71717a';
                    ctx.font = `400 ${fBase * 0.75}px "JetBrains Mono", monospace`;
                    ctx.fillText(`PHOTOGRAPHED BY ${(textRight || 'XIANGVISUALS').replace('©', '').trim().toUpperCase()}`, iX, botY + fBase * 2.45);

                    const divX = iX + iW * 0.62;
                    ctx.strokeStyle = '#d4d4d8';
                    ctx.beginPath();
                    ctx.moveTo(divX, botY + fBase * 0.15);
                    ctx.lineTo(divX, botY + fBase * 3.4);
                    ctx.stroke();

                    const col2X = divX + fBase * 1.4;
                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `600 ${fBase * 0.78}px "JetBrains Mono", monospace`;
                    ctx.fillText((exifCamera || 'DIGITAL CAMERA').toUpperCase(), col2X, botY + fBase * 0.2);

                    ctx.fillStyle = '#52525b';
                    ctx.font = `400 ${fBase * 0.74}px "JetBrains Mono", monospace`;
                    ctx.fillText((exifLens || 'STANDARD LENS').toUpperCase(), col2X, botY + fBase * 1.35);
                    ctx.fillText(exifParams || '24mm  f/2.8  1/125s  ISO 400', col2X, botY + fBase * 2.5);
                }
            };

        // 4. 磨砂玻璃内嵌 (GLASSEXIF OVERLAY)
        } else if (style === 'glass_overlay') {
            wallPaddingX = 0; wallPaddingY = 0;
            sceneW = imgW; sceneH = imgH;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const fImg = app.getFilteredImage(imgData, sW, sH, bwAmount, invertAmount);
                ctx.drawImage(fImg, 0, 0, sW, sH);

                if (matMultiplier > 0.3) {
                    const fBase = shortEdge * 0.0145 * scale * Math.min(1.3, Math.max(0.8, matMultiplier));
                    const barMargin = shortEdge * 0.038 * scale;
                    const barH = fBase * 4.2, barW = sW - barMargin * 2;
                    const barX = barMargin, barY = sH - barMargin - barH;

                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(barX, barY, barW, barH);
                    ctx.clip();

                    const blurCvs = document.createElement('canvas');
                    blurCvs.width = 160; blurCvs.height = 40;
                    const bCtx = app.getCanvasContext(blurCvs);
                    bCtx.filter = 'blur(10px) saturate(160%) brightness(0.75)';
                    bCtx.drawImage(fImg, barX / scale, barY / scale, barW / scale, barH / scale, 0, 0, 160, 40);
                    ctx.drawImage(blurCvs, barX, barY, barW, barH);

                    ctx.fillStyle = 'rgba(12, 12, 14, 0.52)';
                    ctx.fillRect(barX, barY, barW, barH);
                    ctx.restore();

                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
                    ctx.lineWidth = Math.max(1, scale * 1.1);
                    ctx.strokeRect(barX, barY, barW, barH);

                    const midY = barY + barH / 2, innerPad = fBase * 1.4;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `700 ${fBase * 0.98}px "Inter", sans-serif`;
                    ctx.fillText((exifCamera || 'DIGITAL CAMERA').toUpperCase(), barX + innerPad, midY - fBase * 0.65);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
                    ctx.font = `400 ${fBase * 0.78}px "JetBrains Mono", monospace`;
                    ctx.fillText(`${(exifLens || 'LENS').toUpperCase()}   ·   ${exifParams || ''}`, barX + innerPad, midY + fBase * 0.75);

                    ctx.textAlign = 'right';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.font = `600 ${fBase * 0.8}px "JetBrains Mono", monospace`;
                    ctx.fillText(exifTime || (textRight || '© XIANGVISUALS').toUpperCase(), barX + barW - innerPad, midY + fBase * 0.75);

                    if (imgData.palette && imgData.palette.length > 0) {
                        const swSize = fBase * 0.95, swGap = fBase * 0.35;
                        imgData.palette.forEach((c, idx) => {
                            const sx = barX + barW - innerPad - (idx + 1) * swSize - idx * swGap;
                            const sy = midY - fBase * 1.15;
                            ctx.fillStyle = c.rgbStr;
                            ctx.fillRect(sx, sy, swSize, swSize);
                            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
                            ctx.lineWidth = Math.max(0.75, scale * 0.6);
                            ctx.strokeRect(sx, sy, swSize, swSize);
                        });
                    }
                }
            };

        // 5. 博物馆斜切卡纸 (GALLERY PASSEPARTOUT)
        } else if (style === 'gallery_passepartout') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.16 * matMultiplier;
            const padTop = shortEdge * 0.16 * matMultiplier;
            const padBot = shortEdge * 0.24 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padTop + padBot;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;
                const bevel = shortEdge * 0.016 * scale;

                ctx.fillStyle = '#f6f4ef';
                ctx.fillRect(0, 0, sW, sH);

                ctx.fillStyle = '#fdfcf9';
                ctx.fillRect(iX - bevel, iY - bevel, iW + bevel * 2, iH + bevel * 2);

                ctx.fillStyle = '#e5e2dc';
                ctx.beginPath();
                ctx.moveTo(iX - bevel, iY - bevel);
                ctx.lineTo(iX + iW + bevel, iY - bevel);
                ctx.lineTo(iX + iW, iY);
                ctx.lineTo(iX, iY);
                ctx.lineTo(iX, iY + iH);
                ctx.lineTo(iX - bevel, iY + iH + bevel);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(iX + iW + bevel, iY - bevel);
                ctx.lineTo(iX + iW + bevel, iY + iH + bevel);
                ctx.lineTo(iX - bevel, iY + iH + bevel);
                ctx.lineTo(iX, iY + iH);
                ctx.lineTo(iX + iW, iY + iH);
                ctx.lineTo(iX + iW, iY);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = 'rgba(10, 10, 10, 0.14)';
                ctx.lineWidth = Math.max(1, scale * 0.8);
                ctx.strokeRect(iX - bevel, iY - bevel, iW + bevel * 2, iH + bevel * 2);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.014 * scale;
                    const sigY = iY + iH + bevel + fBase * 1.4;

                    ctx.fillStyle = '#52525b';
                    ctx.textBaseline = 'top';
                    ctx.textAlign = 'left';
                    ctx.font = `italic 500 ${fBase * 1.15}px "Cormorant Garamond", "Noto Serif SC", serif`;
                    ctx.fillText(`"${textLeft || 'Untitled'}" — Archival Pigment Print`, iX - bevel, sigY);

                    ctx.textAlign = 'right';
                    ctx.font = `400 ${fBase * 0.8}px "JetBrains Mono", monospace`;
                    ctx.fillStyle = '#71717a';
                    ctx.fillText(`${(exifCamera || '').toUpperCase()}  ·  ${exifParams || ''}  //  ED. 1/1`, iX + iW + bevel, sigY + fBase * 0.15);
                }
            };

        // 6. 日式侘寂留白 (JAPANESE ZEN)
        } else if (style === 'japanese_zen') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.15 * matMultiplier;
            const padTop = shortEdge * 0.22 * matMultiplier;
            const padBot = shortEdge * 0.34 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padTop + padBot;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;
                const sBot = padBot * scale;

                ctx.fillStyle = '#f7f5f0';
                ctx.fillRect(0, 0, sW, sH);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.0145 * scale;
                    const centerY = iY + iH + sBot * 0.48, centerX = sW / 2;
                    const stampSize = fBase * 2.1;
                    const stampX = centerX - stampSize / 2, stampY = centerY - stampSize - fBase * 0.6;

                    ctx.strokeStyle = '#b91c1c';
                    ctx.lineWidth = Math.max(1.2, fBase * 0.1);
                    ctx.strokeRect(stampX, stampY, stampSize, stampSize);

                    ctx.fillStyle = '#b91c1c';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = `700 ${fBase * 0.95}px "Noto Serif SC", "Cormorant Garamond", serif`;
                    ctx.fillText('よいん', centerX, stampY + stampSize * 0.52);

                    ctx.fillStyle = '#1c1917';
                    ctx.font = `500 ${fBase * 1.25}px "Noto Serif SC", "Cormorant Garamond", serif`;
                    setTrack(fBase * 0.35);
                    ctx.fillText(textLeft || '無題', centerX, centerY + fBase * 0.65);

                    ctx.fillStyle = '#78716c';
                    ctx.font = `400 ${fBase * 0.72}px "JetBrains Mono", monospace`;
                    setTrack(fBase * 0.15);
                    ctx.fillText(`${exifParams || '24mm  f/2.8'}   ·   ${exifTime || '2026'}`, centerX, centerY + fBase * 2.2);
                    setTrack(0);
                }
            };

        // 7. 瑞士网格展签 (SWISS GRID)
        } else if (style === 'swiss_grid') {
            wallPaddingX = 0; wallPaddingY = 0;
            const pad = shortEdge * 0.075 * matMultiplier;
            const headerH = shortEdge * 0.085 * matMultiplier;
            const footerH = shortEdge * 0.25 * matMultiplier;
            sceneW = imgW + pad * 2;
            sceneH = imgH + pad * 2 + headerH + footerH;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const sPad = pad * scale, sHead = headerH * scale, sFoot = footerH * scale;
                const iW = imgW * scale, iH = imgH * scale, iX = sPad, iY = sPad + sHead;

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sW, sH);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                ctx.strokeStyle = '#0a0a0a';
                ctx.lineWidth = Math.max(1, shortEdge * 0.0018 * scale);
                ctx.strokeRect(sPad, sPad, iW, sH - sPad * 2);

                ctx.beginPath();
                ctx.moveTo(sPad, iY); ctx.lineTo(sPad + iW, iY);
                ctx.moveTo(sPad, iY + iH); ctx.lineTo(sPad + iW, iY + iH);
                ctx.stroke();

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.014 * scale;
                    const headMidY = sPad + sHead * 0.5;

                    ctx.fillStyle = '#0a0a0a';
                    ctx.textBaseline = 'middle';
                    ctx.font = `700 ${fBase * 0.95}px "JetBrains Mono", monospace`;
                    ctx.textAlign = 'left';
                    const hdrTag = imgData.isHDR ? ` // ${imgData.hdrType}` : ` // ${imgData.colorProfile || 'P3'}`;
                    ctx.fillText(`ARCHIVE SPEC — NO. 01${hdrTag}`, sPad + fBase * 1.2, headMidY);

                    ctx.textAlign = 'right';
                    ctx.font = `500 ${fBase * 0.9}px "JetBrains Mono", monospace`;
                    ctx.fillText((textRight || '© XIANGVISUALS').toUpperCase(), sPad + iW - fBase * 1.2, headMidY);

                    const footTop = iY + iH, row1H = sFoot * 0.54, col1W = iW * 0.42, col2W = iW * 0.33;
                    ctx.beginPath();
                    ctx.moveTo(sPad, footTop + row1H); ctx.lineTo(sPad + iW, footTop + row1H);
                    ctx.moveTo(sPad + col1W, footTop); ctx.lineTo(sPad + col1W, footTop + sFoot);
                    ctx.moveTo(sPad + col1W + col2W, footTop); ctx.lineTo(sPad + col1W + col2W, footTop + sFoot);
                    ctx.stroke();

                    const cellPad = fBase * 1.2;
                    const drawCell = (lbl, val, x, y, isBoldSans) => {
                        ctx.fillStyle = '#71717a';
                        ctx.font = `600 ${fBase * 0.65}px "JetBrains Mono", monospace`;
                        ctx.fillText(lbl, x, y);
                        ctx.fillStyle = '#0a0a0a';
                        ctx.font = isBoldSans ? `700 ${fBase * 1.05}px "Inter", sans-serif` : `600 ${fBase * 0.88}px "JetBrains Mono", monospace`;
                        ctx.fillText(val, x, y + cellPad * 1.2);
                    };

                    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                    drawCell('01 / ARTWORK TITLE', (textLeft || 'UNTITLED ARTWORK').toUpperCase(), sPad + cellPad, footTop + cellPad * 0.75, true);
                    drawCell('02 / OPTICAL SYSTEM', (exifCamera || 'DIGITAL CAMERA').toUpperCase(), sPad + col1W + cellPad, footTop + cellPad * 0.75, false);
                    drawCell('03 / CHRONOLOGY', (exifTime || '2026 ARCHIVE').toUpperCase(), sPad + col1W + col2W + cellPad, footTop + cellPad * 0.75, false);

                    const r2Top = footTop + row1H;
                    drawCell('04 / GEO-COORDINATES', imgData.location || "38° 55' 00\" N  121° 38' 00\" E", sPad + cellPad, r2Top + cellPad * 0.65, false);
                    drawCell('05 / EXPOSURE TELEMETRY', exifParams || '24mm  f/2.8  1/125s  ISO 400', sPad + col1W + cellPad, r2Top + cellPad * 0.65, false);

                    ctx.fillStyle = '#71717a';
                    ctx.font = `600 ${fBase * 0.65}px "JetBrains Mono", monospace`;
                    ctx.fillText('06 / CHROMATIC PALETTE', sPad + col1W + col2W + cellPad, r2Top + cellPad * 0.65);
                    if (imgData.palette && imgData.palette.length > 0) {
                        const swW = (iW - col1W - col2W - cellPad * 2) / imgData.palette.length;
                        imgData.palette.forEach((c, idx) => {
                            ctx.fillStyle = c.rgbStr;
                            ctx.fillRect(sPad + col1W + col2W + cellPad + idx * swW, r2Top + cellPad * 1.7, swW - 2, fBase * 1.05);
                        });
                    }
                }
            };

        // 8. 光学直方图档案 (OPTICAL HISTOGRAM)
        } else if (style === 'optical_histogram') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.08 * matMultiplier;
            const padTop = shortEdge * 0.08 * matMultiplier;
            const padBot = shortEdge * 0.30 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padTop + padBot;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sW, sH);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.015 * scale;
                    const topY = iY + iH + padBot * scale * 0.22;

                    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `700 ${fBase * 1.35}px "Inter", sans-serif`;
                    ctx.fillText((exifCamera || 'DIGITAL CAMERA').toUpperCase(), iX, topY);

                    ctx.fillStyle = '#71717a';
                    ctx.font = `500 ${fBase * 0.85}px "JetBrains Mono", monospace`;
                    ctx.fillText((exifLens || 'STANDARD LENS').toUpperCase(), iX, topY + fBase * 1.85);

                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `600 ${fBase * 0.9}px "JetBrains Mono", monospace`;
                    ctx.fillText(exifParams || '24mm   f/2.8   1/125s   ISO 400', iX, topY + fBase * 3.25);

                    ctx.fillStyle = '#a1a1aa';
                    ctx.font = `500 ${fBase * 0.72}px "JetBrains Mono", monospace`;
                    ctx.fillText(`${imgData.width}×${imgData.height}PX // ${imgData.colorProfile || 'DISPLAY-P3'}`, iX, topY + fBase * 4.65);

                    const histW = iW * 0.36, histH = fBase * 4.5;
                    const histX = iX + iW - histW, histY = topY + fBase * 0.2;

                    ctx.fillStyle = '#fafafa';
                    ctx.fillRect(histX, histY, histW, histH);
                    ctx.strokeStyle = '#e4e4e7';
                    ctx.lineWidth = Math.max(1, scale);
                    ctx.strokeRect(histX, histY, histW, histH);

                    const hist = imgData.histogram;
                    if (hist && hist.l) {
                        const drawCurve = (arr, fillStyle, strokeStyle) => {
                            ctx.save();
                            ctx.beginPath();
                            ctx.moveTo(histX, histY + histH);
                            for (let i = 0; i < arr.length; i++) {
                                ctx.lineTo(histX + (i / (arr.length - 1)) * histW, histY + histH - arr[i] * (histH * 0.88));
                            }
                            ctx.lineTo(histX + histW, histY + histH);
                            ctx.closePath();
                            ctx.fillStyle = fillStyle;
                            ctx.fill();
                            if (strokeStyle) {
                                ctx.strokeStyle = strokeStyle;
                                ctx.lineWidth = Math.max(1, fBase * 0.08);
                                ctx.stroke();
                            }
                            ctx.restore();
                        };
                        drawCurve(hist.r, 'rgba(239, 68, 68, 0.14)', null);
                        drawCurve(hist.g, 'rgba(34, 197, 94, 0.14)', null);
                        drawCurve(hist.b, 'rgba(59, 130, 246, 0.14)', null);
                        drawCurve(hist.l, 'rgba(10, 10, 10, 0.22)', '#0a0a0a');
                    }

                    ctx.textAlign = 'right';
                    ctx.fillStyle = '#71717a';
                    ctx.font = `600 ${fBase * 0.62}px "JetBrains Mono", monospace`;
                    ctx.fillText('LUMINANCE & RGB WAVEFORM [0—255 IRE]', histX + histW, histY + histH + fBase * 0.55);
                }
            };

        // 9. 弥散光感画境 (AURA BLUR)
        } else if (style === 'aura_blur') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.14 * matMultiplier;
            const padTop = shortEdge * 0.14 * matMultiplier;
            const padBot = shortEdge * 0.22 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padTop + padBot;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);

                const blurCanvas = document.createElement('canvas');
                blurCanvas.width = 96; blurCanvas.height = 96;
                const bCtx = app.getCanvasContext(blurCanvas);
                bCtx.filter = 'blur(14px) saturate(165%) brightness(0.92)';
                bCtx.drawImage(fImg, -12, -12, 120, 120);

                ctx.drawImage(blurCanvas, 0, 0, sW, sH);
                ctx.fillStyle = 'rgba(0,0,0,0.18)';
                ctx.fillRect(0, 0, sW, sH);

                ctx.save();
                ctx.shadowColor = `rgba(0, 0, 0, ${0.42 * shadowMultiplier})`;
                ctx.shadowBlur = shortEdge * 0.065 * scale * shadowMultiplier;
                ctx.shadowOffsetY = shortEdge * 0.025 * scale * shadowMultiplier;
                ctx.drawImage(fImg, iX, iY, iW, iH);
                ctx.restore();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
                ctx.lineWidth = Math.max(1, shortEdge * 0.0018 * scale);
                ctx.strokeRect(iX, iY, iW, iH);

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.015 * scale;
                    const centerY = iY + iH + (padBot * scale * 0.52);

                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                    ctx.font = `600 ${fBase * 1.15}px "Cormorant Garamond", "Noto Serif SC", serif`;
                    setTrack(fBase * 0.22);
                    ctx.fillText((textLeft || 'UNTITLED ARTWORK').toUpperCase(), sW / 2, centerY - fBase * 0.85);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
                    ctx.font = `400 ${fBase * 0.75}px "JetBrains Mono", monospace`;
                    setTrack(fBase * 0.12);
                    ctx.fillText(`${(exifCamera || 'CAMERA').toUpperCase()}   ·   ${exifParams || ''}`, sW / 2, centerY + fBase * 1.05);
                    setTrack(0);
                }
            };

        // 10. 暗房高光溢光 (HALATION LAB)
        } else if (style === 'halation_lab') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.09 * matMultiplier;
            const padTop = shortEdge * 0.09 * matMultiplier;
            const padBot = shortEdge * 0.22 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padTop + padBot;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;

                ctx.fillStyle = '#070708';
                ctx.fillRect(0, 0, sW, sH);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                try {
                    const hSize = 128;
                    const hCanvas = document.createElement('canvas');
                    hCanvas.width = hSize; hCanvas.height = hSize;
                    const hCtx = hCanvas.getContext('2d', { willReadFrequently: true });
                    hCtx.drawImage(fImg, 0, 0, hSize, hSize);
                    const hData = hCtx.getImageData(0, 0, hSize, hSize), d = hData.data;

                    for (let p = 0; p < d.length; p += 4) {
                        const lum = 0.299 * d[p] + 0.587 * d[p+1] + 0.114 * d[p+2];
                        if (lum > 200) {
                            const k = (lum - 200) / 55;
                            d[p] = 255; d[p+1] = Math.round(65 * k); d[p+2] = Math.round(20 * k);
                            d[p+3] = Math.round(235 * Math.pow(k, 1.3));
                        } else { d[p+3] = 0; }
                    }
                    hCtx.putImageData(hData, 0, 0);

                    const bloomCanvas = document.createElement('canvas');
                    bloomCanvas.width = hSize; bloomCanvas.height = hSize;
                    const blCtx = bloomCanvas.getContext('2d');
                    blCtx.filter = 'blur(6px)';
                    blCtx.drawImage(hCanvas, 0, 0);

                    ctx.save();
                    ctx.globalCompositeOperation = 'screen';
                    ctx.globalAlpha = 0.82;
                    ctx.drawImage(bloomCanvas, iX - iW * 0.015, iY - iH * 0.015, iW * 1.03, iH * 1.03);
                    ctx.restore();
                } catch (e) {}

                ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
                ctx.lineWidth = Math.max(1, shortEdge * 0.0015 * scale);
                ctx.strokeRect(iX, iY, iW, iH);

                if (grainAmount > 0) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.fillStyle = app.createFilmGrainPattern(ctx);
                    ctx.globalAlpha = grainAmount;
                    ctx.fillRect(iX, iY, iW, iH);
                    ctx.restore();
                }

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.014 * scale;
                    const textY = iY + iH + (padBot * scale * 0.45);
                    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
                    ctx.fillStyle = '#ef4444';
                    ctx.font = `700 ${fBase * 0.95}px "JetBrains Mono", monospace`;
                    ctx.fillText(`HALATION LAB // ${(filmName || 'CINESTILL 800T').toUpperCase()}`, iX, textY - fBase * 0.65);

                    ctx.fillStyle = '#a1a1aa';
                    ctx.font = `400 ${fBase * 0.8}px "JetBrains Mono", monospace`;
                    ctx.fillText(`${(exifCamera || 'CAMERA').toUpperCase()}  ·  ${exifParams || ''}`, iX, textY + fBase * 0.9);

                    ctx.textAlign = 'right';
                    ctx.fillStyle = '#52525b';
                    ctx.fillText(exifTime || 'DARKROOM PRINT', iX + iW, textY + fBase * 0.9);
                }
            };

        // 11. 古典蓝晒印相 (CYANOTYPE)
        } else if (style === 'cyanotype') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.11 * matMultiplier;
            const padTop = shortEdge * 0.11 * matMultiplier;
            const padBot = shortEdge * 0.24 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padTop + padBot;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;
                const bleed = shortEdge * 0.012 * scale;

                ctx.fillStyle = '#f4f1ea';
                ctx.fillRect(0, 0, sW, sH);
                ctx.fillStyle = '#0c2d48';
                ctx.fillRect(iX - bleed, iY - bleed, iW + bleed * 2, iH + bleed * 2);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount, 'cyanotype');
                ctx.drawImage(fImg, iX, iY, iW, iH);

                ctx.strokeStyle = 'rgba(244, 241, 234, 0.75)';
                ctx.lineWidth = Math.max(1, shortEdge * 0.0018 * scale);
                ctx.strokeRect(iX + bleed * 0.5, iY + bleed * 0.5, iW - bleed, iH - bleed);

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.015 * scale;
                    const textY = iY + iH + (padBot * scale * 0.48);

                    ctx.fillStyle = '#0c2d48';
                    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                    ctx.font = `italic 600 ${fBase * 1.35}px "Cormorant Garamond", "Noto Serif SC", serif`;
                    ctx.fillText(`Plate I. — ${textLeft || 'Botanical & Architectural Study'}`, iX, textY - fBase * 0.6);

                    ctx.fillStyle = '#1d567e';
                    ctx.font = `400 ${fBase * 0.78}px "JetBrains Mono", monospace`;
                    ctx.fillText(`FERRICYANIDE PRINT  //  ${(exifCamera || 'CAMERA').toUpperCase()}  ·  ${exifParams || ''}`, iX, textY + fBase * 1.0);

                    ctx.textAlign = 'right';
                    ctx.fillText(exifTime || '1842—2026', iX + iW, textY + fBase * 1.0);
                }
            };

        // 12. 光学矢量矩阵 (VECTOR FIELD)
        } else if (style === 'vector_field') {
            wallPaddingX = 0; wallPaddingY = 0;
            sceneW = imgW; sceneH = imgH;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                ctx.fillStyle = '#050505';
                ctx.fillRect(0, 0, sW, sH);

                const cols = Math.max(20, Math.round(vectorCols || 70));
                const cellSize = sW / cols;
                const rows = Math.max(12, Math.round(sH / cellSize));

                const sCanvas = document.createElement('canvas');
                sCanvas.width = cols; sCanvas.height = rows;
                const sCtx = sCanvas.getContext('2d', { willReadFrequently: true });
                sCtx.drawImage(imgData.imgObj, 0, 0, cols, rows);
                const data = sCtx.getImageData(0, 0, cols, rows).data;

                ctx.save();
                ctx.strokeStyle = '#ffffff';
                ctx.lineCap = 'square'; ctx.lineJoin = 'miter';

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const idx = (r * cols + c) * 4;
                        let lum = (0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2]) / 255;
                        if (invertAmount > 0) lum = Math.abs(invertAmount - lum);
                        const contrastLum = Math.pow(lum, 1.12);
                        if (contrastLum < 0.03) continue;

                        const angle = contrastLum > 0.25
                            ? (Math.PI * 0.5 + Math.min(1, (contrastLum - 0.18) * 1.35) * (Math.PI * 0.25))
                            : (Math.PI * 0.5);
                        const len = cellSize * (0.24 + contrastLum * 0.64);
                        const halfLen = len * 0.48, headSize = len * (0.28 + contrastLum * 0.12);

                        ctx.save();
                        ctx.translate((c + 0.5) * cellSize, (r + 0.5) * cellSize);
                        ctx.rotate(angle);
                        ctx.lineWidth = Math.max(0.75, cellSize * (0.045 + contrastLum * 0.145));

                        ctx.beginPath();
                        ctx.moveTo(-halfLen, 0); ctx.lineTo(halfLen, 0);
                        ctx.moveTo(halfLen - headSize, -headSize * 0.82);
                        ctx.lineTo(halfLen, 0);
                        ctx.lineTo(halfLen - headSize, headSize * 0.82);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
                ctx.restore();
            };

        // 13. 极简细线留白 (MINIMAL LINE)
        } else if (style === 'minimal_line') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.15 * matMultiplier;
            const padTop = shortEdge * 0.25 * matMultiplier;
            const padBot = shortEdge * 0.35 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padTop + padBot;

            drawLogic = (scale) => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sceneW * scale, sceneH * scale);
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);
                ctx.strokeStyle = '#0a0a0a';
                ctx.lineWidth = Math.max(1.5, shortEdge * 0.002 * scale);
                ctx.strokeRect(iX, iY, iW, iH);
            };

        // 14. 三联画廊海报 (TRIPTYCH WATERMARK)
        } else if (style === 'triptych_watermark') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.1 * matMultiplier;
            const padTop = shortEdge * 0.45 * matMultiplier;
            const padBot = shortEdge * 0.65 * matMultiplier;
            const gap = shortEdge * 0.015;
            const isPortrait = imgH > imgW;

            sceneW = isPortrait ? imgW + padX * 2 : imgW + (gap * 2) + padX * 2;
            sceneH = isPortrait ? imgH + (gap * 2) + padTop + padBot : imgH + padTop + padBot;

            drawLogic = (scale) => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sceneW * scale, sceneH * scale);

                const sPadX = padX * scale, sPadTop = padTop * scale, sGap = gap * scale;
                const iW = imgW * scale, iH = imgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                const srcW = fImg.naturalWidth || fImg.width, srcH = fImg.naturalHeight || fImg.height;

                if (isPortrait) {
                    const sPanelH = srcH / 3, dPanelH = iH / 3;
                    for (let k = 0; k < 3; k++) {
                        ctx.drawImage(fImg, 0, sPanelH * k, srcW, sPanelH, sPadX, sPadTop + k * (dPanelH + sGap), iW, dPanelH);
                    }
                } else {
                    const sPanelW = srcW / 3, dPanelW = iW / 3;
                    for (let k = 0; k < 3; k++) {
                        ctx.drawImage(fImg, sPanelW * k, 0, sPanelW, srcH, sPadX + k * (dPanelW + sGap), sPadTop, dPanelW, iH);
                    }
                }

                if (matMultiplier > 0.3) {
                    const centerX = sceneW * scale / 2;
                    const totalImgDrawH = isPortrait ? (iH + sGap * 2) : iH;
                    const textY = sPadTop + totalImgDrawH + (padBot * scale * 0.4);
                    const fontSize = shortEdge * 0.015 * scale;

                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#71717a';
                    ctx.font = `500 ${fontSize}px "Inter", sans-serif`;
                    setTrack(fontSize * 0.6);
                    ctx.fillText((textLeft || 'THE PHOTO').toUpperCase(), centerX, textY - (fontSize * 0.8));

                    const yearMatch = (imgData.exifDate || '').match(/\d{4}/);
                    ctx.fillText(`OF ${yearMatch ? yearMatch[0] : '2026'}`, centerX, textY + (fontSize * 0.8));
                    setTrack(0);
                }
            };

        // 15. 沉浸主色卡 (IMMERSIVE COLOR)
        } else if (style === 'immersive_color') {
            wallPaddingX = 0; wallPaddingY = 0;
            const botBlockH = imgH * 0.85;
            sceneW = imgW; sceneH = imgH + botBlockH;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale, sBotH = botBlockH * scale, sImgH = imgH * scale;
                let mainColor = (imgData.palette && imgData.palette[0]) || { r: 30, g: 41, b: 59 };
                ctx.fillStyle = `rgb(${Math.floor(mainColor.r * 0.75)}, ${Math.floor(mainColor.g * 0.75)}, ${Math.floor(mainColor.b * 0.75)})`;
                ctx.fillRect(0, 0, sW, sH);

                const fImg = app.getFilteredImage(imgData, sW, sImgH, bwAmount, invertAmount);
                ctx.drawImage(fImg, 0, 0, sW, sImgH);

                if (matMultiplier > 0.4) {
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    const pFont = sW * 0.013, sFont = sW * 0.011;
                    const cy = sImgH + sBotH * 0.45, gap = pFont * 2.8;

                    ctx.font = `400 ${pFont}px "Inter", sans-serif`;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                    setTrack(pFont * 0.15);
                    ctx.fillText(`${imgData.location || ''}      ${imgData.exifTime || '12 FEB 2026'}`, sW / 2, cy - gap / 2);

                    ctx.font = `400 ${sFont}px "Inter", sans-serif`;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    setTrack(sFont * 0.2);
                    ctx.fillText(imgData.exifParams || '24mm   f/2.8   1/125s   ISO 400', sW / 2, cy + gap / 2);
                    setTrack(0);
                }
            };

        // 16. 复古拍立得 (POLAROID)
        } else if (style === 'polaroid') {
            const matX = shortEdge * 0.08 * matMultiplier, matTop = shortEdge * 0.08 * matMultiplier, matBot = shortEdge * 0.3 * matMultiplier;
            const paperW = imgW + matX * 2, paperH = imgH + matTop + matBot;
            sceneW = paperW + wallPaddingX * 2; sceneH = paperH + wallPaddingY * 2;

            drawLogic = (scale) => {
                drawBackground(scale);
                const pX = wallPaddingX * scale, pY = wallPaddingY * scale, pW = paperW * scale, pH = paperH * scale;
                ctx.save();
                ctx.shadowColor = `rgba(0, 0, 0, ${0.14 * shadowMultiplier})`;
                ctx.shadowBlur = shortEdge * 0.04 * scale * shadowMultiplier;
                ctx.shadowOffsetY = shortEdge * 0.02 * scale * shadowMultiplier;
                ctx.fillStyle = '#fdfcf8'; ctx.fillRect(pX, pY, pW, pH);
                ctx.restore();

                const iX = pX + matX * scale, iY = pY + matTop * scale, iW = imgW * scale, iH = imgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);
                ctx.strokeStyle = `rgba(0,0,0,${0.06 * shadowMultiplier})`;
                ctx.lineWidth = shortEdge * 0.002 * scale;
                ctx.strokeRect(iX, iY, iW, iH);
            };

        // 17. EXIF 原生 (EXIF RAW)
        } else if (style === 'exif') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.06 * matMultiplier, padTop = shortEdge * 0.06 * matMultiplier, padBot = shortEdge * 0.28 * matMultiplier;
            sceneW = imgW + padX * 2; sceneH = imgH + padTop + padBot;

            drawLogic = (scale) => {
                ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sceneW * scale, sceneH * scale);
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = Math.max(1, shortEdge * 0.002 * scale); ctx.strokeRect(iX, iY, iW, iH);
                if (matMultiplier > 0.4) {
                    const textY = iY + iH + (shortEdge * 0.05 * scale * matMultiplier);
                    const baseFontSize = shortEdge * 0.016 * scale;
                    ctx.fillStyle = '#0a0a0a'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                    ctx.font = `600 ${baseFontSize * 1.2}px "JetBrains Mono", monospace`;
                    ctx.fillText((exifCamera || 'DIGITAL CAMERA').toUpperCase(), iX, textY);
                    ctx.font = `400 ${baseFontSize * 0.85}px "JetBrains Mono", monospace`;
                    ctx.fillStyle = '#52525b';
                    ctx.fillText((exifLens || 'STANDARD LENS').toUpperCase(), iX, textY + baseFontSize * 2.3);
                    ctx.fillText((exifParams || '50mm f/2.8 1/100s ISO100'), iX, textY + baseFontSize * 3.5);
                }
            };

        // 18. 35mm 单张胶片 (FILM 35MM)
        } else if (style === 'film35mm') {
            const baseH = 1000, ratio = imgW / imgH;
            const filmPadY = baseH * 0.18 * matMultiplier, targetImgH = baseH - filmPadY * 2;
            const gap = baseH * 0.05 * matMultiplier, filmPadX = gap * 1.5, targetImgW = targetImgH * ratio;
            const filmW = filmPadX * 2 + targetImgW, filmH = baseH;
            wallPaddingX = baseH * 0.15; wallPaddingY = baseH * 0.25;
            sceneW = filmW + wallPaddingX * 2; sceneH = filmH + wallPaddingY * 2;

            drawLogic = (scale) => {
                drawBackground(scale);
                const fX = wallPaddingX * scale, fY = wallPaddingY * scale, fW = filmW * scale, fH = filmH * scale;
                ctx.save();
                ctx.shadowColor = `rgba(0, 0, 0, ${0.4 * shadowMultiplier})`;
                ctx.shadowBlur = baseH * 0.08 * scale * shadowMultiplier;
                ctx.shadowOffsetY = baseH * 0.04 * scale * shadowMultiplier;
                ctx.fillStyle = '#0f0f0f'; ctx.fillRect(fX, fY, fW, fH);
                ctx.restore();

                ctx.fillStyle = wallColor;
                const holeW = baseH * 0.012 * scale, holeH = baseH * 0.022 * scale, holeGap = baseH * 0.035 * scale;
                const topHoleY = fY + filmPadY * 0.2 * scale, botHoleY = fY + fH - filmPadY * 0.2 * scale - holeH;
                for (let x = fX + holeGap; x < fX + fW - holeGap; x += holeGap) {
                    ctx.beginPath(); ctx.roundRect(x, topHoleY, holeW, holeH, holeW / 2); ctx.roundRect(x, botHoleY, holeW, holeH, holeW / 2); ctx.fill();
                }

                const iX = fX + filmPadX * scale, iY = fY + filmPadY * scale, iW = targetImgW * scale, iH = targetImgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.4) {
                    const fontSize = baseH * 0.018 * scale; ctx.textBaseline = 'middle';
                    const textTopY = fY + filmPadY * 0.65 * scale, textBotY = fY + fH - filmPadY * 0.65 * scale;
                    const bcW = baseH * 0.05 * scale, bcH = baseH * 0.01 * scale;
                    app.drawDXCode(ctx, iX, textTopY - bcH * 0.5, bcW, bcH, 42);

                    ctx.fillStyle = '#facc15'; ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
                    ctx.textAlign = 'left'; ctx.fillText('22A', iX + bcW * 1.5, textTopY);
                    ctx.textAlign = 'center'; ctx.fillText((filmName || 'KODAK PORTRA 400').toUpperCase(), iX + iW / 2, textTopY);
                    ctx.textAlign = 'right'; ctx.fillText('23', iX + iW, textTopY);

                    ctx.font = `400 ${fontSize * 0.8}px "JetBrains Mono", monospace`; ctx.fillStyle = 'rgba(250, 204, 21, 0.6)';
                    ctx.textAlign = 'center'; ctx.fillText(exifParams || '', iX + iW / 2, textBotY);
                }

                ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = app.createFilmGrainPattern(ctx);
                ctx.globalAlpha = grainAmount + invertAmount * 0.15; ctx.fillRect(fX, fY, fW, fH); ctx.restore();
            };

        // 19. 4×5 大画幅 (FILM 4x5)
        } else if (style === 'film4x5') {
            wallPaddingX = 0; wallPaddingY = 0;
            const baseH = 1200, ratio = imgW / imgH;
            const blackBorderTop = baseH * 0.035 * matMultiplier, blackBorderBot = baseH * 0.02 * matMultiplier, blackBorderSide = baseH * 0.015 * matMultiplier;
            const targetImgH = baseH - blackBorderTop - blackBorderBot, targetImgW = targetImgH * ratio, blackW = targetImgW + blackBorderSide * 2;
            const whitePadX = baseH * 0.1 * matMultiplier, whitePadY = baseH * 0.1 * matMultiplier;
            sceneW = blackW + whitePadX * 2; sceneH = baseH + whitePadY * 2;

            drawLogic = (scale) => {
                const fX = whitePadX * scale, fY = whitePadY * scale, sBlackW = blackW * scale, sBaseH = baseH * scale;
                ctx.fillStyle = '#f9f9f9'; ctx.fillRect(0, 0, sceneW * scale, sceneH * scale);
                ctx.fillStyle = '#080808'; ctx.fillRect(fX, fY, sBlackW, sBaseH);

                const iX = fX + blackBorderSide * scale, iY = fY + blackBorderTop * scale, iW = targetImgW * scale, iH = targetImgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.4) {
                    const fontSize = baseH * 0.012 * scale;
                    ctx.fillStyle = '#facc15'; ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`; ctx.textBaseline = 'middle';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${(filmName || 'FUJIFILM   RVP50').toUpperCase()}       50782       D L AGA I`, fX + sBlackW / 2, fY + blackBorderTop * scale * 0.5);
                }

                ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = app.createFilmGrainPattern(ctx);
                ctx.globalAlpha = grainAmount + invertAmount * 0.1; ctx.fillRect(fX, fY, sBlackW, sBaseH); ctx.restore();
            };

        // 20. XPan 宽幅 (FILM XPAN)
        } else if (style === 'film_xpan') {
            wallPaddingX = 0; wallPaddingY = 0;
            const baseH = 800, targetRatio = 65 / 24;
            const targetImgH = baseH, targetImgW = targetImgH * targetRatio;
            const blackBorderT = baseH * 0.01 * matMultiplier, whitePadX = baseH * 0.1 * matMultiplier, whitePadY = baseH * 0.12 * matMultiplier;
            sceneW = targetImgW + blackBorderT * 2 + whitePadX * 2;
            sceneH = targetImgH + blackBorderT * 2 + whitePadY * 2;

            drawLogic = (scale) => {
                const pW = sceneW * scale, pH = sceneH * scale;
                const sWhitePadX = whitePadX * scale, sWhitePadY = whitePadY * scale, sBlackT = blackBorderT * scale;
                const sImgW = targetImgW * scale, sImgH = targetImgH * scale;

                ctx.fillStyle = '#fcfcfc'; ctx.fillRect(0, 0, pW, pH);
                ctx.fillStyle = '#0a0a0a'; ctx.fillRect(sWhitePadX, sWhitePadY, sImgW + sBlackT * 2, sImgH + sBlackT * 2);

                const iX = sWhitePadX + sBlackT, iY = sWhitePadY + sBlackT;
                ctx.save(); ctx.beginPath(); ctx.rect(iX, iY, sImgW, sImgH); ctx.clip();

                const imgRatio = imgW / imgH;
                let drawW = sImgW, drawH = sImgH, drawX = iX, drawY = iY;
                if (imgRatio > targetRatio) { drawW = sImgH * imgRatio; drawX = iX - (drawW - sImgW) / 2; }
                else { drawH = sImgW / imgRatio; drawY = iY - (drawH - sImgH) / 2; }

                const fImg = app.getFilteredImage(imgData, drawW, drawH, bwAmount, invertAmount);
                ctx.drawImage(fImg, drawX, drawY, drawW, drawH);
                ctx.restore();

                if (matMultiplier > 0.4) {
                    const fontSize = baseH * 0.02 * scale;
                    ctx.fillStyle = '#666'; ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`; ctx.textAlign = 'center';
                    setTrack(fontSize * 0.2);
                    ctx.fillText((exifParams || '65:24 PANORAMIC FORMAT').toUpperCase(), pW / 2, pH - sWhitePadY * 0.4);
                    setTrack(0);
                }
            };

        // 21. 长卷接触印相 (FILM STRIP)
        } else if (style === 'film_strip') {
            const allImages = app.state.images;
            if (!allImages.length) return;
            const maxPerRow = 5, rows = [];
            for (let i = 0; i < allImages.length; i += maxPerRow) rows.push(allImages.slice(i, i + maxPerRow));

            const baseH = 1000, filmPadY = baseH * 0.18 * matMultiplier, targetImgH = baseH - filmPadY * 2;
            const gap = baseH * 0.05 * matMultiplier, filmPadX = gap * 1.5;
            const rowLayouts = []; let maxFilmW = 0;

            rows.forEach(row => {
                let totalImgW = 0; const layout = [];
                row.forEach(img => {
                    const iW = targetImgH * (img.width / img.height);
                    layout.push({ w: iW, h: targetImgH, originalData: img });
                    totalImgW += iW;
                });
                const currentFilmW = filmPadX * 2 + totalImgW + gap * (row.length - 1);
                maxFilmW = Math.max(maxFilmW, currentFilmW);
                rowLayouts.push({ layout, w: currentFilmW });
            });

            const filmW = maxFilmW, stripGap = baseH * 0.12;
            const filmH = rows.length * baseH + Math.max(0, rows.length - 1) * stripGap;
            wallPaddingX = baseH * 0.15; wallPaddingY = baseH * 0.25;
            sceneW = filmW + wallPaddingX * 2; sceneH = filmH + wallPaddingY * 2;

            drawLogic = (scale) => {
                drawBackground(scale);
                let currentY = wallPaddingY * scale;
                const fX = wallPaddingX * scale, fW = filmW * scale, fH = baseH * scale;
                const grainPat = app.createFilmGrainPattern(ctx), grainAlpha = grainAmount + invertAmount * 0.25;

                rowLayouts.forEach((rowInfo, rowIndex) => {
                    const fY = currentY;
                    ctx.save();
                    ctx.shadowColor = `rgba(0, 0, 0, ${0.4 * shadowMultiplier})`;
                    ctx.shadowBlur = baseH * 0.08 * scale * shadowMultiplier;
                    ctx.shadowOffsetY = baseH * 0.04 * scale * shadowMultiplier;
                    ctx.fillStyle = '#0f0f0f'; ctx.fillRect(fX, fY, fW, fH);
                    ctx.restore();

                    ctx.fillStyle = wallColor;
                    const holeW = baseH * 0.012 * scale, holeH = baseH * 0.022 * scale, holeGap = baseH * 0.035 * scale;
                    const topHoleY = fY + filmPadY * 0.2 * scale, botHoleY = fY + fH - filmPadY * 0.2 * scale - holeH;
                    for (let x = fX + holeGap; x < fX + fW - holeGap; x += holeGap) {
                        ctx.beginPath(); ctx.roundRect(x, topHoleY, holeW, holeH, holeW / 2); ctx.roundRect(x, botHoleY, holeW, holeH, holeW / 2); ctx.fill();
                    }

                    let currX = fX + filmPadX * scale;
                    rowInfo.layout.forEach((item, idx) => {
                        const iW = item.w * scale, iH = item.h * scale, iX = currX, iY = fY + filmPadY * scale;
                        app.hitboxes.push({ id: item.originalData.id, x: iX, y: iY, w: iW, h: iH });

                        if (app.dragInfo.active && app.dragInfo.id === item.originalData.id) {
                            ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(iX, iY, iW, iH);
                            dragDrawOperation = () => {
                                const dX = app.dragInfo.currX - app.dragInfo.offsetX, dY = app.dragInfo.currY - app.dragInfo.offsetY;
                                const fImg = app.getFilteredImage(item.originalData, iW, iH, bwAmount, invertAmount);
                                ctx.drawImage(fImg, dX, dY, iW, iH);
                            };
                        } else {
                            const fImg = app.getFilteredImage(item.originalData, iW, iH, bwAmount, invertAmount);
                            ctx.drawImage(fImg, iX, iY, iW, iH);
                        }

                        if (matMultiplier > 0.4) {
                            const fontSize = baseH * 0.018 * scale, textTopY = fY + filmPadY * 0.65 * scale;
                            ctx.fillStyle = '#facc15'; ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
                            ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
                            ctx.fillText((item.originalData.filmName || 'KODAK PORTRA 400').toUpperCase(), iX + iW / 2, textTopY);
                        }
                        currX += iW + gap * scale;
                    });

                    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = grainPat; ctx.globalAlpha = grainAlpha; ctx.fillRect(fX, fY, fW, fH); ctx.restore();
                    currentY += fH + stripGap * scale;
                });
                if (dragDrawOperation) dragDrawOperation();
            };
        }

        const finalScale = (targetWidth && targetHeight)
            ? Math.min(targetWidth / sceneW, targetHeight / sceneH)
            : app.OUTPUT_MAX_DIMENSION / Math.max(sceneW, sceneH);

        ctx.canvas.width = Math.max(1, Math.round(sceneW * finalScale));
        ctx.canvas.height = Math.max(1, Math.round(sceneH * finalScale));
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        drawLogic(finalScale);
    }
};