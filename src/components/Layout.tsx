import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Leaf, Rabbit, Heart, ShieldCheck, Sprout, MessageCircle } from 'lucide-react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-nativa selection:text-offwhite">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-[#3e332c] dark:bg-kraft-light text-kraft-light dark:text-earth/90 py-16 mt-auto border-t border-earth-light/20 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-nativa/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="font-brand text-3xl mb-4 text-offwhite dark:text-earth">sánori</h3>
            <p className="text-kraft dark:text-earth/80 font-light leading-relaxed">Productos 100% naturales, botica intencionada y cosmética consciente. Curados para todo el Perú y el mundo.</p>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-offwhite dark:text-earth uppercase tracking-wider text-xs">Enlaces</h4>
            <ul className="space-y-3 font-light text-kraft/80 dark:text-earth/70">
              <li><Link to="/tienda" className="hover:text-nativa transition-colors">Catálogo Virtual</Link></li>
              <li><Link to="/nosotros" className="hover:text-nativa transition-colors">Sobre Nosotros</Link></li>
              <li><Link to="/cart" className="hover:text-nativa transition-colors">Carrito</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-offwhite dark:text-earth uppercase tracking-wider text-xs">Atención al Cliente</h4>
            <ul className="space-y-3 font-light text-kraft/80 dark:text-earth/70">
              <li><a href="#" className="hover:text-nativa transition-colors">Envíos (Delivery a todo el Perú)</a></li>
              <li><a href="#" className="hover:text-nativa transition-colors">Métodos de Pago</a></li>
              <li><a href="#" className="hover:text-nativa transition-colors">Términos y Condiciones</a></li>
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 py-8 border-t border-earth-light/10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-nativa/10 dark:bg-nativa/20 flex items-center justify-center text-nativa">
                <Leaf className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-xs font-medium text-offwhite dark:text-earth uppercase tracking-wider">100% Natural</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-nativa/10 dark:bg-nativa/20 flex items-center justify-center text-nativa">
                <Rabbit className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-xs font-medium text-offwhite dark:text-earth uppercase tracking-wider">Cruelty Free</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-nativa/10 dark:bg-nativa/20 flex items-center justify-center text-nativa">
                <Heart className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-xs font-medium text-offwhite dark:text-earth uppercase tracking-wider">Hecho a Mano</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-nativa/10 dark:bg-nativa/20 flex items-center justify-center text-nativa">
                <Sprout className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-xs font-medium text-offwhite dark:text-earth uppercase tracking-wider">Eco Sostenible</span>
            </div>
            <div className="flex flex-col items-center gap-3 col-span-2 md:col-span-1">
              <div className="w-12 h-12 rounded-full bg-nativa/10 dark:bg-nativa/20 flex items-center justify-center text-nativa">
                <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-xs font-medium text-offwhite dark:text-earth uppercase tracking-wider">Compra Segura</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pt-8 border-t border-earth-light/20 text-center text-kraft/60 dark:text-earth/50 text-xs font-light tracking-wide">
          &copy; {new Date().getFullYear()} sánori. Todos los derechos reservados.
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/51999999999" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 hover:shadow-2xl hover:shadow-[#25D366]/40 transition-all duration-300 flex items-center justify-center group"
      >
        <MessageCircle size={28} className="drop-shadow-sm" />
        <span className="absolute -top-10 -left-6 bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          ¿Necesitas ayuda?
        </span>
      </a>
    </div>
  );
}
