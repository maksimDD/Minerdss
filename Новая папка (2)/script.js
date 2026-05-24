let balance = 1000;
let currentBet = 0;
let multiplier = 1.00;
let bombs = [];
let savedBombs = []; // Массив для сохранения позиций бомб
let revealedCells = 0;
const totalCells = 25; // 5x5 сетка
const grid = document.getElementById('grid');
let bombCount = 2; // начальное количество бомб (минимум 2)
let gameActive = false; // флаг активной игры
let firstCellRevealed = false; // флаг открытия первой клетки

// --- 1. ИСПРАВЛЕННАЯ ГЕНЕРАЦИЯ БОМБ (защита от полного заполнения) ---
function generateBombs(count) {
    const positions = Array.from({ length: totalCells }, (_, i) => i);
    const bombPositions = [];
    const maxPossible = totalCells - 1; // Минимум 1 клетка должна быть пустой
    const actualCount = Math.min(count, maxPossible);

    for (let i = 0; i < actualCount; i++) {
        const randomIndex = Math.floor(Math.random() * positions.length);
        const bombPos = positions[randomIndex];
        bombPositions.push(bombPos);
        positions.splice(randomIndex, 1);
    }
    return bombPositions;
}

// --- 2. ОБРАБОТЧИК ИЗМЕНЕНИЯ РЕЖИМА (без применения ставки!) ---
function updateBombMode() {
    bombCount = parseInt(document.getElementById('bombMode').value);
    // При смене режима просто обновляем переменную, НЕ трогаем баланс и ставку
    if (gameActive) {
        alert('Завершите игру перед сменой режима!');
        return;
    }
    resetGame(); // Сброс состояния
}

// --- 3. НАЧАЛО ИГРЫ (здесь применяем ставку) ---
function startGame() {
    // Проверяем, что игра не активна и не в состоянии анимации
    if (gameActive || document.getElementById('startBtn').disabled) {
        return;
    }

    const betInput = document.getElementById('bet');
    currentBet = parseInt(betInput.value);

    if (currentBet > balance) {
        alert('Недостаточно средств!');
        return;
    }

    // Блокируем кнопки сразу при старте
    setButtonsState(false, false);

    // Списываем ставку и начинаем игру
    balance -= currentBet;
    updateBalance();

    multiplier = 1.00;
    updateMultiplier();

    revealedCells = 0;
    gameActive = true;
    firstCellRevealed = false;

    bombs = generateBombs(bombCount);
    savedBombs = [...bombs];

    // Очищаем стили и текст у всех клеток перед новой игрой
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.className = 'cell';
        cell.textContent = '';
        // Перепривязываем обработчик клика
        cell.removeEventListener('click', handleCellClick);
        cell.addEventListener('click', handleCellClick);
    });
}

// --- 4. ОБРАБОТЧИК КЛИКА (исправленная версия) ---
function handleCellClick(e) {
    if (!gameActive) return;

    const cellIndex = parseInt(e.target.dataset.index);
    const cell = e.target;

    // Если клетка уже открыта — игнорируем клик
    if (cell.classList.contains('empty') || cell.classList.contains('bomb')) return;

    // --- БЛОК: ПРОИГРЫШ (наступили на бомбу) ---
if (bombs.includes(cellIndex)) {
    // МОМЕНТАЛЬНАЯ БЛОКИРОВКА КНОПОК
    setButtonsState(false, false);

    cell.classList.add('bomb', 'loss-animation');
    cell.textContent = '💣';
    grid.classList.add('loss-animation');

    // Показываем окно проигрыша
    showLossPopup(currentBet, balance);
    gameActive = false;

    // Запускаем анимацию раскрытия всех клеток через 1 с
    setTimeout(() => {
        grid.classList.remove('loss-animation');
        revealAllCells();
    }, 1000);

    return;
}

    // --- БЛОК: УСПЕШНЫЙ КЛИК ---
    cell.classList.add('empty', 'reveal-animation');
    cell.textContent = '✅';
    revealedCells++;

    // Разблокировка кнопки
    if (!firstCellRevealed) {
        firstCellRevealed = true;
        setButtonsState(false, true); // Блокируем старт, разблокируем сбор
    } else {
        setButtonsState(false, true);
    }

    // Множитель
    multiplier += parseFloat((Math.random() * 0.1 + 0.05).toFixed(2));
    updateMultiplier();

    // --- ПРОВЕРКА ПОБЕДЫ ---
    if (revealedCells === totalCells - bombCount) {
        const winAmount = Math.round(currentBet * multiplier);
        balance += winAmount;
        updateBalance();

        showWinPopup(winAmount, balance);
        grid.classList.add('win-animation');

        // Блокируем кнопки на время анимации победы
        setButtonsState(false, false);

        // Сброс игры происходит ПОСЛЕ анимации
        setTimeout(() => {
            grid.classList.remove('win-animation');
            resetGame();
        }, 2000);
    }
}

