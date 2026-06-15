# Usamos la imagen oficial de Microsoft Playwright para Python
# Esta imagen ya viene con Python, Pip y todos los códecs de los navegadores instalados
FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar el archivo de requerimientos
COPY requirements.txt .

# Instalar las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el backend de automatización
COPY main.py .

# Exponer el puerto del microservicio
EXPOSE 8000

# Comando para arrancar FastAPI con uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
