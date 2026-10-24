/**
 * XIANG FRAME 3.5 PRO - Core Controller & HDR/HEIC Pipeline
 * - 纯白画廊级开机动画
 * - 全站深色模式切换（无自动强制变黑 Bug）
 */
function triggerHaptic(type = 'light') {
    if (!navigator.vibrate) return;
    try {
        if (type === 'light') navigator.vibrate(10);
        else if (type === 'medium') navigator.vibrate(20);
        else if (type === 'success') navigator.vibrate([15, 30, 15]);
    } catch(e) {}
}

// 纯白画廊启动序幕动画（圆矩影像对焦环 + 毫秒级遥测计数）
function runBootSequence() {
    const preloader = document.getElementById('bootPreloader');
    const counterEl = document.getElementById('bootCounter');
    const barEl = document.getElementById('bootProgressBar');
    const statusEl = document.getElementById('bootStatusText');

    const stages = [
        { pct: 30, text: 'GALLERY WHITE CALIBRATION // DISPLAY-P3 GAMUT' },
        { pct: 65, text: 'MOUNTING APPLE HEIF & GAIN MAP HDR ENGINE...' },
        { pct: 92, text: 'PREPARING SWISS ARCHITECTURAL TEMPLATES...' },
        { pct: 100, text: 'EXHIBITION READY // XIANGVISUALS ARCHIVE 3.5' }
    ];

    const start = performance.now();
    const duration = 950;

    const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentPct = Math.round(eased * 100);

        if (counterEl) counterEl.textContent = String(currentPct).padStart(3, '0');
        if (barEl) barEl.style.width = `${currentPct}%`;

        for (let s of stages) {
            if (currentPct <= s.pct) {
                if (statusEl) statusEl.textContent = s.text;
                break;
            }
        }

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            setTimeout(() => {
                if (preloader) preloader.classList.add('dismissed');
                document.body.classList.add('app-ready');
            }, 140);
        }
    };
    requestAnimationFrame(step);
}

class AppController {
    constructor() {
        this.state = {
            images: [],
            activeId: null,
            darkMode: false,
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
        this.dom = {
            fileInput: document.getElementById('fileInput'),
            btnAddFiles: document.getElementById('btnAddFiles'),
            btnStudioTheme: document.getElementById('btnStudioTheme'),
            btnDownloadAll: document.getElementById('btnDownloadAll'),
            btnDownloadCurrent: document.getElementById('btnDownloadCurrent'),
            btnApplyTextToAll: document.getElementById('btnApplyTextToAll'),

            thumbnailList: document.getElementById('thumbnailList'),
            galleryCount: document.getElementById('galleryCount'),
            emptyState: document.getElementById('emptyState'),
            workspace: document.getElementById('workspace'),
            previewCanvas: document.getElementById('previewCanvas'),
            controlPanel: document.getElementById('controlPanel'),
            imgDimensions: document.getElementById('imgDimensions'),
            hudStyleName: document.getElementById('hudStyleName'),
            hudHdrBadge: document.getElementById('hudHdrBadge'),
            hudHdrText: document.getElementById('hudHdrText'),
            inspectorColorSpace: document.getElementById('inspectorColorSpace'),
            globalLoader: document.getElementById('globalLoader'),
            loaderMainTitle: document.getElementById('loaderMainTitle'),
            loaderSubTitle: document.getElementById('loaderSubTitle'),

            inputLeft: document.getElementById('inputLeft'),
            inputRight: document.getElementById('inputRight'),
            inputExifTime: document.getElementById('inputExifTime'),
            inputLocation: document.getElementById('inputLocation'),
            inputExifCamera: document.getElementById('inputExifCamera'),
            inputExifLens: document.getElementById('inputExifLens'),
            inputExifParams: document.getElementById('inputExifParams'),
            inputFilmName: document.getElementById('inputFilmName'),

            matSizeSlider: document.getElementById('matSizeSlider'),
            matSizeVal: document.getElementById('matSizeVal'),
            shadowSlider: document.getElementById('shadowSlider'),
            shadowVal: document.getElementById('shadowVal'),
            hdrBoostSlider: document.getElementById('hdrBoostSlider'),
            hdrBoostVal: document.getElementById('hdrBoostVal'),

            vectorColsSlider: document.getElementById('vectorColsSlider'),
            vectorColsVal: document.getElementById('vectorColsVal'),

            btnToggleBW: document.getElementById('btnToggleBW'),
            btnToggleInvert: document.getElementById('btnToggleInvert'),
            grainSlider: document.getElementById('grainSlider'),
            grainVal: document.getElementById('grainVal'),

            navBtns: document.querySelectorAll('.nav-btn'),
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabPanes: document.querySelectorAll('.tab-pane'),
            styleBtns: document.querySelectorAll('.style-btn'),
            wallBtns: document.querySelectorAll('.wall-btn'),

            toastContainer: document.getElementById('toastContainer'),
            progressModal: document.getElementById('progressModal'),
            progressBar: document.getElementById('progressBar'),
            progressTitle: document.getElementById('progressTitle'),
            progressCount: document.getElementById('progressCount')
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

    // 全站深色模式切换（同时控制整个应用界面与画布暗房）
    toggleDarkMode(forceState = null) {
        this.state.darkMode = forceState !== null ? forceState : !this.state.darkMode;
        document.body.classList.toggle('dark-mode', this.state.darkMode);
        this.dom.workspace.classList.toggle('dark-studio', this.state.darkMode);

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
                if (b.dataset.tab === targetTabId) {
                    b.classList.add('bg-xv-black', 'text-white');
                    b.classList.remove('text-xv-gray');
                } else {
                    b.classList.remove('bg-xv-black', 'text-white');
                    b.classList.add('text-xv-gray');
                }
            });

            this.dom.tabPanes.forEach(pane => {
                pane.style.display = pane.id === targetTabId ? 'block' : 'none';
            });
        }

        this.dom.navBtns.forEach(b => {
            const bIndex = parseInt(b.dataset.index);
            const bTarget = b.dataset.target;
            let isActive = (index === 0 && bIndex === 0) || (index === 1 && bIndex === 1 && bTarget === targetTabId);
            b.classList.toggle('active-nav', isActive);
        });

        if (this.state.images.length > 0) setTimeout(() => this.renderPreview(false), 300);
    }