// --- 5. ФУНКЦИЯ РАСКРЫТИЯ ВСЕХ КЛЕТОК ---
function revealAllCells() {
    // Блокируем кнопки на время анимации
    setButtonsState(false, false);

    const cells = document.querySelectorAll('.cell');
    let delay = 0;
    // Расчёт общего времени анимации: количество клеток × задержка между ними + запас
    const totalDelay = cells.length * 150 + 200;

    cells.forEach((cell, index) => {
        // Пропускаем уже открытые клетки
        if (cell.classList.contains('empty') || cell.classList.contains('bomb')) return;

        setTimeout(() => {
            const cellIndex = parseInt(cell.dataset.index);
            if (savedBombs.includes(cellIndex)) {
                cell.classList.add('bomb', 'reveal-animation');
                cell.textContent = '💣';
            } else {
                cell.classList.add('empty', 'reveal-animation');
                cell.textContent = '✅';
            }
        }, delay);
        delay += 150; // Задержка между открытием клеток
    });

    // РАЗБЛОКИРОВКА КНОПКИ ПОСЛЕ ЗАВЕРШЕНИЯ АНИМАЦИИ
    setTimeout(() => {
        setButtonsState(true, false); // Кнопка «Начать игру» активна, «Забрать выигрыш» — нет
        // Дополнительно сбрасываем игру, чтобы подготовить интерфейс к новому раунду
        resetGame();
    }, totalDelay);
}

// --- 6. ФУНКЦИЯ СБРОСА ---
function resetGame() {
    bombs = [];
    currentBet = 0;
    multiplier = 1.00;
    revealedCells = 0;
    gameActive = false;
    firstCellRevealed = false;

    updateMultiplier();

    // ГАРАНТИРОВАННО разблокируем кнопку «Начать игру»
    setButtonsState(true, false);

    grid.classList.remove('win-animation', 'loss-animation', 'reveal-animation');

    // Возвращаем все клетки в исходное состояние
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.className = 'cell';
        cell.textContent = '';
    });
}

function enableStartButton() {
    const btn = document.getElementById('startBtn');
    btn.disabled = false;
}

function disableStartButton() {
    const btn = document.getElementById('startBtn');
    btn.disabled = true;
}

function enableCollectButton() {
    document.getElementById('collectBtn').disabled = false;
}

function disableCollectButton() {
    document.getElementById('collectBtn').disabled = true;
}

// --- ФУНКЦИИ ОБНОВЛЕНИЯ ИНТЕРФЕЙСА ---
function updateBalance() {
    document.getElementById('balance').textContent = balance;
}

function updateMultiplier() {
    document.getElementById('multiplier').textContent = `${multiplier.toFixed(2)}x`;
}

// Функция для сбора выигрыша
function collectWinnings() {
    if (!gameActive || !firstCellRevealed) return;

    // Блокируем все кнопки сразу
    setButtonsState(false, false);

    const winAmount = Math.round(currentBet * multiplier);
    balance += winAmount;
    updateBalance();

    showWinPopup(winAmount, balance);
    gameActive = false; // Явно отключаем игру

    // Сразу сбрасываем игру — без задержки
    resetGame();
}

