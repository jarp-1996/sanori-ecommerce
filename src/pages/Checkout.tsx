import React, { useState } from 'react';
import { useCart } from '../lib/CartContext';
import { useAuth } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'card'>('yape');
  const [district, setDistrict] = useState('lima');
  const [address, setAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

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
      await setDoc(orderRef, {
        userId: user.uid,
        customerEmail: user.email,
        items: items,
        total: finalTotal,
        status: 'pending',
        paymentMethod: paymentMethod,
        shippingInfo: { district, address },
        createdAt: serverTimestamp()
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

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-nativa text-offwhite rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-serif text-earth mb-4">¡Pedido Recibido!</h1>
        <p className="text-earth-light mb-8">Gracias por tu compra consciente. Procesaremos tu pedido en breve y lo enviaremos con el mayor cuidado.</p>
        <button onClick={() => navigate('/tienda')} className="bg-earth text-offwhite px-8 py-3 rounded-sm uppercase tracking-widest text-sm">
          Volver a la Tienda
        </button>
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
                <div>
                  <label className="block text-xs uppercase tracking-widest text-earth-light mb-2">Región de Envío</label>
                  <select 
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-offwhite border border-kraft focus:border-nativa outline-none p-3 rounded-sm text-earth"
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
