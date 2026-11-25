/**
 * XIANG FRAME 4.5 PRO - Curatorial Template Engine (29 Editions + Anti-Theft Layer)
 */
window.XiangTemplates = {
    async renderScene(app, ctx, imgData, targetWidth, targetHeight) {
        const { style, wallColor, matMultiplier, shadowMultiplier, invertAmount, grainAmount, bwAmount, vectorCols, asciiColor, asciiInvert, asciiMaskMode } = app.state.settings;
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

        const fitText = (str, maxW) => {
            const text = String(str || '');
            if (!maxW || maxW <= 0 || ctx.measureText(text).width <= maxW) return text;
            let lo = 0, hi = text.length;
            while (lo < hi) {
                const mid = (lo + hi + 1) >> 1;
                if (ctx.measureText(text.slice(0, mid) + '…').width <= maxW) lo = mid;
                else hi = mid - 1;
            }
            return text.slice(0, Math.max(1, lo)) + '…';
        };

        const drawSafeRoundRect = (x, y, w, h, r) => {
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(x, y, w, h, r);
            } else {
                ctx.rect(x, y, w, h);
            }
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

                    const swatchCount = (imgData.palette && imgData.palette.length) ? imgData.palette.length : 0;
                    const swGap = fBase * 0.65, swW = fBase * 3.6, swH = fBase * 2.15;
                    const swatchTotalW = swatchCount ? (swatchCount * swW + (swatchCount - 1) * swGap + fBase * 2) : 0;
                    const leftMaxW = Math.max(fBase * 8, iW - swatchTotalW);

                    const botStartY = iY + iH + sBot * 0.24;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `600 ${fBase * 1.55}px "Cormorant Garamond", "Noto Serif SC", serif`;
                    ctx.fillText(fitText(textLeft || 'UNTITLED ARTWORK', leftMaxW), iX, botStartY);

                    ctx.font = `600 ${fBase * 0.85}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText(`${(exifCamera || 'DIGITAL CAMERA').toUpperCase()}  —  ${(exifLens || 'STANDARD LENS').toUpperCase()}`, leftMaxW), iX, botStartY + fBase * 2.15);

                    ctx.fillStyle = '#71717a';
                    ctx.font = `400 ${fBase * 0.8}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText(`${exifParams || '24mm   f/2.8   1/125s   ISO 400'}   ·   ${imgData.location || ''}`, leftMaxW), iX, botStartY + fBase * 3.5);

                    if (swatchCount > 0) {
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
                    const divX = iX + iW * 0.60;
                    const col1MaxW = (divX - iX) - fBase * 1.6;
                    const col2X = divX + fBase * 1.4;
                    const col2MaxW = (iX + iW) - col2X;

                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `italic 600 ${fBase * 2.15}px "Cormorant Garamond", "Noto Serif SC", serif`;
                    ctx.fillText(fitText(textLeft || 'The Silence of Light', col1MaxW), iX, botY - fBase * 0.2);

                    ctx.fillStyle = '#71717a';
                    ctx.font = `400 ${fBase * 0.75}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText(`PHOTOGRAPHED BY ${(textRight || 'XIANGVISUALS').replace('©', '').trim().toUpperCase()}`, col1MaxW), iX, botY + fBase * 2.45);

                    ctx.strokeStyle = '#d4d4d8';
                    ctx.beginPath();
                    ctx.moveTo(divX, botY + fBase * 0.15);
                    ctx.lineTo(divX, botY + fBase * 3.4);
                    ctx.stroke();

                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `600 ${fBase * 0.78}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText((exifCamera || 'DIGITAL CAMERA').toUpperCase(), col2MaxW), col2X, botY + fBase * 0.2);

                    ctx.fillStyle = '#52525b';
                    ctx.font = `400 ${fBase * 0.74}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText((exifLens || 'STANDARD LENS').toUpperCase(), col2MaxW), col2X, botY + fBase * 1.35);
                    ctx.fillText(fitText(exifParams || '24mm  f/2.8  1/125s  ISO 400', col2MaxW), col2X, botY + fBase * 2.5);
                }
            };

        // 4. 黑胶唱片封套 · 12" LP (VINYL RECORD SLEEVE — 独创立体艺术版式)
        } else if (style === 'vinyl_record') {
            wallPaddingX = 0; wallPaddingY = 0;
            const sleeve = 1400;
            const discR = sleeve * 0.475;
            const protrude = discR * 0.88; // ~44% of disc emerging from sleeve
            const padX = sleeve * 0.16 * Math.min(1.5, Math.max(0.55, matMultiplier));
            const padY = sleeve * 0.19 * Math.min(1.5, Math.max(0.55, matMultiplier));
            sceneW = sleeve + protrude + padX * 2;
            sceneH = sleeve + padY * 2;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const sSleeve = sleeve * scale;
                const sDiscR = discR * scale;
                const sX = padX * scale;
                const sY = padY * scale;
                const discCX = sX + sSleeve + protrude * scale - sDiscR;
                const discCY = sY + sSleeve * 0.5;

                // 1. Studio Wall Backdrop with subtle gallery overhead light gradient
                const isDarkWall = wallColor === '#0a0a0a';
                const baseWall = isDarkWall ? '#101013' : (wallColor === '#ffffff' ? '#f2f1ed' : wallColor);
                ctx.fillStyle = baseWall;
                ctx.fillRect(0, 0, sW, sH);

                const wallLight = ctx.createRadialGradient(sW * 0.45, sH * 0.25, sSleeve * 0.1, sW * 0.5, sH * 0.5, Math.max(sW, sH) * 0.85);
                if (isDarkWall) {
                    wallLight.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
                    wallLight.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
                } else {
                    wallLight.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
                    wallLight.addColorStop(1, 'rgba(0, 0, 0, 0.06)');
                }
                ctx.fillStyle = wallLight;
                ctx.fillRect(0, 0, sW, sH);

                // 2. 12-Inch Glossy Black Vinyl Disc (emerging from right side of sleeve)
                ctx.save();
                // Realistic cast shadow of the vinyl disc onto the studio surface
                ctx.shadowColor = isDarkWall ? `rgba(0, 0, 0, ${0.75 * shadowMultiplier})` : `rgba(0, 0, 0, ${0.26 * shadowMultiplier})`;
                ctx.shadowBlur = sSleeve * 0.055 * shadowMultiplier;
                ctx.shadowOffsetX = sSleeve * 0.014 * shadowMultiplier;
                ctx.shadowOffsetY = sSleeve * 0.026 * shadowMultiplier;
                ctx.fillStyle = '#0c0c0e';
                ctx.beginPath();
                ctx.arc(discCX, discCY, sDiscR, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Clip inside vinyl disc for grooves, anisotropic sheen & center label
                ctx.save();
                ctx.beginPath();
                ctx.arc(discCX, discCY, sDiscR, 0, Math.PI * 2);
                ctx.clip();

                // Deep PVC vinyl radial base
                const pvcGrad = ctx.createRadialGradient(discCX, discCY, sDiscR * 0.28, discCX, discCY, sDiscR);
                pvcGrad.addColorStop(0, '#16161a');
                pvcGrad.addColorStop(0.55, '#0b0b0d');
                pvcGrad.addColorStop(0.95, '#131317');
                pvcGrad.addColorStop(1, '#26262c');
                ctx.fillStyle = pvcGrad;
                ctx.fillRect(discCX - sDiscR, discCY - sDiscR, sDiscR * 2, sDiscR * 2);

                // Anisotropic studio specular light reflections (angled bow-tie sheen across vinyl grooves)
                ctx.save();
                ctx.translate(discCX, discCY);
                ctx.rotate(-Math.PI * 0.22);
                const drawSheenWedge = (angleStart, angleEnd, alpha) => {
                    const g = ctx.createRadialGradient(0, 0, sDiscR * 0.32, 0, 0, sDiscR);
                    g.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.5})`);
                    g.addColorStop(0.55, `rgba(255, 255, 255, ${alpha})`);
                    g.addColorStop(0.92, `rgba(255, 255, 255, ${alpha * 0.7})`);
                    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.arc(0, 0, sDiscR, angleStart, angleEnd);
                    ctx.closePath();
                    ctx.fill();
                };
                drawSheenWedge(-0.32, 0.32, 0.14);
                drawSheenWedge(-0.12, 0.12, 0.12);
                drawSheenWedge(Math.PI - 0.32, Math.PI + 0.32, 0.11);
                drawSheenWedge(Math.PI - 0.12, Math.PI + 0.12, 0.09);
                ctx.restore();

                // Concentric micro-grooves + silent track separators
                const innerGrooveR = sDiscR * 0.37;
                const outerGrooveR = sDiscR * 0.965;
                const grooveCount = 62;
                for (let g = 0; g < grooveCount; g++) {
                    const t = g / (grooveCount - 1);
                    const r = innerGrooveR + t * (outerGrooveR - innerGrooveR);
                    const isTrackGap = g === 18 || g === 39;
                    ctx.beginPath();
                    ctx.arc(discCX, discCY, r, 0, Math.PI * 2);
                    if (isTrackGap) {
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
                        ctx.lineWidth = Math.max(1.5, sDiscR * 0.008);
                    } else {
                        ctx.strokeStyle = (g % 2 === 0) ? 'rgba(255, 255, 255, 0.055)' : 'rgba(0, 0, 0, 0.42)';
                        ctx.lineWidth = Math.max(0.6, sDiscR * 0.0022);
                    }
                    ctx.stroke();
                }

                // Crisp outer vinyl rim highlight
                ctx.beginPath();
                ctx.arc(discCX, discCY, sDiscR - Math.max(1, scale), 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
                ctx.lineWidth = Math.max(1, scale * 1.1);
                ctx.stroke();

                // 3. Center Record Label (colored dynamically from photo's dominant palette!)
                const labelR = sDiscR * 0.335;
                const pal = (imgData.palette && imgData.palette[0]) || { r: 185, g: 56, b: 42 };
                const lblLuma = 0.299 * pal.r + 0.587 * pal.g + 0.114 * pal.b;
                const lblInk = lblLuma > 155 ? '#111113' : '#fafaf9';
                const lblSub = lblLuma > 155 ? 'rgba(17,17,19,0.68)' : 'rgba(250,250,249,0.74)';

                ctx.fillStyle = `rgb(${pal.r}, ${pal.g}, ${pal.b})`;
                ctx.beginPath();
                ctx.arc(discCX, discCY, labelR, 0, Math.PI * 2);
                ctx.fill();

                // Subtle pressed paper ring on center label
                ctx.strokeStyle = lblLuma > 155 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.28)';
                ctx.lineWidth = Math.max(1, scale * 0.9);
                ctx.beginPath();
                ctx.arc(discCX, discCY, labelR * 0.86, 0, Math.PI * 2);
                ctx.stroke();

                // Center label typography (visible on the exposed right half!)
                const lf = labelR * 0.125;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = lblInk;
                ctx.font = `700 ${lf * 0.95}px "JetBrains Mono", monospace`;
                ctx.fillText('SIDE A', discCX + labelR * 0.42, discCY - lf * 1.05);
                ctx.fillStyle = lblSub;
                ctx.font = `500 ${lf * 0.72}px "JetBrains Mono", monospace`;
                ctx.fillText('33⅓ RPM', discCX + labelR * 0.42, discCY + lf * 0.1);
                ctx.fillText('STEREO', discCX + labelR * 0.42, discCY + lf * 1.15);

                // Center spindle hole (revealing wall color + dark rim)
                const holeR = sDiscR * 0.044;
                ctx.fillStyle = baseWall;
                ctx.beginPath();
                ctx.arc(discCX, discCY, holeR, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
                ctx.lineWidth = Math.max(1, scale * 1.2);
                ctx.stroke();
                ctx.restore();

                // 4. Square Cardboard Album Sleeve (cast shadow onto both wall AND vinyl disc!)
                ctx.save();
                ctx.shadowColor = isDarkWall ? `rgba(0, 0, 0, ${0.82 * shadowMultiplier})` : `rgba(0, 0, 0, ${0.3 * shadowMultiplier})`;
                ctx.shadowBlur = sSleeve * 0.058 * shadowMultiplier;
                ctx.shadowOffsetX = sSleeve * 0.018 * shadowMultiplier;
                ctx.shadowOffsetY = sSleeve * 0.028 * shadowMultiplier;
                ctx.fillStyle = '#18181b';
                ctx.fillRect(sX, sY, sSleeve, sSleeve);
                ctx.restore();

                // Clip & cover-crop photograph cleanly into 1:1 album jacket
                ctx.save();
                ctx.beginPath();
                ctx.rect(sX, sY, sSleeve, sSleeve);
                ctx.clip();

                const imgRatio = imgW / imgH;
                let drawW = sSleeve, drawH = sSleeve, drawX = sX, drawY = sY;
                if (imgRatio > 1) {
                    drawW = sSleeve * imgRatio;
                    drawX = sX - (drawW - sSleeve) / 2;
                } else {
                    drawH = sSleeve / imgRatio;
                    drawY = sY - (drawH - sSleeve) / 2;
                }
                const fImg = app.getFilteredImage(imgData, drawW, drawH, bwAmount, invertAmount);
                ctx.drawImage(fImg, drawX, drawY, drawW, drawH);

                // Subtle cardboard sleeve surface sheen & physical ring-wear / spine crease
                const spineX = sX + sSleeve * 0.024;
                const spineGrad = ctx.createLinearGradient(sX, sY, spineX + sSleeve * 0.018, sY);
                spineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
                spineGrad.addColorStop(0.42, 'rgba(0, 0, 0, 0.24)');
                spineGrad.addColorStop(0.58, 'rgba(255, 255, 255, 0.14)');
                spineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = spineGrad;
                ctx.fillRect(sX, sY, sSleeve * 0.045, sSleeve);

                // Delicate soft dark scrim at bottom-left for razor-sharp cover typography
                const scrim = ctx.createLinearGradient(sX, sY + sSleeve * 0.68, sX, sY + sSleeve);
                scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
                scrim.addColorStop(1, 'rgba(0, 0, 0, 0.56)');
                ctx.fillStyle = scrim;
                ctx.fillRect(sX, sY + sSleeve * 0.68, sSleeve, sSleeve * 0.32);

                if (grainAmount > 0) {
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.fillStyle = app.createFilmGrainPattern(ctx);
                    ctx.globalAlpha = Math.min(0.45, grainAmount * 0.85);
                    ctx.fillRect(sX, sY, sSleeve, sSleeve);
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1;
                }

                // Minimalist ECM / Art-House LP Cover Typography
                const fBase = sSleeve * 0.019;
                const covPad = sSleeve * 0.055;

                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
                ctx.font = `italic 600 ${fBase * 2.25}px "Cormorant Garamond", "Noto Serif SC", serif`;
                ctx.fillText(fitText(textLeft || 'Nocturne in Light', sSleeve * 0.72), sX + covPad, sY + sSleeve - covPad - fBase * 1.45);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.74)';
                ctx.font = `500 ${fBase * 0.72}px "JetBrains Mono", monospace`;
                setTrack(fBase * 0.12);
                ctx.fillText(fitText(`${(exifCamera || 'ANALOG STUDIO').toUpperCase()}  ·  ${exifParams || '35mm  f/2.0  1/250s'}`, sSleeve * 0.68), sX + covPad, sY + sSleeve - covPad);
                setTrack(0);

                // Right corner micro pressing mark
                ctx.textAlign = 'right';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
                ctx.font = `600 ${fBase * 0.66}px "JetBrains Mono", monospace`;
                ctx.fillText('12" LP · 33⅓', sX + sSleeve - covPad, sY + sSleeve - covPad);
                ctx.restore();

                // Crisp sleeve edge bevel
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
                ctx.lineWidth = Math.max(1, scale * 0.9);
                ctx.strokeRect(sX, sY, sSleeve, sSleeve);
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

                // Subtle recessed inner bevel shadow for true 3D museum mat depth
                ctx.save();
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
                ctx.lineWidth = Math.max(1, scale * 1.1);
                ctx.beginPath();
                ctx.moveTo(iX, iY + iH); ctx.lineTo(iX, iY); ctx.lineTo(iX + iW, iY);
                ctx.stroke();
                ctx.restore();

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
                    const innerInset = Math.max(1.5, fBase * 0.16);
                    ctx.lineWidth = Math.max(0.7, fBase * 0.05);
                    ctx.strokeRect(stampX + innerInset, stampY + innerInset, stampSize - innerInset * 2, stampSize - innerInset * 2);

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
                    const drawCell = (lbl, val, x, y, maxW, isBoldSans) => {
                        ctx.fillStyle = '#71717a';
                        ctx.font = `600 ${fBase * 0.65}px "JetBrains Mono", monospace`;
                        ctx.fillText(lbl, x, y);
                        ctx.fillStyle = '#0a0a0a';
                        ctx.font = isBoldSans ? `700 ${fBase * 1.05}px "Inter", sans-serif` : `600 ${fBase * 0.88}px "JetBrains Mono", monospace`;
                        ctx.fillText(fitText(val, maxW), x, y + cellPad * 1.2);
                    };

                    const col3W = iW - col1W - col2W;
                    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                    drawCell('01 / ARTWORK TITLE', (textLeft || 'UNTITLED ARTWORK').toUpperCase(), sPad + cellPad, footTop + cellPad * 0.75, col1W - cellPad * 2, true);
                    drawCell('02 / OPTICAL SYSTEM', (exifCamera || 'DIGITAL CAMERA').toUpperCase(), sPad + col1W + cellPad, footTop + cellPad * 0.75, col2W - cellPad * 2, false);
                    drawCell('03 / CHRONOLOGY', (exifTime || '2026 ARCHIVE').toUpperCase(), sPad + col1W + col2W + cellPad, footTop + cellPad * 0.75, col3W - cellPad * 2, false);

                    const r2Top = footTop + row1H;
                    drawCell('04 / GEO-COORDINATES', imgData.location || "38° 55' 00\" N  121° 38' 00\" E", sPad + cellPad, r2Top + cellPad * 0.65, col1W - cellPad * 2, false);
                    drawCell('05 / EXPOSURE TELEMETRY', exifParams || '24mm  f/2.8  1/125s  ISO 400', sPad + col1W + cellPad, r2Top + cellPad * 0.65, col2W - cellPad * 2, false);

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
                    const leftHistMaxW = iW * 0.60;

                    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `700 ${fBase * 1.35}px "Inter", sans-serif`;
                    ctx.fillText(fitText((exifCamera || 'DIGITAL CAMERA').toUpperCase(), leftHistMaxW), iX, topY);

                    ctx.fillStyle = '#71717a';
                    ctx.font = `500 ${fBase * 0.85}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText((exifLens || 'STANDARD LENS').toUpperCase(), leftHistMaxW), iX, topY + fBase * 1.85);

                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `600 ${fBase * 0.9}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText(exifParams || '24mm   f/2.8   1/125s   ISO 400', leftHistMaxW), iX, topY + fBase * 3.25);

                    ctx.fillStyle = '#a1a1aa';
                    ctx.font = `500 ${fBase * 0.72}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText(`${imgData.width}×${imgData.height}PX // ${imgData.colorProfile || 'DISPLAY-P3'}`, leftHistMaxW), iX, topY + fBase * 4.65);

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

        // 9. 暗房高光溢光 (HALATION LAB)
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

        // 13. 极简细线留白 (MINIMAL LINE — 纯净无字)
        } else if (style === 'minimal_line') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.145 * matMultiplier;
            const padTop = shortEdge * 0.21 * matMultiplier;
            const padBot = shortEdge * 0.29 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padTop + padBot;

            drawLogic = (scale) => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sceneW * scale, sceneH * scale);
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);
                ctx.strokeStyle = '#0a0a0a';
                ctx.lineWidth = Math.max(1.2, shortEdge * 0.0018 * scale);
                ctx.strokeRect(iX, iY, iW, iH);
            };

        // 14. 三联画廊海报 (TRIPTYCH WATERMARK)
        } else if (style === 'triptych_watermark') {
            wallPaddingX = 0; wallPaddingY = 0;
            const isPortrait = imgH > imgW;
            const padX = shortEdge * 0.1 * matMultiplier;
            const padTop = shortEdge * (isPortrait ? 0.22 : 0.34) * matMultiplier;
            const padBot = shortEdge * (isPortrait ? 0.36 : 0.48) * matMultiplier;
            const gap = shortEdge * 0.016;

            sceneW = isPortrait ? imgW + padX * 2 : imgW + (gap * 2) + padX * 2;
            sceneH = isPortrait ? imgH + (gap * 2) + padTop + padBot : imgH + padTop + padBot;

            drawLogic = (scale) => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sceneW * scale, sceneH * scale);

                const sPadX = padX * scale, sPadTop = padTop * scale, sGap = gap * scale;
                const iW = imgW * scale, iH = imgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                const srcW = fImg.naturalWidth || fImg.width, srcH = fImg.naturalHeight || fImg.height;
                ctx.strokeStyle = 'rgba(10, 10, 10, 0.12)';
                ctx.lineWidth = Math.max(0.75, scale * 0.8);

                if (isPortrait) {
                    const sPanelH = srcH / 3, dPanelH = iH / 3;
                    for (let k = 0; k < 3; k++) {
                        const py = sPadTop + k * (dPanelH + sGap);
                        ctx.drawImage(fImg, 0, sPanelH * k, srcW, sPanelH, sPadX, py, iW, dPanelH);
                        ctx.strokeRect(sPadX, py, iW, dPanelH);
                    }
                } else {
                    const sPanelW = srcW / 3, dPanelW = iW / 3;
                    for (let k = 0; k < 3; k++) {
                        const px = sPadX + k * (dPanelW + sGap);
                        ctx.drawImage(fImg, sPanelW * k, 0, sPanelW, srcH, px, sPadTop, dPanelW, iH);
                        ctx.strokeRect(px, sPadTop, dPanelW, iH);
                    }
                }

                if (matMultiplier > 0.3) {
                    const centerX = sceneW * scale / 2;
                    const totalImgDrawH = isPortrait ? (iH + sGap * 2) : iH;
                    const textY = sPadTop + totalImgDrawH + (padBot * scale * 0.45);
                    const fontSize = shortEdge * 0.0145 * scale;

                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#18181b';
                    ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
                    setTrack(fontSize * 0.52);
                    ctx.fillText(fitText((textLeft || 'THE PHOTO').toUpperCase(), iW * 0.9), centerX, textY - (fontSize * 0.85));

                    const yearMatch = (imgData.exifDate || imgData.exifTime || '').match(/\d{4}/);
                    ctx.fillStyle = '#71717a';
                    ctx.font = `400 ${fontSize * 0.82}px "JetBrains Mono", monospace`;
                    setTrack(fontSize * 0.35);
                    ctx.fillText(`TRIPTYCH EDITION · ${yearMatch ? yearMatch[0] : '2026'}`, centerX, textY + (fontSize * 0.9));
                    setTrack(0);
                }
            };

        // 15. 复古拍立得 (POLAROID)
        } else if (style === 'polaroid') {
            const matX = shortEdge * 0.08 * matMultiplier, matTop = shortEdge * 0.08 * matMultiplier, matBot = shortEdge * 0.3 * matMultiplier;
            const paperW = imgW + matX * 2, paperH = imgH + matTop + matBot;
            sceneW = paperW + wallPaddingX * 2; sceneH = paperH + wallPaddingY * 2;

            drawLogic = (scale) => {
                drawBackground(scale);
                const pX = wallPaddingX * scale, pY = wallPaddingY * scale, pW = paperW * scale, pH = paperH * scale;
                ctx.save();
                ctx.shadowColor = `rgba(0, 0, 0, ${0.16 * shadowMultiplier})`;
                ctx.shadowBlur = shortEdge * 0.045 * scale * shadowMultiplier;
                ctx.shadowOffsetY = shortEdge * 0.022 * scale * shadowMultiplier;
                ctx.fillStyle = '#faf8f3'; ctx.fillRect(pX, pY, pW, pH);
                ctx.restore();
                ctx.strokeStyle = 'rgba(10, 10, 10, 0.06)';
                ctx.lineWidth = Math.max(1, scale * 0.8);
                ctx.strokeRect(pX, pY, pW, pH);

                const iX = pX + matX * scale, iY = pY + matTop * scale, iW = imgW * scale, iH = imgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);
                ctx.strokeStyle = `rgba(0,0,0,${0.08 * Math.max(0.4, shadowMultiplier)})`;
                ctx.lineWidth = Math.max(1, shortEdge * 0.002 * scale);
                ctx.strokeRect(iX, iY, iW, iH);

                if (matMultiplier > 0.45) {
                    const fBase = shortEdge * 0.0155 * scale;
                    const chinCenterY = iY + iH + (matBot * scale * 0.5);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#27272a';
                    ctx.font = `italic 600 ${fBase * 1.45}px "Cormorant Garamond", "Noto Serif SC", serif`;
                    ctx.fillText(fitText(textLeft || 'Instant Memory', iW * 0.9), pX + pW / 2, chinCenterY - fBase * 0.55);

                    ctx.fillStyle = '#71717a';
                    ctx.font = `400 ${fBase * 0.72}px "JetBrains Mono", monospace`;
                    setTrack(fBase * 0.16);
                    ctx.fillText((exifTime || '2026').toUpperCase(), pX + pW / 2, chinCenterY + fBase * 1.15);
                    setTrack(0);
                }
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
                    ctx.beginPath(); drawSafeRoundRect(x, topHoleY, holeW, holeH, holeW / 2); drawSafeRoundRect(x, botHoleY, holeW, holeH, holeW / 2); ctx.fill();
                }

                const iX = fX + filmPadX * scale, iY = fY + filmPadY * scale, iW = targetImgW * scale, iH = targetImgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.4) {
                    const fontSize = baseH * 0.018 * scale; ctx.textBaseline = 'middle';
                    const textTopY = fY + filmPadY * 0.65 * scale, textBotY = fY + fH - filmPadY * 0.65 * scale;
                    const bcW = baseH * 0.05 * scale, bcH = baseH * 0.01 * scale;
                    app.drawDXCode(ctx, iX, textTopY - bcH * 0.5, bcW, bcH, 42);

                    ctx.save();
                    ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
                    ctx.shadowBlur = Math.max(2, fontSize * 0.25);
                    ctx.fillStyle = '#facc15'; ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
                    ctx.textAlign = 'left'; ctx.fillText('22A', iX + bcW * 1.5, textTopY);
                    ctx.textAlign = 'center'; ctx.fillText((filmName || 'KODAK PORTRA 400').toUpperCase(), iX + iW / 2, textTopY);
                    ctx.textAlign = 'right'; ctx.fillText('23', iX + iW, textTopY);

                    ctx.font = `400 ${fontSize * 0.8}px "JetBrains Mono", monospace`; ctx.fillStyle = 'rgba(250, 204, 21, 0.72)';
                    ctx.textAlign = 'center'; ctx.fillText(exifParams || '', iX + iW / 2, textBotY);
                    ctx.restore();
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

                // 真实 4x5 大画幅底片右上角识别切口 (Sheet Film Notch Code)
                const notchBaseX = fX + sBlackW - baseH * 0.09 * scale;
                const notchH = baseH * 0.012 * scale;
                ctx.fillStyle = '#f9f9f9';
                ctx.beginPath();
                ctx.moveTo(notchBaseX, fY);
                ctx.lineTo(notchBaseX + notchH * 0.8, fY + notchH);
                ctx.lineTo(notchBaseX + notchH * 1.6, fY);
                ctx.moveTo(notchBaseX + notchH * 2.3, fY);
                ctx.arc(notchBaseX + notchH * 3.0, fY, notchH * 0.7, 0, Math.PI, false);
                ctx.fill();

                const iX = fX + blackBorderSide * scale, iY = fY + blackBorderTop * scale, iW = targetImgW * scale, iH = targetImgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.4) {
                    const fontSize = baseH * 0.012 * scale;
                    ctx.save();
                    ctx.shadowColor = 'rgba(245, 158, 11, 0.35)';
                    ctx.shadowBlur = Math.max(1.5, fontSize * 0.22);
                    ctx.fillStyle = '#facc15'; ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`; ctx.textBaseline = 'middle';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${(filmName || 'FUJIFILM   RVP50').toUpperCase()}       50782       D L AGA I`, fX + sBlackW / 2, fY + blackBorderTop * scale * 0.5);
                    ctx.restore();
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
                        ctx.beginPath(); drawSafeRoundRect(x, topHoleY, holeW, holeH, holeW / 2); drawSafeRoundRect(x, botHoleY, holeW, holeH, holeW / 2); ctx.fill();
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
                            const fontSize = baseH * 0.018 * scale;
                            const textTopY = fY + filmPadY * 0.65 * scale;
                            const textBotY = fY + fH - filmPadY * 0.65 * scale;
                            const frameNo = rowIndex * maxPerRow + idx + 1;
                            ctx.save();
                            ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
                            ctx.shadowBlur = Math.max(2, fontSize * 0.22);
                            ctx.fillStyle = '#facc15'; ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
                            ctx.textBaseline = 'middle';
                            ctx.textAlign = 'left'; ctx.fillText(`${frameNo}A`, iX, textTopY);
                            ctx.textAlign = 'center'; ctx.fillText((item.originalData.filmName || 'KODAK PORTRA 400').toUpperCase(), iX + iW / 2, textTopY);
                            ctx.textAlign = 'right'; ctx.fillText(`${frameNo + 1}`, iX + iW, textTopY);
                            ctx.font = `400 ${fontSize * 0.72}px "JetBrains Mono", monospace`;
                            ctx.fillStyle = 'rgba(250, 204, 21, 0.68)';
                            ctx.textAlign = 'center';
                            ctx.fillText(fitText(item.originalData.exifParams || '', iW * 0.9), iX + iW / 2, textBotY);
                            ctx.restore();
                        }
                        currX += iW + gap * scale;
                    });

                    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = grainPat; ctx.globalAlpha = grainAlpha; ctx.fillRect(fX, fY, fW, fH); ctx.restore();
                    currentY += fH + stripGap * scale;
                });
                if (dragDrawOperation) dragDrawOperation();
            };

        // 22. INS 4:5 纯白画廊留白 (INS 4:5 FEED - NEW)
        } else if (style === 'ins_45_story') {
            wallPaddingX = 0; wallPaddingY = 0;
            // Strict 4:5 portrait ratio (Instagram & Xiaohongshu optimal vertical feed)
            const baseW = 1600, baseH = 2000;
            sceneW = baseW;
            sceneH = baseH;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                ctx.fillStyle = wallColor === '#0a0a0a' ? '#0e0e10' : (wallColor || '#ffffff');
                ctx.fillRect(0, 0, sW, sH);
                const isDarkWall = wallColor === '#0a0a0a';

                const padX = baseW * 0.085 * Math.min(1.5, Math.max(0.5, matMultiplier)) * scale;
                const padTop = baseH * 0.08 * Math.min(1.5, Math.max(0.5, matMultiplier)) * scale;
                const padBot = baseH * 0.145 * Math.min(1.5, Math.max(0.5, matMultiplier)) * scale;
                const availW = sW - padX * 2;
                const availH = sH - padTop - padBot;

                const imgRatio = imgW / imgH;
                let drawW = availW, drawH = availW / imgRatio;
                if (drawH > availH) {
                    drawH = availH;
                    drawW = availH * imgRatio;
                }
                const drawX = (sW - drawW) / 2;
                const drawY = padTop + (availH - drawH) / 2;

                ctx.save();
                if (shadowMultiplier > 0) {
                    ctx.shadowColor = isDarkWall ? `rgba(0,0,0,${0.45 * shadowMultiplier})` : `rgba(0,0,0,${0.09 * shadowMultiplier})`;
                    ctx.shadowBlur = baseW * 0.025 * scale * shadowMultiplier;
                    ctx.shadowOffsetY = baseW * 0.01 * scale * shadowMultiplier;
                }
                const fImg = app.getFilteredImage(imgData, drawW, drawH, bwAmount, invertAmount);
                ctx.drawImage(fImg, drawX, drawY, drawW, drawH);
                ctx.restore();

                ctx.strokeStyle = isDarkWall ? 'rgba(255,255,255,0.12)' : 'rgba(10,10,10,0.08)';
                ctx.lineWidth = Math.max(1, scale * 0.8);
                ctx.strokeRect(drawX, drawY, drawW, drawH);

                if (matMultiplier > 0.35) {
                    const fBase = baseW * 0.0135 * scale;
                    const photoBottom = drawY + drawH;
                    const footY = photoBottom + Math.min((sH - photoBottom) * 0.5, padBot * 0.72);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = isDarkWall ? '#f4f4f5' : '#0a0a0a';
                    ctx.font = `600 ${fBase * 1.1}px "Inter", sans-serif`;
                    setTrack(fBase * 0.22);
                    ctx.fillText(fitText((exifCamera || 'DIGITAL CAMERA').toUpperCase(), sW * 0.84), sW / 2, footY - fBase * 0.85);

                    ctx.fillStyle = isDarkWall ? '#a1a1aa' : '#71717a';
                    ctx.font = `400 ${fBase * 0.78}px "JetBrains Mono", monospace`;
                    setTrack(fBase * 0.14);
                    ctx.fillText(fitText(`${(exifLens || 'LENS').toUpperCase()}   ·   ${exifParams || '35mm  f/1.4  1/250s  ISO 100'}`, sW * 0.86), sW / 2, footY + fBase * 0.85);
                    setTrack(0);
                }
            };

        // 23. 3:4 画报卡片 (EDITORIAL CARD)
        } else if (style === 'xhs_editorial') {
            wallPaddingX = 0; wallPaddingY = 0;
            // Strict 3:4 vertical ratio
            const baseW = 1500, baseH = 2000;
            sceneW = baseW;
            sceneH = baseH;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const pad = baseW * 0.068 * Math.min(1.4, Math.max(0.55, matMultiplier)) * scale;
                const headerH = baseH * 0.075 * scale;
                const footerH = baseH * 0.175 * scale;

                // Warm editorial paper surface
                ctx.fillStyle = '#f8f7f3';
                ctx.fillRect(0, 0, sW, sH);

                const fBase = baseW * 0.0145 * scale;
                const innerW = sW - pad * 2;

                // Top header bar: minimalist issue tag + date pill
                ctx.textBaseline = 'middle';
                const topY = pad + headerH * 0.35;
                ctx.textAlign = 'left';
                ctx.fillStyle = '#18181b';
                ctx.font = `700 ${fBase * 0.85}px "JetBrains Mono", monospace`;
                setTrack(fBase * 0.18);
                ctx.fillText('NO. 01  //  VISUAL ARCHIVE', pad, topY);
                setTrack(0);

                // Right date pill
                const dateLabel = (exifTime || '2026').toUpperCase();
                ctx.font = `600 ${fBase * 0.74}px "JetBrains Mono", monospace`;
                const pillW = ctx.measureText(dateLabel).width + fBase * 1.5;
                const pillH = fBase * 1.85;
                ctx.fillStyle = '#18181b';
                ctx.fillRect(pad + innerW - pillW, topY - pillH / 2, pillW, pillH);
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(dateLabel, pad + innerW - pillW / 2, topY + fBase * 0.05);

                // Inset photo area (cover-fit cleanly inside 3:4 card window)
                const photoX = pad;
                const photoY = pad + headerH;
                const photoW = innerW;
                const photoH = sH - photoY - footerH - pad * 0.55;

                ctx.save();
                ctx.beginPath();
                ctx.rect(photoX, photoY, photoW, photoH);
                ctx.clip();
                const imgRatio = imgW / imgH;
                const boxRatio = photoW / photoH;
                let drawW = photoW, drawH = photoH, drawX = photoX, drawY = photoY;
                if (imgRatio > boxRatio) {
                    drawW = photoH * imgRatio;
                    drawX = photoX - (drawW - photoW) / 2;
                } else {
                    drawH = photoW / imgRatio;
                    drawY = photoY - (drawH - photoH) / 2;
                }
                const fImg = app.getFilteredImage(imgData, drawW, drawH, bwAmount, invertAmount);
                ctx.drawImage(fImg, drawX, drawY, drawW, drawH);
                ctx.restore();

                ctx.strokeStyle = 'rgba(10, 10, 10, 0.1)';
                ctx.lineWidth = Math.max(1, scale * 0.8);
                ctx.strokeRect(photoX, photoY, photoW, photoH);

                // Bottom editorial caption + 4-dot palette + EXIF
                const footTop = photoY + photoH + fBase * 1.55;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillStyle = '#0a0a0a';
                ctx.font = `italic 600 ${fBase * 2.05}px "Cormorant Garamond", "Noto Serif SC", serif`;
                ctx.fillText(fitText(textLeft || 'Captured Moments', innerW * 0.72), pad, footTop);

                // 4-dot minimalist color palette on right
                if (imgData.palette && imgData.palette.length > 0) {
                    const dotR = fBase * 0.58;
                    const dotGap = fBase * 0.5;
                    imgData.palette.slice(0, 4).forEach((c, idx) => {
                        const cx = pad + innerW - dotR - idx * (dotR * 2 + dotGap);
                        const cy = footTop + fBase * 1.05;
                        ctx.fillStyle = c.rgbStr || c.hex;
                        ctx.beginPath();
                        ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = 'rgba(10,10,10,0.14)';
                        ctx.lineWidth = Math.max(0.75, scale * 0.6);
                        ctx.stroke();
                    });
                }

                // Hairline divider
                const divY = footTop + fBase * 3.15;
                ctx.strokeStyle = '#d4d4d8';
                ctx.lineWidth = Math.max(1, scale * 0.8);
                ctx.beginPath();
                ctx.moveTo(pad, divY); ctx.lineTo(pad + innerW, divY);
                ctx.stroke();

                // Camera & Exposure footer
                const specY = divY + fBase * 0.95;
                ctx.textAlign = 'left';
                ctx.fillStyle = '#18181b';
                ctx.font = `600 ${fBase * 0.82}px "JetBrains Mono", monospace`;
                ctx.fillText(fitText(`${(exifCamera || 'CAMERA').toUpperCase()}  ·  ${(exifLens || 'LENS').toUpperCase()}`, innerW * 0.58), pad, specY);

                ctx.textAlign = 'right';
                ctx.fillStyle = '#71717a';
                ctx.font = `400 ${fBase * 0.8}px "JetBrains Mono", monospace`;
                ctx.fillText(fitText(exifParams || '35mm  f/2.0  1/250s  ISO 100', innerW * 0.4), pad + innerW, specY);
            };

        // 24. 复古报纸头版 (THE DAILY PRESS - NEW)
        } else if (style === 'newspaper_press') {
            wallPaddingX = 0; wallPaddingY = 0;
            // Authentic broadsheet portrait ratio (3:4)
            const baseW = 1500, baseH = 2000;
            sceneW = baseW;
            sceneH = baseH;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const pad = baseW * 0.065 * Math.min(1.35, Math.max(0.65, matMultiplier)) * scale;
                const innerW = sW - pad * 2;
                const fBase = baseW * 0.0145 * scale;

                // Warm vintage newsprint stock
                ctx.fillStyle = '#f3efe6';
                ctx.fillRect(0, 0, sW, sH);

                // Subtle newsprint paper fiber grain
                ctx.save();
                ctx.globalCompositeOperation = 'multiply';
                ctx.fillStyle = app.createFilmGrainPattern(ctx);
                ctx.globalAlpha = 0.22;
                ctx.fillRect(0, 0, sW, sH);
                ctx.restore();

                const ink = '#1c1917';
                const inkMuted = '#57534e';

                // Top broadsheet masthead border
                let curY = pad * 0.85;
                ctx.strokeStyle = ink;
                ctx.lineWidth = Math.max(1.5, scale * 1.6);
                ctx.beginPath();
                ctx.moveTo(pad, curY); ctx.lineTo(pad + innerW, curY);
                ctx.stroke();

                // Masthead title
                curY += fBase * 1.0;
                ctx.fillStyle = ink;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.font = `700 ${fBase * 3.55}px "Cormorant Garamond", "Noto Serif SC", Georgia, serif`;
                setTrack(fBase * 0.24);
                ctx.fillText('THE VISUAL CHRONICLE', sW / 2, curY);
                setTrack(0);

                // Double broadsheet rule + dateline bar
                curY += fBase * 4.25;
                ctx.strokeStyle = ink;
                ctx.lineWidth = Math.max(2, scale * 2.2);
                ctx.beginPath();
                ctx.moveTo(pad, curY); ctx.lineTo(pad + innerW, curY);
                ctx.stroke();

                const datelineH = fBase * 2.15;
                const datelineMid = curY + datelineH * 0.54;
                ctx.fillStyle = ink;
                ctx.textBaseline = 'middle';
                ctx.font = `600 ${fBase * 0.68}px "JetBrains Mono", monospace`;
                setTrack(fBase * 0.12);
                ctx.textAlign = 'left';
                ctx.fillText('VOL. XIV · NO. 28', pad, datelineMid);
                ctx.textAlign = 'center';
                ctx.fillText((exifTime || 'NOVEMBER 20, 2026').toUpperCase(), sW / 2, datelineMid);
                ctx.textAlign = 'right';
                ctx.fillText('PHOTOGRAPHY EDITION', pad + innerW, datelineMid);
                setTrack(0);

                curY += datelineH;
                ctx.lineWidth = Math.max(1, scale * 1.0);
                ctx.beginPath();
                ctx.moveTo(pad, curY); ctx.lineTo(pad + innerW, curY);
                ctx.stroke();
                ctx.lineWidth = Math.max(0.75, scale * 0.7);
                ctx.beginPath();
                ctx.moveTo(pad, curY + fBase * 0.26); ctx.lineTo(pad + innerW, curY + fBase * 0.26);
                ctx.stroke();

                // Lead Headline
                curY += fBase * 1.1;
                ctx.fillStyle = ink;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.font = `700 ${fBase * 2.45}px "Cormorant Garamond", "Noto Serif SC", Georgia, serif`;
                ctx.fillText(fitText((textLeft || 'A Quiet Study in Light & Shadow'), innerW), pad, curY);

                // Sub-deck line
                curY += fBase * 2.85;
                ctx.fillStyle = inkMuted;
                ctx.font = `italic 500 ${fBase * 1.05}px "Cormorant Garamond", "Noto Serif SC", Georgia, serif`;
                ctx.fillText(fitText(`Field Dispatch — ${(exifCamera || 'Optical Camera').toUpperCase()}  ·  ${(exifLens || 'Prime Lens').toUpperCase()}`, innerW), pad, curY);

                // Main Broadsheet Photograph
                curY += fBase * 1.85;
                const footerH = baseH * 0.155 * scale;
                const photoH = sH - curY - footerH - pad * 0.55;
                const photoW = innerW;

                ctx.save();
                ctx.beginPath();
                ctx.rect(pad, curY, photoW, photoH);
                ctx.clip();
                const imgRatio = imgW / imgH;
                const boxRatio = photoW / photoH;
                let drawW = photoW, drawH = photoH, drawX = pad, drawY = curY;
                if (imgRatio > boxRatio) {
                    drawW = photoH * imgRatio;
                    drawX = pad - (drawW - photoW) / 2;
                } else {
                    drawH = photoW / imgRatio;
                    drawY = curY - (drawH - photoH) / 2;
                }
                const fImg = app.getFilteredImage(imgData, drawW, drawH, bwAmount, invertAmount);
                ctx.drawImage(fImg, drawX, drawY, drawW, drawH);

                if (grainAmount > 0) {
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.fillStyle = app.createFilmGrainPattern(ctx);
                    ctx.globalAlpha = Math.min(0.42, grainAmount * 0.9);
                    ctx.fillRect(pad, curY, photoW, photoH);
                }
                ctx.restore();

                // Crisp broadsheet ink frame around photo
                ctx.strokeStyle = ink;
                ctx.lineWidth = Math.max(1.2, scale * 1.2);
                ctx.strokeRect(pad, curY, photoW, photoH);

                // 2-Column Editorial Footer beneath photo
                const footTop = curY + photoH + fBase * 1.15;
                const footBot = sH - pad * 0.85;
                const colSplitX = pad + innerW * 0.54;

                // Vertical column divider
                ctx.strokeStyle = 'rgba(28, 25, 23, 0.35)';
                ctx.lineWidth = Math.max(0.8, scale * 0.8);
                ctx.beginPath();
                ctx.moveTo(colSplitX, footTop);
                ctx.lineTo(colSplitX, footBot - fBase * 1.4);
                ctx.stroke();

                // Left column: Figure caption & technical telemetry
                const c1MaxW = (colSplitX - pad) - fBase * 1.4;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillStyle = ink;
                ctx.font = `700 ${fBase * 0.74}px "JetBrains Mono", monospace`;
                ctx.fillText('FIG. 01 — TECHNICAL TELEMETRY', pad, footTop);

                ctx.fillStyle = inkMuted;
                ctx.font = `500 ${fBase * 0.78}px "JetBrains Mono", monospace`;
                ctx.fillText(fitText(exifParams || '35mm   f/2.0   1/250s   ISO 400', c1MaxW), pad, footTop + fBase * 1.35);
                ctx.font = `400 ${fBase * 0.7}px "JetBrains Mono", monospace`;
                ctx.fillText(fitText(`COORDS: ${imgData.location || "38° 55' 00\" N  121° 38' 00\" E"}`, c1MaxW), pad, footTop + fBase * 2.7);
                ctx.fillText(fitText(`FORMAT: ${imgData.width}×${imgData.height}PX  ·  ${imgData.colorProfile || 'P3'}`, c1MaxW), pad, footTop + fBase * 3.95);

                // Right column: Archival press note
                const c2X = colSplitX + fBase * 1.4;
                const c2MaxW = (pad + innerW) - c2X;
                ctx.fillStyle = ink;
                ctx.font = `700 ${fBase * 0.74}px "JetBrains Mono", monospace`;
                ctx.fillText('PRESS ARCHIVE NOTE', c2X, footTop);

                ctx.fillStyle = inkMuted;
                ctx.font = `italic 500 ${fBase * 0.98}px "Cormorant Garamond", "Noto Serif SC", Georgia, serif`;
                ctx.fillText(fitText(`"${textLeft || 'Untitled'}" — Archival Press Proof`, c2MaxW), c2X, footTop + fBase * 1.3);
                ctx.font = `400 ${fBase * 0.7}px "JetBrains Mono", monospace`;
                ctx.fillText(fitText(`OPTICS: ${(exifCamera || 'CAMERA').toUpperCase()}`, c2MaxW), c2X, footTop + fBase * 2.75);
                ctx.fillText(fitText(`LENS: ${(exifLens || 'STANDARD').toUpperCase()}`, c2MaxW), c2X, footTop + fBase * 3.95);

                // Bottom broadsheet folio rule
                ctx.strokeStyle = ink;
                ctx.lineWidth = Math.max(1.2, scale * 1.2);
                ctx.beginPath();
                ctx.moveTo(pad, footBot); ctx.lineTo(pad + innerW, footBot);
                ctx.stroke();
            };

        // 23. 电影宽银幕字幕 (2.39:1 CINEMA SCOPE - NEW)
        } else if (style === 'cinema_scope') {
            wallPaddingX = 0; wallPaddingY = 0;
            const targetRatio = 2.39;
            const frameW = Math.max(imgW, Math.round(imgH * targetRatio));
            const frameH = Math.round(frameW / targetRatio);
            const barH = Math.round(frameH * 0.22 * matMultiplier);
            sceneW = frameW;
            sceneH = frameH + barH * 2;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const sBar = barH * scale, sFrameH = frameH * scale;

                ctx.fillStyle = '#050506';
                ctx.fillRect(0, 0, sW, sH);

                // Center-crop image into 2.39:1 anamorphic frame
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, sBar, sW, sFrameH);
                ctx.clip();

                const imgRatio = imgW / imgH;
                let drawW = sW, drawH = sFrameH, drawX = 0, drawY = sBar;
                if (imgRatio > targetRatio) {
                    drawW = sFrameH * imgRatio;
                    drawX = (sW - drawW) / 2;
                } else {
                    drawH = sW / imgRatio;
                    drawY = sBar + (sFrameH - drawH) / 2;
                }
                const fImg = app.getFilteredImage(imgData, drawW, drawH, bwAmount, invertAmount);
                ctx.drawImage(fImg, drawX, drawY, drawW, drawH);

                // Subtle cinema vignette & grain
                const vig = ctx.createRadialGradient(sW / 2, sBar + sFrameH / 2, sFrameH * 0.35, sW / 2, sBar + sFrameH / 2, sW * 0.65);
                vig.addColorStop(0, 'rgba(0,0,0,0)');
                vig.addColorStop(1, 'rgba(0,0,0,0.28)');
                ctx.fillStyle = vig;
                ctx.fillRect(0, sBar, sW, sFrameH);

                if (grainAmount > 0) {
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.fillStyle = app.createFilmGrainPattern(ctx);
                    ctx.globalAlpha = Math.min(0.45, grainAmount * 0.8);
                    ctx.fillRect(0, sBar, sW, sFrameH);
                }
                ctx.restore();

                // Hairline frame gate
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
                ctx.lineWidth = Math.max(1, scale * 0.8);
                ctx.beginPath();
                ctx.moveTo(0, sBar); ctx.lineTo(sW, sBar);
                ctx.moveTo(0, sBar + sFrameH); ctx.lineTo(sW, sBar + sFrameH);
                ctx.stroke();

                if (matMultiplier > 0.35) {
                    const fBase = frameH * 0.026 * scale;
                    const sidePad = sW * 0.032;

                    // Top bar micro cinema telemetry
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                    ctx.font = `500 ${fBase * 0.56}px "JetBrains Mono", monospace`;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'left';
                    setTrack(fBase * 0.14);
                    ctx.fillText(`ANAMORPHIC 2.39:1  //  ${(exifCamera || 'CINEMA CAMERA').toUpperCase()}`, sidePad, sBar * 0.5);
                    ctx.textAlign = 'right';
                    ctx.fillText(`${exifParams || '35mm  T2.0  1/48s  ISO 800'}`, sW - sidePad, sBar * 0.5);
                    setTrack(0);

                    // Bottom cinema subtitle
                    const botMidY = sBar + sFrameH + sBar * 0.5;
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#fef3c7';
                    ctx.font = `italic 500 ${fBase * 1.15}px "Cormorant Garamond", "Noto Serif SC", serif`;
                    ctx.fillText(fitText(textLeft || 'In the quiet hours before dawn.', sW * 0.85), sW / 2, botMidY - fBase * 0.32);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
                    ctx.font = `400 ${fBase * 0.52}px "JetBrains Mono", monospace`;
                    setTrack(fBase * 0.22);
                    ctx.fillText(`${(exifLens || 'ANAMORPHIC LENS').toUpperCase()}  ·  ${(exifTime || '2026').toUpperCase()}`, sW / 2, botMidY + fBase * 0.92);
                    setTrack(0);
                }
            };

        // 24. 美术馆展签 (GALLERY PLACARD - NEW)
        } else if (style === 'gallery_placard') {
            const padX = shortEdge * 0.14 * matMultiplier;
            const padTop = shortEdge * 0.14 * matMultiplier;
            const padBot = shortEdge * 0.32 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padTop + padBot;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;
                const sBot = padBot * scale;

                // Warm museum gallery wall + subtle overhead exhibition spotlight
                ctx.fillStyle = wallColor === '#ffffff' ? '#efede7' : wallColor;
                ctx.fillRect(0, 0, sW, sH);
                if (wallColor !== '#0a0a0a') {
                    const spot = ctx.createRadialGradient(sW / 2, iY * 0.4, sW * 0.05, sW / 2, sH * 0.45, Math.max(sW, sH) * 0.85);
                    spot.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
                    spot.addColorStop(0.65, 'rgba(255, 255, 255, 0.0)');
                    spot.addColorStop(1, 'rgba(0, 0, 0, 0.07)');
                    ctx.fillStyle = spot;
                    ctx.fillRect(0, 0, sW, sH);
                }

                // Framed artwork with realistic museum drop shadow
                const frameThick = shortEdge * 0.014 * scale;
                ctx.save();
                ctx.shadowColor = `rgba(0, 0, 0, ${0.22 * shadowMultiplier})`;
                ctx.shadowBlur = shortEdge * 0.055 * scale * shadowMultiplier;
                ctx.shadowOffsetY = shortEdge * 0.025 * scale * shadowMultiplier;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(iX - frameThick, iY - frameThick, iW + frameThick * 2, iH + frameThick * 2);
                ctx.restore();

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                ctx.strokeStyle = 'rgba(10, 10, 10, 0.15)';
                ctx.lineWidth = Math.max(1, scale * 0.8);
                ctx.strokeRect(iX - frameThick, iY - frameThick, iW + frameThick * 2, iH + frameThick * 2);

                // Authentic museum wall placard card positioned cleanly at bottom-right
                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.0135 * scale;
                    const cardW = Math.min(iW * 0.56, Math.max(iW * 0.42, fBase * 24));
                    const cardH = Math.min(sBot * 0.64, fBase * 8.4);
                    const cardX = iX + iW + frameThick - cardW;
                    const cardY = iY + iH + frameThick + (sBot - frameThick - cardH) * 0.5;

                    ctx.save();
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
                    ctx.shadowBlur = fBase * 1.4;
                    ctx.shadowOffsetY = fBase * 0.35;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(cardX, cardY, cardW, cardH);
                    ctx.restore();

                    // Left black curatorial accent bar
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fillRect(cardX, cardY, Math.max(2, fBase * 0.25), cardH);

                    const cx = cardX + fBase * 1.3;
                    const cMaxW = cardW - fBase * 2.2;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';

                    ctx.fillStyle = '#71717a';
                    ctx.font = `600 ${fBase * 0.62}px "JetBrains Mono", monospace`;
                    setTrack(fBase * 0.12);
                    ctx.fillText('CAT. 01  //  ARCHIVAL EDITION', cx, cardY + fBase * 0.9);
                    setTrack(0);

                    ctx.fillStyle = '#0a0a0a';
                    ctx.font = `italic 600 ${fBase * 1.4}px "Cormorant Garamond", "Noto Serif SC", serif`;
                    ctx.fillText(fitText(textLeft || 'Untitled Study', cMaxW), cx, cardY + fBase * 2.05);

                    ctx.fillStyle = '#52525b';
                    ctx.font = `400 ${fBase * 0.68}px "Inter", sans-serif`;
                    ctx.fillText(fitText(`Archival Pigment Print · ${(exifCamera || 'Digital').toUpperCase()}`, cMaxW), cx, cardY + fBase * 4.35);

                    ctx.fillStyle = '#71717a';
                    ctx.font = `400 ${fBase * 0.64}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText(`${exifParams || '35mm f/2.8 1/125s ISO 100'}`, cMaxW), cx, cardY + fBase * 5.65);

                    ctx.fillStyle = '#a1a1aa';
                    ctx.fillText(`${(exifTime || '2026').toUpperCase()}   ·   EDITION 1 OF 1`, cx, cardY + fBase * 6.85);
                }
            };

        // 27. 独立画册封面 (ZINE / MONOCLE COVER - NEW)
        } else if (style === 'magazine_cover') {
            wallPaddingX = 0; wallPaddingY = 0;
            const baseW = 1500, baseH = 2000;
            sceneW = baseW;
            sceneH = baseH;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const pad = baseW * 0.072 * Math.min(1.4, Math.max(0.6, matMultiplier)) * scale;
                const innerW = sW - pad * 2;
                const fBase = baseW * 0.015 * scale;

                ctx.fillStyle = '#fbfaf6';
                ctx.fillRect(0, 0, sW, sH);

                // Top issue micro-bar
                ctx.fillStyle = '#52525b';
                ctx.textBaseline = 'top';
                ctx.font = `600 ${fBase * 0.68}px "JetBrains Mono", monospace`;
                setTrack(fBase * 0.16);
                ctx.textAlign = 'left';
                ctx.fillText('VOL. 04  //  PHOTOGRAPHY JOURNAL', pad, pad * 0.65);
                ctx.textAlign = 'right';
                ctx.fillText((exifTime || 'AUTUMN 2026').toUpperCase(), pad + innerW, pad * 0.65);
                setTrack(0);

                // Oversized serif masthead
                const mastY = pad * 0.65 + fBase * 1.45;
                ctx.fillStyle = '#0a0a0a';
                ctx.textAlign = 'center';
                ctx.font = `700 ${fBase * 3.85}px "Cormorant Garamond", "Noto Serif SC", serif`;
                setTrack(fBase * 0.35);
                ctx.fillText('MONOGRAPH', sW / 2, mastY);
                setTrack(0);

                // Architectural double rule
                const ruleY = mastY + fBase * 4.5;
                ctx.strokeStyle = '#0a0a0a';
                ctx.lineWidth = Math.max(1.5, scale * 1.6);
                ctx.beginPath();
                ctx.moveTo(pad, ruleY); ctx.lineTo(pad + innerW, ruleY);
                ctx.stroke();
                ctx.lineWidth = Math.max(0.75, scale * 0.7);
                ctx.beginPath();
                ctx.moveTo(pad, ruleY + fBase * 0.32); ctx.lineTo(pad + innerW, ruleY + fBase * 0.32);
                ctx.stroke();

                // Center inset photo window
                const photoY = ruleY + fBase * 1.15;
                const footerH = baseH * 0.145 * scale;
                const photoH = sH - photoY - footerH - pad * 0.5;

                ctx.save();
                ctx.beginPath();
                ctx.rect(pad, photoY, innerW, photoH);
                ctx.clip();
                const imgRatio = imgW / imgH;
                const boxRatio = innerW / photoH;
                let drawW = innerW, drawH = photoH, drawX = pad, drawY = photoY;
                if (imgRatio > boxRatio) {
                    drawW = photoH * imgRatio;
                    drawX = pad - (drawW - innerW) / 2;
                } else {
                    drawH = innerW / imgRatio;
                    drawY = photoY - (drawH - photoH) / 2;
                }
                const fImg = app.getFilteredImage(imgData, drawW, drawH, bwAmount, invertAmount);
                ctx.drawImage(fImg, drawX, drawY, drawW, drawH);
                ctx.restore();
                ctx.strokeStyle = 'rgba(10, 10, 10, 0.14)';
                ctx.lineWidth = Math.max(1, scale * 0.85);
                ctx.strokeRect(pad, photoY, innerW, photoH);

                // Bottom editorial caption + minimalist barcode
                const botY = photoY + photoH + fBase * 1.25;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillStyle = '#0a0a0a';
                ctx.font = `italic 600 ${fBase * 1.95}px "Cormorant Garamond", "Noto Serif SC", serif`;
                ctx.fillText(fitText(textLeft || 'Notes on Quiet Architecture', innerW * 0.72), pad, botY);

                ctx.fillStyle = '#52525b';
                ctx.font = `500 ${fBase * 0.75}px "JetBrains Mono", monospace`;
                ctx.fillText(fitText(`${(exifCamera || 'CAMERA').toUpperCase()}  ·  ${exifParams || ''}`, innerW * 0.72), pad, botY + fBase * 2.45);
                ctx.fillStyle = '#71717a';
                ctx.font = `400 ${fBase * 0.68}px "JetBrains Mono", monospace`;
                ctx.fillText(fitText(imgData.location || "38° 55' 00\" N  121° 38' 00\" E", innerW * 0.72), pad, botY + fBase * 3.65);

                // Minimalist issue barcode on bottom-right
                const bcW = fBase * 6.8, bcH = fBase * 3.1;
                const bcX = pad + innerW - bcW, bcY = botY + fBase * 0.45;
                ctx.fillStyle = '#0a0a0a';
                const bars = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 2, 1, 3, 1];
                let bx = bcX;
                const unit = bcW / bars.reduce((a, b) => a + b + 1, 0);
                bars.forEach((w) => {
                    ctx.fillRect(bx, bcY, w * unit, bcH);
                    bx += (w + 1) * unit;
                });
                ctx.textAlign = 'right';
                ctx.font = `500 ${fBase * 0.58}px "JetBrains Mono", monospace`;
                ctx.fillStyle = '#52525b';
                ctx.fillText('ISSN 2026-0418', pad + innerW, bcY + bcH + fBase * 0.4);
            };

        // 28. 复古 CCD 日期印记 (CCD DIGICAM TIMESTAMP - NEW)
        } else if (style === 'ccd_timestamp') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.042 * matMultiplier;
            const padY = shortEdge * 0.042 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padY * 2;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const iX = padX * scale, iY = padY * scale, iW = imgW * scale, iH = imgH * scale;

                // Classic photo-lab matte border
                ctx.fillStyle = wallColor === '#0a0a0a' ? '#0e0e10' : '#f4f3ef';
                ctx.fillRect(0, 0, sW, sH);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                // Subtle Y2K CCD warm-cyan nostalgic wash & sensor grain
                ctx.save();
                ctx.globalCompositeOperation = 'soft-light';
                const grad = ctx.createLinearGradient(iX, iY, iX + iW, iY + iH);
                grad.addColorStop(0, 'rgba(255, 226, 175, 0.22)');
                grad.addColorStop(1, 'rgba(90, 175, 210, 0.18)');
                ctx.fillStyle = grad;
                ctx.fillRect(iX, iY, iW, iH);

                // Soft corner vignette
                const vig = ctx.createRadialGradient(iX + iW / 2, iY + iH / 2, Math.min(iW, iH) * 0.35, iX + iW / 2, iY + iH / 2, Math.max(iW, iH) * 0.72);
                vig.addColorStop(0, 'rgba(0,0,0,0)');
                vig.addColorStop(1, 'rgba(0,0,0,0.22)');
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = vig;
                ctx.fillRect(iX, iY, iW, iH);

                if (grainAmount > 0) {
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.fillStyle = app.createFilmGrainPattern(ctx);
                    ctx.globalAlpha = Math.min(0.65, grainAmount + 0.14);
                    ctx.fillRect(iX, iY, iW, iH);
                }
                ctx.restore();

                // Authentic glowing quartz LED amber-orange date stamp ('26 11 20)
                const rawDate = exifTime || '20 NOV 2026';
                const parsed = new Date(rawDate);
                let stampStr = "'26  11  20";
                if (!isNaN(parsed)) {
                    const yy = String(parsed.getFullYear()).slice(-2);
                    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
                    const dd = String(parsed.getDate()).padStart(2, '0');
                    stampStr = `'${yy}  ${mm}  ${dd}`;
                }

                const ledFont = Math.max(14, shortEdge * 0.036 * scale);
                const ledX = iX + iW - shortEdge * 0.055 * scale;
                const ledY = iY + iH - shortEdge * 0.052 * scale;

                ctx.save();
                ctx.font = `700 ${ledFont}px "JetBrains Mono", monospace`;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                setTrack(ledFont * 0.06);

                // Outer red-orange halation bloom
                ctx.shadowColor = 'rgba(234, 88, 12, 0.92)';
                ctx.shadowBlur = ledFont * 0.55;
                ctx.fillStyle = 'rgba(255, 118, 36, 0.95)';
                ctx.fillText(stampStr, ledX, ledY);

                // Bright incandescent core
                ctx.shadowColor = 'rgba(251, 146, 60, 0.85)';
                ctx.shadowBlur = ledFont * 0.18;
                ctx.fillStyle = '#ffedd5';
                ctx.globalAlpha = 0.88;
                ctx.fillText(stampStr, ledX, ledY);
                setTrack(0);
                ctx.restore();

                // Crisp photo border edge
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
                ctx.lineWidth = Math.max(1, scale * 0.8);
                ctx.strokeRect(iX, iY, iW, iH);
            };

        // 26. 光学蓝图测绘 (OPTICAL BLUEPRINT - NEW)
        } else if (style === 'blueprint_spec') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.11 * matMultiplier;
            const padTop = shortEdge * 0.11 * matMultiplier;
            const padBot = shortEdge * 0.24 * matMultiplier;
            sceneW = imgW + padX * 2;
            sceneH = imgH + padTop + padBot;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;
                const sBot = padBot * scale;

                // Deep architectural blueprint field
                ctx.fillStyle = '#0b192c';
                ctx.fillRect(0, 0, sW, sH);

                // Technical drafting grid
                const gridStep = Math.max(16, shortEdge * 0.045 * scale);
                ctx.strokeStyle = 'rgba(125, 211, 252, 0.09)';
                ctx.lineWidth = Math.max(0.5, scale * 0.6);
                ctx.beginPath();
                for (let x = 0; x <= sW; x += gridStep) { ctx.moveTo(x, 0); ctx.lineTo(x, sH); }
                for (let y = 0; y <= sH; y += gridStep) { ctx.moveTo(0, y); ctx.lineTo(sW, y); }
                ctx.stroke();

                // Outer CAD border
                const m = shortEdge * 0.028 * scale;
                ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
                ctx.lineWidth = Math.max(1, scale * 1.0);
                ctx.strokeRect(m, m, sW - m * 2, sH - m * 2);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                // Registration frame & corner crosshairs
                ctx.strokeStyle = 'rgba(186, 230, 253, 0.8)';
                ctx.lineWidth = Math.max(1, scale * 1.0);
                ctx.strokeRect(iX, iY, iW, iH);

                const tick = shortEdge * 0.022 * scale;
                ctx.beginPath();
                // 4 corners crosshairs
                [[iX, iY], [iX + iW, iY], [iX, iY + iH], [iX + iW, iY + iH]].forEach(([cx, cy]) => {
                    ctx.moveTo(cx - tick, cy); ctx.lineTo(cx + tick, cy);
                    ctx.moveTo(cx, cy - tick); ctx.lineTo(cx, cy + tick);
                });
                ctx.stroke();

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.0135 * scale;
                    // Top dimension ruler readout
                    ctx.fillStyle = '#7dd3fc';
                    ctx.font = `500 ${fBase * 0.72}px "JetBrains Mono", monospace`;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'left';
                    ctx.fillText(`FIG. 01 // OPTICAL SPEC  [${imgData.width}×${imgData.height}PX]`, iX, (m + iY) * 0.5);
                    ctx.textAlign = 'right';
                    ctx.fillText(`RATIO ${(imgW / imgH).toFixed(2)}:1  ·  ${imgData.colorProfile || 'P3'}`, iX + iW, (m + iY) * 0.5);

                    // Bottom CAD title block
                    const boxY = iY + iH + sBot * 0.2;
                    const boxH = sBot * 0.58;
                    ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
                    ctx.strokeRect(iX, boxY, iW, boxH);
                    const splitX = iX + iW * 0.62;
                    ctx.beginPath();
                    ctx.moveTo(splitX, boxY); ctx.lineTo(splitX, boxY + boxH);
                    ctx.stroke();

                    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                    const bpPad = fBase * 0.95;
                    ctx.fillStyle = '#e0f2fe';
                    ctx.font = `700 ${fBase * 1.15}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText((textLeft || 'OPTICAL BLUEPRINT').toUpperCase(), (splitX - iX) - bpPad * 2), iX + bpPad, boxY + bpPad * 0.8);

                    ctx.fillStyle = '#7dd3fc';
                    ctx.font = `400 ${fBase * 0.74}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText(`${(exifCamera || 'CAMERA').toUpperCase()}  //  ${(exifLens || 'LENS').toUpperCase()}`, (splitX - iX) - bpPad * 2), iX + bpPad, boxY + bpPad * 2.55);

                    const rMaxW = (iX + iW - splitX) - bpPad * 2;
                    ctx.fillStyle = '#bae6fd';
                    ctx.font = `600 ${fBase * 0.76}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText(exifParams || '24mm f/2.8 1/125s ISO 400', rMaxW), splitX + bpPad, boxY + bpPad * 0.85);
                    ctx.fillStyle = '#7dd3fc';
                    ctx.font = `400 ${fBase * 0.7}px "JetBrains Mono", monospace`;
                    ctx.fillText(fitText(`${(exifTime || '2026').toUpperCase()}  ·  OPTICAL ARCHIVE`, rMaxW), splitX + bpPad, boxY + bpPad * 2.55);
                }
            };

        // 27. 字符矩阵 · 极简蒙版透视 (ASCII MASK REVEAL — 支持彩色字符 & 相对原图反色)
        } else if (style === 'ascii_inset') {
            wallPaddingX = 0; wallPaddingY = 0;
            sceneW = imgW;
            sceneH = imgH;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const baseDark = wallColor === '#0a0a0a';
                // 开启「字符反色」时，ASCII 背景与字符相对原片呈现反转对比
                const effectiveDark = asciiInvert ? !baseDark : baseDark;
                const paperBg = effectiveDark ? '#09090b' : (wallColor === '#0a0a0a' ? '#ffffff' : (wallColor || '#ffffff'));
                const inkRGB = effectiveDark ? '244, 244, 245' : '12, 12, 14';

                // 1. Full-bleed backdrop
                ctx.fillStyle = paperBg;
                ctx.fillRect(0, 0, sW, sH);

                // 2. Full-bleed ASCII Matrix sampled 1:1 from the photograph
                const cols = Math.max(42, Math.min(140, Math.round((vectorCols || 70) * 1.15)));
                const cellW = sW / cols;
                const cellH = cellW * 1.44;
                const rows = Math.max(18, Math.ceil(sH / cellH));

                const fImg = app.getFilteredImage(imgData, sW, sH, bwAmount, invertAmount);
                const sCanvas = document.createElement('canvas');
                sCanvas.width = cols; sCanvas.height = rows;
                const sCtx = sCanvas.getContext('2d', { willReadFrequently: true });
                sCtx.drawImage(fImg, 0, 0, cols, rows);
                const px = sCtx.getImageData(0, 0, cols, rows).data;

                const ramp = '   .,:;ilIJTtYVFAZPKHDBMWN#@';
                const rampLen = ramp.length - 1;
                const charSize = cellH * 0.98;

                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const fLight = `400 ${charSize}px "JetBrains Mono", monospace`;
                const fMed   = `500 ${charSize}px "JetBrains Mono", monospace`;
                const fBold  = `700 ${charSize}px "JetBrains Mono", monospace`;

                for (let r = 0; r < rows; r++) {
                    const cy = (r + 0.5) * cellH;
                    for (let c = 0; c < cols; c++) {
                        const idx = (r * cols + c) * 4;
                        let cr = px[idx], cg = px[idx + 1], cb = px[idx + 2];
                        const lum = (0.299 * cr + 0.587 * cg + 0.114 * cb) / 255;

                        // S-curve contrast lift for crisp architectural ASCII silhouette
                        const cLum = Math.max(0, Math.min(1, (lum - 0.06) / 0.88));
                        const density = effectiveDark ? cLum : (1 - cLum);
                        if (!asciiColor && density < 0.06) continue;

                        const charIdx = asciiColor
                            ? Math.max(3, Math.min(rampLen, Math.floor((0.18 + Math.pow(density, 0.85) * 0.82) * rampLen)))
                            : Math.min(rampLen, Math.floor(Math.pow(density, 0.92) * rampLen));
                        const ch = ramp[charIdx];
                        if (ch === ' ') continue;

                        if (density > 0.66) ctx.font = fBold;
                        else if (density > 0.34) ctx.font = fMed;
                        else ctx.font = fLight;

                        if (asciiColor) {
                            let dr = cr, dg = cg, db = cb;
                            if (asciiInvert) {
                                dr = 255 - dr; dg = 255 - dg; db = 255 - db;
                            }
                            // Gentle contrast legibility guard against paper ground
                            const dLum = 0.299 * dr + 0.587 * dg + 0.114 * db;
                            if (!effectiveDark && dLum > 225) {
                                dr *= 0.82; dg *= 0.82; db *= 0.82;
                            } else if (effectiveDark && dLum < 38) {
                                dr = dr + 45; dg = dg + 45; db = db + 45;
                            }
                            ctx.fillStyle = `rgb(${Math.round(dr)}, ${Math.round(dg)}, ${Math.round(db)})`;
                        } else {
                            const alpha = density > 0.66 ? 0.96 : (density > 0.34 ? 0.74 : 0.46);
                            ctx.fillStyle = `rgba(${inkRGB}, ${alpha})`;
                        }
                        ctx.fillText(ch, (c + 0.5) * cellW, cy);
                    }
                }
                ctx.restore();

                // 3. Smart Subject-Aware 1:1 Spatial Mask Reveal (根据画面显著性自动锁定主体 + 5 种极简高定蒙版形态)
                if (!imgData.saliency && typeof app.computeSaliencyAnchors === 'function') {
                    try { imgData.saliency = app.computeSaliencyAnchors(imgData.imgObj); } catch (e) {}
                }
                const sal = imgData.saliency || {
                    p1: { x: 0.45, y: 0.55 },
                    p2: { x: 0.72, y: 0.30 },
                    bestRowY: 0.52,
                    bestColX: 0.50
                };

                const mode = asciiMaskMode || 'focus';
                const sizeFactor = Math.min(1.35, Math.max(0.55, 0.52 + matMultiplier * 0.48));
                const hairlineCol = effectiveDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(10, 10, 10, 0.14)';
                const hairlineW = Math.max(1, scale * 0.85);
                const shBlur = Math.min(sW, sH) * 0.026 * shadowMultiplier;
                const shOffY = Math.min(sW, sH) * 0.009 * shadowMultiplier;
                const shCol = effectiveDark
                    ? `rgba(0, 0, 0, ${0.68 * shadowMultiplier})`
                    : `rgba(0, 0, 0, ${0.18 * shadowMultiplier})`;

                const clampRect = (cx, cy, w, h, marginPct = 0.06) => {
                    const mx = sW * marginPct, my = sH * marginPct;
                    const cw = Math.min(w, sW - mx * 2);
                    const ch = Math.min(h, sH - my * 2);
                    const x = Math.max(mx, Math.min(sW - mx - cw, cx - cw / 2));
                    const y = Math.max(my, Math.min(sH - my - ch, cy - ch / 2));
                    return { x, y, w: cw, h: ch };
                };

                const revealRect = (x, y, w, h) => {
                    if (shadowMultiplier > 0) {
                        ctx.save();
                        ctx.shadowColor = shCol;
                        ctx.shadowBlur = shBlur;
                        ctx.shadowOffsetY = shOffY;
                        ctx.fillStyle = paperBg;
                        ctx.fillRect(x, y, w, h);
                        ctx.restore();
                    }
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.clip();
                    ctx.drawImage(fImg, 0, 0, sW, sH);
                    ctx.restore();
                    ctx.strokeStyle = hairlineCol;
                    ctx.lineWidth = hairlineW;
                    ctx.strokeRect(x, y, w, h);
                };

                const revealCircle = (cx, cy, r) => {
                    if (shadowMultiplier > 0) {
                        ctx.save();
                        ctx.shadowColor = shCol;
                        ctx.shadowBlur = shBlur;
                        ctx.shadowOffsetY = shOffY;
                        ctx.fillStyle = paperBg;
                        ctx.beginPath();
                        ctx.arc(cx, cy, r, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(fImg, 0, 0, sW, sH);
                    ctx.restore();
                    ctx.strokeStyle = hairlineCol;
                    ctx.lineWidth = hairlineW;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.stroke();
                };

                if (mode === 'focus') {
                    // 1. 智能聚焦：单极简黄金比例蒙版自动锁定画面核心主体
                    const w = sW * 0.48 * sizeFactor;
                    const h = sH * 0.48 * sizeFactor;
                    const r = clampRect(sal.p1.x * sW, sal.p1.y * sH, w, h, 0.075);
                    revealRect(r.x, r.y, r.w, r.h);

                } else if (mode === 'triptych') {
                    // 2. 阶梯三联：围绕核心主体的三条交错建筑感切条，留出呼吸感字符缝隙
                    const isPortrait = sH > sW * 1.1;
                    if (!isPortrait) {
                        const totalW = Math.min(sW * 0.78, sW * 0.56 * sizeFactor);
                        const gap = sW * 0.024;
                        const stripW = (totalW - gap * 2) / 3;
                        const baseH = Math.min(sH * 0.72, sH * 0.52 * sizeFactor);
                        const groupX = Math.max(sW * 0.07, Math.min(sW - sW * 0.07 - totalW, sal.p1.x * sW - totalW / 2));
                        const centerY = Math.max(sH * 0.28, Math.min(sH * 0.72, sal.p1.y * sH));
                        const offsets = [-baseH * 0.14, 0, baseH * 0.14];
                        const heights = [baseH * 0.88, baseH * 1.04, baseH * 0.88];
                        for (let k = 0; k < 3; k++) {
                            const sx = groupX + k * (stripW + gap);
                            const sh = heights[k];
                            const sy = Math.max(sH * 0.06, Math.min(sH - sH * 0.06 - sh, centerY - sh / 2 + offsets[k]));
                            revealRect(sx, sy, stripW, sh);
                        }
                    } else {
                        const totalH = Math.min(sH * 0.76, sH * 0.54 * sizeFactor);
                        const gap = sH * 0.022;
                        const stripH = (totalH - gap * 2) / 3;
                        const baseW = Math.min(sW * 0.76, sW * 0.56 * sizeFactor);
                        const groupY = Math.max(sH * 0.07, Math.min(sH - sH * 0.07 - totalH, sal.p1.y * sH - totalH / 2));
                        const centerX = Math.max(sW * 0.28, Math.min(sW * 0.72, sal.p1.x * sW));
                        const offsets = [-baseW * 0.13, 0, baseW * 0.13];
                        const widths = [baseW * 0.86, baseW * 1.04, baseW * 0.86];
                        for (let k = 0; k < 3; k++) {
                            const sy = groupY + k * (stripH + gap);
                            const sw = widths[k];
                            const sx = Math.max(sW * 0.06, Math.min(sW - sW * 0.06 - sw, centerX - sw / 2 + offsets[k]));
                            revealRect(sx, sy, sw, stripH);
                        }
                    }

                } else if (mode === 'dual') {
                    // 3. 双重焦点：主次双视觉显著点自动成对透出，形成画面对话
                    const r1 = clampRect(sal.p1.x * sW, sal.p1.y * sH, sW * 0.42 * sizeFactor, sH * 0.44 * sizeFactor, 0.065);
                    const r2 = clampRect(sal.p2.x * sW, sal.p2.y * sH, sW * 0.27 * sizeFactor, sH * 0.28 * sizeFactor, 0.065);
                    revealRect(r2.x, r2.y, r2.w, r2.h);
                    revealRect(r1.x, r1.y, r1.w, r1.h);

                } else if (mode === 'circle') {
                    // 4. 光学圆镜：纯圆形光学透镜蒙版锁定主体焦点
                    const minDim = Math.min(sW, sH);
                    const r = Math.min(minDim * 0.42, minDim * 0.27 * sizeFactor);
                    const margin = r + minDim * 0.07;
                    const cx = Math.max(margin, Math.min(sW - margin, sal.p1.x * sW));
                    const cy = Math.max(margin, Math.min(sH - margin, sal.p1.y * sH));
                    revealCircle(cx, cy, r);

                } else if (mode === 'band') {
                    // 5. 横贯视带：自动追踪画面信息密度最高的水平/垂直视带贯穿画面
                    const isPortrait = sH > sW * 1.15;
                    if (!isPortrait) {
                        const bandH = Math.min(sH * 0.56, sH * 0.32 * sizeFactor);
                        const sidePad = sW * 0.055;
                        const y = Math.max(sH * 0.08, Math.min(sH - sH * 0.08 - bandH, sal.bestRowY * sH - bandH / 2));
                        revealRect(sidePad, y, sW - sidePad * 2, bandH);
                    } else {
                        const bandW = Math.min(sW * 0.58, sW * 0.36 * sizeFactor);
                        const topPad = sH * 0.055;
                        const x = Math.max(sW * 0.08, Math.min(sW - sW * 0.08 - bandW, sal.bestColX * sW - bandW / 2));
                        revealRect(x, topPad, bandW, sH - topPad * 2);
                    }
                }
            };

        // 28. 无框原图 · 防盗直出 (RAW PROTECT)
        } else if (style === 'raw_protect') {
            wallPaddingX = 0; wallPaddingY = 0;
            sceneW = imgW;
            sceneH = imgH;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const fImg = app.getFilteredImage(imgData, sW, sH, bwAmount, invertAmount);
                ctx.drawImage(fImg, 0, 0, sW, sH);
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

        // 叠加独立版权防盗水印层 (Anti-Theft Copyright Watermark Engine)
        if (app.state.protect && app.state.protect.enabled && typeof app.renderCopyrightWatermark === 'function') {
            app.renderCopyrightWatermark(ctx, imgData, !(targetWidth && targetHeight));
        }
    }
};