function showDepositModal() {
    document.getElementById('deposit-modal').style.display = 'block';
}

function hideDepositModal() {
    const modal = document.getElementById('deposit-modal');
    modal.classList.add('hide');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('hide');
    }, 300); // Скрываем через 300 мс, чтобы анимация успела отработать
}

function deposit(method) {
    let amount = 0;
    switch (method) {
        case 'Crypto Bot': amount = 500; break;
        case 'Ton': amount = 300; break;
        case 'USDT': amount = 200; break;
        case 'Другое': amount = 100; break;
    }
    balance += amount;
    updateBalance();
    hideDepositModal();
}

// Закрытие модального окна при клике вне его области
window.onclick = function(event) {
    const depositModal = document.getElementById('deposit-modal');
    const winPopup = document.getElementById('winPopup');
    const lossPopup = document.getElementById('lossPopup');

    if (event.target === depositModal) {
        hideDepositModal();
    }

    if (event.target === winPopup) {
        closeWinPopup();
    }

    if (event.target === lossPopup) {
        closeLossPopup();
    }
};

// --- Вспомогательные функции закрытия попапов ---
function closeWinPopup() {
    document.getElementById('winPopup').style.display = 'none';
    resetGame();
}

function closeLossPopup() {
    document.getElementById('lossPopup').style.display = 'none';
    // resetGame() убран — сброс происходит после анимации в revealAllCells()
}


function showWinPopup(amount, newBalance) {
    const popup = document.getElementById('winPopup');
    const winAmountElement = document.getElementById('winAmount');
    const newBalanceElement = document.getElementById('newBalance');

    winAmountElement.textContent = `${amount} $`;
    newBalanceElement.textContent = `${newBalance} $`;

    // Блокируем кнопки при показе попапа
    setButtonsState(false, false);
    popup.style.display = 'block';
}


function showLossPopup(lossAmount, currentBalance) {
    const popup = document.getElementById('lossPopup');
    const lossAmountElement = document.getElementById('lossAmount');
    const currentBalanceElement = document.getElementById('currentBalance');

    lossAmountElement.textContent = `${lossAmount} $`;
    currentBalanceElement.textContent = `${currentBalance} $`;

    popup.style.display = 'block';
}

// --- ФУНКЦИИ ОБНОВЛЕНИЯ ИНТЕРФЕЙСА ---
function updateBalance() {
    document.getElementById('balance').textContent = balance;
}

function updateMultiplier() {
    document.getElementById('multiplier').textContent = `${multiplier.toFixed(2)}x`;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    updateBalance();
    updateMultiplier();
    document.getElementById('bombMode').value = bombCount;

    // Создаём пустое поле при загрузке
    createEmptyGrid();

    // Явно включаем кнопки при загрузке
    enableStartButton();
    disableCollectButton();

    // Привязываем обработчики событий
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('collectBtn').addEventListener('click', collectWinnings);
});

// --- ДОПОЛНИТЕЛЬНАЯ ФУНКЦИЯ: создание пустого поля ---
function createEmptyGrid() {
    grid.innerHTML = ''; // Очищаем поле

    // Создаём 25 пустых клеток
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        // Сразу привязываем обработчик клика — клетки всегда интерактивны
        cell.addEventListener('click', handleCellClick);
        grid.appendChild(cell);
    }
}
function setButtonsState(startEnabled, collectEnabled) {
    document.getElementById('startBtn').disabled = !startEnabled;
    document.getElementById('collectBtn').disabled = !collectEnabled;
}
function setButtonsState(startEnabled, collectEnabled, loading = false) {
    document.getElementById('startBtn').disabled = !startEnabled;
    document.getElementById('collectBtn').disabled = !collectEnabled;
    if (loading) {
        document.querySelectorAll('.btn').forEach(btn => btn.classList.add('loading'));
    } else {
        document.querySelectorAll('.btn').forEach(btn => btn.classList.remove('loading'));
    }
}
