import { Link } from "react-router-dom";
import { ArrowRight, Leaf, ShoppingBag, Sparkles, Droplets, Heart } from "lucide-react";
import { useSiteSettings } from "../lib/SiteSettingsContext";
import { motion } from "motion/react";
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Product, useCart } from "../lib/CartContext";

export default function Home() {
  const { settings, loading } = useSiteSettings();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Product[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Product);
      });
      setFeaturedProducts(data.slice(0, 8));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="animate-in fade-in duration-700 bg-background overflow-clip relative selection:bg-mustard selection:text-earth">
      
      {/* Immersive Editorial Hero */}
      <section className="relative min-h-[calc(100vh-80px)] md:min-h-[85vh] w-full flex items-center overflow-hidden mb-12 rounded-b-[2rem] md:rounded-b-[3rem] shadow-2xl">
        <div className="absolute inset-0 w-full h-full bg-earth">
          {settings?.heroImageUrl && (
            <img 
              src={settings.heroImageUrl} 
              alt="Cuidado Natural" 
              className="w-full h-full object-cover"
            />
          )}
          {/* Overlays for contrast */}
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-earth/90 via-earth/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-earth/80 via-transparent to-transparent md:hidden"></div>
        </div>

        <div className="relative z-10 w-full max-w-[100rem] mx-auto px-6 md:px-12 lg:px-20 pb-12 pt-24 md:pt-32 flex flex-col items-start justify-center h-full">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/10 text-mustard font-bold tracking-[0.3em] uppercase text-xs mb-6 px-4 py-2 rounded-full shadow-lg">
              <Sparkles size={14} className="text-mustard" /> Cosmética Holística
            </span>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-brand text-offwhite leading-[0.9] mb-6 tracking-tight drop-shadow-2xl">
              Sana tu <br />
              <span className="text-mustard font-hand italic font-normal text-6xl sm:text-8xl lg:text-[9rem] leading-none">piel,</span><br/>
              nutre tu ser.
            </h1>
            <p className="text-lg md:text-xl text-offwhite/90 font-light max-w-md mb-8 md:mb-10 leading-relaxed drop-shadow-md">
              Formulaciones botánicas inspiradas en la sabiduría de nuestra tierra para un cuidado consciente y vivo.
            </p>
            <Link
              to="/tienda"
              className="inline-flex items-center gap-4 bg-mustard text-earth px-8 py-4 rounded-full uppercase tracking-widest font-bold text-xs hover:bg-offwhite hover:text-earth transition-all duration-300 group shadow-2xl hover:shadow-mustard/20 hover:-translate-y-1"
            >
              Explorar Colección <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Marquee / Banner */}
      <section className="w-full bg-earth text-mustard-light py-8 overflow-hidden mt-10 md:mt-20 flex whitespace-nowrap">
        <motion.div 
          animate={{ x: [0, -1000] }} 
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex space-x-12 items-center text-xl lg:text-2xl font-brand uppercase tracking-widest"
        >
          {Array(10).fill("· Belleza Consciente · Sabiduría Botánica · Ingredientes Puros ").map((text, i) => (
            <span key={i}>{text}</span>
          ))}
        </motion.div>
      </section>

      {/* Retail Style Categories */}
      <section className="py-16 px-4 sm:px-6 md:px-12 max-w-[100rem] mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-earth font-brand text-3xl md:text-4xl mb-3">Nuestras Categorías</h2>
          <div className="w-16 h-1 bg-nativa mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto">
          {/* Category 1 */}
          <Link to="/tienda?q=Sólidos" className="group flex flex-col items-center text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-4 border-4 border-mustard/30 group-hover:border-nativa bg-offwhite flex items-center justify-center transition-colors shadow-lg relative text-earth group-hover:text-nativa">
              <Sparkles size={40} className="sm:w-16 sm:h-16 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h4 className="font-brand text-earth text-lg md:text-xl group-hover:text-nativa transition-colors">Cuidado Capilar</h4>
            <p className="text-xs text-earth/60 hidden sm:block mt-1">Shampoos Sólidos</p>
          </Link>
          
          {/* Category 2 */}
          <Link to="/tienda?q=Jabones" className="group flex flex-col items-center text-center">
             <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-4 border-4 border-mustard/30 group-hover:border-nativa bg-offwhite flex items-center justify-center transition-colors shadow-lg relative text-earth group-hover:text-nativa">
              <Droplets size={40} className="sm:w-16 sm:h-16 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h4 className="font-brand text-earth text-lg md:text-xl group-hover:text-nativa transition-colors">Jabones Naturales</h4>
            <p className="text-xs text-earth/60 hidden sm:block mt-1">Hechos a mano</p>
          </Link>

          {/* Category 3 */}
          <Link to="/tienda?q=Aromaterapia" className="group flex flex-col items-center text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-4 border-4 border-mustard/30 group-hover:border-nativa bg-offwhite flex items-center justify-center transition-colors shadow-lg relative text-earth group-hover:text-nativa">
              <Leaf size={40} className="sm:w-16 sm:h-16 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h4 className="font-brand text-earth text-lg md:text-xl group-hover:text-nativa transition-colors">Aromaterapia</h4>
            <p className="text-xs text-earth/60 hidden sm:block mt-1">Aceites y Blends</p>
          </Link>
          
          {/* Category 4 */}
          <Link to="/tienda" className="group flex flex-col items-center text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-4 border-4 border-mustard/30 group-hover:border-nativa transition-colors shadow-lg relative bg-earth flex items-center justify-center">
               <ArrowRight size={32} className="text-offwhite group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="font-brand text-earth text-lg md:text-xl group-hover:text-nativa transition-colors">Ver Todo</h4>
            <p className="text-xs text-earth/60 hidden sm:block mt-1">Catálogo Completo</p>
          </Link>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="py-16 relative overflow-hidden bg-background">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
            <div>
              <h2 className="text-earth font-brand text-3xl md:text-4xl mb-3 flex items-center gap-3">
                <Sparkles className="text-mustard" />
                Ofertas Destacadas
              </h2>
              <div className="w-16 h-1 bg-nativa rounded-full"></div>
            </div>
            <Link to="/tienda" className="bg-mustard text-earth px-6 py-3 rounded-full hover:bg-nativa hover:text-white transition-colors uppercase tracking-widest text-xs font-bold shadow-lg">
              Ver Catálogo Completo
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <div key={product.id} className="bg-white rounded-[2rem] p-4 sm:p-6 border border-earth/5 shadow-xl shadow-earth/5 hover:-translate-y-2 transition-transform duration-500 group relative flex flex-col">
                <Link to={`/producto/${product.id}`} className="flex-1 flex flex-col">
                  {/* Badges/Stickers */}
                  {product.status === 'in_production' ? (
                     <span className="absolute top-4 left-4 z-10 bg-kraft text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-md">
                       En Producción
                     </span>
                  ) : product.stock <= 0 ? (
                     <span className="absolute top-4 left-4 z-10 bg-earth text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-md">
                       Agotado
                     </span>
                  ) : index < 4 && (
                     <span className="absolute top-4 left-4 z-10 bg-nativa text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-md">
                       OFERTA -20%
                     </span>
                  )}
                  
                  <div className="aspect-square rounded-[1.5rem] overflow-hidden mb-4 relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-earth-light text-sm italic bg-offwhite">Sin imagen</div>
                    )}
                  </div>
                  
                  <div className="text-[10px] text-nativa uppercase tracking-[0.2em] mb-1 font-medium">{product.category}</div>
                  <h3 className="font-brand text-xl sm:text-2xl text-earth mb-3 line-clamp-2 h-[3.5rem] group-hover:text-kraft transition-colors">{product.name}</h3>
                </Link>
                
                <div className="flex items-end justify-between mt-auto pt-2">
                  <div className="flex flex-col">
                    {index < 4 && (
                      <span className="text-earth/40 line-through text-xs mb-1">
                        S/ {(product.price * 1.2).toFixed(2)}
                      </span>
                    )}
                    <span className="text-earth font-bold text-xl sm:text-2xl">
                      S/ {product.price.toFixed(2)}
                    </span>
                  </div>
                  {(product.stock > 0 || product.status === 'in_production') && (
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }}
                      className="w-12 h-12 rounded-full bg-earth text-mustard flex items-center justify-center hover:bg-kraft hover:text-white transition-colors shadow-lg shrink-0"
                    >
                      <ShoppingBag size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community / Workshops Promo */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto text-center relative min-h-[80vh] flex flex-col justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl opacity-5 pointer-events-none -z-10">
           <Leaf className="w-full h-full text-nativa" />
        </div>
        <h2 className="text-nativa font-bold tracking-[0.3em] uppercase text-xs mb-4">Comunidad Sánori</h2>
        <h3 className="text-4xl md:text-5xl lg:text-6xl font-brand text-earth mb-8 max-w-3xl mx-auto">
          Más que cosmética, un estilo de vida consciente
        </h3>
        <p className="text-earth/70 text-lg font-light max-w-2xl mx-auto mb-12">
          Aprende con nosotros a través de nuestros talleres presenciales y nuestro blog donde compartimos saberes ancestrales sobre plantas y autocuidado.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link to="/talleres" className="bg-earth text-white px-8 py-4 rounded-full uppercase tracking-widest font-bold text-xs hover:bg-nativa transition-colors">
            Ver Talleres
          </Link>
          <Link to="/blog" className="bg-transparent border border-earth/20 text-earth px-8 py-4 rounded-full uppercase tracking-widest font-bold text-xs hover:border-nativa hover:text-nativa transition-colors">
            Leer el Blog
          </Link>
        </div>
      </section>
      
    </div>
  );
}
