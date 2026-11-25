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

// 五幕装裱开机动画逻辑（支持点击任意位置立即跳过）
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

    preloader.addEventListener('click', finishBoot, { once: true });
    setTimeout(finishBoot, 2100);
}

const PROTECT_PRESETS = {
    gallery:  { layout: 'adaptive', opacity: 15, centerFade: 60, size: 15, jitter: 32, blend: 'smart-luma', edgeAnchor: true,  microMesh: true, chroma: true },
    social:   { layout: 'dense',    opacity: 20, centerFade: 42, size: 16, jitter: 40, blend: 'smart-luma', edgeAnchor: true,  microMesh: true, chroma: true },
    proofing: { layout: 'dense',    opacity: 32, centerFade: 15, size: 22, jitter: 25, blend: 'difference', edgeAnchor: false, microMesh: true, chroma: false }
};

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
                vectorCols: 70,
                asciiColor: false,
                asciiInvert: false,
                asciiMaskMode: 'focus'
            },
            protect: {
                enabled: false,
                text: 'XIANGVISUALS',
                layout: 'adaptive',
                blend: 'smart-luma',
                opacity: 15,
                centerFade: 60,
                size: 15,
                jitter: 32,
                edgeAnchor: true,
                microMesh: true,
                chroma: true,
                lsb: true,
                seed: Math.floor(Math.random() * 10000)
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
        if (this.dom.optProtectEnabled) this.dom.optProtectEnabled.checked = false;
        this.initColorSpace();
        this.restoreTheme();
        this.bindEvents();
        this.initSortable();
        this.updateControlsVisibility(this.state.settings.style);
        this.updateProtectTelemetry();

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
            btnAsciiColor: $('btnAsciiColor'),
            btnAsciiInvert: $('btnAsciiInvert'),
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
            progressCount: $('progressCount'),

            // Status Dot & Drop Overlay
            tabProtectDot: $('tabProtectDot'),
            dropOverlay: $('dropOverlay'),

            // Anti-Theft Copyright Watermark Studio
            optProtectEnabled: $('optProtectEnabled'),
            protectScoreTotal: $('protectScoreTotal'),
            protectSecVal: $('protectSecVal'),
            protectSecBar: $('protectSecBar'),
            protectVisVal: $('protectVisVal'),
            protectVisBar: $('protectVisBar'),
            protectPresetBtns: document.querySelectorAll('.protect-preset-btn'),
            protectText: $('protectText'),
            protectLayout: $('protectLayout'),
            protectBlend: $('protectBlend'),
            optProtectEdge: $('optProtectEdge'),
            optProtectMesh: $('optProtectMesh'),
            optProtectChroma: $('optProtectChroma'),
            optProtectLsb: $('optProtectLsb'),
            protectOpacity: $('protectOpacity'),
            protectOpacityVal: $('protectOpacityVal'),
            protectCenterFade: $('protectCenterFade'),
            protectCenterFadeVal: $('protectCenterFadeVal'),
            protectSize: $('protectSize'),
            protectSizeVal: $('protectSizeVal'),
            protectJitter: $('protectJitter'),
            protectJitterVal: $('protectJitterVal'),
            btnProtectReseed: $('btnProtectReseed'),
            verifyLsbInput: $('verifyLsbInput'),
            verifyLsbResult: $('verifyLsbResult')
        };
    }

    initColorSpace() {
        this.state.supportsP3 = window.matchMedia && window.matchMedia('(color-gamut: p3)').matches;
        try {
            this.ctx = this.dom.previewCanvas.getContext('2d', {
                alpha: false,
                willReadFrequently: true,
                colorSpace: this.state.supportsP3 ? 'display-p3' : 'srgb'
            });
        } catch (e) {
            this.ctx = this.dom.previewCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
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

    restoreTheme() {
        try {
            const saved = localStorage.getItem('xv-studio-theme');
            if (saved === 'dark') this.toggleDarkMode(true);
        } catch (e) {}
    }

    toggleDarkMode(forceState = null) {
        this.state.darkMode = forceState !== null ? forceState : !this.state.darkMode;
        document.body.classList.toggle('dark-mode', this.state.darkMode);
        try {
            localStorage.setItem('xv-studio-theme', this.state.darkMode ? 'dark' : 'light');
        } catch (e) {}

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

        let dragCounter = 0;
        document.body.addEventListener('dragenter', (e) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                dragCounter++;
                this.dom.dropOverlay?.classList.add('active');
            }
        });
        document.body.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        document.body.addEventListener('dragleave', () => {
            dragCounter = Math.max(0, dragCounter - 1);
            if (dragCounter === 0) this.dom.dropOverlay?.classList.remove('active');
        });
        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            this.dom.dropOverlay?.classList.remove('active');
            if (!this.state.isProcessing && e.dataTransfer.files.length > 0) this.handleFiles(e.dataTransfer.files);
        });

        this.dom.styleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                triggerHaptic('light');
                const target = e.currentTarget;
                const newStyle = target.dataset.style;
                this.dom.styleBtns.forEach(b => b.classList.remove('active'));
                target.classList.add('active');
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

        this.dom.btnAsciiColor?.addEventListener('click', () => {
            triggerHaptic('light');
            const next = !this.state.settings.asciiColor;
            this.dom.btnAsciiColor.classList.toggle('active-bw', next);
            this.updateSettings({ asciiColor: next }, false);
        });

        this.dom.btnAsciiInvert?.addEventListener('click', () => {
            triggerHaptic('light');
            const next = !this.state.settings.asciiInvert;
            this.dom.btnAsciiInvert.classList.toggle('active-invert', next);
            this.updateSettings({ asciiInvert: next }, false);
        });

        document.querySelectorAll('.ascii-mask-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                triggerHaptic('light');
                const mode = e.currentTarget.dataset.mask;
                document.querySelectorAll('.ascii-mask-btn').forEach(b => {
                    const active = b === e.currentTarget;
                    b.className = active
                        ? 'ascii-mask-btn py-1.5 border border-xv-black bg-xv-black text-white text-[9.5px] font-mono font-bold'
                        : 'ascii-mask-btn py-1.5 border border-xv-border text-[9.5px] font-mono font-semibold text-xv-gray';
                });
                this.updateSettings({ asciiMaskMode: mode }, false);
            });
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
        const btnShufflePalette = document.getElementById('btnShufflePalette');
        btnShufflePalette?.addEventListener('click', () => {
            const activeImg = this.getActiveImage();
            if (!activeImg?.palette) return;
            triggerHaptic('light');
            activeImg.palette.push(activeImg.palette.shift());
            this.renderPaletteEditor();
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

        // =========================================================
        // 版权防盗水印引擎交互绑定 (ANTI-THEFT PROTECT STUDIO)
        // =========================================================
        const syncProtectUI = () => {
            const p = this.state.protect;
            if (this.dom.protectOpacityVal) this.dom.protectOpacityVal.textContent = `${p.opacity}%`;
            if (this.dom.protectCenterFadeVal) this.dom.protectCenterFadeVal.textContent = `${p.centerFade}%`;
            if (this.dom.protectSizeVal) this.dom.protectSizeVal.textContent = `${(p.size / 10).toFixed(1)}%`;
            if (this.dom.protectJitterVal) this.dom.protectJitterVal.textContent = `${p.jitter}%`;
            this.updateProtectTelemetry();
            this.renderPreview(false);
        };

        this.dom.optProtectEnabled?.addEventListener('change', (e) => {
            triggerHaptic('light');
            this.state.protect.enabled = e.target.checked;
            syncProtectUI();
            this.showToast(e.target.checked ? 'PROTECT LAYER ACTIVE // 版权防盗水印已启用' : 'PROTECT LAYER OFF // 已关闭防盗水印', 'info');
        });

        this.dom.protectPresetBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                triggerHaptic('light');
                this.dom.protectPresetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const preset = PROTECT_PRESETS[btn.dataset.preset];
                if (!preset) return;
                Object.assign(this.state.protect, preset);
                if (!this.state.protect.enabled) {
                    this.state.protect.enabled = true;
                    if (this.dom.optProtectEnabled) this.dom.optProtectEnabled.checked = true;
                }
                if (this.dom.protectLayout) this.dom.protectLayout.value = preset.layout;
                if (this.dom.protectBlend) this.dom.protectBlend.value = preset.blend;
                if (this.dom.protectOpacity) this.dom.protectOpacity.value = preset.opacity;
                if (this.dom.protectCenterFade) this.dom.protectCenterFade.value = preset.centerFade;
                if (this.dom.protectSize) this.dom.protectSize.value = preset.size;
                if (this.dom.protectJitter) this.dom.protectJitter.value = preset.jitter;
                if (this.dom.optProtectEdge) this.dom.optProtectEdge.checked = preset.edgeAnchor;
                if (this.dom.optProtectMesh) this.dom.optProtectMesh.checked = preset.microMesh;
                if (this.dom.optProtectChroma) this.dom.optProtectChroma.checked = preset.chroma;
                syncProtectUI();
            });
        });

        this.dom.protectText?.addEventListener('input', this.debounce((e) => {
            this.state.protect.text = e.target.value;
            this.renderPreview(false);
        }, 80));

        this.dom.protectLayout?.addEventListener('change', (e) => { this.state.protect.layout = e.target.value; syncProtectUI(); });
        this.dom.protectBlend?.addEventListener('change', (e) => { this.state.protect.blend = e.target.value; syncProtectUI(); });
        this.dom.optProtectEdge?.addEventListener('change', (e) => { this.state.protect.edgeAnchor = e.target.checked; syncProtectUI(); });
        this.dom.optProtectMesh?.addEventListener('change', (e) => { this.state.protect.microMesh = e.target.checked; syncProtectUI(); });
        this.dom.optProtectChroma?.addEventListener('change', (e) => { this.state.protect.chroma = e.target.checked; syncProtectUI(); });
        this.dom.optProtectLsb?.addEventListener('change', (e) => { this.state.protect.lsb = e.target.checked; syncProtectUI(); });

        const bindProtectSlider = (el, key) => {
            el?.addEventListener('input', (e) => {
                this.state.protect[key] = parseInt(e.target.value, 10);
                syncProtectUI();
            });
        };
        bindProtectSlider(this.dom.protectOpacity, 'opacity');
        bindProtectSlider(this.dom.protectCenterFade, 'centerFade');
        bindProtectSlider(this.dom.protectSize, 'size');
        bindProtectSlider(this.dom.protectJitter, 'jitter');

        const doReseed = () => {
            triggerHaptic('light');
            this.state.protect.seed = Math.floor(Math.random() * 10000);
            this.renderPreview(false);
        };
        this.dom.btnProtectReseed?.addEventListener('click', doReseed);

        // LSB 盲水印溯源验真
        this.dom.verifyLsbInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const decoded = this.extractLsbFingerprint(img);
                    const box = this.dom.verifyLsbResult;
                    if (!box) return;
                    box.classList.remove('hidden');
                    if (decoded) {
                        box.style.borderColor = '#10b981';
                        box.innerHTML = `<div style="color:#10b981;font-weight:700;margin-bottom:4px;"><i class="fa-solid fa-check-double"></i> 验证通过 · 检测到隐形版权指纹</div><div>${decoded}</div>`;
                    } else {
                        box.style.borderColor = '#d97706';
                        box.innerHTML = `<div style="color:#d97706;font-weight:700;margin-bottom:4px;"><i class="fa-solid fa-triangle-exclamation"></i> 未检测到 LSB 指纹</div><div class="opacity-70">该图片可能经过二次有损压缩，或未使用 PNG 无损格式导出。</div>`;
                    }
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        });

        // 快捷键支持
        window.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
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
            } else if (e.key.toLowerCase() === 'r' && this.state.protect.enabled) {
                doReseed();
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
        this.ctx.clearRect(0, 0, this.dom.previewCanvas.width, this.dom.previewCanvas.height);
        this.dom.imgDimensions.textContent = '-- × --';
        if (window.innerWidth < 768) this.switchToTab(0);
    }

    getActiveImage() { return this.state.images.find(img => img.id === this.state.activeId); }

    renderPaletteEditor() {
        const activeImg = this.getActiveImage();
        const paletteContainer = document.getElementById('interactivePalette');
        if (!paletteContainer || !activeImg || !activeImg.palette) return;
        paletteContainer.innerHTML = '';
        activeImg.palette.forEach((colorObj, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'palette-chip-wrapper';
            wrap.style.backgroundColor = colorObj.hex || colorObj.rgbStr;
            wrap.innerHTML = `<input type="color" class="palette-chip-input" value="${colorObj.hex || '#334155'}"><span class="palette-chip-hex">${(colorObj.hex || '').replace('#', '')}</span>`;
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
    }

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

        if (this.dom.inspectorColorSpace) {
            this.dom.inspectorColorSpace.textContent = imgData.isHDR ? imgData.hdrType : imgData.colorProfile;
        }

        this.renderPaletteEditor();
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
        const isFilm = style.startsWith('film') || style === 'halation_lab' || style === 'cinema_scope' || style === 'ccd_timestamp' || style === 'newspaper_press' || style === 'vinyl_record';
        const isVector = style === 'vector_field' || style === 'ascii_inset';
        const hasWall = ['polaroid', 'film35mm', 'film_strip', 'gallery_placard', 'ins_45_story', 'ccd_timestamp', 'vinyl_record', 'ascii_inset'].includes(style);
        const hasShadow = ['polaroid', 'film35mm', 'film_strip', 'gallery_placard', 'ins_45_story', 'vinyl_record', 'ascii_inset'].includes(style);

        document.getElementById('section-vector').style.display = isVector ? 'block' : 'none';
        const asciiOpts = document.getElementById('ctrl-ascii-opts');
        if (asciiOpts) asciiOpts.style.display = style === 'ascii_inset' ? 'block' : 'none';
        document.getElementById('ctrl-grain').style.display = isFilm ? 'block' : 'none';
        document.getElementById('section-materials').style.display = hasWall ? 'block' : 'none';

        const secLayout = document.getElementById('section-layout');
        if (['film4x5', 'film_xpan', 'vector_field', 'raw_protect'].includes(style)) {
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

    // =========================================================
    // ANTI-THEFT COPYRIGHT WATERMARK & LSB FINGERPRINT ENGINE
    // =========================================================
    seededRandom(s) {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    }

    computeEdgeMap(imgObj) {
        const maxDim = 160;
        const nW = imgObj.naturalWidth || imgObj.width;
        const nH = imgObj.naturalHeight || imgObj.height;
        const scale = Math.min(1, maxDim / Math.max(nW, nH));
        const w = Math.max(16, Math.round(nW * scale));
        const h = Math.max(16, Math.round(nH * scale));

        const off = document.createElement('canvas');
        off.width = w; off.height = h;
        const octx = off.getContext('2d', { willReadFrequently: true });
        octx.drawImage(imgObj, 0, 0, w, h);
        const data = octx.getImageData(0, 0, w, h).data;

        const gray = new Float32Array(w * h);
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
            gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        const mag = new Float32Array(w * h);
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = y * w + x;
                const gx = -gray[idx - w - 1] + gray[idx - w + 1] - 2 * gray[idx - 1] + 2 * gray[idx + 1] - gray[idx + w - 1] + gray[idx + w + 1];
                const gy = -gray[idx - w - 1] - 2 * gray[idx - w] - gray[idx - w + 1] + gray[idx + w - 1] + 2 * gray[idx + w] + gray[idx + w + 1];
                mag[idx] = Math.abs(gx) + Math.abs(gy);
            }
        }
        return { edgeMap: mag, edgeW: w, edgeH: h };
    }

    // 视觉显著性分析：结合 Sobel 结构边缘、色彩饱和度与构图权重，自动定位画面主/次视觉焦点
    computeSaliencyAnchors(imgObj) {
        const maxDim = 64;
        const nW = imgObj.naturalWidth || imgObj.width;
        const nH = imgObj.naturalHeight || imgObj.height;
        const scale = Math.min(1, maxDim / Math.max(nW, nH));
        const w = Math.max(20, Math.round(nW * scale));
        const h = Math.max(20, Math.round(nH * scale));

        const off = document.createElement('canvas');
        off.width = w; off.height = h;
        const octx = off.getContext('2d', { willReadFrequently: true });
        octx.drawImage(imgObj, 0, 0, w, h);
        const data = octx.getImageData(0, 0, w, h).data;

        const gray = new Float32Array(w * h);
        const sat = new Float32Array(w * h);
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            gray[p] = 0.299 * r + 0.587 * g + 0.114 * b;
            sat[p] = Math.max(r, g, b) - Math.min(r, g, b);
        }

        const sal = new Float32Array(w * h);
        for (let y = 1; y < h - 1; y++) {
            const ny = (y / h) - 0.5;
            for (let x = 1; x < w - 1; x++) {
                const nx = (x / w) - 0.5;
                const idx = y * w + x;
                const gx = -gray[idx - w - 1] + gray[idx - w + 1] - 2 * gray[idx - 1] + 2 * gray[idx + 1] - gray[idx + w - 1] + gray[idx + w + 1];
                const gy = -gray[idx - w - 1] - 2 * gray[idx - w] - gray[idx - w + 1] + gray[idx + w - 1] + 2 * gray[idx + w] + gray[idx + w + 1];
                const edge = (Math.abs(gx) + Math.abs(gy)) * 0.25;
                // Gentle center/rule-of-thirds composition prior
                const prior = 0.55 + 0.45 * Math.exp(-(nx * nx + ny * ny) * 3.2);
                sal[idx] = (edge + sat[idx] * 0.65) * prior;
            }
        }

        // Find primary & secondary focal regions via sliding-box energy
        const winR = Math.max(3, Math.round(Math.min(w, h) * 0.14));
        const scoreGrid = new Float32Array(w * h);
        let best1 = -1, p1 = { x: 0.46, y: 0.54 };

        for (let y = winR; y < h - winR; y++) {
            for (let x = winR; x < w - winR; x++) {
                let sum = 0;
                for (let dy = -winR; dy <= winR; dy += 2) {
                    const rowOff = (y + dy) * w;
                    for (let dx = -winR; dx <= winR; dx += 2) {
                        sum += sal[rowOff + x + dx];
                    }
                }
                scoreGrid[y * w + x] = sum;
                if (sum > best1) {
                    best1 = sum;
                    p1 = { x: x / w, y: y / h };
                }
            }
        }

        // Secondary peak with spatial separation >= 0.34 normalized distance
        let best2 = -1, p2 = { x: p1.x > 0.5 ? 0.28 : 0.72, y: p1.y > 0.5 ? 0.28 : 0.72 };
        for (let y = winR; y < h - winR; y++) {
            for (let x = winR; x < w - winR; x++) {
                const nx = x / w, ny = y / h;
                const dist = Math.hypot(nx - p1.x, ny - p1.y);
                if (dist < 0.34) continue;
                const sc = scoreGrid[y * w + x];
                if (sc > best2) {
                    best2 = sc;
                    p2 = { x: nx, y: ny };
                }
            }
        }

        // Best horizontal band Y and vertical band X
        let bestRowScore = -1, bestRowY = 0.5;
        for (let y = Math.floor(h * 0.24); y <= Math.floor(h * 0.76); y++) {
            let s = 0;
            for (let x = 2; x < w - 2; x++) s += sal[y * w + x];
            if (s > bestRowScore) { bestRowScore = s; bestRowY = y / h; }
        }
        let bestColScore = -1, bestColX = 0.5;
        for (let x = Math.floor(w * 0.24); x <= Math.floor(w * 0.76); x++) {
            let s = 0;
            for (let y = 2; y < h - 2; y++) s += sal[y * w + x];
            if (s > bestColScore) { bestColScore = s; bestColX = x / w; }
        }

        return { p1, p2, bestRowY, bestColX };
    }

    getLocalLuminance(ctx, W, H, x, y, w, h) {
        const sx = Math.max(0, Math.min(W - 1, Math.floor(x - w / 2)));
        const sy = Math.max(0, Math.min(H - 1, Math.floor(y - h / 2)));
        const sw = Math.max(1, Math.min(W - sx, Math.floor(w)));
        const sh = Math.max(1, Math.min(H - sy, Math.floor(h)));
        const data = ctx.getImageData(sx, sy, sw, sh).data;
        let sum = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
            sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            count++;
        }
        return count ? sum / count : 128;
    }

    renderCopyrightWatermark(ctx, imgData) {
        const p = this.state.protect;
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;
        if (!W || !H) return;

        // Lazily compute & cache Sobel edge map
        if (p.edgeAnchor && imgData && !imgData.edgeData) {
            try { imgData.edgeData = this.computeEdgeMap(imgData.imgObj); } catch (e) {}
        }
        const edgeData = imgData?.edgeData || null;

        const text = (p.text.trim() || 'XIANGVISUALS').toUpperCase();
        const baseOpacity = p.opacity / 100;
        const centerFade = p.centerFade / 100;
        const sizePct = p.size / 1000;
        const jitter = p.jitter / 100;
        const layout = p.layout;
        const blend = p.blend;

        const minDim = Math.min(W, H);
        const ratio = W / H;
        const fontSize = Math.max(11, Math.round(minDim * sizePct));

        let cols, rows;
        if (layout === 'dense') {
            cols = ratio > 1.25 ? 5 : (ratio < 0.8 ? 3 : 4);
            rows = ratio > 1.25 ? 3 : (ratio < 0.8 ? 5 : 4);
        } else if (layout === 'perimeter') {
            cols = ratio >= 1 ? 4 : 3;
            rows = ratio >= 1 ? 3 : 4;
        } else {
            if (ratio > 1.35) { cols = 4; rows = 3; }
            else if (ratio < 0.78) { cols = 3; rows = 4; }
            else { cols = 3; rows = 3; }
        }

        const cellW = W / cols;
        const cellH = H / rows;
        let seedCursor = p.seed;

        // 1. Ultra-Fine Anti-AI Micro-Mesh Layer
        if (p.microMesh) {
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            const step = Math.max(60, Math.round(minDim / 9));
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.08, baseOpacity * 0.35)})`;
            ctx.lineWidth = Math.max(0.75, minDim * 0.0006);
            ctx.beginPath();
            for (let x = step / 2; x < W; x += step) {
                for (let y = step / 2; y < H; y += step) {
                    const cross = fontSize * 0.28;
                    ctx.moveTo(x - cross, y); ctx.lineTo(x + cross, y);
                    ctx.moveTo(x, y - cross); ctx.lineTo(x, y + cross);
                }
            }
            ctx.stroke();
            ctx.restore();
        }

        // 2. Primary Structural Watermark Nodes
        ctx.save();
        ctx.font = `600 ${fontSize}px "Inter", -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (layout === 'perimeter' && r > 0 && r < rows - 1 && c > 0 && c < cols - 1) {
                    continue;
                }

                let posX = (c + 0.5) * cellW;
                let posY = (r + 0.5) * cellH;

                if (p.edgeAnchor && edgeData) {
                    let bestEnergy = -1, bestX = posX, bestY = posY;
                    const samples = 5;
                    for (let sy = 0; sy < samples; sy++) {
                        for (let sx = 0; sx < samples; sx++) {
                            const candX = (c + 0.18 + (sx / (samples - 1)) * 0.64) * cellW;
                            const candY = (r + 0.18 + (sy / (samples - 1)) * 0.64) * cellH;
                            const ex = Math.min(edgeData.edgeW - 1, Math.floor((candX / W) * edgeData.edgeW));
                            const ey = Math.min(edgeData.edgeH - 1, Math.floor((candY / H) * edgeData.edgeH));
                            const energy = edgeData.edgeMap[ey * edgeData.edgeW + ex];
                            if (energy > bestEnergy) {
                                bestEnergy = energy;
                                bestX = candX;
                                bestY = candY;
                            }
                        }
                    }
                    posX = posX * 0.35 + bestX * 0.65;
                    posY = posY * 0.35 + bestY * 0.65;
                }

                const staggerX = (r % 2 === 1) ? cellW * 0.1 : -cellW * 0.1;
                posX += staggerX + (this.seededRandom(seedCursor++) - 0.5) * cellW * jitter * 0.7;
                posY += (this.seededRandom(seedCursor++) - 0.5) * cellH * jitter * 0.7;

                const marginX = Math.min(W * 0.3, fontSize * 3.2);
                const marginY = Math.min(H * 0.3, fontSize * 2.2);
                posX = Math.max(marginX, Math.min(W - marginX, posX));
                posY = Math.max(marginY, Math.min(H - marginY, posY));

                const dx = (posX - W / 2) / (W / 2);
                const dy = (posY - H / 2) / (H / 2);
                const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));
                const spatialWeight = (1 - centerFade) + centerFade * Math.pow(dist, 1.35);
                const alpha = Math.max(0.025, baseOpacity * spatialWeight);

                const textW = ctx.measureText(text).width;
                const angle = (-14 + (this.seededRandom(seedCursor++) - 0.5) * 10) * (Math.PI / 180);

                ctx.save();
                ctx.translate(posX, posY);
                ctx.rotate(angle);

                let fillMain, strokeMain;
                if (blend === 'smart-luma') {
                    ctx.globalCompositeOperation = 'source-over';
                    const luma = this.getLocalLuminance(ctx, W, H, posX, posY, textW, fontSize * 2);
                    const isLightBg = luma > 132;
                    fillMain = isLightBg ? `rgba(12, 12, 14, ${alpha})` : `rgba(248, 248, 250, ${alpha})`;
                    strokeMain = isLightBg ? `rgba(12, 12, 14, ${alpha * 0.6})` : `rgba(248, 248, 250, ${alpha * 0.6})`;
                } else {
                    ctx.globalCompositeOperation = blend;
                    fillMain = `rgba(255, 255, 255, ${Math.min(0.85, alpha * 1.35)})`;
                    strokeMain = `rgba(255, 255, 255, ${alpha * 0.9})`;
                }

                if (p.chroma) {
                    const shift = Math.max(1, fontSize * 0.045);
                    ctx.fillStyle = `rgba(255, 60, 80, ${alpha * 0.32})`;
                    ctx.fillText(text, -shift, 0);
                    ctx.fillStyle = `rgba(60, 180, 255, ${alpha * 0.32})`;
                    ctx.fillText(text, shift, 0);
                }

                ctx.fillStyle = fillMain;
                ctx.fillText(text, 0, 0);

                if (p.microMesh) {
                    const lineW = textW * 0.42;
                    const lineY = fontSize * 0.82;
                    ctx.strokeStyle = strokeMain;
                    ctx.lineWidth = Math.max(1, fontSize * 0.045);
                    ctx.beginPath();
                    ctx.moveTo(-lineW, lineY); ctx.lineTo(lineW, lineY);
                    ctx.moveTo(0, lineY - fontSize * 0.22); ctx.lineTo(0, lineY + fontSize * 0.22);
                    ctx.stroke();
                }

                ctx.restore();
            }
        }
        ctx.restore();
    }

    embedLsbFingerprint(canvas, payloadText) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        const msg = `XV::${payloadText}::END`;
        const bits = [];
        for (let i = 0; i < msg.length; i++) {
            const code = msg.charCodeAt(i);
            for (let b = 7; b >= 0; b--) bits.push((code >> b) & 1);
        }

        const totalPixels = canvas.width * canvas.height;
        const bitLen = bits.length;
        for (let p = 0; p < totalPixels; p++) {
            const idx = p * 4 + 2; // Blue channel LSB
            data[idx] = (data[idx] & 0xFE) | bits[p % bitLen];
        }
        ctx.putImageData(imgData, 0, 0);
    }

    extractLsbFingerprint(img) {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const scanH = Math.min(c.height, 80);
        const data = ctx.getImageData(0, 0, c.width, scanH).data;

        // Collect up to 36000 blue-channel LSB bits and test all 8 bit-alignments (resilient to arbitrary cropping)
        const maxBits = Math.min(Math.floor(data.length / 4), 36000);
        const bits = new Uint8Array(maxBits);
        for (let p = 0; p < maxBits; p++) bits[p] = data[p * 4 + 2] & 1;

        for (let offset = 0; offset < 8; offset++) {
            let chars = '';
            for (let i = offset; i + 8 <= maxBits; i += 8) {
                const byte = (bits[i] << 7) | (bits[i+1] << 6) | (bits[i+2] << 5) | (bits[i+3] << 4) |
                             (bits[i+4] << 3) | (bits[i+5] << 2) | (bits[i+6] << 1) | bits[i+7];
                chars += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : ' ';
            }
            const match = chars.match(/XV::([^:]+(?:\|[^:]+)*)::END/);
            if (match) return match[1];
        }
        return null;
    }

    updateProtectTelemetry() {
        const p = this.state.protect;
        let sec = 42;
        sec += Math.min(22, p.opacity * 0.75);
        sec += p.layout === 'dense' ? 14 : (p.layout === 'adaptive' ? 10 : 6);
        if (p.edgeAnchor) sec += 9;
        if (p.microMesh) sec += 7;
        if (p.chroma) sec += 6;
        if (p.lsb) sec += 8;
        sec = Math.min(99, Math.round(sec));

        let vis = 100 - (p.opacity * 1.15) + (p.centerFade * 0.25);
        if (p.layout === 'dense') vis -= 8;
        if (p.edgeAnchor) vis += 5;
        vis = Math.max(30, Math.min(98, Math.round(vis)));

        const total = Math.round(sec * 0.6 + vis * 0.4);
        if (this.dom.protectSecVal) this.dom.protectSecVal.textContent = `${sec}%`;
        if (this.dom.protectSecBar) this.dom.protectSecBar.style.width = `${sec}%`;
        if (this.dom.protectVisVal) this.dom.protectVisVal.textContent = `${vis}%`;
        if (this.dom.protectVisBar) this.dom.protectVisBar.style.width = `${vis}%`;
        if (this.dom.protectScoreTotal) this.dom.protectScoreTotal.textContent = `${total} / 100`;

        // Sync tab indicator dot
        this.dom.tabProtectDot?.classList.toggle('hidden', !p.enabled);
    }

    renderHighResBlob(imgData, styleOverride = null) {
        return new Promise(async (resolve) => {
            const originalStyle = this.state.settings.style;
            if (styleOverride) this.state.settings.style = styleOverride;
            const offCanvas = document.createElement('canvas');
            const offCtx = this.getCanvasContext(offCanvas, { alpha: false, willReadFrequently: true });
            await this.renderScene(offCtx, imgData, null, null);

            // 若开启防盗水印与隐形盲水印且导出格式为 PNG，则自动写入像素底层 LSB 版权指纹
            const fmt = this.state.exportFormat || 'image/jpeg';
            if (fmt === 'image/png' && this.state.protect.enabled && this.state.protect.lsb) {
                const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
                const wmText = (this.state.protect.text.trim() || 'XIANGVISUALS').toUpperCase();
                this.embedLsbFingerprint(offCanvas, `${wmText} | ${stamp} UTC`);
            }

            offCanvas.toBlob((blob) => {
                if (styleOverride) this.state.settings.style = originalStyle;
                resolve(blob);
            }, fmt, 0.96);
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
            const protectTag = this.state.protect.enabled ? '_PROTECT' : '';
            link.download = `XIANGVISUALS_${this.state.settings.style.toUpperCase()}${protectTag}_${Date.now()}.${ext}`;
            link.href = url; document.body.appendChild(link); link.click(); document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            triggerHaptic('success');
            const lsbNote = (this.state.exportFormat === 'image/png' && this.state.protect.enabled && this.state.protect.lsb)
                ? ' (含 LSB 盲水印)' : '';
            this.showToast(`HIGH-RES ARCHIVE EXPORTED // 高清作品已导出${lsbNote}`, 'success');
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

        const stylesToGen = ['ascii_inset', 'vinyl_record', 'ins_45_story', 'xhs_editorial', 'newspaper_press', 'magazine_cover', 'ccd_timestamp', 'exif_palette', 'editorial_magazine', 'cinema_scope'];
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