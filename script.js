(function() {
    let enteredPin = '';
    let checking = false;
    const lockScreen = document.getElementById('lockScreen');
    const lockContainer = document.querySelector('.lock-container');
    const pinDotEls = document.querySelectorAll('#pinDots .pin-dot');

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
        } catch (e) {
            // Network/server issue — treat as incorrect, don't unlock.
            ok = false;
        }

        if (ok) {
            pinDotEls.forEach(d => d.classList.add('success'));
            setTimeout(() => lockScreen.classList.add('hidden'), 450);
        } else {
            pinDotEls.forEach(d => d.classList.add('error'));
            lockContainer.classList.add('pin-shake');
            setTimeout(() => {
                lockContainer.classList.remove('pin-shake');
                enteredPin = '';
                updatePinDots();
                checking = false;
            }, 500);
        }
    }

    document.querySelectorAll('#keypad .key[data-k]').forEach(btn => {
        btn.addEventListener('click', () => {
            const k = btn.dataset.k;
            if (k === '' || enteredPin.length >= 6) return;
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

    // ----- navigation state -----
    const pages = {
        hub: document.getElementById('pageHub'),
        reasons: document.getElementById('pageReasons'),
        surprise: document.getElementById('pageSurprise'),
        gallery: document.getElementById('pageGallery'),
        vault: document.getElementById('pageVault'),
        add: document.getElementById('pageAdd')
    };

    showPage('hub');

    function showPage(pageId) {
        Object.values(pages).forEach(p => p.classList.remove('active'));
        pages[pageId].classList.add('active');
        if (pageId === 'vault') renderVault();
    }

    // back handlers (go to hub)
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.closest('[data-back]') || e.target.classList.contains('back-btn')) {
                showPage('hub');
            }
        });
    });

    // ----- hub cards open respective page (letters opens its own standalone file) -----
    document.querySelectorAll('.hub-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const page = card.dataset.page;
            if (page === 'letters') {
                window.location.href = 'letters.html';
                return;
            }
            if (page) showPage(page);
        });
    });

    // ----- 14 reasons -----
    const reasonsList = [
        "the way you smile at me",
        "the way you talk to me",
        "you still laugh at my jokes",
        "the way you are constantly trying to learn new things",
        "your eyes when you talk about dreams",
        "the way you call me babe",
        "you are really intellectual",
        "you make everyday days feel like valentine",
        "the way you hold my hand",
        "you always pray for me",
        "your strength when things are hard",
        "the cute faces you make ",
        "you chose me back",
        "you are you, and that's everything I love"
    ];

    let revealedIdx = 0;
    const reasonsGrid = document.getElementById('reasonsGrid');
    const counterSpan = document.getElementById('reasonCounter');
    const revealBtn = document.getElementById('revealOneMore');
    const revealAllBtn = document.getElementById('revealAllBtn');

    function renderReasons() {
        reasonsGrid.innerHTML = '';
        for (let i = 0; i < revealedIdx; i++) {
            const div = document.createElement('div');
            div.className = 'reason-card';
            div.innerText = reasonsList[i];
            reasonsGrid.appendChild(div);
        }
        counterSpan.innerText = `${revealedIdx} / 14 revealed`;
        if (revealedIdx >= 7) revealAllBtn.classList.remove('hidden');
        if (revealedIdx >= 14) revealBtn.disabled = true;
    }
    revealBtn.addEventListener('click', () => {
        if (revealedIdx < 14) {
            revealedIdx++;
            renderReasons();
        }
        if (revealedIdx === 14) {
            revealBtn.innerText = 'all revealed 💕';
            revealBtn.style.opacity = '0.6';
        }
    });
    revealAllBtn.addEventListener('click', () => {
        revealedIdx = 14;
        renderReasons();
        revealBtn.innerText = 'all revealed 💕';
    });
    revealedIdx = 1;
    renderReasons();

    // ----- surprise game (with message overlay) -----
    const questions = [
        { question: "where did we first connect?", options: ["your house", "that party", "online", "my shop"], correct: 3, memory: "you were showing your 32... lol. First time I ever saw an angel✨" },
        { question: "what couldn't you finish on our first date?", options: ["the cake", "the parfait", "the doughnuts", "me"], correct: 1, memory: "Like how can you get filled from drinking chilled yoghurt... 😂" },
        { question: "How much do you think I love you?", options: ["you don't love me", "About 50%", "maybe 80%", "so much"], correct: 3, memory: "You know how they say some moments feel like a lifetime? Every second with you does that. My love for you is measured in eternities that only last an instant. I LOVE YOU MON CŒUR❤" },
        { question: "When is our anniversary?(I think I got it but it is you tun to guss)", options: ["june 05 2021", "May 04 2021", "july 25 2021", "september 22 2021"], correct: 2, memory: "I think it was the sunday evening I phoned you and then asked you out" }
    ];
    let qIndex = 0;
    const startDiv = document.getElementById('gameStart');
    const playDiv = document.getElementById('gamePlay');
    const endDiv = document.getElementById('gameEnd');
    const questionBox = document.getElementById('questionBox');
    const optionsBox = document.getElementById('optionsBox');
    const progress = document.getElementById('gameProgress');

    // overlay elements (for game only)
    const overlay = document.getElementById('messageOverlay');
    const msgEmoji = document.getElementById('messageEmoji');
    const msgContent = document.getElementById('messageContent');
    const msgHint = document.getElementById('messageHint');
    const closeMsgBtn = document.getElementById('closeMessageBtn');

    let pendingNextQuestion = false;
    function showMessageOverlay(text, isCorrect, opts = {}) {
        msgEmoji.innerText = opts.emoji ?? (isCorrect ? '✨' : '💭');
        msgContent.innerHTML = text;
        msgHint.innerText = (typeof opts.hint !== 'undefined') ? opts.hint : (isCorrect ? '· correct ·' : '');
        pendingNextQuestion = !!opts.nextOnClose;
        overlay.classList.add('active');
    }

    function closeOverlay() {
        overlay.classList.remove('active');
        if (pendingNextQuestion) {
            pendingNextQuestion = false;
            qIndex++;
            showQuestion();
        }
    }
    closeMsgBtn.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
    });

    document.getElementById('startGameBtn').addEventListener('click', () => {
        startDiv.classList.add('hidden');
        playDiv.classList.remove('hidden');
        qIndex = 0;
        showQuestion();
    });

    function showQuestion() {
        if (qIndex >= questions.length) {
            playDiv.classList.add('hidden');
            endDiv.classList.remove('hidden');
            return;
        }
        const q = questions[qIndex];
        questionBox.innerText = q.question;
        let optsHtml = '';
        q.options.forEach((opt, i) => {
            optsHtml += `<button class="option-btn" data-opt-index="${i}">${opt}</button>`;
        });
        optionsBox.innerHTML = optsHtml;
        progress.innerText = `question ${qIndex+1} of ${questions.length}`;
        
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selected = parseInt(e.target.dataset.optIndex);
                const currentQ = questions[qIndex];
                
                document.querySelectorAll('.option-btn').forEach(b => {
                    b.classList.remove('correct-guess', 'wrong-guess');
                });
                
                if (selected === currentQ.correct) {
                    e.target.classList.add('correct-guess');
                    showMessageOverlay(currentQ.memory, true, { nextOnClose: true });
                } else {
                    e.target.classList.add('wrong-guess');
                    showMessageOverlay('try again', false);
                }
            });
        });
    }

    // ----- OPEN WHEN LETTERS now lives in letters.html -----

    // ----- GALLERY -----
    const galleryGrid = document.getElementById('galleryGrid');

    // Full image list — matches the /images folder exactly.
    // Edit captions freely. Order is randomized on every load.
    const allGalleryImages = [
        { file: 'ohima (1).jpeg', caption: 'You look like a queen 👑' },
        { file: 'ohima (1).jpg',  caption: 'See teeth 😁' },
        { file: 'ohima (1).png',  caption: 'You always glow' },
        { file: 'ohima (2).jpg',  caption: 'Stupendous in my opinion' },
        { file: 'ohima (3).jpg',  caption: 'Hot kidd 🔥' },
        { file: 'ohima (4).jpg',  caption: 'lol 😄' },
        { file: 'ohima (5).jpg',  caption: '2022 I guess' },
        { file: 'ohima (6).jpg',  caption: 'Corper weee 🎖️' },
        { file: 'ohima (7).jpg',  caption: 'My love 🤍' },
        { file: 'ohima (8).jpg',  caption: 'I love you' },
        { file: 'ohima (9).jpg',  caption: 'Remember this one?' },
        { file: 'ohima (10).jpg', caption: 'Still my favourite' },
        { file: 'ohima (11).jpg', caption: 'Pure sunshine ☀️' },
        { file: 'ohima (12).jpg', caption: 'This smile 🥹' },
        { file: 'ohima (13).jpg', caption: 'Always her' },
        { file: 'ohima (14).jpg', caption: 'Mon cœur 🤍' },
        { file: 'ohima (15).jpg', caption: 'Radiant as always' },
        { file: 'ohima (16).jpg', caption: 'She doesn\'t miss 💅' },
        { file: 'ohima (17).jpg', caption: 'Beautiful soul' },
        { file: 'ohima (18).jpg', caption: 'Says it all ❤️' },
    ];

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ----- PHOTO STRIP (hub page) — 5 random images each load -----
    const photoStrip = document.getElementById('photoStrip');
    if (photoStrip) {
        shuffle(allGalleryImages).slice(0, 5).forEach((item) => {
            const img = document.createElement('img');
            img.className = 'hub-photo';
            img.src = `images/${item.file}`;
            img.alt = 'us';
            img.loading = 'lazy';
            photoStrip.appendChild(img);
        });
    }

    // Randomize order on every page load — show all images
    shuffle(allGalleryImages).forEach((item) => {
        const src = `images/${item.file}`;
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `
            <div class="photo-caption">${item.caption}</div>
            <img src="${src}" alt="memory" loading="lazy">
        `;
        div.addEventListener('click', () => expandImage(src, item.caption));
        galleryGrid.appendChild(div);
    });

    window.expandImage = function(src, caption) {
        document.getElementById('expandedImg').src = src;
        document.getElementById('caption').innerText = caption;
        document.getElementById('lightbox').classList.remove('hidden');
    };
    window.closeLightbox = function() {
        document.getElementById('lightbox').classList.add('hidden');
    };

    // ----- MEMORY VAULT with image support -----
    // 🤍 Hardcoded memories — edit titles/dates/notes freely, or delete entries you don't want.
    // For a photo, drop the file in /images and set image: "images/yourfile.jpg"
    const hardcodedMemories = [
        {
            title: "The day we met",
            date: "2021-06-05",
            note: "EDIT ME: write what happened the day it all started.",
            tag: "first",
            image: null
        },
        {
            title: "Our anniversary",
            date: "2021-07-25",
            note: "EDIT ME: write about this milestone.",
            tag: "milestone",
            image: null
        },
        {
            title: "EDIT ME: give this memory a title",
            date: "",
            note: "EDIT ME: describe the moment, then add as many more of these blocks as you like.",
            tag: "everyday",
            image: null
        }
    ];

    function getMemories() {
        const saved = JSON.parse(localStorage.getItem('memories') || '[]');
        return [...saved, ...hardcodedMemories];
    }

    function renderVault() {
        const vaultContent = document.getElementById('vaultContent');
        const mems = getMemories();
        if (!mems.length) {
            vaultContent.innerHTML = '<div style="text-align:center; padding:60px 20px; color:#b85763;">✨ no memories yet.<br>add your first one together.</div>';
            return;
        }
        let html = '<div style="display:flex; flex-direction:column; gap:16px;">';
        mems.forEach((m) => {
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
        vaultContent.innerHTML = html;
    }

    // ----- ADD MEMORY (with image resize & storage) -----
    const memImageInput = document.getElementById('memImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    let imageDataURL = null;

    memImageInput.addEventListener('change', function(e) {
        const file = this.files[0];
        if (!file) {
            imagePreview.style.display = 'none';
            imageDataURL = null;
            return;
        }
        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX = 400;
                let width = img.width, height = img.height;
                if (width > height) {
                    if (width > MAX) { height = height * (MAX / width); width = MAX; }
                } else {
                    if (height > MAX) { width = width * (MAX / height); height = MAX; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                imageDataURL = dataUrl;
                previewImg.src = dataUrl;
                imagePreview.style.display = 'block';
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('saveMemoryBtn').addEventListener('click', function() {
        const title = document.getElementById('memTitle').value.trim();
        const date = document.getElementById('memDate').value;
        const note = document.getElementById('memNote').value.trim();
        const tag = document.getElementById('memTag').value;
        if (!title) { document.getElementById('memTitle').focus(); return; }
        const mems = getMemories();
        mems.unshift({
            title,
            date,
            note,
            tag,
            image: imageDataURL || null,
            id: Date.now()
        });
        localStorage.setItem('memories', JSON.stringify(mems));
        // reset form
        document.getElementById('memTitle').value = '';
        document.getElementById('memDate').value = '';
        document.getElementById('memNote').value = '';
        memImageInput.value = '';
        imagePreview.style.display = 'none';
        imageDataURL = null;
        // toast
        const t = document.getElementById('toast');
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2200);
        if (pages.vault.classList.contains('active')) renderVault();
    });

    // ----- floating hearts -----
    function addFloater() {
        const heart = document.createElement('div');
        heart.innerText = '❤️';
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

    const style = document.createElement('style');
    style.innerHTML = `@keyframes float-up { to { transform: translateY(-100vh); opacity:0; }}`;
    document.head.appendChild(style);
})();