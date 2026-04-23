// Получаем контексты для всех графиков
const levelCtx = document.getElementById('levelChart').getContext('2d');
const humidityCtx = document.getElementById('humidityChart').getContext('2d');
const waterTempCtx = document.getElementById('waterTempChart').getContext('2d');
const airTempCtx = document.getElementById('airTempChart').getContext('2d');

// Общие настройки для всех графиков
const commonOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
    },
    scales: {
        y: { grid: { color: '#e0e0e0' } },
        x: { grid: { display: false } }
    }
};

// График уровня воды (синий)
const levelChart = new Chart(levelCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Уровень воды',
            data: [],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52,152,219,0.1)',
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        ...commonOptions,
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'см' } },
            x: { title: { display: true, text: 'Время' } }
        }
    }
});

// График влажности (зелёный)
const humidityChart = new Chart(humidityCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Влажность',
            data: [],
            borderColor: '#27ae60',
            backgroundColor: 'rgba(39,174,96,0.1)',
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        ...commonOptions,
        scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: '%' } },
            x: { title: { display: true, text: 'Время' } }
        }
    }
});

// График температуры воды (красный)
const waterTempChart = new Chart(waterTempCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Температура воды',
            data: [],
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231,76,60,0.1)',
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        ...commonOptions,
        scales: {
            y: { beginAtZero: true, title: { display: true, text: '°C' } },
            x: { title: { display: true, text: 'Время' } }
        }
    }
});

// График температуры воздуха (оранжевый)
const airTempChart = new Chart(airTempCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Температура воздуха',
            data: [],
            borderColor: '#f39c12',
            backgroundColor: 'rgba(243,156,18,0.1)',
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        ...commonOptions,
        scales: {
            y: { beginAtZero: true, title: { display: true, text: '°C' } },
            x: { title: { display: true, text: 'Время' } }
        }
    }
});

/**
 * Обновляет все графики и карточки с текущими значениями
 */
function updateCharts(data) {
    if (!data.labels || data.labels.length === 0) return;

    // Обновляем карточки с текущими значениями
    document.getElementById('level').innerHTML = data.latest_level;
    document.getElementById('humidity').innerHTML = data.latest_humidity;
    document.getElementById('water_temp').innerHTML = data.latest_water_temp;
    document.getElementById('air_temp').innerHTML = data.latest_air_temp;

    // Обновляем график уровня воды
    levelChart.data.labels = data.labels;
    levelChart.data.datasets[0].data = data.levels;
    levelChart.update();

    // Обновляем график влажности
    humidityChart.data.labels = data.labels;
    humidityChart.data.datasets[0].data = data.humidities;
    humidityChart.update();

    // Обновляем график температуры воды
    waterTempChart.data.labels = data.labels;
    waterTempChart.data.datasets[0].data = data.water_temps;
    waterTempChart.update();

    // Обновляем график температуры воздуха
    airTempChart.data.labels = data.labels;
    airTempChart.data.datasets[0].data = data.air_temps;
    airTempChart.update();
}

/**
 * Запрашивает свежие данные с сервера
 */
function fetchData() {
    fetch('/api/data')
        .then(response => response.json())
        .then(data => updateCharts(data))
        .catch(error => console.error('Ошибка при получении данных:', error));
}

// Запускаем автоматическое обновление каждые 2 секунды
setInterval(fetchData, 2000);

// Первоначальная загрузка данных
fetchData();
