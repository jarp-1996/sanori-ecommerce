import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Product, useCart } from "../lib/CartContext";
import { motion } from "motion/react";
import { ArrowLeft, ShoppingBag, Leaf, Droplets, Sparkles, ShieldCheck } from "lucide-react";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-earth/20 border-t-mustard rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-background text-earth">
        <h2 className="text-4xl font-brand mb-4">Producto no encontrado</h2>
        <p className="text-earth/70 mb-8 max-w-md text-center">No hemos podido encontrar el producto que buscas. Es posible que haya sido retirado o el enlace sea incorrecto.</p>
        <Link to="/tienda" className="bg-earth text-offwhite px-8 py-3 rounded-full uppercase tracking-widest text-xs font-bold hover:bg-kraft transition-colors">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 selection:bg-mustard selection:text-earth">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link to="/tienda" className="inline-flex items-center gap-2 text-earth hover:text-kraft transition-colors font-medium text-sm mb-12">
          <ArrowLeft size={16} /> Volver a la Tienda
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Product Image */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden aspect-[4/5] sm:aspect-square relative flex items-center justify-center p-8 shadow-xl border border-earth/5">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-contain max-h-[80%] hover:scale-105 transition-transform duration-700" 
                />
              ) : (
                <Leaf size={64} className="text-earth/10" />
              )}
              {/* Floating badges */}
              <div className="absolute top-6 right-6 flex flex-col gap-2">
                <span className="bg-nativa text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                  100% Natural
                </span>
              </div>
            </div>
          </motion.div>
          
          {/* Product Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col md:py-10"
          >
            <div className="mb-2">
              <span className="text-xs uppercase tracking-[0.2em] text-mustard font-bold">{product.category}</span>
              {product.status === 'in_production' ? (
                <span className="bg-kraft text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ml-auto">
                  En Producción
                </span>
              ) : product.stock <= 0 ? (
                <span className="bg-earth text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ml-auto">
                  Agotado
                </span>
              ) : null}
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-brand text-earth leading-tight mb-4">{product.name}</h1>
            
            <div className="text-2xl font-medium text-earth mb-8">S/ {product.price.toFixed(2)}</div>
            
            <p className="text-earth/80 leading-relaxed mb-10 text-lg font-light">
              {product.description}
            </p>
            
            {/* Action Area */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-earth/10 shadow-sm mb-10">
              {product.stock > 0 || product.status === 'in_production' ? (
                <>
                  {product.status === 'in_production' && (
                    <div className="mb-6 p-4 bg-kraft/10 border border-kraft/20 rounded-xl text-sm justify-between text-earth flex gap-3">
                      <div className="font-medium">⚠️ Lote en producción</div>
                      <div className="text-earth/80">Puedes reservar tu pedido. Te avisaremos apenas el nuevo lote esté listo para envío.</div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex bg-background rounded-full border border-earth/10 w-full sm:w-32 h-14">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-1/3 flex items-center justify-center text-earth hover:text-nativa transition-colors"
                      >-</button>
                      <div className="w-1/3 flex items-center justify-center font-medium text-earth">{quantity}</div>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-1/3 flex items-center justify-center text-earth hover:text-nativa transition-colors"
                      >+</button>
                    </div>
                    
                    <button 
                      onClick={() => {
                        for(let i=0; i<quantity; i++) addToCart(product);
                      }}
                      className="w-full h-14 bg-earth text-offwhite rounded-full flex items-center justify-center gap-3 hover:bg-mustard hover:text-earth transition-all shadow-md group uppercase tracking-widest text-xs font-bold"
                    >
                      <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" /> 
                      Añadir al carrito
                    </button>
                  </div>
                  <p className="text-xs text-center text-earth/50 mt-4 leading-relaxed">Envío gratis en compras mayores a S/ 150.</p>
                </>
              ) : (
                <div className="w-full py-6 text-center text-earth/60 font-medium uppercase tracking-widest text-sm bg-background rounded-xl border border-earth/10">
                  Producto Agotado
                </div>
              )}
            </div>
            
            {/* Features (Static for demo, could be dynamic depending on product) */}
            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-earth/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-nativa/10 flex items-center justify-center flex-shrink-0 text-nativa">
                  <Leaf size={16} />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-earth">Ingredientes Limpios</p>
                  <p className="text-earth/60 text-xs">Sin parabenos ni sulfatos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-mustard/20 flex items-center justify-center flex-shrink-0 text-mustard-light">
                  <Droplets size={16} className="text-mustard" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-earth">Hidratación Profunda</p>
                  <p className="text-earth/60 text-xs">Manteca de karité, aceites</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-earth/10 flex items-center justify-center flex-shrink-0 text-earth">
                  <Sparkles size={16} />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-earth">Hecho a Mano</p>
                  <p className="text-earth/60 text-xs">Procesos artesanales</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-kraft/10 flex items-center justify-center flex-shrink-0 text-kraft">
                  <ShieldCheck size={16} />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-earth">Cruelty Free</p>
                  <p className="text-earth/60 text-xs">No probado en animales</p>
                </div>
              </div>
            </div>
            
          </motion.div>
        </div>
      </div>
    </div>
  );
}
