let balance = 1000;
let currentBet = 0;
let multiplier = 1.00;
let bombs = [];
let startButtonTimer = null; // Таймер для блокировки кнопки «Начать игру»
let savedBombs = [];
let revealedCells = 0;
const totalCells = 25; // 5x5 сетка
const grid = document.getElementById('grid');
let bombCount = 2;
let gameActive = false;
let firstCellRevealed = false;
let skipAnimations = false; // Флаг для скипа анимации

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

function startGame() {
    const startBtn = document.getElementById('startBtn');
    if (startBtn.disabled) {
        return; // Если кнопка заблокирована таймером, не начинаем игру
    }

    closeWinPopup();
    closeLossPopup();

    if (gameActive) {
        return;
    }

    // ... остальной код startGame() без изменений


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

    bombs = generateBombs(bombCount);
    savedBombs = [...bombs];

    // Сохранение прогресса в момент начала игры
    localStorage.setItem('minerdss_progress', JSON.stringify({
        balance: balance,
        bombCount: bombCount,
        multiplier: multiplier,
        currentBet: currentBet
    }));

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
        cell.classList.add('bomb', 'loss-animation');
        cell.textContent = '💣';

        showLossPopup(currentBet, balance);
        gameActive = false;

        setTimeout(() => {
            grid.classList.remove('loss-animation');
            revealAllCells(); // Запускаем раскрытие всех клеток
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

    // Коэффициенты для режима 3 бомбы
    if (bombCount === 3) {
        const fixedMultipliers = [
            1.06, 1.21, 1.39, 1.61, 1.88,
            2.20, 2.58, 3.05, 3.63, 4.35,
            5.25, 6.35, 7.70, 9.35, 11.40
        ];
        const maxIndex = Math.min(revealedCells - 1, fixedMultipliers.length - 1);
        multiplier = fixedMultipliers[maxIndex];
    } else {
        // Старый алгоритм для других режимов
        multiplier += parseFloat((Math.random() * 0.1 + 0.05).toFixed(2));
    }

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

// Раскрытие всех клеток мгновенно
// Раскрытие всех клеток мгновенно
// Раскрытие всех клеток мгновенно
// Раскрытие всех клеток мгновенно
function revealAllCells() {
    const cells = document.querySelectorAll('.cell');

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

    setTimeout(() => {
        lockStartButtonForSeconds(3); // Блокируем кнопку на 3 секунды
        resetGame(); // Сброс игры после блокировки
    }, 1000); // Показываем раскрытие 1 секунду
}

// Сброс игры
// Сброс игры
function resetGame() {
    // Останавливаем таймер блокировки, если он активен
    if (startButtonTimer) {
        clearInterval(startButtonTimer);
        startButtonTimer = null;
        const startBtn = document.getElementById('startBtn');
        startBtn.disabled = false;
        startBtn.textContent = 'Начать игру';
    }

    bombs = [];
    currentBet = 0;
    multiplier = 1.00;
    revealedCells = 0;
    gameActive = false;
    firstCellRevealed = false;

    updateMultiplier();
    setButtonsState(true, false); // Кнопка «Начать игру» активна (если не заблокирована таймером)
    grid.classList.remove('win-animation', 'loss-animation');

    // Очищаем поле и пересоздаём его
    grid.innerHTML = '';
    createEmptyGrid();
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
    document.getElementById('multiplier').textContent = multiplier.toFixed(2) + "x";
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
    // Не сбрасываем игру здесь — она уже сброшена в revealAllCells()
}

// Закрытие всплывающего окна проигрыша
function closeLossPopup() {
    const lossPopup = document.getElementById('lossPopup');
    lossPopup.style.display = 'none';
    // Не сбрасываем игру здесь — она уже сбросится в revealAllCells()
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

// Функция загрузки прогресса при старте страницы
function loadProgress() {
    const saved = localStorage.getItem('minerdss_progress');
    if (saved) {
        const data = JSON.parse(saved);
        balance = data.balance;
        bombCount = data.bombCount;
        multiplier = data.multiplier;
        currentBet = data.currentBet;
        updateBalance();
        updateMultiplier();

        // Обновляем активную кнопку режима
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`.mode-btn[data-bombs="${bombCount}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
}

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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadProgress();
    updateBalance();
    updateMultiplier();

    // Привязываем обработчики событий для кнопок режимов
    document.querySelectorAll('.mode-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Сбрасываем активный класс у всех
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            // Добавляем активному
            this.classList.add('active');

            updateBombMode(parseInt(this.dataset.bombs));
        });
    });

    // Создаём пустое поле при загрузке
    createEmptyGrid();

    // Явно включаем кнопки при загрузке
    setButtonsState(true, false);

    // Привязываем обработчики событий к кнопкам управления
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('collectBtn').addEventListener('click', collectWinnings);
});
function lockStartButtonForSeconds(seconds) {
    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = true;

    let countdown = seconds;
    startBtn.textContent = `Начать игру (${countdown}с)`;

    startButtonTimer = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            startBtn.textContent = `Начать игру (${countdown}с)`;
        } else {
            clearInterval(startButtonTimer);
            startBtn.disabled = false;
            startBtn.textContent = 'Начать игру';
            startButtonTimer = null;
        }
    }, 1000);
}
