import React, { useState } from 'react';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, MessageSquare } from 'lucide-react';
import { useSiteSettings } from '../lib/SiteSettingsContext';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'card'>('yape');
  const [district, setDistrict] = useState('lima');
  const [address, setAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    id: string;
    total: number;
    paymentMethod: 'yape' | 'card';
    customerName: string;
    customerPhone: string;
    items: any[];
    shippingInfo: { district: string; address: string };
  } | null>(null);

  React.useEffect(() => {
    if (user) {
      setCustomerName(user.displayName || profile?.name || '');
    }
  }, [user, profile]);

  if (!user && items.length > 0 && !orderComplete) {
    navigate('/cart');
    return null;
  }

  const shippingCost = district === 'lima' ? 10 : 20;
  const finalTotal = total + shippingCost;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProcessing(true);

    try {
      const orderRef = doc(collection(db, 'orders'));
      const orderId = orderRef.id;
      const orderData = {
        userId: user.uid,
        customerEmail: user.email,
        customerName: customerName,
        customerPhone: customerPhone,
        paymentVerified: false,
        items: items,
        total: finalTotal,
        status: 'pending',
        paymentMethod: paymentMethod,
        shippingInfo: { district, address },
        createdAt: serverTimestamp()
      };
      
      await setDoc(orderRef, orderData);

      // Si las notificaciones de Telegram están activas, enviar la alerta por bot
      if (settings?.telegramEnabled && settings?.telegramBotToken && settings?.telegramChatId) {
        try {
          const messageText = `🌿 *¡Nueva compra recibida en Sánori!* 🌿\n\n` +
            `*ID del Pedido:* \`${orderId}\`\n` +
            `*Cliente:* ${customerName}\n` +
            `*Contacto:* ${customerPhone} (${user.email || 'No proporcionado'})\n` +
            `*Método:* ${paymentMethod === 'yape' ? 'Yape 🟣' : 'Tarjeta de Crédito/Débito 💳'}\n` +
            `*Destino:* ${address} (${district === 'lima' ? 'Lima Metropolitana' : 'Provincia'})\n` +
            `*Total:* S/ ${finalTotal.toFixed(2)}\n\n` +
            `*Detalles del pedido:*\n` +
            items.map(item => `- ${item.name} (x${item.quantity}) - S/ ${(item.price * item.quantity).toFixed(2)}`).join('\n');

          const telegramUrl = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
          
          fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: settings.telegramChatId,
              text: messageText,
              parse_mode: 'Markdown'
            })
          }).catch(err => console.error("Error enviando notificación a Telegram:", err));
        } catch (teleError) {
          console.error("Error al construir el mensaje de Telegram:", teleError);
        }
      }

      // Si las notificaciones de WhatsApp Automatizadas están activas, enviar la alerta al cliente
      if (settings?.whatsappEnabled && settings?.whatsappApiUrl) {
        try {
          const clientMessageText = `🌿 *Sánori - Compra Recibida* 🌿\n\n` +
            `¡Hola *${customerName}*! Muchas gracias por tu compra en Sánori.\n\n` +
            `*ID de tu Pedido:* \`${orderId}\`\n` +
            `*Total a pagar:* S/ ${finalTotal.toFixed(2)}\n` +
            `*Método:* ${paymentMethod === 'yape' ? 'Yape (Recuerda enviar tu captura por aquí)' : 'Tarjeta de Crédito/Débito'}\n` +
            `*Dirección:* ${address} (${district === 'lima' ? 'Lima Metropolitana' : 'Provincia'})\n\n` +
            `*Detalles del pedido:*\n` +
            items.map(item => `- ${item.name} (${item.quantity} un.)`).join('\n') + `\n\n` +
            `Estamos preparando todo con mucho cariño. ¡Gracias por apostar por la cosmética viva! 🌸`;

          // Formatear teléfono
          let cleanPhone = customerPhone.replace(/\D/g, '');
          if (cleanPhone.length === 9) {
            cleanPhone = '51' + cleanPhone; // Prefijo de Perú por defecto
          }

          const whatsappBody = {
            number: cleanPhone,
            message: clientMessageText,
            token: settings.whatsappToken || '',
            session: settings.whatsappSession || 'sanori'
          };
          
          fetch(settings.whatsappApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(whatsappBody)
          }).catch(err => console.error("Error enviando notificación WhatsApp:", err));
        } catch (wsError) {
          console.error("Error al construir mensaje de WhatsApp:", wsError);
        }
      }

      setCompletedOrder({
        id: orderId,
        total: finalTotal,
        paymentMethod: paymentMethod,
        customerName: customerName,
        customerPhone: customerPhone,
        items: [...items],
        shippingInfo: { district, address }
      });

      clearCart();
      setOrderComplete(true);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Hubo un error procesando tu pedido.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyId = () => {
    if (completedOrder) {
      navigator.clipboard.writeText(completedOrder.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getWhatsAppMessage = () => {
    if (!completedOrder) return '';
    const itemsText = completedOrder.items.map(item => `- ${item.name} (x${item.quantity})`).join('\n');
    const message = `¡Hola Sánori! Acabo de realizar mi compra.\n\n*ID del Pedido:* ${completedOrder.id}\n*Total:* S/ ${completedOrder.total.toFixed(2)}\n*Método:* ${completedOrder.paymentMethod === 'yape' ? 'Yape' : 'Tarjeta'}\n\n*Detalles del Pedido:*\n${itemsText}\n\n*Envío:* ${completedOrder.shippingInfo.address} (${completedOrder.shippingInfo.district === 'lima' ? 'Lima' : 'Provincia'})\n*Cliente:* ${completedOrder.customerName}\n*Contacto:* ${completedOrder.customerPhone}\n\nAquí adjunto mi captura de pantalla del pago.`;
    return encodeURIComponent(message);
  };

  if (orderComplete && completedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-in fade-in">
        <div className="bg-kraft-light/25 border border-kraft rounded-md p-8 md:p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-nativa text-offwhite rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif text-earth mb-2">¡Pedido Recibido Exitosamente!</h1>
          <p className="text-earth-light mb-8 max-w-lg mx-auto">Gracias por tu compra consciente y natural en Sánori. Tu orden ha sido registrada en nuestro sistema.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left border-y border-kraft/60 py-8 my-8">
            <div>
              <h3 className="font-serif text-earth text-lg mb-3">Información de Pedido</h3>
              <div className="space-y-2 text-sm text-earth-light">
                <p className="flex items-center gap-2">
                  <span className="font-medium text-earth">ID:</span> 
                  <span className="font-mono bg-offwhite px-2 py-0.5 rounded border border-kraft/50 text-xs">
                    {completedOrder.id}
                  </span>
                  <button onClick={handleCopyId} className="hover:text-nativa transition" title="Copiar ID">
                    {copied ? <Check className="w-4 h-4 text-nativa" /> : <Copy className="w-4 h-4" />}
                  </button>
                </p>
                <p><span className="font-medium text-earth">Método de Pago:</span> <span className="capitalize">{completedOrder.paymentMethod}</span></p>
                <p><span className="font-medium text-earth">Total del Pedido:</span> S/ {completedOrder.total.toFixed(2)}</p>
                <p><span className="font-medium text-earth">Destino:</span> {completedOrder.shippingInfo.address} ({completedOrder.shippingInfo.district === 'lima' ? 'Lima' : 'Provincia'})</p>
              </div>
            </div>

            <div>
              {completedOrder.paymentMethod === 'yape' ? (
                <div className="bg-nativa/5 border border-nativa/30 rounded p-4">
                  <h3 className="font-serif text-nativa text-base font-bold mb-2 flex items-center gap-2">
                    🟣 Instrucciones de Pago Yape
                  </h3>
                  <ol className="text-xs text-earth-light space-y-2 list-decimal list-inside">
                    <li>Abre tu aplicación Yape.</li>
                    <li>Saca captura o yapea directamente al número: <strong className="text-earth font-mono">999 999 999</strong></li>
                    <li>Envíanos tu comprobante por WhatsApp presionando el botón de abajo. ¡Listo!</li>
                  </ol>
                  
                  <a 
                    href={`https://wa.me/51999999999?text=${getWhatsAppMessage()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-2 px-4 rounded-sm font-medium transition text-xs uppercase tracking-wider"
                  >
                    <MessageSquare className="w-4 h-4" /> Enviar Comprobante por WhatsApp
                  </a>
                </div>
              ) : (
                <div className="bg-earth/5 border border-earth/20 rounded p-4">
                  <h3 className="font-serif text-earth text-sm font-bold mb-1">
                    💳 Transacción con Tarjeta
                  </h3>
                  <p className="text-xs text-earth-light leading-relaxed mb-3">
                    Tu pago con tarjeta ha sido registrado. Validaremos la transacción bancaria de inmediato y procederemos con la elaboración/empaquetado de tu pedido.
                  </p>
                  <p className="text-xs text-kraft accent-nativa">
                    No necesitas realizar ninguna acción adicional. Nos comunicaremos contigo directamente de ser necesario.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="text-left bg-offwhite/50 border border-kraft/45 rounded p-4 mb-8">
            <h4 className="font-serif text-earth text-sm mb-3 font-bold">Resumen de Productos</h4>
            <div className="divide-y divide-kraft/20 max-h-40 overflow-y-auto">
              {completedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 text-xs">
                  <span className="text-earth-light">{item.name} <strong className="text-kraft">x{item.quantity}</strong></span>
                  <span className="font-medium text-earth">S/ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/tienda')} className="bg-earth hover:bg-earth-light text-offwhite px-8 py-3 rounded-sm uppercase tracking-widest text-xs transition">
              Volver a la Tienda
            </button>
            <button onClick={() => navigate('/')} className="bg-transparent border border-kraft text-earth hover:bg-kraft/10 px-8 py-3 rounded-sm uppercase tracking-widest text-xs transition">
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in">
      <h1 className="text-3xl font-serif text-earth mb-8">Finalizar Pedido</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            <div className="bg-kraft-light/30 p-6 border border-kraft rounded-sm">
              <h2 className="text-xl font-serif text-earth mb-4">1. Datos de Envío</h2>
              {profile && <p className="mb-4 text-sm text-earth-light">Email: {profile.email}</p>}
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-earth-light mb-2">Nombre Completo</label>
                    <input 
                      type="text" 
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Juan Pérez"
                      className="w-full bg-offwhite border border-kraft focus:border-nativa outline-none p-3 rounded-sm text-earth placeholder:text-kraft text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-earth-light mb-2">Teléfono / WhatsApp</label>
                    <input 
                      type="tel" 
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="999 999 999"
                      className="w-full bg-offwhite border border-kraft focus:border-nativa outline-none p-3 rounded-sm text-earth placeholder:text-kraft text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-earth-light mb-2">Región de Envío</label>
                  <select 
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-offwhite border border-kraft focus:border-nativa outline-none p-3 rounded-sm text-earth text-sm"
                  >
                    <option value="lima">Lima Metropolitana</option>
                    <option value="provincia">Provincia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-earth-light mb-2">Dirección Completa</label>
                  <input 
                    type="text" 
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Principal 123, Dpto 4"
                    className="w-full bg-offwhite border border-kraft focus:border-nativa outline-none p-3 rounded-sm text-earth placeholder:text-kraft"
                  />
                </div>
              </div>
            </div>

            <div className="bg-kraft-light/30 p-6 border border-kraft rounded-sm">
              <h2 className="text-xl font-serif text-earth mb-4">2. Método de Pago</h2>
              
              <div className="space-y-4">
                <label className={`flex items-center p-4 border rounded-sm cursor-pointer transition-colors ${paymentMethod === 'yape' ? 'border-nativa bg-nativa/10' : 'border-kraft bg-offwhite'}`}>
                  <input type="radio" value="yape" checked={paymentMethod === 'yape'} onChange={() => setPaymentMethod('yape')} className="mr-3 accent-nativa" />
                  <span className="font-medium text-earth">Yape</span>
                </label>
                
                {paymentMethod === 'yape' && (
                  <div className="pl-8 pr-4 text-sm text-earth-light">
                    QR o número (+51 999 999 999). Serás contactado para confirmar la captura de pantalla de tu pago.
                  </div>
                )}

                <label className={`flex items-center p-4 border rounded-sm cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-nativa bg-nativa/10' : 'border-kraft bg-offwhite'}`}>
                  <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="mr-3 accent-nativa" />
                  <span className="font-medium text-earth">Tarjeta de Crédito / Débito</span>
                </label>

                {paymentMethod === 'card' && (
                  <div className="pl-8 pr-4 space-y-3">
                    <input type="text" placeholder="Número de Tarjeta" className="w-full bg-offwhite border border-kraft outline-none p-3 rounded-sm text-sm" />
                    <div className="flex gap-3">
                      <input type="text" placeholder="MM/YY" className="w-1/2 bg-offwhite border border-kraft outline-none p-3 rounded-sm text-sm" />
                      <input type="text" placeholder="CVC" className="w-1/2 bg-offwhite border border-kraft outline-none p-3 rounded-sm text-sm" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={processing || items.length === 0}
              className="w-full bg-earth hover:bg-earth-light text-offwhite py-4 rounded-sm transition uppercase tracking-widest text-sm disabled:opacity-50"
            >
              {processing ? 'Procesando...' : `Pagar S/ ${finalTotal.toFixed(2)}`}
            </button>
          </form>
        </div>

        <div>
          <div className="bg-offwhite p-6 border border-kraft rounded-sm sticky top-28">
            <h2 className="font-serif text-xl text-earth mb-6 border-b border-kraft pb-4">Tu Pedido</h2>
            
            {items.some(item => item.status === 'in_production') && (
              <div className="mb-6 p-4 bg-kraft/10 border border-kraft rounded-sm text-sm text-earth">
                <span className="font-bold flex items-center gap-2 mb-1">
                  ⚠️ Productos en Producción
                </span>
                Algunos productos de tu pedido (u todo el pedido) son lotes en producción. Te contactaremos cuando estén listos para el envío.
              </div>
            )}

            <div className="space-y-4 mb-6 hidden md:block">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 bg-kraft-light rounded-sm overflow-hidden flex-shrink-0 relative">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                    {item.status === 'in_production' && (
                      <div className="absolute inset-x-0 bottom-0 bg-kraft text-white text-[8px] uppercase text-center font-bold">Reserva</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-earth line-clamp-1">{item.name}</p>
                    <p className="text-kraft">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-medium">S/ {(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-earth-light">
                <span>Subtotal</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-earth-light">
                <span>Envío Domicilio</span>
                <span>S/ {shippingCost.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-kraft flex justify-between font-medium text-earth text-lg mt-4">
                <span>Total</span>
                <span>S/ {finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
