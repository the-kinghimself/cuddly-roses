(function() {
    'use strict';

    // ── LOCK SCREEN ──
    (function initLock() {
        const lockScreen = document.getElementById('lockScreen');
        if (!lockScreen) return;

        if (sessionStorage.getItem('unlocked') === 'true') {
            lockScreen.classList.add('hidden');
            return;
        }

        const pinDotEls = document.querySelectorAll('#pinDots .pin-dot');
        let enteredPin = '';
        let checking = false;

        function updatePinDots() {
            pinDotEls.forEach((dot, i) => {
                dot.classList.toggle('filled', i < enteredPin.length);
                dot.classList.remove('error', 'success');
            });
        }

        async function checkPin() {
            if (enteredPin.length < 6 || checking) return;
            checking = true;
            let ok = false;
            try {
                const res = await fetch('/.netlify/functions/check-pin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin: enteredPin })
                });
                const data = await res.json();
                ok = !!data.ok;
            } catch { ok = false; }

            if (ok) {
                pinDotEls.forEach(d => d.classList.add('success'));
                sessionStorage.setItem('unlocked', 'true');
                setTimeout(() => lockScreen.classList.add('hidden'), 450);
            } else {
                pinDotEls.forEach(d => d.classList.add('error'));
                document.querySelector('.lock-container').classList.add('pin-shake');
                setTimeout(() => {
                    document.querySelector('.lock-container').classList.remove('pin-shake');
                    enteredPin = '';
                    updatePinDots();
                    checking = false;
                }, 500);
            }
        }

        document.querySelectorAll('#keypad .key[data-k]').forEach(btn => {
            btn.addEventListener('click', () => {
                const k = btn.dataset.k;
                if (k === '' || enteredPin.length >= 6 || checking) return;
                enteredPin += k;
                updatePinDots();
                checkPin();
            });
        });

        const delKey = document.getElementById('delKey');
        if (delKey) {
            delKey.addEventListener('click', () => {
                enteredPin = enteredPin.slice(0, -1);
                updatePinDots();
            });
        }
    })();

    // ── REASONS ──
    (function initReasons() {
        const grid = document.getElementById('reasonsGrid');
        if (!grid) return;

        const source = document.getElementById('reasonsSource');
        if (!source) return;
        const reasons = Array.from(source.querySelectorAll('li')).map(li => li.textContent.trim());

        let revealed = 1;
        const counter = document.getElementById('reasonCounter');
        const revealBtn = document.getElementById('revealOneMore');
        const revealAllBtn = document.getElementById('revealAllBtn');

        function render() {
            grid.innerHTML = '';
            for (let i = 0; i < revealed; i++) {
                const div = document.createElement('div');
                div.className = 'reason-card';
                div.textContent = reasons[i];
                grid.appendChild(div);
            }
            counter.textContent = `${revealed} / ${reasons.length} revealed`;
            if (revealed >= 7) revealAllBtn.classList.remove('hidden');
            if (revealed >= reasons.length) revealBtn.disabled = true;
        }

        revealBtn.addEventListener('click', () => {
            if (revealed < reasons.length) {
                revealed++;
                render();
            }
            if (revealed === reasons.length) {
                revealBtn.textContent = 'all revealed 💕';
                revealBtn.style.opacity = '0.6';
            }
        });

        revealAllBtn.addEventListener('click', () => {
            revealed = reasons.length;
            render();
            revealBtn.textContent = 'all revealed 💕';
        });

        render();
    })();

    // ── GALLERY ──
    (function initGallery() {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;

        const template = document.getElementById('gallerySource');
        const items = [];
        if (template) {
            const children = template.content.querySelectorAll('[data-src]');
            children.forEach(el => {
                items.push({
                    src: el.dataset.src,
                    caption: el.dataset.caption || '💭'
                });
            });
        }

        let mems = [];
        try { mems = JSON.parse(localStorage.getItem('memories') || '[]'); } catch {}
        const memImages = mems.filter(m => m.image).map(m => ({
            src: m.image,
            caption: m.title || 'Memory'
        }));

        const combined = [...items, ...memImages];
        for (let i = combined.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [combined[i], combined[j]] = [combined[j], combined[i]];
        }

        combined.forEach(item => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            const imageSrc = item.src.startsWith('data:') ? item.src : 'images/' + item.src;
            div.innerHTML = `
                <div class="photo-caption">${item.caption}</div>
                <img src="${imageSrc}" alt="memory" loading="lazy" onerror="this.onerror=null; this.src='images/ohima (1).jpg';">
            `;
            div.addEventListener('click', () => expandImage(item.src, item.caption));
            grid.appendChild(div);
        });

        window.expandImage = function(src, caption) {
            document.getElementById('expandedImg').src = src.startsWith('data:') ? src : 'images/' + src;
            document.getElementById('caption').textContent = caption;
            document.getElementById('lightbox').classList.remove('hidden');
        };
        window.closeLightbox = function() {
            document.getElementById('lightbox').classList.add('hidden');
        };
    })();

    // ── HUB PHOTO STRIP ──
    (function initHub() {
        const strip = document.getElementById('photoStrip');
        if (!strip) return;

        const source = document.getElementById('stripSource');
        if (!source) return;
        const files = source.dataset.images.split(',').map(s => s.trim());
        const shuffled = files.sort(() => 0.5 - Math.random());
        shuffled.slice(0, 5).forEach(file => {
            const img = document.createElement('img');
            img.className = 'hub-photo';
            img.src = `images/${file}`;
            img.alt = 'us';
            img.loading = 'lazy';
            img.onerror = () => { img.src = 'images/ohima (1).jpg'; };
            strip.appendChild(img);
        });
    })();

    // ── MEMORY VAULT ──
    (function initVault() {
        const container = document.getElementById('vaultContent');
        if (!container) return;

        function getMemories() {
            try { return JSON.parse(localStorage.getItem('memories') || '[]'); }
            catch { return []; }
        }

        function render() {
            const mems = getMemories();
            if (!mems.length) {
                container.innerHTML = `<div style="text-align:center; padding:60px 20px; color:#b85763;">✨ no memories yet.<br>shall we make one together.</div>`;
                return;
            }
            let html = '<div style="display:flex; flex-direction:column; gap:16px;">';
            mems.forEach(m => {
                const dateStr = m.date ? new Date(m.date+'T12:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : 'a special day';
                html += `
                    <div style="background:white; border-radius:30px; padding:18px 20px; border:2px solid #ffe2e2; box-shadow:0 4px 12px rgba(170,80,90,0.1);">
                        <div style="font-size:0.8rem; color:#b85763; text-transform:uppercase; letter-spacing:1px;">${dateStr}</div>
                        <div style="font-size:1.3rem; font-weight:600; color:#b13e4b; margin:4px 0 8px;">${m.title}</div>
                        ${m.note ? `<div style="color:#ac7b81; margin-bottom:8px;">${m.note}</div>` : ''}
                        <div style="display:inline-block; background:#ffd9d9; padding:4px 14px; border-radius:30px; font-size:0.9rem; color:#a53f4d;">${m.tag}</div>
                        ${m.image ? `<div style="margin-top:12px;"><img src="${m.image}" style="max-width:100%; max-height:200px; border-radius:20px; border:2px solid #ffe2e2;"></div>` : ''}
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        }

        render();
        window.refreshVault = render;
    })();

    // ── ADD MEMORY ──
    (function initAddMemory() {
        const saveBtn = document.getElementById('saveMemoryBtn');
        if (!saveBtn) return;

        const imageInput = document.getElementById('memImage');
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        let imageDataURL = null;

        if (imageInput && preview && previewImg) {
            imageInput.addEventListener('change', function(e) {
                const file = this.files[0];
                if (!file) {
                    preview.style.display = 'none';
                    imageDataURL = null;
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(ev) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const MAX = 400;
                        let w = img.width, h = img.height;
                        if (w > h) {
                            if (w > MAX) { h = h * (MAX / w); w = MAX; }
                        } else {
                            if (h > MAX) { w = w * (MAX / h); h = MAX; }
                        }
                        canvas.width = w; canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, w, h);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        imageDataURL = dataUrl;
                        previewImg.src = dataUrl;
                        preview.style.display = 'block';
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        saveBtn.addEventListener('click', function() {
            const title = document.getElementById('memTitle').value.trim();
            const date = document.getElementById('memDate').value;
            const note = document.getElementById('memNote').value.trim();
            const tag = document.getElementById('memTag').value;
            if (!title) { document.getElementById('memTitle').focus(); return; }

            let mems = [];
            try { mems = JSON.parse(localStorage.getItem('memories') || '[]'); } catch {}
            mems.unshift({ title, date, note, tag, image: imageDataURL || null, id: Date.now() });
            localStorage.setItem('memories', JSON.stringify(mems));

            document.getElementById('memTitle').value = '';
            document.getElementById('memDate').value = '';
            document.getElementById('memNote').value = '';
            imageInput.value = '';
            preview.style.display = 'none';
            imageDataURL = null;

            const toast = document.getElementById('toast');
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2200);

            if (window.refreshVault) window.refreshVault();
        });
    })();

    // ── LETTERS ──
    (function initLetters() {
        const board = document.getElementById('lettersBoard');
        if (!board) return;

        const source = document.getElementById('lettersSource');
        if (!source) return;
        const letterElements = source.content.querySelectorAll('.letter-data');
        const letters = Array.from(letterElements).map(el => ({
            icon: el.dataset.icon,
            label: el.dataset.label,
            sub: el.dataset.sub,
            content: el.innerHTML
        }));

        const modal = document.getElementById('letterModal');
        const modalCard = document.getElementById('letterModalCard');
        const modalIcon = document.getElementById('modalIcon');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const closeBtn = document.getElementById('closeLetterBtn');

        function openLetter(letter, dark) {
            modalIcon.textContent = letter.icon;
            modalTitle.textContent = 'open when ' + letter.label;
            modalBody.innerHTML = letter.content;
            modalCard.classList.toggle('dark-modal', !!dark);
            modal.classList.add('active');
        }
        function closeLetter() { modal.classList.remove('active'); }

        closeBtn.addEventListener('click', closeLetter);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeLetter(); });

        letters.forEach(l => {
            const el = document.createElement('div');
            el.className = 'letter-envelope';
            el.innerHTML = `
                <div class="envelope-inner">
                    <div class="envelope-seal">${l.icon}</div>
                    <div class="envelope-text">
                        <div class="envelope-label">open when ${l.label}</div>
                        <div class="envelope-sub">${l.sub}</div>
                    </div>
                    <div class="envelope-status-chip">unopened</div>
                </div>
            `;
            el.addEventListener('click', () => {
                openLetter(l, false);
                el.classList.add('opened');
                el.querySelector('.envelope-status-chip').textContent = 'opened ❤️';
            });
            board.appendChild(el);
        });

        // ── SPECIAL LETTER PIN (no content stored; just set flag) ──
        const specialEnvelope = document.getElementById('specialEnvelope');
        const specialPinWrap = document.getElementById('specialPinWrap');
        const specialDots = document.querySelectorAll('.s-dot');
        const specialErr = document.getElementById('specialErr');

        if (specialEnvelope && specialPinWrap) {
            let sPin = '', sChecking = false;

            specialEnvelope.addEventListener('click', () => {
                specialPinWrap.style.display = 'block';
                specialEnvelope.style.display = 'none';
                specialPinWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });

            function updateDots() {
                specialDots.forEach((d, i) => {
                    d.classList.toggle('filled', i < sPin.length);
                    d.classList.remove('error', 'ok');
                });
                specialErr.style.display = 'none';
            }

            async function checkSpecialPin() {
                if (sPin.length < 4 || sChecking) return;
                sChecking = true;
                try {
                    const res = await fetch('/.netlify/functions/check-special-pin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pin: sPin })
                    });
                    const data = await res.json();
                    if (data.ok) {
                        specialDots.forEach(d => d.classList.add('ok'));
                        // Set session flag and redirect
                        sessionStorage.setItem('specialUnlocked', 'true');
                        setTimeout(() => { window.location.href = 'special.html'; }, 500);
                    } else {
                        specialDots.forEach(d => d.classList.add('error'));
                        specialPinWrap.classList.add('s-shake');
                        specialErr.style.display = 'block';
                        setTimeout(() => {
                            specialPinWrap.classList.remove('s-shake');
                            sPin = '';
                            updateDots();
                            sChecking = false;
                        }, 500);
                    }
                } catch {
                    sPin = '';
                    updateDots();
                    sChecking = false;
                }
            }

            document.querySelectorAll('.s-key[data-k]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const k = btn.dataset.k;
                    if (k === '' || sPin.length >= 4 || sChecking) return;
                    sPin += k;
                    updateDots();
                    checkSpecialPin();
                });
            });
            document.getElementById('sDelKey').addEventListener('click', () => {
                sPin = sPin.slice(0, -1);
                updateDots();
            });
        }
    })();

    // ── SPECIAL LETTER DISPLAY (special.html) ──
    (function initSpecial() {
        const card = document.getElementById('letterCard');
        if (!card) return;

        // Check if we came from a successful unlock
        if (sessionStorage.getItem('specialUnlocked') !== 'true') {
            document.getElementById('fallback').style.display = 'block';
            return;
        }
        // Consume the flag
        sessionStorage.removeItem('specialUnlocked');

        // Read the letter content from the hidden div on this page
        const contentDiv = document.getElementById('specialLetterContent');
        if (!contentDiv) {
            document.getElementById('fallback').style.display = 'block';
            return;
        }

        const title = contentDiv.dataset.title || 'a letter for you 💌';
        const message = contentDiv.textContent.trim();

        document.getElementById('letterTitle').textContent = title;
        const body = document.getElementById('letterBody');
        // Split by newlines and create <p> for each non‑empty line
        message.split('\n').filter(l => l.trim()).forEach(line => {
            const p = document.createElement('p');
            p.textContent = line;
            body.appendChild(p);
        });

        card.style.display = 'block';
        document.title = title + ' 💝';

        // Floating hearts background
        const bg = document.getElementById('heartsBg');
        if (bg) {
            const emojis = ['❤️','💕','🤍','💖','✨'];
            for (let i = 0; i < 14; i++) {
                const s = document.createElement('span');
                s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                s.style.left = Math.random() * 100 + '%';
                s.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';
                s.style.animationDuration = (6 + Math.random() * 8) + 's';
                s.style.animationDelay = (Math.random() * 8) + 's';
                bg.appendChild(s);
            }
        }
    })();

    // ── FLOATING HEARTS (global) ──
    (function addFloatingHearts() {
        const style = document.createElement('style');
        style.textContent = `@keyframes float-up { to { transform: translateY(-100vh); opacity:0; } }`;
        document.head.appendChild(style);

        function addFloater() {
            const heart = document.createElement('div');
            heart.textContent = '❤️';
            heart.style.position = 'fixed';
            heart.style.left = Math.random() * 100 + '%';
            heart.style.bottom = '-20px';
            heart.style.fontSize = '1.7rem';
            heart.style.pointerEvents = 'none';
            heart.style.zIndex = '1000';
            heart.style.animation = 'float-up 4s linear forwards';
            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), 4000);
        }
        setInterval(addFloater, 800);
    })();
})();