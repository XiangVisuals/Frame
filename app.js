/**
 * XIANG FRAME 4.5 PRO - Studio Core Controller
 * 100% 完整独立版：处理启动序幕、HEIC/HDR、P3 色域解码与交互色卡
 */
function triggerHaptic(type = 'light') {
    if (!navigator.vibrate) return;
    try {
        if (type === 'light') navigator.vibrate(10);
        else if (type === 'medium') navigator.vibrate(20);
        else if (type === 'success') navigator.vibrate([15, 30, 15]);
    } catch(e) {}
}

// 2.6 秒五幕装裱开机动画逻辑
function runBootSequence() {
    const preloader = document.getElementById('bootPreloader');
    if (!preloader) return;

    let dismissed = false;
    const finishBoot = () => {
        if (dismissed) return;
        dismissed = true;
        preloader.classList.add('dismissed');
        document.body.classList.add('app-ready');
    };

    setTimeout(finishBoot, 2600);
}

class AppController {
    constructor() {
        this.state = {
            images: [],
            activeId: null,
            darkMode: false,
            exportFormat: 'image/jpeg',
            settings: {
                style: 'exif',
                wallColor: '#ffffff',
                matMultiplier: 1.0,
                shadowMultiplier: 1.0,
                invertAmount: 0,
                grainAmount: 0.15,
                bwAmount: 0,
                hdrBoost: 0,
                vectorCols: 70
            },
            isProcessing: false,
            grainPattern: null,
            supportsP3: false,
            currentTab: 0
        };
        this.OUTPUT_MAX_DIMENSION = 4200;
        this.isRendering = false;
        this.animationFrames = {};
        this.hitboxes = [];
        this.dragInfo = { active: false, id: null, offsetX: 0, offsetY: 0, currX: 0, currY: 0 };

        this.initDOM();
        this.initColorSpace();
        this.bindEvents();
        this.initSortable();
        this.updateControlsVisibility(this.state.settings.style);

        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
            this.renderPreview(false);
        }, 200));

        if (window.innerWidth < 768) {
            this.switchToTab(0);
        }
    }

    initDOM() {
        const $ = (id) => document.getElementById(id);
        this.dom = {
            fileInput: $('fileInput'),
            btnAddFiles: $('btnAddFiles'),
            btnStudioTheme: $('btnStudioTheme'),
            btnDownloadAll: $('btnDownloadAll'),
            btnDownloadCurrent: $('btnDownloadCurrent'),
            btnApplyTextToAll: $('btnApplyTextToAll'),

            thumbnailList: $('thumbnailList'),
            galleryCount: $('galleryCount'),
            emptyState: $('emptyState'),
            workspace: $('workspace'),
            previewCanvas: $('previewCanvas'),
            controlPanel: $('controlPanel'),
            imgDimensions: $('imgDimensions'),
            hudStyleName: $('hudStyleName'),
            hudHdrBadge: $('hudHdrBadge'),
            hudHdrText: $('hudHdrText'),
            inspectorColorSpace: $('inspectorColorSpace'),
            globalLoader: $('globalLoader'),
            loaderMainTitle: $('loaderMainTitle'),
            loaderSubTitle: $('loaderSubTitle'),

            inputLeft: $('inputLeft'),
            inputRight: $('inputRight'),
            inputExifTime: $('inputExifTime'),
            inputLocation: $('inputLocation'),
            inputExifCamera: $('inputExifCamera'),
            inputExifLens: $('inputExifLens'),
            inputExifParams: $('inputExifParams'),
            inputFilmName: $('inputFilmName'),

            matSizeSlider: $('matSizeSlider'),
            matSizeVal: $('matSizeVal'),
            shadowSlider: $('shadowSlider'),
            shadowVal: $('shadowVal'),
            hdrBoostSlider: $('hdrBoostSlider'),
            hdrBoostVal: $('hdrBoostVal'),
            vectorColsSlider: $('vectorColsSlider'),
            vectorColsVal: $('vectorColsVal'),

            btnToggleBW: $('btnToggleBW'),
            btnToggleInvert: $('btnToggleInvert'),
            grainSlider: $('grainSlider'),
            grainVal: $('grainVal'),

            navBtns: document.querySelectorAll('.nav-btn'),
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabPanes: document.querySelectorAll('.tab-pane'),
            styleBtns: document.querySelectorAll('.style-btn'),
            wallBtns: document.querySelectorAll('.wall-btn'),

            toastContainer: $('toastContainer'),
            progressModal: $('progressModal'),
            progressBar: $('progressBar'),
            progressTitle: $('progressTitle'),
            progressCount: $('progressCount')
        };
    }

    initColorSpace() {
        this.state.supportsP3 = window.matchMedia && window.matchMedia('(color-gamut: p3)').matches;
        try {
            this.ctx = this.dom.previewCanvas.getContext('2d', {
                alpha: false,
                colorSpace: this.state.supportsP3 ? 'display-p3' : 'srgb'
            });
        } catch (e) {
            this.ctx = this.dom.previewCanvas.getContext('2d', { alpha: false });
        }
    }

    getCanvasContext(canvas, options = {}) {
        try {
            return canvas.getContext('2d', {
                colorSpace: this.state.supportsP3 ? 'display-p3' : 'srgb',
                ...options
            });
        } catch (e) {
            return canvas.getContext('2d', options);
        }
    }

    toggleDarkMode(forceState = null) {
        this.state.darkMode = forceState !== null ? forceState : !this.state.darkMode;
        document.body.classList.toggle('dark-mode', this.state.darkMode);

        const icon = this.dom.btnStudioTheme.querySelector('i');
        if (icon) {
            icon.className = this.state.darkMode
                ? 'fa-solid fa-sun text-[11px]'
                : 'fa-solid fa-moon text-[11px]';
        }
    }

    initSortable() {
        new Sortable(this.dom.thumbnailList, {
            animation: 180,
            ghostClass: 'sortable-ghost',
            onEnd: () => {
                triggerHaptic('light');
                const itemEls = this.dom.thumbnailList.querySelectorAll('.thumb-item');
                const newOrderIds = Array.from(itemEls).map(el => el.dataset.id);
                this.state.images.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
                if (this.state.settings.style === 'film_strip') {
                    this.renderPreview(false);
                }
            }
        });
    }

    switchToTab(index, targetTabId = null) {
        triggerHaptic('light');
        this.state.currentTab = index;
        const pager = document.getElementById('view-pager');

        if (window.innerWidth < 768) {
            pager.style.transform = `translateX(-${index * 100}vw)`;
        }

        if (index === 1 && targetTabId) {
            this.dom.tabBtns.forEach(b => {
                const active = b.dataset.tab === targetTabId;
                b.classList.toggle('bg-xv-black', active);
                b.classList.toggle('text-white', active);
                b.classList.toggle('text-xv-gray', !active);
            });

            this.dom.tabPanes.forEach(pane => {
                pane.style.display = pane.id === targetTabId ? 'block' : 'none';
            });
        }

        this.dom.navBtns.forEach(b => {
            const bIndex = parseInt(b.dataset.index);
            const bTarget = b.dataset.target;
            const isActive = (index === 0 && bIndex === 0) || (index === 1 && bIndex === 1 && bTarget === targetTabId);
            b.classList.toggle('active-nav', isActive);
        });

        if (this.state.images.length > 0) setTimeout(() => this.renderPreview(false), 260);
    }

    handleResize() {
        const pager = document.getElementById('view-pager');
        pager.style.transform = window.innerWidth >= 768 ? '' : `translateX(-${this.state.currentTab * 100}vw)`;
    }

    animateFilter(key, targetValue) {
        if (this.animationFrames[key]) cancelAnimationFrame(this.animationFrames[key]);
        const startValue = this.state.settings[key];
        const startTime = performance.now();
        const duration = 260;

        const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            this.state.settings[key] = startValue + (targetValue - startValue) * ease;
            this.renderPreview(false);
            if (progress < 1) this.animationFrames[key] = requestAnimationFrame(animate);
        };
        this.animationFrames[key] = requestAnimationFrame(animate);
    }

    bindEvents() {
        this.dom.btnAddFiles.addEventListener('click', () => { triggerHaptic(); this.dom.fileInput.click(); });
        this.dom.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        this.dom.btnStudioTheme.addEventListener('click', () => {
            triggerHaptic('light');
            this.toggleDarkMode();
        });

        this.dom.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchToTab(parseInt(e.currentTarget.dataset.index), e.currentTarget.dataset.target);
            });
        });

        this.dom.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchToTab(1, e.currentTarget.dataset.tab));
        });

        document.body.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.dataTransfer.types.includes('Files')) document.body.classList.add('opacity-80');
        });
        document.body.addEventListener('dragleave', (e) => {
            if (e.clientX === 0 || e.clientY === 0) document.body.classList.remove('opacity-80');
        });
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            document.body.classList.remove('opacity-80');
            if (!this.state.isProcessing && e.dataTransfer.files.length > 0) this.handleFiles(e.dataTransfer.files);
        });

        this.dom.styleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                triggerHaptic('light');
                const target = e.currentTarget;
                const newStyle = target.dataset.style;
                this.dom.styleBtns.forEach(b => b.classList.remove('active'));
                target.classList.add('active');
                if (this.dom.hudStyleName) {
                    this.dom.hudStyleName.textContent = newStyle.replace(/_/g, ' ').toUpperCase();
                }
                this.updateSettings({ style: newStyle }, true);
            });
        });

        this.dom.wallBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                triggerHaptic('light');
                const color = e.target.dataset.wall;
                this.updateSettings({ wallColor: color }, false);
                this.dom.wallBtns.forEach(b => b.classList.remove('ring-2', 'ring-offset-1', 'ring-offset-2', 'ring-xv-black'));
                e.target.classList.add('ring-2', 'ring-offset-1', 'ring-xv-black');
            });
        });

        this.dom.btnToggleBW.addEventListener('click', () => {
            triggerHaptic('light');
            const isBW = this.state.settings.bwAmount === 1;
            this.animateFilter('bwAmount', isBW ? 0 : 1);
            this.dom.btnToggleBW.classList.toggle('active-bw', !isBW);
        });

        this.dom.btnToggleInvert.addEventListener('click', () => {
            triggerHaptic('light');
            const isInvert = this.state.settings.invertAmount === 1;
            this.animateFilter('invertAmount', isInvert ? 0 : 1);
            this.dom.btnToggleInvert.classList.toggle('active-invert', !isInvert);
        });

        const bindSlider = (slider, key, label, fmt) => {
            if (!slider) return;
            slider.addEventListener('input', (e) => {
                if (this.isRendering) return;
                this.isRendering = true;
                requestAnimationFrame(() => {
                    const val = parseFloat(e.target.value);
                    this.updateSettings({ [key]: val }, false);
                    label.textContent = fmt ? fmt(val) : `${Math.round(val * 100)}%`;
                    this.isRendering = false;
                });
            });
        };
        bindSlider(this.dom.matSizeSlider, 'matMultiplier', this.dom.matSizeVal);
        bindSlider(this.dom.shadowSlider, 'shadowMultiplier', this.dom.shadowVal);
        bindSlider(this.dom.grainSlider, 'grainAmount', this.dom.grainVal);
        bindSlider(this.dom.hdrBoostSlider, 'hdrBoost', this.dom.hdrBoostVal);
        bindSlider(this.dom.vectorColsSlider, 'vectorCols', this.dom.vectorColsVal, v => `${v} 列`);

        const onTextChange = this.debounce((key, value) => {
            const activeImg = this.getActiveImage();
            if (activeImg) {
                activeImg[key] = value;
                this.renderPreview(false);
            }
        }, 120);

        const textMap = [
            ['inputLeft', 'textLeft'], ['inputRight', 'textRight'],
            ['inputExifTime', 'exifTime'], ['inputLocation', 'location'],
            ['inputExifCamera', 'exifCamera'], ['inputExifLens', 'exifLens'],
            ['inputExifParams', 'exifParams'], ['inputFilmName', 'filmName']
        ];
        textMap.forEach(([domKey, prop]) => {
            if (this.dom[domKey]) {
                this.dom[domKey].addEventListener('input', (e) => onTextChange(prop, e.target.value));
            }
        });

        this.dom.btnApplyTextToAll.addEventListener('click', () => {
            triggerHaptic('success');
            const activeImg = this.getActiveImage();
            if (!activeImg) return;
            this.state.images.forEach(img => {
                textMap.forEach(([, prop]) => { img[prop] = activeImg[prop]; });
            });
            this.showToast('ARCHIVE METADATA SYNCED // 已同步至全部作品', 'success');
        });

        this.dom.btnDownloadCurrent.addEventListener('click', () => { triggerHaptic('medium'); this.downloadCurrent(); });
        this.dom.btnDownloadAll.addEventListener('click', () => { triggerHaptic('medium'); this.downloadAll(); });

        // 交互式色卡微调器
        const paletteContainer = document.getElementById('interactivePalette');
        const btnShufflePalette = document.getElementById('btnShufflePalette');

        const renderPaletteEditor = () => {
            const activeImg = this.getActiveImage();
            if (!paletteContainer || !activeImg || !activeImg.palette) return;
            paletteContainer.innerHTML = '';

            activeImg.palette.forEach((colorObj, idx) => {
                const wrap = document.createElement('div');
                wrap.className = 'palette-chip-wrapper';
                wrap.style.backgroundColor = colorObj.hex || colorObj.rgbStr;
                wrap.innerHTML = `
                    <input type="color" class="palette-chip-input" value="${colorObj.hex || '#334155'}">
                    <span class="palette-chip-hex">${(colorObj.hex || '').replace('#', '')}</span>
                `;
                wrap.querySelector('input').addEventListener('input', (e) => {
                    const hex = e.target.value.toUpperCase();
                    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
                    activeImg.palette[idx] = { hex, r, g, b, rgbStr: `rgb(${r}, ${g}, ${b})` };
                    wrap.style.backgroundColor = hex;
                    wrap.querySelector('.palette-chip-hex').textContent = hex.replace('#', '');
                    this.renderPreview(false);
                });
                paletteContainer.appendChild(wrap);
            });
        };

        btnShufflePalette?.addEventListener('click', () => {
            const activeImg = this.getActiveImage();
            if (!activeImg?.palette) return;
            triggerHaptic('light');
            activeImg.palette.push(activeImg.palette.shift());
            renderPaletteEditor();
            this.renderPreview(false);
        });

        // 导出规格引擎按钮
        document.querySelectorAll('.res-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                triggerHaptic('light');
                const dim = parseInt(e.currentTarget.dataset.dim);
                this.OUTPUT_MAX_DIMENSION = dim;
                document.querySelectorAll('.res-btn').forEach(b => {
                    const active = b === e.currentTarget;
                    b.className = active
                        ? 'res-btn py-1.5 border border-xv-black bg-xv-black text-white text-[9.5px] font-mono font-bold'
                        : 'res-btn py-1.5 border border-xv-border text-[9.5px] font-mono font-semibold text-xv-gray';
                });
                this.showToast(`EXPORT RESOLUTION: ${dim}PX`, 'info');
            });
        });

        document.querySelectorAll('.fmt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                triggerHaptic('light');
                this.state.exportFormat = e.currentTarget.dataset.fmt;
                document.querySelectorAll('.fmt-btn').forEach(b => {
                    const active = b === e.currentTarget;
                    b.className = active
                        ? 'fmt-btn py-1 border border-xv-black bg-xv-black text-white text-[9px] font-mono font-bold'
                        : 'fmt-btn py-1 border border-xv-border text-[9px] font-mono font-semibold text-xv-gray';
                });
            });
        });

        // 快捷键支持
        window.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                e.preventDefault(); this.downloadCurrent(); return;
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                if (this.state.images.length < 2) return;
                const idx = this.state.images.findIndex(i => i.id === this.state.activeId);
                const next = e.key === 'ArrowRight' ? (idx + 1) % this.state.images.length : (idx - 1 + this.state.images.length) % this.state.images.length;
                this.setActiveImage(this.state.images[next].id);
            } else if (e.key.toLowerCase() === 'd') {
                this.toggleDarkMode();
            }
        });
    }

    debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    updateThumbnailsOrderDOM() {
        this.state.images.forEach(img => {
            const thumb = this.dom.thumbnailList.querySelector(`[data-id="${img.id}"]`);
            if (thumb) this.dom.thumbnailList.appendChild(thumb);
        });
    }

    async detectHdrAndColorProfile(file, exifData) {
        let isHDR = false, hdrType = 'SDR', colorProfile = 'sRGB';
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const isHeic = ext === 'heic' || ext === 'heif' || file.type.includes('heic') || file.type.includes('heif');
        const isAvif = ext === 'avif' || file.type.includes('avif');

        if (exifData) {
            if (exifData.ColorSpace === 65535 || String(exifData.ProfileDescription || '').includes('P3')) colorProfile = 'DISPLAY-P3';
            if (exifData.CustomRendered === 3 || (exifData.Make && String(exifData.Make).toUpperCase().includes('APPLE') && isHeic)) {
                isHDR = true; hdrType = 'APPLE EDR'; colorProfile = 'DISPLAY-P3';
            }
        }

        try {
            const buf = await file.slice(0, Math.min(file.size, 262144)).arrayBuffer();
            const ascii = new TextDecoder('latin1').decode(new Uint8Array(buf));
            if (ascii.includes('hdrgm') || ascii.includes('GainMap') || ascii.includes('21496')) {
                isHDR = true; hdrType = 'ULTRA HDR'; colorProfile = 'DISPLAY-P3';
            } else if (ascii.includes('tmap') || ascii.includes('hvc1')) {
                isHDR = true; hdrType = isHeic ? 'HEIF 10-BIT HDR' : 'HDR GAINMAP'; colorProfile = 'DISPLAY-P3';
            } else if (ascii.includes('Display P3') || isHeic) {
                colorProfile = 'DISPLAY-P3';
            }
        } catch (e) {}

        if (isAvif) colorProfile = 'DISPLAY-P3';
        return { isHDR, hdrType, colorProfile, isHeic };
    }

    async decodeImageFile(file) {
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const isHeic = ext === 'heic' || ext === 'heif' || file.type.includes('heic') || file.type.includes('heif');
        const nativeUrl = URL.createObjectURL(file);
        try {
            const imgObj = await this.loadImage(nativeUrl);
            return { url: nativeUrl, imgObj };
        } catch (nativeErr) {
            URL.revokeObjectURL(nativeUrl);
            if (isHeic && typeof heic2any !== 'undefined') {
                if (this.dom.loaderSubTitle) this.dom.loaderSubTitle.textContent = `TRANSCODING HEIC (${file.name})...`;
                const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.96 });
                const finalBlob = Array.isArray(converted) ? converted[0] : converted;
                const convertedUrl = URL.createObjectURL(finalBlob);
                const imgObj = await this.loadImage(convertedUrl);
                return { url: convertedUrl, imgObj };
            }
            throw nativeErr;
        }
    }

    computeHistogram(imgObj) {
        const bins = 64;
        const rH = new Float32Array(bins), gH = new Float32Array(bins), bH = new Float32Array(bins), lH = new Float32Array(bins);
        try {
            const cvs = document.createElement('canvas');
            cvs.width = 128; cvs.height = 128;
            const ctx = this.getCanvasContext(cvs, { willReadFrequently: true });
            ctx.drawImage(imgObj, 0, 0, 128, 128);
            const data = ctx.getImageData(0, 0, 128, 128).data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                rH[Math.min(bins - 1, Math.floor((r / 256) * bins))]++;
                gH[Math.min(bins - 1, Math.floor((g / 256) * bins))]++;
                bH[Math.min(bins - 1, Math.floor((b / 256) * bins))]++;
                lH[Math.min(bins - 1, Math.floor((lum / 256) * bins))]++;
            }
            const norm = (arr) => {
                const max = Math.max(...arr, 1);
                return arr.map((_, i) => Math.pow((arr[Math.max(0, i - 1)] * 0.25 + arr[i] * 0.5 + arr[Math.min(bins - 1, i + 1)] * 0.25) / max, 0.75));
            };
            return { r: norm(rH), g: norm(gH), b: norm(bH), l: norm(lH) };
        } catch (e) {
            return { r: rH, g: gH, b: bH, l: lH };
        }
    }

    extractPalette(imgObj) {
        const fallback = [
            { rgbStr: '#d4d4d8', hex: '#D4D4D8', r: 212, g: 212, b: 216 },
            { rgbStr: '#94a3b8', hex: '#94A3B8', r: 148, g: 163, b: 184 },
            { rgbStr: '#64748b', hex: '#64748B', r: 100, g: 116, b: 139 },
            { rgbStr: '#1e293b', hex: '#1E293B', r: 30, g: 41, b: 59 }
        ];
        try {
            const cvs = document.createElement('canvas');
            cvs.width = 64; cvs.height = 64;
            const ctx = this.getCanvasContext(cvs, { willReadFrequently: true });
            ctx.drawImage(imgObj, 0, 0, 64, 64);
            const data = ctx.getImageData(0, 0, 64, 64).data;
            const counts = {}, pool = [];

            for (let i = 0; i < data.length; i += 4) {
                if (data[i+3] < 128) continue;
                const r = data[i], g = data[i+1], b = data[i+2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                if (lum > 242 || lum < 14) continue;
                pool.push({ r, g, b });
                const k = `${r >> 5},${g >> 5},${b >> 5}`;
                if (!counts[k]) counts[k] = { count: 0, r: 0, g: 0, b: 0 };
                counts[k].count++; counts[k].r += r; counts[k].g += g; counts[k].b += b;
            }
            const bins = Object.values(counts).sort((a, b) => b.count - a.count);
            if (!bins.length) return fallback;

            const picked = bins.slice(0, 4).map(b => ({ r: Math.round(b.r / b.count), g: Math.round(b.g / b.count), b: Math.round(b.b / b.count) }));
            while (picked.length < 4) picked.push(pool[picked.length] || { r: 120, g: 120, b: 120 });

            const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
            return picked.map(c => ({ rgbStr: `rgb(${c.r}, ${c.g}, ${c.b})`, hex: `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`, r: c.r, g: c.g, b: c.b }));
        } catch (e) {
            return fallback;
        }
    }

    async handleFiles(fileList) {
        const files = Array.from(fileList).filter(f => f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif|avif|tif|tiff|dng)$/i.test(f.name));
        if (!files.length) { this.showToast('未检测到有效的图片或 HEIC/HDR 文件', 'error'); return; }

        this.dom.globalLoader.classList.add('active');
        await new Promise(r => setTimeout(r, 60));

        if (!this.state.images.length) {
            this.dom.emptyState.style.display = 'none';
            this.dom.controlPanel.classList.remove('opacity-40', 'pointer-events-none');
            this.dom.btnDownloadCurrent.classList.replace('hidden', 'flex');
            this.dom.btnDownloadAll.classList.replace('hidden', 'flex');
        }

        let firstNewId = null, hdrCount = 0;
        for (const file of files) {
            try {
                let exif = null;
                try { if (typeof exifr !== 'undefined') exif = await exifr.parse(file, { gps: true, tiff: true, exif: true, icc: true }); } catch (e) {}

                const hdrInfo = await this.detectHdrAndColorProfile(file, exif);
                if (hdrInfo.isHDR) hdrCount++;

                const { url, imgObj } = await this.decodeImageFile(file);
                const make = (exif?.Make || '').trim(), model = (exif?.Model || '').trim();
                const camera = (model.toUpperCase().startsWith(make.toUpperCase()) ? model : `${make} ${model}`).trim().toUpperCase() || 'DIGITAL CAMERA';
                const lens = (exif?.LensModel || '24MM F/2.8').toUpperCase();
                const focal = exif?.FocalLength ? `${parseFloat(Number(exif.FocalLength).toFixed(1))}mm` : '24mm';
                const fnum = exif?.FNumber ? `f/${parseFloat(Number(exif.FNumber).toFixed(1))}` : 'f/2.8';
                const exp = exif?.ExposureTime ? (exif.ExposureTime >= 1 ? `${exif.ExposureTime}s` : `1/${Math.round(1 / exif.ExposureTime)}s`) : '1/125s';
                const iso = exif?.ISO ? `ISO ${exif.ISO}` : 'ISO 400';
                const params = `${focal}   ${fnum}   ${exp}   ${iso}`;

                let dateStr = 'PHOTOGRAPHED IN : OCT 15, 2026', timeStr = '12 FEB 2026';
                if (exif?.DateTimeOriginal) {
                    const d = new Date(exif.DateTimeOriginal);
                    if (!isNaN(d)) {
                        dateStr = 'PHOTOGRAPHED IN : ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
                        timeStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
                    }
                }

                let locationStr = "38° 55' 00\" N    121° 38' 00\" E";
                if (typeof exif?.latitude === 'number' && typeof exif?.longitude === 'number') {
                    const dms = (deg, isLat) => `${Math.floor(Math.abs(deg))}° ${Math.floor((Math.abs(deg)-Math.floor(Math.abs(deg)))*60)}' ${Math.round(((Math.abs(deg)-Math.floor(Math.abs(deg)))*60-Math.floor((Math.abs(deg)-Math.floor(Math.abs(deg)))*60))*60)}" ${isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W')}`;
                    locationStr = `${dms(exif.latitude, true)}    ${dms(exif.longitude, false)}`;
                }

                const newImg = {
                    id: 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                    file, url, imgObj,
                    width: imgObj.width, height: imgObj.height,
                    textLeft: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').toUpperCase() || 'UNTITLED ARTWORK',
                    textRight: '© XIANGVISUALS',
                    exifTime: timeStr, location: locationStr, exifCamera: camera,
                    exifLens: lens, exifParams: params, exifDate: dateStr, filmName: 'FUJIFILM RVP50',
                    palette: this.extractPalette(imgObj), histogram: this.computeHistogram(imgObj),
                    isHDR: hdrInfo.isHDR, hdrType: hdrInfo.hdrType, colorProfile: hdrInfo.colorProfile
                };

                this.state.images.push(newImg);
                this.addThumbnail(newImg);
                if (!firstNewId) firstNewId = newImg.id;
            } catch (e) {
                console.error('加载失败:', file.name, e);
                this.showToast(`无法解码 ${file.name}`, 'error');
            }
        }

        this.updateGalleryCounter();
        this.dom.globalLoader.classList.remove('active');
        if (firstNewId) this.setActiveImage(firstNewId);
        if (window.innerWidth < 768) this.switchToTab(1, 'tab-templates');

        triggerHaptic('success');
        this.showToast(`LOADED ${files.length} ARTWORKS${hdrCount ? ` (${hdrCount} HDR)` : ''}`, 'success');
    }

    updateGalleryCounter() {
        if (this.dom.galleryCount) this.dom.galleryCount.textContent = `${this.state.images.length}`;
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    addThumbnail(imgData) {
        const div = document.createElement('div');
        div.className = 'thumb-item relative shrink-0 w-full aspect-square overflow-hidden bg-xv-light group';
        div.dataset.id = imgData.id;

        const badge = imgData.isHDR ? `<span class="absolute bottom-1 left-1 px-1 bg-black/85 text-amber-300 font-mono text-[8px] font-bold z-10">HDR</span>` : (imgData.colorProfile === 'DISPLAY-P3' ? `<span class="absolute bottom-1 left-1 px-1 bg-black/75 text-white font-mono text-[8px] z-10">P3</span>` : '');
        div.innerHTML = `<img src="${imgData.url}" class="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105">${badge}`;

        const delBtn = document.createElement('button');
        delBtn.className = 'absolute top-1 right-1 w-5 h-5 bg-xv-black/80 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10';
        delBtn.innerHTML = '<i class="fa-solid fa-xmark text-[10px]"></i>';
        delBtn.addEventListener('click', (e) => { e.stopPropagation(); triggerHaptic('light'); this.removeImage(imgData.id); });

        div.appendChild(delBtn);
        div.addEventListener('click', () => { triggerHaptic('light'); this.setActiveImage(imgData.id); });
        this.dom.thumbnailList.appendChild(div);
    }

    removeImage(id) {
        const index = this.state.images.findIndex(img => img.id === id);
        if (index === -1) return;
        URL.revokeObjectURL(this.state.images[index].url);
        this.state.images.splice(index, 1);
        document.querySelector(`.thumb-item[data-id="${id}"]`)?.remove();
        this.updateGalleryCounter();

        if (!this.state.images.length) {
            this.resetUI();
        } else if (this.state.activeId === id) {
            this.setActiveImage(this.state.images[Math.min(index, this.state.images.length - 1)].id);
        }
        if (this.state.settings.style === 'film_strip') this.renderPreview(true);
    }

    resetUI() {
        this.state.activeId = null;
        this.dom.emptyState.style.display = 'flex';
        this.dom.controlPanel.classList.add('opacity-40', 'pointer-events-none');
        this.dom.btnDownloadCurrent.classList.replace('flex', 'hidden');
        this.dom.btnDownloadAll.classList.replace('flex', 'hidden');
        this.dom.previewCanvas.classList.remove('loaded');
        this.dom.hudHdrBadge?.classList.add('hidden');
        this.ctx.clearRect(0, 0, this.dom.previewCanvas.width, this.dom.previewCanvas.height);
        this.dom.imgDimensions.textContent = '-- × --';
        if (window.innerWidth < 768) this.switchToTab(0);
    }

    getActiveImage() { return this.state.images.find(img => img.id === this.state.activeId); }

    setActiveImage(id) {
        this.state.activeId = id;
        const imgData = this.getActiveImage();
        if (!imgData) return;

        document.querySelectorAll('.thumb-item').forEach(el => el.classList.toggle('active', el.dataset.id === id));

        this.dom.inputLeft.value = imgData.textLeft || '';
        this.dom.inputRight.value = imgData.textRight || '';
        this.dom.inputExifTime.value = imgData.exifTime || '';
        this.dom.inputLocation.value = imgData.location || '';
        this.dom.inputExifCamera.value = imgData.exifCamera || '';
        this.dom.inputExifLens.value = imgData.exifLens || '';
        this.dom.inputExifParams.value = imgData.exifParams || '';
        this.dom.inputFilmName.value = imgData.filmName || '';
        this.dom.imgDimensions.textContent = `${imgData.width} × ${imgData.height}`;

        if (this.dom.hudHdrBadge) {
            const showHdr = imgData.isHDR || imgData.colorProfile === 'DISPLAY-P3';
            this.dom.hudHdrBadge.classList.toggle('hidden', !showHdr);
            this.dom.hudHdrBadge.classList.toggle('flex', showHdr);
            this.dom.hudHdrText.textContent = imgData.isHDR ? `${imgData.hdrType} · P3` : 'DISPLAY-P3';
        }
        if (this.dom.inspectorColorSpace) {
            this.dom.inspectorColorSpace.textContent = imgData.isHDR ? imgData.hdrType : imgData.colorProfile;
        }

        const paletteContainer = document.getElementById('interactivePalette');
        if (paletteContainer && imgData.palette) {
            paletteContainer.innerHTML = '';
            imgData.palette.forEach((colorObj, idx) => {
                const wrap = document.createElement('div');
                wrap.className = 'palette-chip-wrapper';
                wrap.style.backgroundColor = colorObj.hex || colorObj.rgbStr;
                wrap.innerHTML = `<input type="color" class="palette-chip-input" value="${colorObj.hex || '#334155'}"><span class="palette-chip-hex">${(colorObj.hex || '').replace('#', '')}</span>`;
                wrap.querySelector('input').addEventListener('input', (e) => {
                    const hex = e.target.value.toUpperCase();
                    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
                    imgData.palette[idx] = { hex, r, g, b, rgbStr: `rgb(${r}, ${g}, ${b})` };
                    wrap.style.backgroundColor = hex;
                    wrap.querySelector('.palette-chip-hex').textContent = hex.replace('#', '');
                    this.renderPreview(false);
                });
                paletteContainer.appendChild(wrap);
            });
        }

        this.renderPreview(true);
    }

    updateSettings(newSettings, animate = false) {
        const oldStyle = this.state.settings.style;
        this.state.settings = { ...this.state.settings, ...newSettings };
        if (newSettings.style && newSettings.style !== oldStyle) {
            this.updateControlsVisibility(newSettings.style);
        }
        this.renderPreview(animate);
    }

    updateControlsVisibility(style) {
        const isFilm = style.startsWith('film') || style === 'halation_lab';
        const isVector = style === 'vector_field';
        const hasWall = ['polaroid', 'film35mm', 'film_strip'].includes(style);
        const hasShadow = ['polaroid', 'film35mm', 'film_strip', 'aura_blur'].includes(style);

        document.getElementById('section-vector').style.display = isVector ? 'block' : 'none';
        document.getElementById('ctrl-grain').style.display = isFilm ? 'block' : 'none';
        document.getElementById('section-materials').style.display = hasWall ? 'block' : 'none';

        const secLayout = document.getElementById('section-layout');
        if (['film4x5', 'film_xpan', 'vector_field'].includes(style)) {
            secLayout.style.display = 'none';
        } else {
            secLayout.style.display = 'block';
            document.getElementById('ctrl-margin').style.display = 'block';
            document.getElementById('ctrl-shadow').style.display = hasShadow ? 'block' : 'none';
        }
    }

    createFilmGrainPattern(ctx) {
        if (this.state.grainPattern) return this.state.grainPattern;
        const cvs = document.createElement('canvas'); cvs.width = 128; cvs.height = 128;
        const pCtx = cvs.getContext('2d'), imgData = pCtx.createImageData(128, 128);
        for (let i = 0; i < imgData.data.length; i += 4) {
            const v = Math.random() * 255;
            imgData.data[i] = v; imgData.data[i+1] = v; imgData.data[i+2] = v; imgData.data[i+3] = 40;
        }
        pCtx.putImageData(imgData, 0, 0);
        this.state.grainPattern = ctx.createPattern(cvs, 'repeat');
        return this.state.grainPattern;
    }

    drawDXCode(ctx, x, y, width, height, seed) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.7)';
        for (let b = 0; b < 5; b++) {
            if (Math.sin(seed + b * 1.3) * 10000 % 1 > 0.4) {
                ctx.fillRect(x + b * width * 0.25, y, width * 0.18, height);
            }
        }
    }

    getFilteredImage(imgDataObj, w, h, bwAmount, invertAmount, modeOverride = null) {
        const hdrBoost = this.state.settings.hdrBoost || 0;
        if (bwAmount === 0 && invertAmount === 0 && hdrBoost === 0 && !modeOverride) return imgDataObj.imgObj;

        const rw = Math.max(1, Math.round(w)), rh = Math.max(1, Math.round(h));
        const cacheKey = `${bwAmount.toFixed(2)}_${invertAmount.toFixed(2)}_${hdrBoost.toFixed(2)}_${modeOverride || 'std'}_${rw}_${rh}`;
        if (imgDataObj.filterCache?.key === cacheKey) return imgDataObj.filterCache.canvas;

        const cvs = document.createElement('canvas'); cvs.width = rw; cvs.height = rh;
        const ctx = this.getCanvasContext(cvs, { willReadFrequently: true });
        ctx.drawImage(imgDataObj.imgObj, 0, 0, rw, rh);
        const imgPixels = ctx.getImageData(0, 0, rw, rh), d = imgPixels.data;

        for (let i = 0; i < d.length; i += 4) {
            let r = d[i], g = d[i+1], b = d[i+2];
            if (hdrBoost > 0) {
                const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                const lift = lum + hdrBoost * 0.28 * Math.sin(lum * Math.PI) * Math.pow(lum, 0.85);
                const sc = lum > 0.001 ? lift / lum : 1;
                r = Math.min(255, r * sc); g = Math.min(255, g * sc); b = Math.min(255, b * sc);
            }
            if (modeOverride === 'cyanotype') {
                const cLum = Math.pow((0.299 * r + 0.587 * g + 0.114 * b) / 255, 0.92);
                if (cLum < 0.5) { const t = cLum * 2; r = 7 + 22 * t; g = 30 + 56 * t; b = 61 + 65 * t; }
                else { const t = (cLum - 0.5) * 2; r = 29 + 215 * t; g = 86 + 155 * t; b = 126 + 108 * t; }
            }
            if (bwAmount > 0) {
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                r += (gray - r) * bwAmount; g += (gray - g) * bwAmount; b += (gray - b) * bwAmount;
            }
            if (invertAmount > 0) {
                r += (255 - r * 2) * invertAmount; g += (255 - g * 2) * invertAmount; b += (255 - b * 2) * invertAmount;
            }
            d[i] = r; d[i+1] = g; d[i+2] = b;
        }
        ctx.putImageData(imgPixels, 0, 0);
        imgDataObj.filterCache = { key: cacheKey, canvas: cvs };
        return cvs;
    }

    async renderScene(ctx, imgData, targetWidth, targetHeight) {
        return window.XiangTemplates.renderScene(this, ctx, imgData, targetWidth, targetHeight);
    }

    async renderPreview(animate = true) {
        const imgData = this.getActiveImage();
        if (!imgData && this.state.settings.style !== 'film_strip') return;
        if (this.state.settings.style === 'film_strip' && !this.state.images.length) return;

        if (animate) this.dom.previewCanvas.classList.remove('loaded');
        const safeDpr = Math.min(window.devicePixelRatio || 1, 2);
        const containerW = Math.max(280, this.dom.workspace.clientWidth - 32);
        const containerH = Math.max(280, this.dom.workspace.clientHeight - 32);

        await this.renderScene(this.ctx, imgData || this.state.images[0], containerW * safeDpr, containerH * safeDpr);

        if (animate) {
            requestAnimationFrame(() => requestAnimationFrame(() => this.dom.previewCanvas.classList.add('loaded')));
        } else {
            this.dom.previewCanvas.classList.add('loaded');
        }
    }

    renderHighResBlob(imgData, styleOverride = null) {
        return new Promise(async (resolve) => {
            const originalStyle = this.state.settings.style;
            if (styleOverride) this.state.settings.style = styleOverride;
            const offCanvas = document.createElement('canvas');
            const offCtx = this.getCanvasContext(offCanvas, { alpha: false });
            await this.renderScene(offCtx, imgData, null, null);
            offCanvas.toBlob((blob) => {
                if (styleOverride) this.state.settings.style = originalStyle;
                resolve(blob);
            }, this.state.exportFormat || 'image/jpeg', 0.96);
        });
    }

    async downloadCurrent() {
        const dataToRender = this.getActiveImage() || this.state.images[0];
        if (!dataToRender || this.state.isProcessing) return;

        this.state.isProcessing = true;
        const originalText = this.dom.btnDownloadCurrent.innerHTML;
        this.dom.btnDownloadCurrent.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>RENDERING</span>';

        try {
            await new Promise(r => setTimeout(r, 40));
            const blob = await this.renderHighResBlob(dataToRender);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const ext = this.state.exportFormat === 'image/png' ? 'png' : 'jpg';
            link.download = `XIANGVISUALS_${this.state.settings.style.toUpperCase()}_${Date.now()}.${ext}`;
            link.href = url; document.body.appendChild(link); link.click(); document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            triggerHaptic('success');
            this.showToast('HIGH-RES ARCHIVE EXPORTED // 高清作品已导出', 'success');
        } catch (e) {
            console.error(e); this.showToast('EXPORT FAILED // 导出失败', 'error');
        } finally {
            this.state.isProcessing = false;
            this.dom.btnDownloadCurrent.innerHTML = originalText;
        }
    }

    async downloadAll() {
        if (!this.state.images.length || this.state.isProcessing) return;

        this.state.isProcessing = true;
        this.dom.progressModal.classList.remove('opacity-0', 'pointer-events-none');

        const stylesToGen = ['exif_palette', 'exif_minimal', 'editorial_magazine', 'glass_overlay', 'gallery_passepartout', 'swiss_grid', 'optical_histogram', 'aura_blur'];
        const totalTasks = this.state.images.length * stylesToGen.length;
        let currentTask = 0;

        this.dom.progressTitle.textContent = 'RENDERING ARCHIVE EDITIONS...';
        this.updateProgress(0, totalTasks);

        try {
            const zip = new JSZip();
            for (let i = 0; i < this.state.images.length; i++) {
                const img = this.state.images[i];
                const baseName = img.file.name.replace(/\.[^/.]+$/, '') || `Artwork_${i+1}`;
                const folder = zip.folder(baseName);
                const ext = this.state.exportFormat === 'image/png' ? 'png' : 'jpg';

                for (const style of stylesToGen) {
                    const blob = await this.renderHighResBlob(img, style);
                    folder.file(`${baseName}_${style.toUpperCase()}.${ext}`, blob);
                    currentTask++;
                    this.updateProgress(currentTask, totalTasks);
                    await new Promise(r => requestAnimationFrame(r));
                }
            }

            this.dom.progressTitle.textContent = 'COMPRESSING ZIP ARCHIVE...';
            const zipContent = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipContent);
            link.download = `XIANGVISUALS_Archive_${Date.now()}.zip`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            triggerHaptic('success');
            this.showToast('BATCH ARCHIVE EXPORTED // 批量画册已打包', 'success');
        } catch (e) {
            console.error(e); this.showToast('BATCH EXPORT FAILED // 打包失败', 'error');
        } finally {
            this.dom.progressModal.classList.add('opacity-0', 'pointer-events-none');
            this.state.isProcessing = false;
        }
    }

    updateProgress(current, total) {
        this.dom.progressBar.style.width = `${Math.floor((current / total) * 100)}%`;
        this.dom.progressCount.textContent = `${current} / ${total} EDITIONS`;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast pointer-events-auto';
        const icon = type === 'success' ? 'fa-check' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-square-full');
        toast.innerHTML = `<i class="fa-solid ${icon} text-[10px]"></i><span class="tracking-widest">${message}</span>`;
        this.dom.toastContainer.appendChild(toast);

        requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    runBootSequence();
    new AppController();
});