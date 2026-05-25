let balance = 1000;
let currentBet = 0;
let multiplier = 1.00;
let bombs = [];
let savedBombs = [];
let revealedCells = 0;
const totalCells = 25; // 5x5 сетка
const grid = document.getElementById('grid');
let bombCount = 2;
let gameActive = false;
let firstCellRevealed = false;
let skipAnimations = false;

// Генерация бомб с защитой от полного заполнения
function generateBombs(count) {
    const positions = Array.from({ length: totalCells }, (_, i) => i);
    const bombPositions = [];
    const maxPossible = totalCells - 1;
    const actualCount = Math.min(count, maxPossible);

    for (let i = 0; i < actualCount; i++) {
        const randomIndex = Math.floor(Math.random() * positions.length);
        const bombPos = positions[randomIndex];
        bombPositions.push(bombPos);
        positions.splice(randomIndex, 1);
    }
    return bombPositions;
}

// Обновление режима бомб
function updateBombMode(count) {
    bombCount = count;

    // Обновляем визуальное состояние кнопок режима
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    if (gameActive) {
        alert('Завершите игру перед сменой режима!');
        return;
    }
    resetGame();
}

// Начало игры
function startGame() {
    if (gameActive || document.getElementById('startBtn').disabled) {
        return;
    }

    const betInput = document.getElementById('bet');
    currentBet = parseInt(betInput.value);

    if (currentBet > balance) {
        alert('Недостаточно средств!');
        return;
    }

    setButtonsState(false, false);

    balance -= currentBet;
    updateBalance();

    multiplier = 1.00;
    updateMultiplier();

    revealedCells = 0;
    gameActive = true;
    firstCellRevealed = false;
    skipAnimations = false;

    bombs = generateBombs(bombCount);
    savedBombs = [...bombs];

    // Очищаем и пересоздаём поле
    grid.innerHTML = '';
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        grid.appendChild(cell);
    }
}

// Обработка клика по клетке
function handleCellClick(e) {
    if (!gameActive) return;

    const cellIndex = parseInt(e.target.dataset.index);
    const cell = e.target;

    if (cell.classList.contains('empty') || cell.classList.contains('bomb')) return;

// Проигрыш — наступили на бомбу
if (bombs.includes(cellIndex)) {
    setButtonsState(false, false);
    cell.classList.add('bomb', 'loss-animation');
    cell.textContent = '💣';

    showLossPopup(currentBet, balance);
    gameActive = false;

    setTimeout(() => {
        grid.classList.remove('loss-animation');
        revealAllCells();
    }, 1000);
    return;
}

// Успешный клик
cell.classList.add('empty', 'reveal-animation');
cell.textContent = '✅';
revealedCells++;

if (!firstCellRevealed) {
    firstCellRevealed = true;
    setButtonsState(false, true);
} else {
    setButtonsState(false, true);
}

multiplier += parseFloat((Math.random() * 0.1 + 0.05).toFixed(2));
updateMultiplier();

// Проверка победы
if (revealedCells === totalCells - bombCount) {
    const winAmount = Math.round(currentBet * multiplier);
    balance += winAmount;
    updateBalance();

    showWinPopup(winAmount, balance);
    grid.classList.add('win-animation');

    setButtonsState(false, false);

    setTimeout(() => {
        grid.classList.remove('win-animation');
        resetGame();
    }, 2000);
}
}

// Раскрытие всех клеток (с возможностью скипа анимации)
function revealAllCells() {
    setButtonsState(false, false);
    const cells = document.querySelectorAll('.cell');

    if (skipAnimations) {
        // Если скип анимации включён — раскрываем всё сразу
        cells.forEach(cell => {
            if (cell.classList.contains('empty') || cell.classList.contains('bomb')) return;

            const cellIndex = parseInt(cell.dataset.index);
            if (savedBombs.includes(cellIndex)) {
                cell.classList.add('bomb');
                cell.textContent = '💣';
            } else {
                cell.classList.add('empty');
                cell.textContent = '✅';
            }
        });
        setButtonsState(true, false);
        resetGame();
        return;
    }

    // Обычная анимация раскрытия
    let delay = 0;
    const totalDelay = cells.length * 150 + 200;

    cells.forEach((cell, index) => {
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
        delay += 150;
    });

    setTimeout(() => {
        setButtonsState(true, false);
        resetGame();
    }, totalDelay);
}

// Сброс игры
function resetGame() {
    bombs = [];
    currentBet = 0;
    multiplier = 1.00;
    revealedCells = 0;
    gameActive = false;
    firstCellRevealed = false;
    skipAnimations = false;

    updateMultiplier();
    setButtonsState(true, false);
    grid.classList.remove('win-animation', 'loss-animation', 'reveal-animation');
}

// Управление состоянием кнопок
function setButtonsState(startEnabled, collectEnabled, loading = false) {
    document.getElementById('startBtn').disabled = !startEnabled;
    document.getElementById('collectBtn').disabled = !collectEnabled;

    if (loading) {
        document.querySelectorAll('.btn').forEach(btn => btn.classList.add('loading'));
    } else {
        document.querySelectorAll('.btn').forEach(btn => btn.classList.remove('loading'));
    }
}

// Обновление баланса
function updateBalance() {
    document.getElementById('balance').textContent = balance;
}

// Обновление множителя
function updateMultiplier() {
    document.getElementById('multiplier').textContent = `${multiplier.toFixed(2)}x`;
}

// Сбор выигрыша
function collectWinnings() {
    if (!gameActive || !firstCellRevealed) return;

    setButtonsState(false, false);
    const winAmount = Math.round(currentBet * multiplier);
    balance += winAmount;
    updateBalance();

    showWinPopup(winAmount, balance);
    gameActive = false;
    resetGame();
}

// Пополнение баланса
function showDepositModal() {
    document.getElementById('deposit-modal').style.display = 'block';
}

function hideDepositModal() {
    const modal = document.getElementById('deposit-modal');
    modal.classList.add('hide');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('hide');
    }, 300);
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

// Всплывающие окна
function showWinPopup(amount, newBalance) {
    const popup = document.getElementById('winPopup');
    document.getElementById('winAmount').textContent = `${amount} $`;
    document.getElementById('newBalance').textContent = `${newBalance} $`;
    popup.style.display = 'block';
}

function showLossPopup(lossAmount, currentBalance) {
    const popup = document.getElementById('lossPopup');
    document.getElementById('lossAmount').textContent = `${lossAmount} $`;
    document.getElementById('currentBalance').textContent = `${currentBalance} $`;
    popup.style.display = 'block';
}

// Закрытие всплывающего окна выигрыша
function closeWinPopup() {
    document.getElementById('winPopup').style.display = 'none';
    resetGame();
}

// Закрытие всплывающего окна проигрыша
function closeLossPopup() {
    document.getElementById('lossPopup').style.display = 'none';
}

// Обработка клика вне модальных окон для их закрытия
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    updateBalance();
    updateMultiplier();

    // Привязываем обработчики событий для кнопок режимов
    document.querySelectorAll('.mode-btn').forEach(button => {
        button.addEventListener('click', function() {
            updateBombMode(parseInt(this.dataset.bombs));
        });
    });

    // Создаём пустое поле при загрузке
    createEmptyGrid();

    // Явно включаем кнопки при загрузке
    setButtonsState(true, false);

    // Привязываем обработчики событий
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('collectBtn').addEventListener('click', collectWinnings);
});

// Дополнительная функция: создание пустого поля
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