    handleResize() {
        if (window.innerWidth >= 768) {
            document.getElementById('view-pager').style.transform = '';
        } else {
            document.getElementById('view-pager').style.transform = `translateX(-${this.state.currentTab * 100}vw)`;
        }
    }

    animateFilter(key, targetValue) {
        if (this.animationFrames[key]) cancelAnimationFrame(this.animationFrames[key]);
        const startValue = this.state.settings[key];
        const startTime = performance.now();
        const duration = 260;

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
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

        // 切换全站深色/浅色模式
        this.dom.btnStudioTheme.addEventListener('click', () => {
            triggerHaptic('light');
            this.toggleDarkMode();
        });

        this.dom.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                const targetTab = e.currentTarget.dataset.target;
                this.switchToTab(index, targetTab);
            });
        });

        this.dom.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.dataset.tab;
                this.switchToTab(1, targetTab);
            });
        });

        const body = document.body;
        body.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.dataTransfer.types.includes('Files')) body.classList.add('opacity-80');
        });
        body.addEventListener('dragleave', (e) => {
            if (e.clientX === 0 || e.clientY === 0) body.classList.remove('opacity-80');
        });
        body.addEventListener('drop', (e) => {
            e.preventDefault();
            body.classList.remove('opacity-80');
            if (!this.state.isProcessing && e.dataTransfer.files.length > 0) this.handleFiles(e.dataTransfer.files);
        });

        // 切换模版：已彻底移除强制把 workspace 变成 dark-studio 的 Bug
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
                this.dom.wallBtns.forEach(b => b.classList.remove('ring-2', 'ring-offset-2', 'ring-xv-black'));
                e.target.classList.add('ring-2', 'ring-offset-2', 'ring-xv-black');
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

        const sliderInputHandler = (key, value, displayElem, formatter) => {
            if (!this.isRendering) {
                this.isRendering = true;
                requestAnimationFrame(() => {
                    this.updateSettings({ [key]: parseFloat(value) }, false);
                    displayElem.textContent = formatter ? formatter(value) : `${Math.round(value * 100)}%`;
                    this.isRendering = false;
                });
            }
        };
        this.dom.matSizeSlider.addEventListener('input', (e) => sliderInputHandler('matMultiplier', e.target.value, this.dom.matSizeVal));
        this.dom.shadowSlider.addEventListener('input', (e) => sliderInputHandler('shadowMultiplier', e.target.value, this.dom.shadowVal));
        this.dom.grainSlider.addEventListener('input', (e) => sliderInputHandler('grainAmount', e.target.value, this.dom.grainVal));
        this.dom.hdrBoostSlider.addEventListener('input', (e) => sliderInputHandler('hdrBoost', e.target.value, this.dom.hdrBoostVal));
        this.dom.vectorColsSlider.addEventListener('input', (e) => sliderInputHandler('vectorCols', e.target.value, this.dom.vectorColsVal, v => `${v} 列`));

        const textInputHandler = this.debounce((key, value) => {
            const activeImg = this.getActiveImage();
            if (activeImg) {
                activeImg[key] = value;
                this.renderPreview(false);
            }
        }, 120);

        this.dom.inputLeft.addEventListener('input', (e) => textInputHandler('textLeft', e.target.value));
        this.dom.inputRight.addEventListener('input', (e) => textInputHandler('textRight', e.target.value));
        this.dom.inputExifTime.addEventListener('input', (e) => textInputHandler('exifTime', e.target.value));
        this.dom.inputLocation.addEventListener('input', (e) => textInputHandler('location', e.target.value));
        this.dom.inputExifCamera.addEventListener('input', (e) => textInputHandler('exifCamera', e.target.value));
        this.dom.inputExifLens.addEventListener('input', (e) => textInputHandler('exifLens', e.target.value));
        this.dom.inputExifParams.addEventListener('input', (e) => textInputHandler('exifParams', e.target.value));
        this.dom.inputFilmName.addEventListener('input', (e) => textInputHandler('filmName', e.target.value));

        this.dom.btnApplyTextToAll.addEventListener('click', () => {
            triggerHaptic('success');
            const activeImg = this.getActiveImage();
            if (!activeImg) return;
            this.state.images.forEach(img => {
                img.textLeft = activeImg.textLeft;
                img.textRight = activeImg.textRight;
                img.exifTime = activeImg.exifTime;
                img.location = activeImg.location;
                img.exifCamera = activeImg.exifCamera;
                img.exifLens = activeImg.exifLens;
                img.exifParams = activeImg.exifParams;
                img.filmName = activeImg.filmName;
            });
            this.showToast('ARCHIVE METADATA SYNCED // 已同步至全部作品', 'success');
        });

        this.dom.btnDownloadCurrent.addEventListener('click', () => { triggerHaptic('medium'); this.downloadCurrent(); });
        this.dom.btnDownloadAll.addEventListener('click', () => { triggerHaptic('medium'); this.downloadAll(); });

        const cvs = this.dom.previewCanvas;
        const getCoords = (e) => {
            const rect = cvs.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const canvasRatio = cvs.width / cvs.height;
            const rectRatio = rect.width / rect.height;
            let renderW, renderH, offsetX = 0, offsetY = 0;
            if (canvasRatio > rectRatio) {
                renderW = rect.width; renderH = rect.width / canvasRatio; offsetY = (rect.height - renderH) / 2;
            } else {
                renderH = rect.height; renderW = rect.height * canvasRatio; offsetX = (rect.width - renderW) / 2;
            }
            const scale = cvs.width / renderW;
            return { x: (clientX - rect.left - offsetX) * scale, y: (clientY - rect.top - offsetY) * scale };
        };

        const handleDown = (e) => {
            if (this.state.settings.style !== 'film_strip') return;
            const coords = getCoords(e);
            for (let i = this.hitboxes.length - 1; i >= 0; i--) {
                const box = this.hitboxes[i];
                if (coords.x >= box.x && coords.x <= box.x + box.w && coords.y >= box.y && coords.y <= box.y + box.h) {
                    triggerHaptic('light');
                    this.dragInfo = { active: true, id: box.id, offsetX: coords.x - box.x, offsetY: coords.y - box.y, currX: coords.x, currY: coords.y };
                    cvs.style.cursor = 'grabbing';
                    this.renderPreview(false);
                    break;
                }
            }
        };

        const handleMove = (e) => {
            if (!this.dragInfo.active) return;
            e.preventDefault();
            const coords = getCoords(e);
            this.dragInfo.currX = coords.x; this.dragInfo.currY = coords.y;

            let swapId = null;
            for (let box of this.hitboxes) {
                if (box.id !== this.dragInfo.id) {
                    if (coords.x >= box.x && coords.x <= box.x + box.w && coords.y >= box.y && coords.y <= box.y + box.h) {
                        swapId = box.id; break;
                    }
                }
            }
            if (swapId) {
                const idx1 = this.state.images.findIndex(img => img.id === this.dragInfo.id);
                const idx2 = this.state.images.findIndex(img => img.id === swapId);
                if (idx1 > -1 && idx2 > -1) {
                    triggerHaptic('medium');
                    const temp = this.state.images[idx1];
                    this.state.images[idx1] = this.state.images[idx2];
                    this.state.images[idx2] = temp;
                    this.updateThumbnailsOrderDOM();
                }
            }
            this.renderPreview(false);
        };

        const handleUp = () => {
            if (this.dragInfo.active) {
                triggerHaptic('light');
                this.dragInfo.active = false;
                cvs.style.cursor = 'auto';
                this.renderPreview(false);
            }
        };

        cvs.addEventListener('mousedown', handleDown);
        cvs.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        cvs.addEventListener('touchstart', handleDown, { passive: false });
        cvs.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);
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
        let isHDR = false;
        let hdrType = 'SDR';
        let colorProfile = 'sRGB';

        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const isHeic = ext === 'heic' || ext === 'heif' || file.type === 'image/heic' || file.type === 'image/heif';
        const isAvif = ext === 'avif' || file.type === 'image/avif';

        if (exifData) {
            if (exifData.ColorSpace === 65535 || String(exifData.ProfileDescription || '').includes('P3') || String(exifData.ColorSpace || '').includes('Uncalibrated')) {
                colorProfile = 'DISPLAY-P3';
            }
            if (exifData.CustomRendered === 3 || exifData.CustomRendered === 'HDR' || (exifData.Make && String(exifData.Make).toUpperCase().includes('APPLE') && isHeic)) {
                isHDR = true;
                hdrType = 'APPLE EDR';
                colorProfile = 'DISPLAY-P3';
            }
        }

        try {
            const slice = file.slice(0, Math.min(file.size, 262144));
            const buf = await slice.arrayBuffer();
            const ascii = new TextDecoder('latin1').decode(new Uint8Array(buf));

            if (ascii.includes('hdrgm') || ascii.includes('GainMap') || ascii.includes('urn:iso:std:iso:ts:21496')) {
                isHDR = true;
                hdrType = 'ULTRA HDR';
                colorProfile = 'DISPLAY-P3';
            } else if (ascii.includes('tmap') || ascii.includes('hvc1') || ascii.includes('MiHB')) {
                isHDR = true;
                hdrType = isHeic ? 'HEIF 10-BIT HDR' : 'HDR GAINMAP';
                colorProfile = 'DISPLAY-P3';
            } else if (ascii.includes('Display P3') || (ascii.includes('sRGB IEC61966') === false && isHeic)) {
                colorProfile = 'DISPLAY-P3';
            }
        } catch (e) {}

        if (isAvif) colorProfile = 'DISPLAY-P3';
        return { isHDR, hdrType, colorProfile, isHeic };
    }

    async decodeImageFile(file) {
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const isHeic = ext === 'heic' || ext === 'heif' || file.type === 'image/heic' || file.type === 'image/heif';

        const nativeUrl = URL.createObjectURL(file);
        try {
            const imgObj = await this.loadImage(nativeUrl);
            return { url: nativeUrl, imgObj };
        } catch (nativeErr) {
            URL.revokeObjectURL(nativeUrl);
            if (isHeic && typeof heic2any !== 'undefined') {
                if (this.dom.loaderSubTitle) {
                    this.dom.loaderSubTitle.textContent = `TRANSCODING APPLE HEIC/HEIF (${file.name})...`;
                }
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.96
                });
                const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                const convertedUrl = URL.createObjectURL(finalBlob);
                const imgObj = await this.loadImage(convertedUrl);
                return { url: convertedUrl, imgObj };
            }
            throw nativeErr;
        }
    }

    computeHistogram(imgObj) {
        const bins = 64;
        const rHist = new Float32Array(bins);
        const gHist = new Float32Array(bins);
        const bHist = new Float32Array(bins);
        const lHist = new Float32Array(bins);

        try {
            const canvas = document.createElement('canvas');
            const ctx = this.getCanvasContext(canvas, { willReadFrequently: true });
            canvas.width = 128; canvas.height = 128;
            ctx.drawImage(imgObj, 0, 0, 128, 128);
            const data = ctx.getImageData(0, 0, 128, 128).data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                rHist[Math.min(bins - 1, Math.floor((r / 256) * bins))]++;
                gHist[Math.min(bins - 1, Math.floor((g / 256) * bins))]++;
                bHist[Math.min(bins - 1, Math.floor((b / 256) * bins))]++;
                lHist[Math.min(bins - 1, Math.floor((lum / 256) * bins))]++;
            }

            const normalize = (arr) => {
                const max = Math.max(...arr, 1);
                const out = new Float32Array(bins);
                for (let i = 0; i < bins; i++) {
                    const prev = arr[Math.max(0, i - 1)];
                    const curr = arr[i];
                    const next = arr[Math.min(bins - 1, i + 1)];
                    out[i] = Math.pow(((prev * 0.25 + curr * 0.5 + next * 0.25) / max), 0.75);
                }
                return out;
            };

            return {
                r: normalize(rHist),
                g: normalize(gHist),
                b: normalize(bHist),
                l: normalize(lHist)
            };
        } catch (e) {
            return { r: rHist, g: gHist, b: bHist, l: lHist };
        }
    }

    extractPalette(imgObj) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = this.getCanvasContext(canvas, { willReadFrequently: true });
            canvas.width = 64; canvas.height = 64;
            ctx.drawImage(imgObj, 0, 0, 64, 64);
            const data = ctx.getImageData(0, 0, 64, 64).data;

            const colorCounts = {};
            const colorPool = [];
            const binSize = 32;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i+3] > 128) {
                    const r = data[i], g = data[i+1], b = data[i+2];
                    const luminance = (0.299*r + 0.587*g + 0.114*b);
                    if (luminance > 242 || luminance < 14) continue;
                    colorPool.push({ r, g, b, lum: luminance });
                    const binKey = `${Math.floor(r/binSize)},${Math.floor(g/binSize)},${Math.floor(b/binSize)}`;
                    if (!colorCounts[binKey]) colorCounts[binKey] = { count: 0, rSum: 0, gSum: 0, bSum: 0 };
                    colorCounts[binKey].count++;
                    colorCounts[binKey].rSum += r;
                    colorCounts[binKey].gSum += g;
                    colorCounts[binKey].bSum += b;
                }
            }

            const defaultPalette = [
                { rgbStr: '#d4d4d8', hex: '#D4D4D8', r: 212, g: 212, b: 216 },
                { rgbStr: '#94a3b8', hex: '#94A3B8', r: 148, g: 163, b: 184 },
                { rgbStr: '#64748b', hex: '#64748B', r: 100, g: 116, b: 139 },
                { rgbStr: '#1e293b', hex: '#1E293B', r: 30, g: 41, b: 59 }
            ];

            if (colorPool.length === 0) return defaultPalette;
            const sortedBins = Object.values(colorCounts).sort((a, b) => b.count - a.count);
            if (sortedBins.length === 0) return defaultPalette;

            const getSaturation = (r, g, b) => {
                const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
                return max === 0 ? 0 : (max - min) / max;
            };
            const getLightness = (r, g, b) => (Math.max(r, g, b) / 255 + Math.min(r, g, b) / 255) / 2;

            let candidates = [];
            for (let i = 0; i < Math.min(10, sortedBins.length); i++) {
                const bin = sortedBins[i];
                if (bin.count > sortedBins[0].count * 0.05) {
                    const r = Math.round(bin.rSum / bin.count);
                    const g = Math.round(bin.gSum / bin.count);
                    const b = Math.round(bin.bSum / bin.count);
                    candidates.push({ r, g, b, s: getSaturation(r, g, b), l: getLightness(r, g, b), count: bin.count });
                }
            }

            candidates.sort((a, b) => {
                let scoreA = a.s * (a.l > 0.1 && a.l < 0.9 ? 1 : 0.1) * Math.log(a.count);
                let scoreB = b.s * (b.l > 0.1 && b.l < 0.9 ? 1 : 0.1) * Math.log(b.count);
                return scoreB - scoreA;
            });

            let bestColor = candidates.length > 0 ? candidates[0] : {
                r: Math.round(sortedBins[0].rSum / sortedBins[0].count),
                g: Math.round(sortedBins[0].gSum / sortedBins[0].count),
                b: Math.round(sortedBins[0].bSum / sortedBins[0].count)
            };

            const pickedColors = [{ r: bestColor.r, g: bestColor.g, b: bestColor.b }];
            const dist = (c1, c2) => Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2);

            let dominantBin = sortedBins[0];
            pickedColors.push({
                r: Math.round(dominantBin.rSum / dominantBin.count),
                g: Math.round(dominantBin.gSum / dominantBin.count),
                b: Math.round(dominantBin.bSum / dominantBin.count)
            });

            while (pickedColors.length < 4 && colorPool.length > 0) {
                let maxDist = -1; let furthestColor = colorPool[0];
                for (let c of colorPool) {
                    let minDistToPicked = Math.min(...pickedColors.map(p => dist(c, p)));
                    if (minDistToPicked > maxDist) { maxDist = minDistToPicked; furthestColor = c; }
                }
                pickedColors.push({ r: furthestColor.r, g: furthestColor.g, b: furthestColor.b });
            }

            const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
            return pickedColors.map(c => ({
                rgbStr: `rgba(${c.r}, ${c.g}, ${c.b}, 1)`,
                hex: rgbToHex(c.r, c.g, c.b),
                r: c.r, g: c.g, b: c.b
            }));
        } catch(e) {
            return [
                { rgbStr: '#d4d4d8', hex: '#D4D4D8', r: 212, g: 212, b: 216 },
                { rgbStr: '#94a3b8', hex: '#94A3B8', r: 148, g: 163, b: 184 },
                { rgbStr: '#64748b', hex: '#64748B', r: 100, g: 116, b: 139 },
                { rgbStr: '#1e293b', hex: '#1E293B', r: 30, g: 41, b: 59 }
            ];
        }
    }

    async handleFiles(fileList) {
        const files = Array.from(fileList).filter(f => f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif|avif|tif|tiff|dng)$/i.test(f.name));
        if (files.length === 0) { this.showToast('未检测到有效的图片或 HEIC/HDR 文件', 'error'); return; }

        if (this.dom.loaderSubTitle) this.dom.loaderSubTitle.textContent = 'DECODING HEIF / P3 GAMUT & WAVEFORM...';
        this.dom.globalLoader.classList.add('active');
        await new Promise(r => setTimeout(r, 80));

        if (this.state.images.length === 0) {
            this.dom.emptyState.style.display = 'none';
            this.dom.controlPanel.classList.remove('opacity-40', 'pointer-events-none');
            this.dom.btnDownloadCurrent.classList.remove('hidden');
            this.dom.btnDownloadAll.classList.remove('hidden');
            this.dom.btnDownloadCurrent.classList.add('flex');
            this.dom.btnDownloadAll.classList.add('flex');
        }

        let firstNewId = null;
        let hdrCount = 0;

        for (let file of files) {
            try {
                let exifData = null;
                try {
                    if (typeof exifr !== 'undefined') {
                        exifData = await exifr.parse(file, { gps: true, tiff: true, exif: true, icc: true });
                    }
                } catch (err) { console.warn("EXIF 解析跳过:", err); }

                const hdrInfo = await this.detectHdrAndColorProfile(file, exifData);
                if (hdrInfo.isHDR) hdrCount++;

                const { url, imgObj } = await this.decodeImageFile(file);

                let camera = 'DIGITAL CAMERA';
                if (exifData?.Make || exifData?.Model) {
                    let make = exifData.Make || ''; let model = exifData.Model || '';
                    camera = model.toUpperCase().startsWith(make.toUpperCase())
                        ? model.toUpperCase()
                        : `${make} ${model}`.trim().toUpperCase();
                }

                let lens = exifData?.LensModel ? exifData.LensModel.toUpperCase() : '24MM F/2.8';
                let focal = exifData?.FocalLength ? `${parseFloat(Number(exifData.FocalLength).toFixed(1))}mm` : '24mm';
                let fnumber = exifData?.FNumber ? `f/${parseFloat(Number(exifData.FNumber).toFixed(1))}` : 'f/2.8';
                let exposure = exifData?.ExposureTime
                    ? (exifData.ExposureTime >= 1 ? `${exifData.ExposureTime}s` : `1/${Math.round(1/exifData.ExposureTime)}s`)
                    : '1/125s';
                let iso = exifData?.ISO ? `ISO ${exifData.ISO}` : 'ISO 400';
                let params = [focal, fnumber, exposure, iso].filter(Boolean).join('   ') || '24mm   f/2.8   1/125s   ISO 400';

                let dateStr = 'PHOTOGRAPHED IN : OCT 15, 2026';
                let timeStr = '12 FEB 2026';
                if (exifData?.DateTimeOriginal) {
                    try {
                        const d = new Date(exifData.DateTimeOriginal);
                        const options = { month: 'short', day: 'numeric', year: 'numeric' };
                        dateStr = 'PHOTOGRAPHED IN : ' + d.toLocaleDateString('en-US', options).toUpperCase();
                        timeStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
                    } catch(e) {}
                }

                let locationStr = "38° 55' 00\" N    121° 38' 00\" E";
                if (typeof exifData?.latitude === 'number' && typeof exifData?.longitude === 'number') {
                    const formatDMS = (deg, isLat) => {
                        const d = Math.abs(deg);
                        const degInt = Math.floor(d);
                        const minFloat = (d - degInt) * 60;
                        const minInt = Math.floor(minFloat);
                        const secInt = Math.round((minFloat - minInt) * 60);
                        const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
                        return `${degInt}° ${minInt}' ${secInt}" ${dir}`;
                    };
                    locationStr = `${formatDMS(exifData.latitude, true)}    ${formatDMS(exifData.longitude, false)}`;
                }

                const defaultTitle = file.name.split('.')[0].replace(/[-_]/g, ' ').toUpperCase() || 'UNTITLED ARTWORK';
                const palette = this.extractPalette(imgObj);
                const histogram = this.computeHistogram(imgObj);

                const newImg = {
                    id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    file, url, imgObj,
                    width: imgObj.width, height: imgObj.height,
                    textLeft: defaultTitle,
                    textRight: '© XIANGVISUALS',
                    exifTime: timeStr,
                    location: locationStr,
                    exifCamera: camera,
                    exifLens: lens,
                    exifParams: params,
                    exifDate: dateStr,
                    filmName: 'FUJIFILM RVP50',
                    palette,
                    histogram,
                    isHDR: hdrInfo.isHDR,
                    hdrType: hdrInfo.hdrType,
                    colorProfile: hdrInfo.colorProfile
                };

                this.state.images.push(newImg);
                this.addThumbnail(newImg);
                if (!firstNewId) firstNewId = newImg.id;
            } catch (e) {
                console.error("加载失败:", file.name, e);
                this.showToast(`无法解码 ${file.name}`, 'error');
            }
        }

        this.updateGalleryCounter();
        this.dom.globalLoader.classList.remove('active');
        if (firstNewId) this.setActiveImage(firstNewId);

        if (window.innerWidth < 768) {
            this.switchToTab(1, 'tab-templates');
        }
        triggerHaptic('success');
        const hdrMsg = hdrCount > 0 ? ` (${hdrCount} HDR/P3)` : '';
        this.showToast(`LOADED ${files.length} ARTWORKS${hdrMsg} // 已解析入库`, 'success');
    }

    updateGalleryCounter() {
        if (this.dom.galleryCount) {
            this.dom.galleryCount.textContent = `${this.state.images.length} ITEMS`;
        }
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

        const hdrBadgeHtml = imgData.isHDR
            ? `<span class="absolute bottom-1 left-1 px-1 py-0.2 bg-black/85 text-amber-300 font-mono text-[8px] font-bold tracking-wider z-10 border border-white/20">HDR</span>`
            : (imgData.colorProfile === 'DISPLAY-P3' ? `<span class="absolute bottom-1 left-1 px-1 py-0.2 bg-black/75 text-white font-mono text-[8px] font-medium tracking-wider z-10">P3</span>` : '');

        div.innerHTML = `
            <img src="${imgData.url}" class="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105">
            ${hdrBadgeHtml}
        `;

        const delBtn = document.createElement('button');
        delBtn.className = 'absolute top-1 right-1 w-5 h-5 bg-xv-black/80 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10';
        delBtn.innerHTML = '<i class="fa-solid fa-xmark text-[10px]"></i>';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic('light');
            this.removeImage(imgData.id);
        });

        div.appendChild(delBtn);
        div.addEventListener('click', () => {
            triggerHaptic('light');
            this.setActiveImage(imgData.id);
        });
        this.dom.thumbnailList.appendChild(div);
    }

    removeImage(id) {
        const index = this.state.images.findIndex(img => img.id === id);
        if (index > -1) {
            URL.revokeObjectURL(this.state.images[index].url);
            this.state.images.splice(index, 1);
            const thumb = document.querySelector(`.thumb-item[data-id="${id}"]`);
            if (thumb) thumb.remove();
            this.updateGalleryCounter();

            if (this.state.images.length === 0) {
                this.resetUI();
            } else if (this.state.activeId === id) {
                const nextIndex = Math.min(index, this.state.images.length - 1);
                this.setActiveImage(this.state.images[nextIndex].id);
            }
            if (this.state.settings.style === 'film_strip') {
                this.renderPreview(true);
            }
        }
    }

    resetUI() {
        this.state.activeId = null;
        this.dom.emptyState.style.display = 'flex';
        this.dom.controlPanel.classList.add('opacity-40', 'pointer-events-none');
        this.dom.btnDownloadCurrent.classList.add('hidden');
        this.dom.btnDownloadAll.classList.add('hidden');
        this.dom.previewCanvas.classList.remove('loaded');
        if (this.dom.hudHdrBadge) this.dom.hudHdrBadge.classList.add('hidden');
        this.ctx.clearRect(0, 0, this.dom.previewCanvas.width, this.dom.previewCanvas.height);
        this.dom.imgDimensions.textContent = '-- × -- PX';
        if (window.innerWidth < 768) this.switchToTab(0);
    }

    getActiveImage() { return this.state.images.find(img => img.id === this.state.activeId); }

    setActiveImage(id) {
        this.state.activeId = id;
        const imgData = this.getActiveImage();
        if (!imgData) return;

        document.querySelectorAll('.thumb-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === id);
        });

        this.dom.inputLeft.value = imgData.textLeft || '';
        this.dom.inputRight.value = imgData.textRight || '';
        this.dom.inputExifTime.value = imgData.exifTime || '';
        this.dom.inputLocation.value = imgData.location || '';
        this.dom.inputExifCamera.value = imgData.exifCamera || '';
        this.dom.inputExifLens.value = imgData.exifLens || '';
        this.dom.inputExifParams.value = imgData.exifParams || '';
        this.dom.inputFilmName.value = imgData.filmName || '';
        this.dom.imgDimensions.textContent = `${imgData.width} × ${imgData.height} PX · ${imgData.colorProfile}`;

        if (this.dom.hudHdrBadge) {
            if (imgData.isHDR || imgData.colorProfile === 'DISPLAY-P3') {
                this.dom.hudHdrBadge.classList.remove('hidden');
                this.dom.hudHdrBadge.classList.add('flex');
                this.dom.hudHdrText.textContent = imgData.isHDR ? `${imgData.hdrType} · P3` : 'DISPLAY-P3';
            } else {
                this.dom.hudHdrBadge.classList.add('hidden');
                this.dom.hudHdrBadge.classList.remove('flex');
            }
        }
        if (this.dom.inspectorColorSpace) {
            this.dom.inspectorColorSpace.textContent = imgData.isHDR ? imgData.hdrType : imgData.colorProfile;
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

        const secLayout = document.getElementById('section-layout');
        const ctrlMargin = document.getElementById('ctrl-margin');
        const ctrlShadow = document.getElementById('ctrl-shadow');
        const secVector = document.getElementById('section-vector');
        const secMaterials = document.getElementById('section-materials');
        const ctrlGrain = document.getElementById('ctrl-grain');

        if (secVector) secVector.style.display = isVector ? 'block' : 'none';
        if (ctrlGrain) ctrlGrain.style.display = isFilm ? 'block' : 'none';
        if (secMaterials) secMaterials.style.display = hasWall ? 'block' : 'none';

        if (style === 'film4x5' || style === 'film_xpan' || style === 'vector_field') {
            if (secLayout) secLayout.style.display = 'none';
        } else {
            if (secLayout) secLayout.style.display = 'block';
            if (ctrlMargin) ctrlMargin.style.display = 'block';
            if (ctrlShadow) ctrlShadow.style.display = hasShadow ? 'block' : 'none';
        }
    }

    createFilmGrainPattern(ctx) {
        if (this.state.grainPattern) return this.state.grainPattern;
        const patternCanvas = document.createElement('canvas');
        const size = 128;
        patternCanvas.width = size; patternCanvas.height = size;
        const pCtx = patternCanvas.getContext('2d');
        const imgData = pCtx.createImageData(size, size);
        for (let i = 0; i < imgData.data.length; i += 4) {
            const val = Math.random() * 255;
            imgData.data[i] = val; imgData.data[i+1] = val; imgData.data[i+2] = val; imgData.data[i+3] = 40;
        }
        pCtx.putImageData(imgData, 0, 0);
        this.state.grainPattern = ctx.createPattern(patternCanvas, 'repeat');
        return this.state.grainPattern;
    }

    drawDXCode(ctx, x, y, width, height, seed) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.7)';
        for (let b = 0; b < 5; b++) {
            const hash = Math.sin(seed + b * 1.3) * 10000;
            if (hash - Math.floor(hash) > 0.4) {
                ctx.fillRect(x + b * width * 0.25, y, width * 0.18, height);
            }
        }
    }

    getFilteredImage(imgDataObj, w, h, bwAmount, invertAmount, modeOverride = null) {
        const hdrBoost = this.state.settings.hdrBoost || 0;
        if (bwAmount === 0 && invertAmount === 0 && hdrBoost === 0 && !modeOverride) return imgDataObj.imgObj;

        const rw = Math.max(1, Math.round(w));
        const rh = Math.max(1, Math.round(h));
        const cacheKey = `${bwAmount.toFixed(2)}_${invertAmount.toFixed(2)}_${hdrBoost.toFixed(2)}_${modeOverride || 'std'}_${rw}_${rh}`;
        if (imgDataObj.filterCache && imgDataObj.filterCache.key === cacheKey) return imgDataObj.filterCache.canvas;

        const canvas = document.createElement('canvas');
        canvas.width = rw; canvas.height = rh;
        const ctx = this.getCanvasContext(canvas, { willReadFrequently: true });
        ctx.drawImage(imgDataObj.imgObj, 0, 0, rw, rh);
        const imgPixels = ctx.getImageData(0, 0, rw, rh);
        const data = imgPixels.data;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i], g = data[i+1], b = data[i+2];

            if (hdrBoost > 0) {
                const nr = r / 255, ng = g / 255, nb = b / 255;
                const lum = 0.299 * nr + 0.587 * ng + 0.114 * nb;
                const highlightCurve = lum + hdrBoost * 0.28 * Math.sin(lum * Math.PI) * Math.pow(lum, 0.85);
                const scale = lum > 0.001 ? (highlightCurve / lum) : 1;
                r = Math.min(255, r * scale);
                g = Math.min(255, g * scale);
                b = Math.min(255, b * scale);
            }

            if (modeOverride === 'cyanotype') {
                const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                const cLum = Math.pow(lum, 0.92);
                if (cLum < 0.5) {
                    const t = cLum * 2;
                    r = 7 + (29 - 7) * t;
                    g = 30 + (86 - 30) * t;
                    b = 61 + (126 - 61) * t;
                } else {
                    const t = (cLum - 0.5) * 2;
                    r = 29 + (244 - 29) * t;
                    g = 86 + (241 - 86) * t;
                    b = 126 + (234 - 126) * t;
                }
            }

            if (bwAmount > 0) {
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                r += (gray - r) * bwAmount;
                g += (gray - g) * bwAmount;
                b += (gray - b) * bwAmount;
            }
            if (invertAmount > 0) {
                r += (255 - r * 2) * invertAmount;
                g += (255 - g * 2) * invertAmount;
                b += (255 - b * 2) * invertAmount;
            }
            data[i] = r; data[i+1] = g; data[i+2] = b;
        }
        ctx.putImageData(imgPixels, 0, 0);
        imgDataObj.filterCache = { key: cacheKey, canvas };
        return canvas;
    }

    async renderScene(ctx, imgData, targetWidth, targetHeight) {
        return window.XiangTemplates.renderScene(this, ctx, imgData, targetWidth, targetHeight);
    }

    async renderPreview(animate = true) {
        const imgData = this.getActiveImage();
        if (!imgData && this.state.settings.style !== 'film_strip') return;
        if (this.state.settings.style === 'film_strip' && this.state.images.length === 0) return;

        if (animate) this.dom.previewCanvas.classList.remove('loaded');

        const dpr = window.devicePixelRatio || 1;
        const containerW = Math.max(300, this.dom.workspace.clientWidth - 40);
        const containerH = Math.max(300, this.dom.workspace.clientHeight - 40);
        const safeDpr = Math.min(dpr, 2);

        const dataToRender = imgData || this.state.images[0];
        await this.renderScene(this.ctx, dataToRender, containerW * safeDpr, containerH * safeDpr);

        this.dom.previewCanvas.style.width = 'auto';
        this.dom.previewCanvas.style.height = 'auto';
        this.dom.previewCanvas.style.maxWidth = '100%';
        this.dom.previewCanvas.style.maxHeight = '100%';
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

            const offscreenCanvas = document.createElement('canvas');
            const offCtx = this.getCanvasContext(offscreenCanvas, { alpha: false });

            await this.renderScene(offCtx, imgData, null, null);

            offscreenCanvas.toBlob((blob) => {
                if (styleOverride) this.state.settings.style = originalStyle;
                resolve(blob);
            }, 'image/jpeg', 0.96);
        });
    }

    async downloadCurrent() {
        const imgData = this.getActiveImage();
        const dataToRender = imgData || this.state.images[0];
        if (!dataToRender || this.state.isProcessing) return;

        this.state.isProcessing = true;
        const originalText = this.dom.btnDownloadCurrent.innerHTML;
        this.dom.btnDownloadCurrent.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>RENDERING</span>';

        try {
            await new Promise(r => setTimeout(r, 50));
            const blob = await this.renderHighResBlob(dataToRender);
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            const styleName = this.state.settings.style.toUpperCase();
            link.download = `XIANGVISUALS_${styleName}_${Date.now()}.jpg`;
            link.href = url;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);

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
        if (this.state.images.length === 0 || this.state.isProcessing) return;

        this.state.isProcessing = true;
        this.dom.progressModal.classList.remove('opacity-0', 'pointer-events-none');

        const stylesToGen = [
            'swiss_grid', 'optical_histogram', 'aura_blur', 'halation_lab',
            'cyanotype', 'vector_field', 'exif_palette', 'exif_minimal'
        ];
        const totalTasks = this.state.images.length * stylesToGen.length;
        let currentTask = 0;

        this.dom.progressTitle.textContent = 'RENDERING ARCHIVE EDITIONS...';
        this.updateProgress(0, totalTasks);

        try {
            const zip = new JSZip();
            for (let i = 0; i < this.state.images.length; i++) {
                const img = this.state.images[i];
                const baseName = img.file.name.substring(0, img.file.name.lastIndexOf('.')) || `Artwork_${i+1}`;
                const folder = zip.folder(baseName);

                for (let style of stylesToGen) {
                    const blob = await this.renderHighResBlob(img, style);
                    folder.file(`${baseName}_${style.toUpperCase()}.jpg`, blob);
                    currentTask++;
                    this.updateProgress(currentTask, totalTasks);
                    await new Promise(r => requestAnimationFrame(r));
                }
            }

            this.dom.progressTitle.textContent = 'COMPRESSING ZIP ARCHIVE...';
            const zipContent = await zip.generateAsync({ type: "blob" });

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
        const percent = Math.floor((current / total) * 100);
        this.dom.progressBar.style.width = `${percent}%`;
        this.dom.progressCount.textContent = `${current} / ${total} EDITIONS`;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast pointer-events-auto`;
        let icon = 'fa-square-full';
        if (type === 'success') icon = 'fa-check';
        if (type === 'error') icon = 'fa-triangle-exclamation';

        toast.innerHTML = `<i class="fa-solid ${icon} text-[10px] text-white"></i><span class="tracking-widest">${message}</span>`;
        this.dom.toastContainer.appendChild(toast);

        requestAnimationFrame(() => requestAnimationFrame(() => this.dom.toastContainer && toast.classList.add('show')));
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