let currentUser = null;
let userData = { points: 0, totalRecycled: 0, history: [] };
let stream = null;
let flashDealStarted = false;

// 1. INICIALIZAÇÃO
function initGroupAccounts() {
    const group = [
        { name: "samille", pts: 1250 },
        { name: "maria clara", pts: 1000 },
        { name: "juan luiz", pts: 1500 },
        { name: "Giliardi", pts: 1520 },
        { name: "daniel henrique", pts: 2022 }
    ];
    group.forEach(m => {
        const key = `recitech_user_${m.name}`;
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify({
                points: m.pts, totalRecycled: m.pts,
                history: [{ desc: "Saldo Inicial", pts: `+${m.pts}`, date: "22/03/2026" }]
            }));
        }
    });
}
initGroupAccounts();

// 2. ADMIN RESET
function masterReset() {
    if (confirm("Botão Nuclear ☢️")) {
        localStorage.clear();
        location.reload();
    }
}

// 3. DATABASE
function saveToDB() {
    if (currentUser) localStorage.setItem(`recitech_user_${currentUser}`, JSON.stringify(userData));
}

function loadFromDB() {
    const data = localStorage.getItem(`recitech_user_${currentUser}`);
    if (data) {
        userData = JSON.parse(data);
        if (userData.totalRecycled === undefined) userData.totalRecycled = userData.points;
    }
}

// 4. LOGIN E UI
function handleLogin() {
    const user = document.getElementById('user-input').value.trim().toLowerCase();
    if (user) {
        currentUser = user;
        loadFromDB();
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        document.getElementById('user-name-display').innerText = user;
        if (user === "daniel henrique" || user === "daniel") document.getElementById('admin-btn').classList.remove('hidden');
        updateUI();
    }
}

function updateUI() {
    document.getElementById('total-points').innerText = userData.points;
    document.getElementById('eco-co2').innerText = (userData.totalRecycled * 0.05).toFixed(1);
    document.getElementById('eco-water').innerText = (userData.totalRecycled * 1.2).toFixed(1);
    
    // Ativação automática da oferta para todos
    if (!flashDealStarted) {
        startFlashDeal();
        flashDealStarted = true;
    }

    const b1 = document.getElementById('badge-1'), b2 = document.getElementById('badge-2'), b3 = document.getElementById('badge-3');
    if (userData.totalRecycled > 0) b1.classList.add('unlocked');
    if (userData.totalRecycled >= 1000) b2.classList.add('unlocked');
    if (userData.totalRecycled >= 5000) b3.classList.add('unlocked');

    updateHistoryUI();
    updateRanking();
}

// 5. OFERTA RELÂMPAGO
function startFlashDeal() {
    const card = document.getElementById('flash-deal');
    const timerDisplay = document.getElementById('timer');
    card.classList.remove('hidden');
    let timeLeft = 300;
    const interval = setInterval(() => {
        const mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;
        timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (timeLeft-- <= 0) { clearInterval(interval); card.classList.add('hidden'); }
    }, 1000);
}

// 6. OPERAÇÕES
function addPoints(val) {
    new Audio('https://www.soundjay.com/buttons/beep-07a.mp3').play().catch(()=>{});
    userData.points += val;
    userData.totalRecycled += val;
    userData.history.unshift({ desc: "Reciclagem PET", pts: `+${val}`, date: new Date().toLocaleTimeString() });
    saveToDB(); updateUI();
}

function redeemPoints(cost) {
    if (userData.points >= cost) {
        userData.points -= cost;
        const code = 'KOCH-' + Math.random().toString(36).substr(2, 4).toUpperCase();
        document.getElementById('coupon-code').innerText = code;
        userData.history.unshift({ desc: "Resgate Koch", pts: `-${cost}`, date: new Date().toLocaleDateString() });
        saveToDB(); updateUI();
        document.getElementById('success-modal').classList.remove('hidden');
    } else { alert("Saldo insuficiente!"); }
}

// 7. RANKING E CÂMERA
function updateRanking() {
    const players = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('recitech_user_')) {
            const name = key.replace('recitech_user_', ''), data = JSON.parse(localStorage.getItem(key));
            players.push({ name, points: data.totalRecycled });
        }
    }
    players.sort((a, b) => b.points - a.points);
    document.getElementById('ranking-list').innerHTML = players.map((p, idx) => `
        <li class="${p.name === currentUser ? 'rank-item-me' : ''}">
            <span>${idx + 1}º ${p.name.toUpperCase()}</span><span>${p.points} pts</span>
        </li>`).join('');
}

function updateHistoryUI() {
    document.getElementById('points-list').innerHTML = userData.history.map(h => `
        <li><div><strong>${h.desc}</strong><br><small>${h.date}</small></div>
        <span style="color: ${h.pts.includes('+') ? '#27ae60' : '#ff4757'}">${h.pts}</span></li>`).join('');
}

async function openScanner() {
    document.getElementById('scanner-modal').classList.remove('hidden');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        document.getElementById('video').srcObject = stream;
        setTimeout(() => { 
            document.getElementById('scan-frame').classList.add('active');
            setTimeout(() => { addPoints(250); closeScanner(); }, 800);
        }, 3000);
    } catch (e) { alert("Câmera OFF"); closeScanner(); }
}

function closeScanner() {
    document.getElementById('scanner-modal').classList.add('hidden');
    if (stream) stream.getTracks().forEach(t => t.stop());
}

function toggleHistory() { document.getElementById('history-section').classList.toggle('hidden'); }
function closeSuccess() { document.getElementById('success-modal').classList.add('hidden'); }
function handleLogout() { location.reload(); }