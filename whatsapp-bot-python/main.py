import os
import asyncio
import urllib.parse
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel
from playwright.async_api import async_playwright
import pyqrcode

app = FastAPI(
    title="Sánori - WhatsApp Bot Core",
    description="Microservicio autohospedado en Python para automatización libre de WhatsApp Web usando Playwright y FastAPI."
)

# Directorio para guardar la sesión del navegador para mantener el inicio de sesión
USER_DATA_DIR = os.path.join(os.getcwd(), "wweb_session")
QR_FILE_PATH = os.path.join(os.getcwd(), "whatsapp_qr.png")

# Estados posibles del bot: "initializing", "qr_needed", "authenticated", "error"
bot_state = {
    "status": "initializing",
    "qr_ready": False,
    "qr_data": None,
    "error_message": None
}

# Referencia global a la página de Playwright y navegador
pw_resources = {
    "playwright": None,
    "browser_context": None,
    "page": None,
    "lock": asyncio.Lock()  # Lock para evitar concurrencia conflictiva al enviar mensajes
}

class MessagePayload(BaseModel):
    number: str
    message: str
    token: str = None
    session: str = "sanori"


async def monitor_whatsapp_status():
    """
    Tarea en segundo plano que levanta Chromium e interactúa con WhatsApp Web.
    Mantiene la sesión persistente e identifica si requiere escanear QR.
    """
    global bot_state, pw_resources
    
    print("🌿 Iniciando motor de automatización Playwright...")
    try:
        pw = await async_playwright().start()
        pw_resources["playwright"] = pw
        
        # Lanzamos Chromium con persistencia de cookies/sesión
        # Esto permite que una vez escaneado el QR, no tengas que volver a escanearlo al reiniciar el servidor.
        context = await pw.chromium.launch_persistent_context(
            user_data_dir=USER_DATA_DIR,
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--disable-gpu"
            ]
        )
        pw_resources["browser_context"] = context
        
        # Abrir pestaña principal
        page = context.pages[0] if context.pages else await context.new_page()
        pw_resources["page"] = page
        
        # Ir a WhatsApp Web
        print("🔗 Accediendo a WhatsApp Web...")
        await page.goto("https://web.whatsapp.com", wait_until="domcontentloaded", timeout=60000)
        
        # Ciclo de monitoreo de estado
        while True:
            await asyncio.sleep(5)
            
            # 1. Verificar si ya estamos autenticados (busca el componente de la barra de búsqueda o el panel principal)
            is_authenticated = await page.locator('div[contenteditable="true"]').count() > 0 or \
                               await page.locator('span[data-icon="chat"]').count() > 0 or \
                               await page.locator('span[data-icon="status-v3"]').count() > 0
            
            if is_authenticated:
                if bot_state["status"] != "authenticated":
                    print("✅ ¡Sánori Bot conectado exitosamente a WhatsApp!")
                    bot_state["status"] = "authenticated"
                    bot_state["qr_ready"] = False
                    bot_state["qr_data"] = None
                    if os.path.exists(QR_FILE_PATH):
                        try:
                            os.remove(QR_FILE_PATH)
                        except Exception:
                            pass
                continue
                
            # 2. Si no está autenticado, buscar si el código QR ya está listo en pantalla
            qr_container = page.locator('div[data-ref]')
            if await qr_container.count() > 0:
                qr_val = await qr_container.first.get_attribute("data-ref")
                if qr_val and qr_val != bot_state["qr_data"]:
                    print(f"👁️ ¡Nuevo código QR de WhatsApp detectado!")
                    bot_state["status"] = "qr_needed"
                    bot_state["qr_ready"] = True
                    bot_state["qr_data"] = qr_val
                    
                    # Generar código QR como imagen local
                    qr = pyqrcode.create(qr_val)
                    qr.png(QR_FILE_PATH, scale=6)
                    
                    # Mostrar en consola de terminal como texto ASCII para fácil escaneo directo
                    print("\n--- ESCANEA ESTE CÓDIGO QR DESDE TU CELULAR (SÁNORI BOT) ---")
                    print(qr.terminal(quiet_zone=1))
                    print("------------------------------------------------------------\n")
                    print(f"También puedes ver o descargar la imagen en: http://localhost:8000/qr")
            else:
                # Si no hay QR pero tampoco está autenticado, podría estar cargando
                if bot_state["status"] == "authenticated":
                    print("⚠️ Se perdió la conexión con el chat de WhatsApp Web. Reevaluando...")
                    bot_state["status"] = "initializing"

    except Exception as e:
        error_msg = f"Error crítico en el monitor: {str(e)}"
        print(f"❌ {error_msg}")
        bot_state["status"] = "error"
        bot_state["error_message"] = error_msg


