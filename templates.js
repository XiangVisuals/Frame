/**
 * XIANG FRAME 3.5 PRO - Template Rendering Engine
 * 包含 5 款 2026 先锋流行趋势版式 + 12 款经典画廊/胶片/矢量版式
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

        // =====================================================================
        // NEW TREND 1: SWISS ARCHITECTURAL GRID (瑞士国际主义网格展签)
        // =====================================================================
        if (style === 'swiss_grid') {
            wallPaddingX = 0; wallPaddingY = 0;
            const pad = shortEdge * 0.075 * matMultiplier;
            const headerH = shortEdge * 0.085 * matMultiplier;
            const footerH = shortEdge * 0.25 * matMultiplier;

            sceneW = imgW + pad * 2;
            sceneH = imgH + pad * 2 + headerH + footerH;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale;
                const sPad = pad * scale, sHead = headerH * scale, sFoot = footerH * scale;
                const iW = imgW * scale, iH = imgH * scale;
                const iX = sPad, iY = sPad + sHead;

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sW, sH);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                const lineW = Math.max(1, shortEdge * 0.0018 * scale);
                ctx.strokeStyle = '#0a0a0a';
                ctx.lineWidth = lineW;

                ctx.strokeRect(sPad, sPad, iW, sH - sPad * 2);

                ctx.beginPath();
                ctx.moveTo(sPad, iY); ctx.lineTo(sPad + iW, iY);
                ctx.moveTo(sPad, iY + iH); ctx.lineTo(sPad + iW, iY + iH);
                ctx.stroke();

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.014 * scale;
                    ctx.fillStyle = '#0a0a0a';
                    ctx.textBaseline = 'middle';

                    const headMidY = sPad + sHead * 0.5;
                    ctx.font = `700 ${fBase * 0.95}px "JetBrains Mono", monospace`;
                    ctx.textAlign = 'left';
                    const hdrTag = imgData.isHDR ? ` // ${imgData.hdrType}` : ` // ${imgData.colorProfile || 'P3'}`;
                    ctx.fillText(`ARCHIVE SPEC — NO. 01${hdrTag}`, sPad + fBase * 1.2, headMidY);

                    ctx.textAlign = 'right';
                    ctx.font = `500 ${fBase * 0.9}px "JetBrains Mono", monospace`;
                    ctx.fillText((textRight || '© XIANGVISUALS').toUpperCase(), sPad + iW - fBase * 1.2, headMidY);

                    const footTop = iY + iH;
                    const row1H = sFoot * 0.54;
                    const col1W = iW * 0.42;
                    const col2W = iW * 0.33;

                    ctx.beginPath();
                    ctx.moveTo(sPad, footTop + row1H);
                    ctx.lineTo(sPad + iW, footTop + row1H);
                    ctx.moveTo(sPad + col1W, footTop);
                    ctx.lineTo(sPad + col1W, footTop + sFoot);
                    ctx.moveTo(sPad + col1W + col2W, footTop);
                    ctx.lineTo(sPad + col1W + col2W, footTop + sFoot);
                    ctx.stroke();

                    const cellPad = fBase * 1.2;
                    const labelFont = `600 ${fBase * 0.65}px "JetBrains Mono", monospace`;
                    const valFont = `700 ${fBase * 1.05}px "Inter", sans-serif`;
                    const monoValFont = `600 ${fBase * 0.88}px "JetBrains Mono", monospace`;

                    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                    ctx.fillStyle = '#71717a'; ctx.font = labelFont;
                    ctx.fillText('01 / ARTWORK TITLE', sPad + cellPad, footTop + cellPad * 0.75);
                    ctx.fillStyle = '#0a0a0a'; ctx.font = valFont;
                    ctx.fillText((textLeft || 'UNTITLED ARTWORK').toUpperCase(), sPad + cellPad, footTop + cellPad * 2.0);

                    ctx.fillStyle = '#71717a'; ctx.font = labelFont;
                    ctx.fillText('02 / OPTICAL SYSTEM', sPad + col1W + cellPad, footTop + cellPad * 0.75);
                    ctx.fillStyle = '#0a0a0a'; ctx.font = monoValFont;
                    ctx.fillText((exifCamera || 'DIGITAL CAMERA').toUpperCase(), sPad + col1W + cellPad, footTop + cellPad * 2.05);

                    ctx.fillStyle = '#71717a'; ctx.font = labelFont;
                    ctx.fillText('03 / CHRONOLOGY', sPad + col1W + col2W + cellPad, footTop + cellPad * 0.75);
                    ctx.fillStyle = '#0a0a0a'; ctx.font = monoValFont;
                    ctx.fillText((exifTime || '2026 ARCHIVE').toUpperCase(), sPad + col1W + col2W + cellPad, footTop + cellPad * 2.05);

                    const r2Top = footTop + row1H;
                    ctx.fillStyle = '#71717a'; ctx.font = labelFont;
                    ctx.fillText('04 / GEO-COORDINATES', sPad + cellPad, r2Top + cellPad * 0.65);
                    ctx.fillStyle = '#0a0a0a'; ctx.font = monoValFont;
                    ctx.fillText(imgData.location || "38° 55' 00\" N  121° 38' 00\" E", sPad + cellPad, r2Top + cellPad * 1.75);

                    ctx.fillStyle = '#71717a'; ctx.font = labelFont;
                    ctx.fillText('05 / EXPOSURE TELEMETRY', sPad + col1W + cellPad, r2Top + cellPad * 0.65);
                    ctx.fillStyle = '#0a0a0a'; ctx.font = monoValFont;
                    ctx.fillText(exifParams || '24mm  f/2.8  1/125s  ISO 400', sPad + col1W + cellPad, r2Top + cellPad * 1.75);

                    ctx.fillStyle = '#71717a'; ctx.font = labelFont;
                    ctx.fillText('06 / CHROMATIC PALETTE', sPad + col1W + col2W + cellPad, r2Top + cellPad * 0.65);
                    if (imgData.palette && imgData.palette.length > 0) {
                        const swAreaW = iW - col1W - col2W - cellPad * 2;
                        const swW = swAreaW / imgData.palette.length;
                        const swH = fBase * 1.05;
                        imgData.palette.forEach((c, idx) => {
                            ctx.fillStyle = c.rgbStr;
                            ctx.fillRect(sPad + col1W + col2W + cellPad + idx * swW, r2Top + cellPad * 1.7, swW - 2, swH);
                        });
                    }
                }
            };

        // =====================================================================
        // NEW TREND 2: OPTICAL HISTOGRAM ARCHIVE (实时光学直方图波形档案)
        // =====================================================================
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
                const sBot = padBot * scale;

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sW, sH);

                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.35) {
                    const fBase = shortEdge * 0.015 * scale;
                    const topY = iY + iH + sBot * 0.22;

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

                    const histW = iW * 0.36;
                    const histH = fBase * 4.5;
                    const histX = iX + iW - histW;
                    const histY = topY + fBase * 0.2;

                    ctx.fillStyle = '#fafafa';
                    ctx.fillRect(histX, histY, histW, histH);
                    ctx.strokeStyle = '#e4e4e7';
                    ctx.lineWidth = Math.max(1, scale);
                    ctx.strokeRect(histX, histY, histW, histH);

                    ctx.beginPath();
                    for (let z = 1; z <= 3; z++) {
                        const zx = histX + (histW * z) / 4;
                        ctx.moveTo(zx, histY);
                        ctx.lineTo(zx, histY + histH);
                    }
                    ctx.stroke();

                    const hist = imgData.histogram;
                    if (hist && hist.l) {
                        const drawCurve = (arr, fillStyle, strokeStyle) => {
                            const bins = arr.length;
                            ctx.save();
                            ctx.beginPath();
                            ctx.moveTo(histX, histY + histH);
                            for (let i = 0; i < bins; i++) {
                                const px = histX + (i / (bins - 1)) * histW;
                                const py = histY + histH - arr[i] * (histH * 0.88);
                                ctx.lineTo(px, py);
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

        // =====================================================================
        // NEW TREND 3: AURA ATMOSPHERIC BLUR (弥散光感流光画境)
        // =====================================================================
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

                ctx.save();
                ctx.drawImage(blurCanvas, 0, 0, sW, sH);
                const grad = ctx.createRadialGradient(sW * 0.5, sH * 0.5, shortEdge * 0.2 * scale, sW * 0.5, sH * 0.5, Math.max(sW, sH) * 0.75);
                grad.addColorStop(0, 'rgba(0,0,0,0.02)');
                grad.addColorStop(1, 'rgba(0,0,0,0.32)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, sW, sH);
                ctx.restore();

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
                    try { ctx.letterSpacing = `${fBase * 0.22}px`; } catch(e){}
                    ctx.fillText((textLeft || 'UNTITLED ARTWORK').toUpperCase(), sW / 2, centerY - fBase * 0.85);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
                    ctx.font = `400 ${fBase * 0.75}px "JetBrains Mono", monospace`;
                    try { ctx.letterSpacing = `${fBase * 0.12}px`; } catch(e){}
                    ctx.fillText(`${(exifCamera || 'CAMERA').toUpperCase()}   ·   ${exifParams || ''}`, sW / 2, centerY + fBase * 1.05);
                    try { ctx.letterSpacing = '0px'; } catch(e){}
                }
            };

        // =====================================================================
        // NEW TREND 4: DARKROOM HALATION LAB (暗房高光红晕溢光印相)
        // =====================================================================
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
                    const hData = hCtx.getImageData(0, 0, hSize, hSize);
                    const d = hData.data;

                    for (let p = 0; p < d.length; p += 4) {
                        const lum = 0.299 * d[p] + 0.587 * d[p+1] + 0.114 * d[p+2];
                        if (lum > 200) {
                            const intensity = (lum - 200) / 55;
                            d[p] = 255;
                            d[p+1] = Math.round(65 * intensity);
                            d[p+2] = Math.round(20 * intensity);
                            d[p+3] = Math.round(235 * Math.pow(intensity, 1.3));
                        } else {
                            d[p+3] = 0;
                        }
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

                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#ef4444';
                    ctx.font = `700 ${fBase * 0.95}px "JetBrains Mono", monospace`;
                    ctx.fillText(`HALATION LAB // ${(filmName || 'CINESTILL 800T').toUpperCase()}`, iX, textY - fBase * 0.65);

                    ctx.fillStyle = '#a1a1aa';
                    ctx.font = `400 ${fBase * 0.8}px "JetBrains Mono", monospace`;
                    ctx.fillText(`${(exifCamera || 'CAMERA').toUpperCase()}  ·  ${exifParams || ''}`, iX, textY + fBase * 0.9);

                    ctx.textAlign = 'right';
                    ctx.fillStyle = '#52525b';
                    ctx.font = `500 ${fBase * 0.78}px "JetBrains Mono", monospace`;
                    ctx.fillText(exifTime || 'DARKROOM PRINT', iX + iW, textY + fBase * 0.9);
                }
            };

        // =====================================================================
        // NEW TREND 5: CYANOTYPE 1842 ARCHIVE (古典蓝晒普鲁士蓝印相)
        // =====================================================================
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

                ctx.fillStyle = '#f4f1ea';
                ctx.fillRect(0, 0, sW, sH);

                const bleed = shortEdge * 0.012 * scale;
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
                    ctx.font = `500 ${fBase * 0.8}px "JetBrains Mono", monospace`;
                    ctx.fillText(exifTime || '1842—2026', iX + iW, textY + fBase * 1.0);
                }
            };

        // =====================================================================
        // 6. BORDERLESS DENSE LUMINANCE VECTOR FIELD (70 列无边框高密矢量场)
        // =====================================================================
        } else if (style === 'vector_field') {
            wallPaddingX = 0; wallPaddingY = 0;
            sceneW = imgW;
            sceneH = imgH;

            drawLogic = (scale) => {
                const sW = sceneW * scale;
                const sH = sceneH * scale;

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
                ctx.fillStyle = '#ffffff';
                ctx.lineCap = 'square';
                ctx.lineJoin = 'miter';

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const idx = (r * cols + c) * 4;
                        let lum = (0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2]) / 255;
                        if (invertAmount > 0) lum = Math.abs(invertAmount - lum);

                        const contrastLum = Math.pow(lum, 1.12);
                        if (contrastLum < 0.03) continue;

                        const cx = (c + 0.5) * cellSize;
                        const cy = (r + 0.5) * cellSize;

                        const isBright = contrastLum > 0.25;
                        const angle = isBright
                            ? (Math.PI * 0.5 + Math.min(1, (contrastLum - 0.18) * 1.35) * (Math.PI * 0.25))
                            : (Math.PI * 0.5);

                        const len = cellSize * (0.24 + contrastLum * 0.64);
                        const thickness = Math.max(0.75, cellSize * (0.045 + contrastLum * 0.145));

                        ctx.save();
                        ctx.translate(cx, cy);
                        ctx.rotate(angle);

                        ctx.lineWidth = thickness;
                        const halfLen = len * 0.48;
                        const headSize = len * (0.28 + contrastLum * 0.12);

                        ctx.beginPath();
                        ctx.moveTo(-halfLen, 0);
                        ctx.lineTo(halfLen, 0);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.moveTo(halfLen - headSize, -headSize * 0.82);
                        ctx.lineTo(halfLen, 0);
                        ctx.lineTo(halfLen - headSize, headSize * 0.82);
                        ctx.stroke();

                        ctx.restore();
                    }
                }
                ctx.restore();
            };

        // =====================================================================
        // 7. MINIMAL LINE (极简细线留白)
        // =====================================================================
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

        // =====================================================================
        // 8. TRIPTYCH WATERMARK (三联画廊海报)
        // =====================================================================
        } else if (style === 'triptych_watermark') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.1 * matMultiplier;
            const padTop = shortEdge * 0.45 * matMultiplier;
            const padBot = shortEdge * 0.65 * matMultiplier;
            const gap = shortEdge * 0.015;
            const isPortrait = imgH > imgW;

            if (isPortrait) {
                sceneW = imgW + padX * 2;
                sceneH = imgH + (gap * 2) + padTop + padBot;
            } else {
                sceneW = imgW + (gap * 2) + padX * 2;
                sceneH = imgH + padTop + padBot;
            }

            drawLogic = (scale) => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sceneW * scale, sceneH * scale);

                const sPadX = padX * scale, sPadTop = padTop * scale, sGap = gap * scale;
                const iW = imgW * scale, iH = imgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                const srcW = fImg.naturalWidth || fImg.width;
                const srcH = fImg.naturalHeight || fImg.height;

                if (isPortrait) {
                    const sPanelH = srcH / 3, dPanelH = iH / 3;
                    ctx.drawImage(fImg, 0, 0, srcW, sPanelH, sPadX, sPadTop, iW, dPanelH);
                    ctx.drawImage(fImg, 0, sPanelH, srcW, sPanelH, sPadX, sPadTop + dPanelH + sGap, iW, dPanelH);
                    ctx.drawImage(fImg, 0, sPanelH * 2, srcW, sPanelH, sPadX, sPadTop + (dPanelH * 2) + (sGap * 2), iW, dPanelH);
                } else {
                    const sPanelW = srcW / 3, dPanelW = iW / 3;
                    ctx.drawImage(fImg, 0, 0, sPanelW, srcH, sPadX, sPadTop, dPanelW, iH);
                    ctx.drawImage(fImg, sPanelW, 0, sPanelW, srcH, sPadX + dPanelW + sGap, sPadTop, dPanelW, iH);
                    ctx.drawImage(fImg, sPanelW * 2, 0, sPanelW, srcH, sPadX + (dPanelW * 2) + (sGap * 2), sPadTop, dPanelW, iH);
                }

                if (matMultiplier > 0.3) {
                    const centerX = sceneW * scale / 2;
                    const totalImgDrawH = isPortrait ? (iH + sGap * 2) : iH;
                    const textY = sPadTop + totalImgDrawH + (padBot * scale * 0.4);

                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    const fontSize = shortEdge * 0.015 * scale;
                    ctx.fillStyle = '#71717a';
                    ctx.font = `500 ${fontSize}px "Inter", sans-serif`;

                    try { ctx.letterSpacing = `${fontSize * 0.6}px`; } catch(e){}
                    ctx.fillText((textLeft || 'THE PHOTO').toUpperCase(), centerX, textY - (fontSize * 0.8));

                    let yearStr = '2026';
                    if (imgData.exifDate) {
                        const yearMatch = imgData.exifDate.match(/\d{4}/);
                        if (yearMatch) yearStr = yearMatch[0];
                    }
                    ctx.fillText(`OF ${yearStr}`, centerX, textY + (fontSize * 0.8));
                    try { ctx.letterSpacing = '0px'; } catch(e){}
                }
            };

        // =====================================================================
        // 9. IMMERSIVE COLOR (沉浸主色卡)
        // =====================================================================
        } else if (style === 'immersive_color') {
            wallPaddingX = 0; wallPaddingY = 0;
            const botBlockH = imgH * 0.85;
            sceneW = imgW; sceneH = imgH + botBlockH;

            drawLogic = (scale) => {
                const sW = sceneW * scale, sH = sceneH * scale, sBotH = botBlockH * scale, sImgH = imgH * scale;
                let mainColorRgb = { r: 30, g: 41, b: 59 };
                if (imgData.palette && imgData.palette.length > 0) {
                    const getSat = (r, g, b) => {
                        const max = Math.max(r,g,b)/255, min = Math.min(r,g,b)/255;
                        return max === 0 ? 0 : (max - min) / max;
                    };
                    let bestSat = -1;
                    imgData.palette.forEach(c => {
                        const s = getSat(c.r, c.g, c.b);
                        if (s > bestSat) { bestSat = s; mainColorRgb = c; }
                    });
                }

                const adjustColor = (c, factor) => Math.max(0, Math.min(255, Math.floor(c * factor)));
                const r = adjustColor(mainColorRgb.r, 0.75);
                const g = adjustColor(mainColorRgb.g, 0.75);
                const b = adjustColor(mainColorRgb.b, 0.75);

                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(0, 0, sW, sH);

                const fImg = app.getFilteredImage(imgData, sW, sImgH, bwAmount, invertAmount);
                ctx.drawImage(fImg, 0, 0, sW, sImgH);

                if (matMultiplier > 0.4) {
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    const textCenterX = sW / 2;
                    const primaryFontSize = sW * 0.013;
                    const secondaryFontSize = sW * 0.011;
                    const textCenterY = sImgH + (sBotH * 0.45);
                    const gap = primaryFontSize * 2.8;

                    ctx.font = `400 ${primaryFontSize}px "Inter", sans-serif`;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                    const coordStr = imgData.location || "38° 55' 00\" N    121° 38' 00\" E";
                    const dateStr = imgData.exifTime || '12 FEB 2026';

                    try { ctx.letterSpacing = `${primaryFontSize * 0.15}px`; } catch(e){}
                    ctx.fillText(`${coordStr}      ${dateStr}`, textCenterX, textCenterY - (gap/2));

                    ctx.font = `400 ${secondaryFontSize}px "Inter", sans-serif`;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    try { ctx.letterSpacing = `${secondaryFontSize * 0.2}px`; } catch(e){}
                    ctx.fillText(imgData.exifParams || '24mm   f/2.8   1/125s   ISO 400', textCenterX, textCenterY + (gap/2));
                    try { ctx.letterSpacing = '0px'; } catch(e){}
                }
            };

        // =====================================================================
        // 10. POLAROID (复古拍立得)
        // =====================================================================
        } else if (style === 'polaroid') {
            const matX = shortEdge * 0.08 * matMultiplier, matTop = shortEdge * 0.08 * matMultiplier, matBot = shortEdge * 0.3 * matMultiplier;
            const paperW = imgW + (matX * 2), paperH = imgH + matTop + matBot;
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

                const iX = pX + (matX * scale), iY = pY + (matTop * scale), iW = imgW * scale, iH = imgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);
                ctx.strokeStyle = `rgba(0,0,0,${0.06 * shadowMultiplier})`;
                ctx.lineWidth = shortEdge * 0.002 * scale;
                ctx.strokeRect(iX, iY, iW, iH);
            };

        // =====================================================================
        // 11. EXIF RAW (EXIF 原生)
        // =====================================================================
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

        // =====================================================================
        // 12. FILM 35MM (35mm 单张)
        // =====================================================================
        } else if (style === 'film35mm') {
            const baseH = 1000; const ratio = imgW / imgH;
            const filmPadY = baseH * 0.18 * matMultiplier; const targetImgH = baseH - (filmPadY * 2);
            const gap = baseH * 0.05 * matMultiplier; const filmPadX = gap * 1.5; const targetImgW = targetImgH * ratio;
            const filmW = (filmPadX * 2) + targetImgW; const filmH = baseH;

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
                const topHoleY = fY + (filmPadY * 0.2 * scale); const botHoleY = fY + fH - (filmPadY * 0.2 * scale) - holeH;
                for (let x = fX + holeGap; x < fX + fW - holeGap; x += holeGap) {
                    ctx.beginPath(); ctx.roundRect(x, topHoleY, holeW, holeH, holeW/2); ctx.roundRect(x, botHoleY, holeW, holeH, holeW/2); ctx.fill();
                }

                const iX = fX + filmPadX * scale, iY = fY + filmPadY * scale, iW = targetImgW * scale, iH = targetImgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (invertAmount > 0) {
                    ctx.save(); ctx.globalCompositeOperation = 'multiply';
                    ctx.fillStyle = `rgba(220, 95, 15, ${invertAmount * 0.6})`; ctx.fillRect(iX, iY, iW, iH); ctx.restore();
                }

                if (matMultiplier > 0.4) {
                    const fontSize = baseH * 0.018 * scale; ctx.textBaseline = 'middle';
                    const textTopY = fY + (filmPadY * 0.65 * scale); const textBotY = fY + fH - (filmPadY * 0.65 * scale);
                    const filmText = (filmName || 'KODAK PORTRA 400').toUpperCase();
                    const bcW = baseH * 0.05 * scale, bcH = baseH * 0.01 * scale;
                    app.drawDXCode(ctx, iX, textTopY - bcH*0.5, bcW, bcH, 42);

                    ctx.fillStyle = '#facc15'; ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
                    ctx.textAlign = 'left'; ctx.fillText('22A', iX + bcW*1.5, textTopY);
                    ctx.textAlign = 'center'; ctx.fillText(filmText, iX + iW/2, textTopY);
                    ctx.textAlign = 'right'; ctx.fillText('23', iX + iW, textTopY);

                    ctx.font = `400 ${fontSize * 0.8}px "JetBrains Mono", monospace`; ctx.fillStyle = 'rgba(250, 204, 21, 0.6)';
                    ctx.textAlign = 'center'; ctx.fillText(exifParams || '', iX + iW/2, textBotY);
                }

                ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = app.createFilmGrainPattern(ctx);
                ctx.globalAlpha = grainAmount + (invertAmount * 0.15); ctx.fillRect(fX, fY, fW, fH); ctx.restore();
            };

        // =====================================================================
        // 13. FILM 4x5 (4×5 大画幅)
        // =====================================================================
        } else if (style === 'film4x5') {
            wallPaddingX = 0; wallPaddingY = 0; const baseH = 1200; const ratio = imgW / imgH;
            const blackBorderTop = baseH * 0.035 * matMultiplier, blackBorderBot = baseH * 0.02 * matMultiplier, blackBorderSide = baseH * 0.015 * matMultiplier;
            const targetImgH = baseH - blackBorderTop - blackBorderBot; const targetImgW = targetImgH * ratio; const blackW = targetImgW + blackBorderSide * 2;
            const whitePadX = baseH * 0.1 * matMultiplier, whitePadY = baseH * 0.1 * matMultiplier;
            sceneW = blackW + whitePadX * 2; sceneH = baseH + whitePadY * 2;

            drawLogic = (scale) => {
                const sWhitePadX = whitePadX * scale, sWhitePadY = whitePadY * scale, sBlackW = blackW * scale, sBaseH = baseH * scale;
                ctx.fillStyle = '#f9f9f9'; ctx.fillRect(0, 0, sceneW * scale, sceneH * scale);
                const fX = sWhitePadX, fY = sWhitePadY;
                ctx.fillStyle = '#080808'; ctx.fillRect(fX, fY, sBlackW, sBaseH);

                ctx.beginPath(); ctx.arc(fX + sBlackW, fY + sBaseH * 0.15, baseH * 0.015 * scale, 0, Math.PI * 2); ctx.fillStyle = '#f9f9f9'; ctx.fill();
                ctx.beginPath(); ctx.arc(fX + sBlackW, fY + sBaseH * 0.20, baseH * 0.01 * scale, 0, Math.PI * 2); ctx.fill();

                const iX = fX + blackBorderSide * scale, iY = fY + blackBorderTop * scale, iW = targetImgW * scale, iH = targetImgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.4) {
                    const fontSize = baseH * 0.012 * scale; ctx.fillStyle = '#facc15'; ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`; ctx.textBaseline = 'middle';
                    const textY = fY + (blackBorderTop * scale * 0.5); const filmText = (filmName || 'FUJIFILM   RVP50').toUpperCase();
                    ctx.textAlign = 'center'; ctx.fillText(`${filmText}       50782       D L AGA I`, fX + sBlackW/2, textY);
                }

                ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = app.createFilmGrainPattern(ctx);
                ctx.globalAlpha = grainAmount + (invertAmount * 0.1); ctx.fillRect(fX, fY, sBlackW, sBaseH); ctx.restore();
            };

        // =====================================================================
        // 14. FILM XPAN (XPan 65:24 宽幅)
        // =====================================================================
        } else if (style === 'film_xpan') {
            wallPaddingX = 0; wallPaddingY = 0; const baseH = 800; const targetRatio = 65 / 24;
            const targetImgH = baseH, targetImgW = targetImgH * targetRatio;
            const blackBorderT = baseH * 0.01 * matMultiplier, whitePadX = baseH * 0.1 * matMultiplier, whitePadY = baseH * 0.12 * matMultiplier;
            sceneW = targetImgW + blackBorderT * 2 + whitePadX * 2; sceneH = targetImgH + blackBorderT * 2 + whitePadY * 2;

            drawLogic = (scale) => {
                const pW = sceneW * scale, pH = sceneH * scale;
                const sWhitePadX = whitePadX * scale, sWhitePadY = whitePadY * scale, sBlackT = blackBorderT * scale;
                const sImgW = targetImgW * scale, sImgH = targetImgH * scale;

                ctx.fillStyle = '#fcfcfc'; ctx.fillRect(0, 0, pW, pH);
                const bX = sWhitePadX, bY = sWhitePadY;
                ctx.fillStyle = '#0a0a0a'; ctx.fillRect(bX, bY, sImgW + sBlackT*2, sImgH + sBlackT*2);

                const iX = bX + sBlackT, iY = bY + sBlackT;
                ctx.save(); ctx.beginPath(); ctx.rect(iX, iY, sImgW, sImgH); ctx.clip();

                const imgRatio = imgW / imgH; let drawW, drawH, drawX, drawY;
                if (imgRatio > targetRatio) { drawH = sImgH; drawW = drawH * imgRatio; drawX = iX - (drawW - sImgW) / 2; drawY = iY; }
                else { drawW = sImgW; drawH = drawW / imgRatio; drawX = iX; drawY = iY - (drawH - sImgH) / 2; }

                const fImg = app.getFilteredImage(imgData, drawW, drawH, bwAmount, invertAmount);
                ctx.drawImage(fImg, drawX, drawY, drawW, drawH);
                ctx.restore();

                if (matMultiplier > 0.4) {
                    const fontSize = baseH * 0.02 * scale; ctx.fillStyle = '#666'; ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`; ctx.textAlign = 'center';
                    try { ctx.letterSpacing = `${fontSize * 0.2}px`; } catch(e){}
                    ctx.fillText((exifParams || '65:24 PANORAMIC FORMAT').toUpperCase(), pW/2, pH - sWhitePadY*0.4);
                    try { ctx.letterSpacing = '0px'; } catch(e){}
                }
                ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = app.createFilmGrainPattern(ctx);
                ctx.globalAlpha = grainAmount + (invertAmount * 0.25); ctx.fillRect(bX, bY, sImgW + sBlackT*2, sImgH + sBlackT*2); ctx.restore();
            };

        // =====================================================================
        // 15. FILM STRIP (长卷接触印相)
        // =====================================================================
        } else if (style === 'film_strip') {
            const allImages = app.state.images;
            if (allImages.length === 0) return;
            const maxPerRow = 5; const rows = [];
            for (let i = 0; i < allImages.length; i += maxPerRow) rows.push(allImages.slice(i, i + maxPerRow));

            const baseH = 1000, filmPadY = baseH * 0.18 * matMultiplier, targetImgH = baseH - (filmPadY * 2);
            const gap = baseH * 0.05 * matMultiplier, filmPadX = gap * 1.5;
            const rowLayouts = []; let maxFilmW = 0;

            rows.forEach(row => {
                let totalImgW = 0; const layout = [];
                row.forEach(img => { const ratio = img.width / img.height; const iW = targetImgH * ratio; layout.push({ imgObj: img.imgObj, w: iW, h: targetImgH, originalData: img }); totalImgW += iW; });
                const currentFilmW = (filmPadX * 2) + totalImgW + gap * (row.length - 1);
                maxFilmW = Math.max(maxFilmW, currentFilmW); rowLayouts.push({ layout, w: currentFilmW });
            });

            const filmW = maxFilmW, stripGap = baseH * 0.12;
            const filmH = rows.length * baseH + Math.max(0, rows.length - 1) * stripGap;
            wallPaddingX = baseH * 0.15; wallPaddingY = baseH * 0.25;
            sceneW = filmW + wallPaddingX * 2; sceneH = filmH + wallPaddingY * 2;

            drawLogic = (scale) => {
                drawBackground(scale);
                let currentY = wallPaddingY * scale; const fX = wallPaddingX * scale, fW = filmW * scale, fH = baseH * scale;
                const grainPat = app.createFilmGrainPattern(ctx), grainAlpha = grainAmount + (invertAmount * 0.25);

                rowLayouts.forEach((rowInfo, rowIndex) => {
                    const fY = currentY;
                    ctx.save(); ctx.shadowColor = `rgba(0, 0, 0, ${0.4 * shadowMultiplier})`; ctx.shadowBlur = baseH * 0.08 * scale * shadowMultiplier; ctx.shadowOffsetY = baseH * 0.04 * scale * shadowMultiplier;
                    ctx.fillStyle = '#0f0f0f'; ctx.fillRect(fX, fY, fW, fH); ctx.restore();

                    ctx.fillStyle = wallColor;
                    const holeW = baseH * 0.012 * scale, holeH = baseH * 0.022 * scale, holeGap = baseH * 0.035 * scale;
                    const topHoleY = fY + (filmPadY * 0.2 * scale), botHoleY = fY + fH - (filmPadY * 0.2 * scale) - holeH;
                    for (let x = fX + holeGap; x < fX + fW - holeGap; x += holeGap) {
                        ctx.beginPath(); ctx.roundRect(x, topHoleY, holeW, holeH, holeW/2); ctx.roundRect(x, botHoleY, holeW, holeH, holeW/2); ctx.fill();
                    }

                    let currX = fX + filmPadX * scale;
                    rowInfo.layout.forEach(item => {
                        const iW = item.w * scale, iH = item.h * scale, iX = currX, iY = fY + filmPadY * scale;
                        app.hitboxes.push({ id: item.originalData.id, x: iX, y: iY, w: iW, h: iH });

                        if (app.dragInfo.active && app.dragInfo.id === item.originalData.id) {
                            ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(iX, iY, iW, iH); ctx.restore();
                            dragDrawOperation = () => {
                                const dX = app.dragInfo.currX - app.dragInfo.offsetX, dY = app.dragInfo.currY - app.dragInfo.offsetY;
                                ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 40 * scale; ctx.shadowOffsetY = 20 * scale;
                                const fImg = app.getFilteredImage(item.originalData, iW, iH, bwAmount, invertAmount);
                                ctx.drawImage(fImg, dX, dY, iW, iH);
                                ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(2, baseH * 0.003 * scale); ctx.strokeRect(dX, dY, iW, iH); ctx.restore();
                            };
                        } else {
                            const fImg = app.getFilteredImage(item.originalData, iW, iH, bwAmount, invertAmount);
                            ctx.drawImage(fImg, iX, iY, iW, iH);
                        }
                        currX += iW + gap * scale;
                    });

                    if (matMultiplier > 0.4) {
                        const fontSize = baseH * 0.018 * scale; ctx.textBaseline = 'middle';
                        const textTopY = fY + (filmPadY * 0.65 * scale);
                        currX = fX + filmPadX * scale; let frameIndex = rowIndex * (maxPerRow * 2) + 1;
                        rowInfo.layout.forEach((item, idx) => {
                            const iW_scaled = item.w * scale, filmStr = (item.originalData.filmName || 'KODAK PORTRA 400').toUpperCase(), seed = rowIndex * 100 + idx;
                            const bcW = baseH * 0.05 * scale, bcH = baseH * 0.01 * scale;
                            app.drawDXCode(ctx, currX, textTopY - bcH*0.5, bcW, bcH, seed);
                            ctx.fillStyle = '#facc15'; ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
                            ctx.textAlign = 'left'; ctx.fillText(`${frameIndex}A`, currX + bcW*1.5, textTopY);
                            ctx.textAlign = 'center'; ctx.fillText(filmStr, currX + iW_scaled/2, textTopY);
                            ctx.textAlign = 'right'; ctx.fillText(`${frameIndex + 1}`, currX + iW_scaled, textTopY);
                            currX += iW_scaled + gap * scale; frameIndex += 2;
                        });
                    }
                    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = grainPat; ctx.globalAlpha = grainAlpha; ctx.fillRect(fX, fY, fW, fH); ctx.restore();
                    currentY += fH + stripGap * scale;
                });
                if (dragDrawOperation) dragDrawOperation();
            };

        // =====================================================================
        // 16. EXIF PALETTE (色卡档案)
        // =====================================================================
        } else if (style === 'exif_palette') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.1 * matMultiplier, padTop = shortEdge * 0.22 * matMultiplier, padBot = shortEdge * 0.3 * matMultiplier;
            sceneW = imgW + padX * 2; sceneH = padTop + imgH + padBot;

            drawLogic = (scale) => {
                ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sceneW * scale, sceneH * scale);
                const iX = padX * scale, iY = padTop * scale, iW = imgW * scale, iH = imgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.4) {
                    const sEdge = shortEdge * scale, bFont = sEdge * 0.022;
                    const brand = (exifCamera || 'CAMERA').split(' ')[0].toUpperCase();
                    const model = (exifCamera || 'UNKNOWN MODEL').replace(brand, '').trim() || exifCamera;

                    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                    ctx.fillStyle = '#0a0a0a'; ctx.font = `800 ${bFont * 1.8}px "Inter", sans-serif`;
                    try { ctx.letterSpacing = `${bFont * 0.25}px`; } catch(e){}
                    ctx.fillText(brand, iX, iY - (padTop * scale * 0.65));
                    try { ctx.letterSpacing = '0px'; } catch(e){}

                    ctx.fillStyle = '#71717a'; ctx.font = `600 ${bFont * 0.6}px "Inter", sans-serif`;
                    ctx.fillText(model, iX, iY - (padTop * scale * 0.65) + bFont * 2.4);

                    const bY = iY + iH + (padBot * scale * 0.28);
                    ctx.fillStyle = '#0a0a0a'; ctx.font = `700 ${bFont * 0.9}px "Inter", sans-serif`;
                    try { ctx.letterSpacing = `${bFont*0.1}px`; } catch(e){}
                    ctx.fillText(textLeft || 'UNTITLED ARTWORK', iX, bY);
                    try { ctx.letterSpacing = '0px'; } catch(e){}

                    ctx.fillStyle = '#71717a'; ctx.font = `500 ${bFont * 0.5}px "Inter", sans-serif`;
                    ctx.fillText(imgData.exifDate || '', iX, bY + bFont * 1.8);
                    ctx.fillText((exifParams || '24MM F2.8 1/100S ISO250') + '    ' + (exifLens || 'STANDARD LENS'), iX, bY + bFont * 2.8);

                    if (imgData.palette && imgData.palette.length > 0) {
                        const pW = sEdge * 0.08, pH = sEdge * 0.025;
                        let startX = iX + iW - (pW * imgData.palette.length);
                        imgData.palette.forEach((color, idx) => {
                            ctx.fillStyle = color.rgbStr ? color.rgbStr : color;
                            ctx.fillRect(startX + (idx * pW), bY + bFont * 0.2, pW, pH);
                        });
                    }
                }
            };

        // =====================================================================
        // 17. EXIF MINIMAL (极简对角)
        // =====================================================================
        } else if (style === 'exif_minimal') {
            wallPaddingX = 0; wallPaddingY = 0;
            const padX = shortEdge * 0.1 * matMultiplier, padY = shortEdge * 0.15 * matMultiplier;
            sceneW = imgW + padX * 2; sceneH = imgH + padY * 2;

            drawLogic = (scale) => {
                ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sceneW * scale, sceneH * scale);
                const iX = padX * scale, iY = padY * scale, iW = imgW * scale, iH = imgH * scale;
                const fImg = app.getFilteredImage(imgData, iW, iH, bwAmount, invertAmount);
                ctx.drawImage(fImg, iX, iY, iW, iH);

                if (matMultiplier > 0.4) {
                    const sEdge = shortEdge * scale, bFont = sEdge * 0.022;
                    const brand = (exifCamera || 'CAMERA').split(' ')[0].toUpperCase();
                    const model = (exifCamera || 'UNKNOWN MODEL').replace(brand, '').trim() || exifCamera;

                    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                    ctx.fillStyle = '#0a0a0a'; ctx.font = `700 ${bFont * 2}px "Inter", sans-serif`;
                    try { ctx.letterSpacing = `${bFont*0.08}px`; } catch(e){}
                    ctx.fillText(brand, iX, iY - (padY * scale * 0.6));
                    try { ctx.letterSpacing = '0px'; } catch(e){}

                    ctx.fillStyle = '#52525b'; ctx.font = `500 ${bFont * 0.7}px "Inter", sans-serif`;
                    ctx.fillText(model, iX, iY - (padY * scale * 0.6) + bFont * 2.4);

                    const bY = iY + iH + (padY * scale * 0.25);
                    ctx.textAlign = 'right'; ctx.fillStyle = '#71717a'; ctx.font = `500 ${bFont * 0.6}px "Inter", sans-serif`;
                    ctx.fillText(exifLens || 'RF 24-70MM F2.8 L', iX + iW, bY);
                    ctx.fillText(imgData.exifDate || '', iX + iW, bY + bFont * 1.3);

                    ctx.fillStyle = '#0a0a0a'; ctx.font = `600 ${bFont * 0.65}px "Inter", sans-serif`;
                    try { ctx.letterSpacing = `${bFont*0.05}px`; } catch(e){}
                    ctx.fillText((exifParams || '24MM F2.8 1/100S ISO250').toUpperCase(), iX + iW, bY + bFont * 2.6);
                    try { ctx.letterSpacing = '0px'; } catch(e){}
                }
            };
        }

        let finalScale = 1, outW, outH;
        if (targetWidth && targetHeight) {
            finalScale = Math.min(targetWidth / sceneW, targetHeight / sceneH);
            outW = Math.max(1, Math.round(sceneW * finalScale));
            outH = Math.max(1, Math.round(sceneH * finalScale));
        } else {
            finalScale = app.OUTPUT_MAX_DIMENSION / Math.max(sceneW, sceneH);
            outW = Math.max(1, Math.round(sceneW * finalScale));
            outH = Math.max(1, Math.round(sceneH * finalScale));
        }

        ctx.canvas.width = outW;
        ctx.canvas.height = outH;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        drawLogic(finalScale);
    }
};