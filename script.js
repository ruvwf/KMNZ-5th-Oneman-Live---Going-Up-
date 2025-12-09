(function () {
    const loader = document.getElementById('loader');
    const progressEl = document.querySelector('.loader-progress');
    const percentEl = document.querySelector('.loader-percent');
    const bg = document.querySelector('.bg-image');
    const fg = document.querySelector('.front-image');
    const body = document.body;

    // 先に画像を読み込んでおく
    const assets = [
        'images/image1.jpg',
        'images/image2.png',
        'images/logo.png',
        'images/thumb.png'
    ];

    let loaded = 0;
    const total = assets.length;
    let targetPercent = 0;
    let displayPercent = 0;

    assets.forEach(src => {
        const img = new Image();
        img.onload = img.onerror = () => {
            loaded++;
            targetPercent = Math.round((loaded / total) * 100);
        };
        img.src = src;
    });

    function tick() {
        displayPercent += (targetPercent - displayPercent) * 0.18;
        if (loaded < total && displayPercent > 95) displayPercent = 95;

        const p = Math.min(100, Math.round(displayPercent));
        progressEl.style.width = p + '%';
        if (percentEl) {
            percentEl.textContent = p + '%';
            const leftPct = Math.min(98, Math.max(2, p));
            percentEl.style.left = leftPct + '%';
            percentEl.style.transform = 'translate(-50%, -50%)';
        }

        if (loaded === total && p >= 100) {
            finish();
        } else {
            requestAnimationFrame(tick);
        }
    }

    function finish() {
        
        if (loader) loader.classList.add('hidden');

        // 待機
        if (loader) setTimeout(() => {
            try { loader.remove(); } catch (e) { /* ignore */ }
        }, 550);

        // ページの準備完了
        body.classList.add('page-ready');

        // 背景・ロゴ表示
        if (bg) bg.classList.add('loaded');
        if (fg) setTimeout(() => fg.classList.add('visible'), 200);

        initScrollFade();
    }

    // スクロールでフェードイン
    function initScrollFade() {
        const items = document.querySelectorAll('.fade-on-scroll');
        if (!items.length) return;

        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -20% 0px', 
            threshold: 0.08
        });

        items.forEach(item => {
            // すでにほぼ画面内にあるものは即時表示
            const rect = item.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.92) {
                item.classList.add('in-view');
            } else {
                obs.observe(item);
            }
        });
    }


    // おまじない
    setTimeout(() => {
        targetPercent = 100;
        if (loaded < total) loaded = total;
    }, 8000);

    // 画像にmainが重ならないようにする処理（frontとbgを同サイズにし、その高さをヒーローに反映）
    function updateHeroHeight() {
        const bgImg = document.querySelector('.bg-image img');
        const fgImg = document.querySelector('.front-image img');
        const spacer = document.querySelector('.hero-spacer');
        const bgWrap = document.querySelector('.bg-image');
        const fgWrap = document.querySelector('.front-image');
        const fallback = Math.round(window.innerHeight * 0.6);

        // 有効幅: 横画面時は左右25vwの余白を引いた幅、縦画面時は全幅
        const isLandscape = window.matchMedia('(orientation: landscape)').matches;
        const sidePaddingRate = isLandscape ? 0.25 : 0;
        const effectiveWidth = Math.max(1, Math.round(window.innerWidth * (1 - sidePaddingRate * 2)));

        // 基準画像: frontがあればfront、なければbg
        const baseImg = fgImg || bgImg;
        if (!baseImg) {
            document.documentElement.style.setProperty('--hero-height', fallback + 'px');
            if (spacer) spacer.style.height = fallback + 'px';
            if (bgWrap) bgWrap.style.height = fallback + 'px';
            if (fgWrap) fgWrap.style.height = fallback + 'px';
            return;
        }

        function applyHeight() {
            const scale = effectiveWidth / Math.max(1, baseImg.naturalWidth);
            const renderedHeight = Math.round(baseImg.naturalHeight * scale);
            const h = Math.max(48, renderedHeight); // 最低高さを確保

            document.documentElement.style.setProperty('--hero-height', h + 'px');
            if (spacer) spacer.style.height = h + 'px';
            if (bgWrap) bgWrap.style.height = h + 'px';
            if (fgWrap) fgWrap.style.height = h + 'px';
        }

        if (baseImg.naturalWidth && baseImg.naturalHeight) {
            applyHeight();
        } else {
            baseImg.addEventListener('load', applyHeight, { once: true });
            document.documentElement.style.setProperty('--hero-height', fallback + 'px');
            if (spacer) spacer.style.height = fallback + 'px';
            if (bgWrap) bgWrap.style.height = fallback + 'px';
            if (fgWrap) fgWrap.style.height = fallback + 'px';
        }
    }

    window.addEventListener('resize', updateHeroHeight, { passive: true });
    window.addEventListener('orientationchange', updateHeroHeight);


    const imgs = document.querySelectorAll('.bg-image img, .front-image img');
    imgs.forEach(img => {
        img.addEventListener('load', updateHeroHeight, { once: true });
    });

    const _finish = finish;
    finish = function () {
        updateHeroHeight();
        setTimeout(() => _finish(), 0);
    };

    document.addEventListener('DOMContentLoaded', updateHeroHeight);

    requestAnimationFrame(tick);
})();

// ここからタイマー
(function () {
    // 初期化
    const container = document.querySelector('.top-countdown[data-target]');
    if (!container) return;

    const targetAttr = container.getAttribute('data-target');
    const parts = targetAttr.split('-').map(Number);
    const targetDate = new Date(parts[0], Math.max(0, parts[1] - 1), parts[2], 17, 0, 0);

    const els = {
        days: container.querySelector('[data-unit="days"]'),
        hours: container.querySelector('[data-unit="hours"]'),
        minutes: container.querySelector('[data-unit="minutes"]'),
        seconds: container.querySelector('[data-unit="seconds"]')
    };

    let last = {};

    function pad(n){ return String(n).padStart(2,'0'); }

    function update() {
        const now = new Date();
        let diff = Math.max(0, Math.floor((targetDate - now) / 1000)); // 秒
        if (diff <= 0) {
            container.innerHTML = '<div class="cd-done">開催中</div>';
            return clearInterval(timer);
        }
        const days = Math.floor(diff / 86400); diff %= 86400;
        const hours = Math.floor(diff / 3600); diff %= 3600;
        const minutes = Math.floor(diff / 60); const seconds = diff % 60;

        const vals = { days: String(days), hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };

        Object.keys(vals).forEach(k => {
            const el = els[k];
            if (!el) return;
            if (last[k] !== vals[k]) {
                el.textContent = vals[k];
                el.classList.add('update');
                requestAnimationFrame(() => {
                    setTimeout(() => el.classList.remove('update'), 160);
                });
            }
        });
        last = vals;
    }

    update();
    const timer = setInterval(update, 1000);
})();

// 共有リンク
(function () {
    function setShareLinks() {
        const url = encodeURIComponent(location.href);
        const text = encodeURIComponent(document.title);
        document.querySelectorAll('.js-share-x').forEach(a => {
            a.href = `https://x.com/intent/tweet?url=${url}&text=${text}`;
        });
        document.querySelectorAll('.js-share-line').forEach(a => {
            a.href = `https://social-plugins.line.me/lineit/share?url=${url}`;
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setShareLinks);
    } else {
        setShareLinks();
    }
})();