@app.on_event("startup")
async def startup_event():
    # Iniciamos el servicio de monitoreo en segundo plano
    asyncio.create_task(monitor_whatsapp_status())


@app.get("/", response_class=HTMLResponse)
async def get_dashboard():
    """
    Dashboard visual para administración cómoda desde el navegador.
    """
    status_color = "text-yellow-600 font-bold"
    if bot_state["status"] == "authenticated":
        status_color = "text-green-600 font-bold"
    elif bot_state["status"] == "qr_needed":
        status_color = "text-red-600 font-bold animate-pulse"
        
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Sánori - WhatsApp API Console</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 text-gray-800 font-sans min-h-screen flex flex-col justify-between">
        <header class="bg-[#1F2E22] text-white py-6 px-8 shadow-md">
            <div class="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold tracking-tight">🌿 Sánori Bot Center</h1>
                    <p class="text-xs text-gray-300 mt-1">Conector Inteligente y Libre de WhatsApp Web</p>
                </div>
                <span class="bg-green-700/30 border border-green-500/50 text-green-300 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold">Autohospedado</span>
            </div>
        </header>

        <main class="max-w-4xl mx-auto w-full p-6 flex-1 space-y-8">
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div>
                    <h2 class="text-lg font-bold text-gray-700">Estado de la Sesión</h2>
                    <div class="mt-2 text-sm">
                        Estado Actual: <span class="{status_color}">{bot_state['status'].upper()}</span>
                    </div>
                </div>

                {'''
                <div class="bg-yellow-50 border border-yellow-200 p-6 rounded-xl flex flex-col items-center justify-center space-y-4">
                    <p class="text-xs font-bold text-yellow-800 uppercase tracking-widest">⚠️ Código QR Requerido</p>
                    <p class="text-xs text-yellow-700 text-center max-w-md">Para habilitar los envíos automatizados de Sánori, abre WhatsApp en tu smartphone, ve a Dispositivos Vinculados y escanea el código siguiente:</p>
                    <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-md">
                        <img src="/qr?cache_breaker={}" alt="Código QR Sánori" class="w-64 h-64">
                    </div>
                    <span class="text-[10px] text-gray-400">La imagen se actualiza automáticamente al detectar cambios.</span>
                </div>
                ''' if bot_state['status'] == 'qr_needed' else ''}

                {'''
                <div class="bg-green-50 border border-green-100 p-6 rounded-xl space-y-2">
                    <p class="text-sm font-bold text-green-800 flex items-center gap-2">
                        <span>🟢 ¡Sesión Vinculada y Activa!</span>
                    </p>
                    <p class="text-xs text-green-700 leading-relaxed">
                        El bot está listo para transferir alertas de compra y confirmaciones de pago desde la tienda para tus clientes. Mantén este servidor corriendo de forma constante.
                    </p>
                </div>
                ''' if bot_state['status'] == 'authenticated' else ''}

                {'''
                <div class="bg-gray-100 p-6 rounded-xl space-y-2">
                    <p class="text-sm font-bold text-gray-600 animate-pulse">⚙️ Conectando con WhatsApp Web...</p>
                    <p class="text-xs text-gray-500">Espere unos segundos mientras levantamos el navegador seguro en segundo plano.</p>
                </div>
                ''' if bot_state['status'] == 'initializing' else ''}
            </div>

            <!-- Panel de Pruebas -->
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 class="text-md font-bold text-gray-700">Probar Comunicación</h3>
                <p class="text-xs text-gray-500 leading-relaxed">Realiza una petición de prueba para verificar que el flujo de mensajería responda al instante en tu red local.</p>
                
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <p class="text-xs font-bold text-gray-600">Endpoint para Desarrollo de tu Tienda:</p>
                    <code class="block bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono">POST http://localhost:8000/send-message</code>
                    <p class="text-[10px] text-gray-400">Este microservicio ya se encuentra vinculado a tu panel administrador de Sánori.</p>
                </div>
            </div>
        </main>

        <footer class="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400">
            🌿 Sánori Cosmética Artesanal — Alquimia Natural para tu Piel y Cabello.
        </footer>
    </body>
    </html>
    """.format(urllib.parse.quote(str(bot_state["qr_data"] or '')))
    return html_content


@app.get("/qr")
async def get_qr_image():
    """
    Ruta que expone la imagen del código QR escaneable para vincular la cuenta.
    """
    if bot_state["status"] != "qr_needed" or not os.path.exists(QR_FILE_PATH):
        raise HTTPException(status_code=404, detail="No se requiere escaneo de código QR en este momento o ya está logueado.")
    return FileResponse(QR_FILE_PATH, media_type="image/png")


@app.get("/status")
async def get_status():
    """
    Verifica rápidamente el estado del bot.
    """
    return bot_state


@app.post("/send-message")
async def send_message(payload: MessagePayload):
    """
    Envía un mensaje de WhatsApp a un número destinatario.
    Utiliza un lock síncrono para garantizar que los mensajes se despachen en cola, uno a uno,
    evitando que se crucen acciones en la misma pestaña del navegador.
    """
    global bot_state, pw_resources
    
    if bot_state["status"] != "authenticated":
        raise HTTPException(
            status_code=400, 
            detail=f"No se puede enviar el mensaje. El bot no está autenticado (Estado actual: {bot_state['status']})."
        )
        
    page = pw_resources["page"]
    if not page:
        raise HTTPException(status_code=500, detail="Recursos del navegador no inicializados.")

    # Formatear el número de teléfono
    # Quitamos espacios, guiones y aseguramos el prefijo de país por defecto (51 para Perú si tiene 9 dígitos)
    number = payload.number.replace(" ", "").replace("-", "").replace("+", "")
    if len(number) == 9:
        number = "51" + number

    async with pw_resources["lock"]:
        try:
            print(f"🚀 Procesando envío de WhatsApp a {number}...")
            encoded_text = urllib.parse.quote(payload.message)
            send_url = f"https://web.whatsapp.com/send?phone={number}&text={encoded_text}"
            
            # Navegar al link de envío directo
            await page.goto(send_url, wait_until="domcontentloaded", timeout=45000)
            
            # Esperar a que aparezca el botón de enviar o el input cargado
            # Los selectores en WhatsApp Web cambian rara vez, pero 'span[data-icon="send"]' o el botón con el ícono es el estándar
            send_btn_selector = 'span[data-icon="send"]'
            
            # Esperar a que cargue la burbuja de chat o el botón de envío
            # Esto puede tomar unos segundos debido a la sincronización de WhatsApp Web
            try:
                await page.wait_for_selector(send_btn_selector, timeout=20000)
            except Exception:
                # Intento de respaldo: el input de texto del chat
                # A veces el texto ya se precarga y solo hace falta dar 'Enter' en el elemento editable
                input_selector = 'div[contenteditable="true"]'
                await page.wait_for_selector(input_selector, timeout=10000)
                await page.keyboard.press("Enter")
                print("✓ Mensaje disparado usando 'Enter' como respaldo.")
                await asyncio.sleep(3)
                return {"status": "success", "sent": True, "message": "Mensaje enviado via Enter"}

            # Si el botón de enviar está visible, darle click
            await page.click(send_btn_selector)
            print(f"✓ ¡Mensaje enviado con éxito por botón a {number}!")
            
            # Esperar un par de segundos para garantizar que el mensaje se transmita antes de cambiar de página
            await asyncio.sleep(3)
            return {"status": "success", "sent": True}
            
        except Exception as e:
            print(f"❌ Error al enviar mensaje a {number}: {str(e)}")
            # Intentar volver a la pestaña limpia de inicio para no dejar la pantalla rota
            try:
                await page.goto("https://web.whatsapp.com", wait_until="domcontentloaded", timeout=15000)
            except Exception:
                pass
            raise HTTPException(status_code=500, detail=f"No se pudo completar el envío del mensaje: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    # Iniciamos el servidor en el puerto estándar 8000 de forma local
    print("🚀 Iniciando servidor FastAPI local de pruebas en el puerto 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
