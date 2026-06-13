import { useCart } from '../lib/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useAuth, loginWithGoogle } from '../lib/firebase';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      // Force login before checkout
      loginWithGoogle().then(() => {
        navigate('/checkout');
      }).catch(err => console.error(err));
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in">
      <h1 className="text-3xl font-serif text-earth mb-8">Tu Canasta Consciente</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-kraft-light/30 border border-kraft rounded-sm">
          <p className="text-earth-light mb-6">Aún no has seleccionado ningún producto.</p>
          <Link to="/tienda" className="inline-block bg-nativa text-offwhite px-6 py-3 rounded-sm hover:bg-nativa-light transition uppercase text-sm tracking-wider font-medium">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border border-kraft rounded-sm bg-offwhite">
                <div className="w-24 h-24 bg-kraft-light rounded-sm overflow-hidden flex-shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-kraft"></div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-serif text-lg text-earth">{item.name}</h3>
                      <p className="text-nativa text-xs uppercase tracking-wider">{item.category}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-earth-light hover:text-nativa transition-colors p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-3 border border-kraft rounded-sm px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-earth hover:text-nativa"><Minus size={16} /></button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-earth hover:text-nativa"><Plus size={16} /></button>
                    </div>
                    <div className="font-medium text-earth">
                      S/ {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-kraft-light/30 p-6 border border-kraft rounded-sm h-fit">
            <h2 className="font-serif text-xl text-earth mb-6 border-b border-kraft pb-4">Resumen de Pedido</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-earth-light">
                <span>Subtotal</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-earth-light">
                <span>Envío</span>
                <span className="text-xs self-center text-mustard">Calculado en checkout</span>
              </div>
              <div className="pt-4 border-t border-kraft flex justify-between font-medium text-earth text-lg">
                <span>Total estimado</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="w-full bg-earth hover:bg-earth-light text-offwhite py-4 rounded-sm transition flex justify-center items-center gap-2 uppercase tracking-widest text-sm"
            >
              Iniciar Pago <ArrowRight size={18} />
            </button>
            <p className="text-center text-xs text-earth-light mt-4">
              {user ? 'Proceder a elegir método de pago.' : 'Inicia sesión con Google para pagar más rápido.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
