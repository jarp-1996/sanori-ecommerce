# Usamos una imagen base oficial de Python (Debian)
FROM python:3.11-slim-bookworm

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar el archivo de requerimientos
COPY requirements.txt .

# Instalar las dependencias de Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Instalar los navegadores de Playwright y sus dependencias de sistema operativo
RUN playwright install --with-deps chromium

# Copiar el backend de automatización
COPY main.py .

# Exponer el puerto del microservicio
EXPOSE 8000

# Comando para arrancar FastAPI con uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
