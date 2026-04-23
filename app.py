import serial
import sqlite3
import time
import threading
from flask import Flask, render_template, jsonify
from datetime import datetime


SERIAL_PORT = 'COM10'  # Порт для связи с SimulIDE
BAUD_RATE = 9600  # Скорость передачи данных
DB_NAME = 'groundwater.db'  # Имя файла базы данных
MAX_POINTS = 50  # Количество точек на графике


app = Flask(__name__)


def init_db():
    """Создаёт таблицу в базе данных, если её нет"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        water_level REAL,
        humidity REAL,
        water_temp REAL,
        air_temp REAL
    )''')
    conn.commit()
    conn.close()
    print("База данных создана")


def save_to_db(level, humidity, water_temp, air_temp):
    """Сохраняет показания в базу данных"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("INSERT INTO readings (water_level, humidity, water_temp, air_temp) VALUES (?, ?, ?, ?)",
              (level, humidity, water_temp, air_temp))
    conn.commit()
    conn.close()


def read_serial():
    """Фоновый поток для чтения данных с Arduino через COM-порт"""
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        time.sleep(2)
        print(f"Слушаю порт {SERIAL_PORT}...")

        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8').strip()
                parts = line.split(',')

                if len(parts) == 4:
                    level = float(parts[0])
                    humidity = float(parts[1])
                    water_temp = float(parts[2])
                    air_temp = float(parts[3])

                    save_to_db(level, humidity, water_temp, air_temp)
                    print(
                        f"{datetime.now().strftime('%H:%M:%S')} | Уровень:{level}см | Влажность:{humidity}% | Вода:{water_temp}°C | Воздух:{air_temp}°C")

            time.sleep(0.1)
    except Exception as e:
        print(f"Ошибка порта: {e}")


@app.route('/')
def index():
    """Главная страница с веб-интерфейсом"""
    return render_template('index.html')


@app.route('/api/data')
def get_data():
    """API endpoint для получения данных в формате JSON"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        f"SELECT water_level, humidity, water_temp, air_temp, timestamp FROM readings ORDER BY id DESC LIMIT {MAX_POINTS}")
    rows = c.fetchall()
    conn.close()

    # Переворачиваем для хронологического порядка
    rows.reverse()

    # Извлекаем данные
    labels = [r[4][11:16] for r in rows]  # Только время ЧЧ:ММ
    levels = [r[0] for r in rows]
    humidities = [r[1] for r in rows]
    water_temps = [r[2] for r in rows]
    air_temps = [r[3] for r in rows]

    # Последние значения
    latest = rows[-1] if rows else [0, 0, 0, 0]

    return jsonify({
        'labels': labels,
        'levels': levels,
        'humidities': humidities,
        'water_temps': water_temps,
        'air_temps': air_temps,
        'latest_level': latest[0],
        'latest_humidity': latest[1],
        'latest_water_temp': latest[2],
        'latest_air_temp': latest[3]
    })


if __name__ == '__main__':
    init_db()

    # Запускаем поток чтения данных с COM-порта
    serial_thread = threading.Thread(target=read_serial, daemon=True)
    serial_thread.start()

    app.run(debug=False, use_reloader=False)
