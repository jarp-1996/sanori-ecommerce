import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, useCart } from '../lib/CartContext';
import { ShoppingBag, ChevronDown } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';

const CATEGORIES = [
  "Jabones Intencionados",
  "Cuidado del cabello (Sólidos)",
  "Aromaterapia",
  "Cuidado personal"
];

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('a-z');
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Product[] = [];
      snapshot.forEach(doc => {
        const docData = doc.data();
        data.push({ id: doc.id, ...docData } as Product);
      });
      setProducts(data);
      setLoading(false);
      
      // If there's a category in the URL search params, try to set the active category
      if (searchQuery) {
        const matchingCat = CATEGORIES.find(c => c.toLowerCase() === searchQuery.toLowerCase());
        if (matchingCat) {
          setActiveCategory(matchingCat);
          // Optional: clear the query so the search doesn't also filter by text unnecessarily if it's an exact category match
        }
      }
    }, (error) => {
      console.error("Error fetching products", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [searchQuery]);

  const categories = ['all', ...CATEGORIES];
  
  const filteredAndSortedProducts = useMemo(() => {
    // 1. Filter
    let filtered = products.filter(p => {
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchesSearch = !searchQuery || 
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      if (sortOption === 'a-z') {
        return a.name.localeCompare(b.name);
      } else if (sortOption === 'z-a') {
        return b.name.localeCompare(a.name);
      } else if (sortOption === 'price-asc') {
        return a.price - b.price;
      } else if (sortOption === 'price-desc') {
        return b.price - a.price;
      }
      return 0;
    });

    return filtered;
  }, [products, activeCategory, searchQuery, sortOption]);

  return (
    <div className="animate-in fade-in duration-700 max-w-[100rem] mx-auto px-6 lg:px-12 py-16 md:py-24">
      <div className="mb-8 md:mb-12 flex justify-end">
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.6, delay: 0.2 }}
           className="relative min-w-[240px]"
        >
          <span className="text-[10px] uppercase tracking-widest text-earth/60 font-medium absolute -top-5 left-4">Ordenar por</span>
          <select 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full bg-offwhite/50 border border-nativa/30 rounded-2xl py-3 px-4 text-earth focus:outline-none focus:border-nativa transition-colors font-sans text-sm shadow-sm hover:border-nativa/60 appearance-none cursor-pointer"
          >
            <option value="a-z">Alfabéticamente, A-Z</option>
            <option value="z-a">Alfabéticamente, Z-A</option>
            <option value="price-asc">Precio, menor a mayor</option>
            <option value="price-desc">Precio, mayor a menor</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-earth/50">
            <ChevronDown className="w-4 h-4" />
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-28">
            <h3 className="text-xs uppercase tracking-[0.15em] font-bold text-earth mb-6 pb-2 border-b border-earth/10">Categorías</h3>
            {categories.length > 1 && (
              <ul className="space-y-3">
                {categories.map(cat => (
                  <li key={cat}>
                    <button
                      onClick={() => setActiveCategory(cat)}
                      className={`text-sm transition-all duration-300 w-full text-left flex items-center justify-between group ${
                        activeCategory === cat 
                          ? 'text-earth font-bold' 
                          : 'text-earth/60 hover:text-earth'
                      }`}
                    >
                      <span>{cat === 'all' ? 'Todos los productos' : cat}</span>
                      {activeCategory === cat && (
                        <motion.span layoutId="activeCategoryDot" className="w-1.5 h-1.5 rounded-full bg-nativa"></motion.span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            
            {searchQuery && (
              <div className="mt-8 pt-6 border-t border-earth/10">
                <h3 className="text-xs uppercase tracking-[0.15em] font-bold text-earth mb-4">Búsqueda activa</h3>
                <div className="bg-mustard/10 border border-mustard/20 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                  <span className="text-earth/80 truncate">"{searchQuery}"</span>
                  <Link to="/tienda" className="text-earth hover:text-nativa transition-colors p-1" title="Limpiar búsqueda">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-8 h-8 rounded-full border-4 border-kraft border-t-nativa"></div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center text-sm text-earth/60">
                <p>Mostrando {filteredAndSortedProducts.length} producto{filteredAndSortedProducts.length !== 1 ? 's' : ''}</p>
              </div>

              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12"
              >
                {filteredAndSortedProducts.map(product => (
                  <motion.div 
                    key={product.id} 
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="group relative flex flex-col h-full"
                  >
                    <div className="aspect-[4/5] bg-kraft-light rounded-2xl overflow-hidden mb-4 relative flex-shrink-0">
                      <Link to={`/producto/${product.id}`} className="block w-full h-full">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-earth-light text-sm italic bg-kraft">Sin imagen</div>
                        )}
                        
                        {/* Stickers overlay */}
                        {product.status === 'in_production' ? (
                          <div className="absolute top-4 left-4 bg-kraft text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                            En Producción
                          </div>
                        ) : product.stock <= 0 ? (
                          <div className="absolute top-4 left-4 bg-earth text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                            Agotado
                          </div>
                        ) : null}

                      </Link>
                      
                      {/* Actions overlay */}
                      {product.stock > 0 || product.status === 'in_production' ? (
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-earth/80 via-earth/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out flex justify-center gap-4">
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }}
                            className="bg-offwhite text-earth hover:bg-nativa hover:text-offwhite w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors uppercase tracking-[0.1em] text-xs font-semibold shadow-lg"
                            title="Añadir al carrito"
                          >
                            <ShoppingBag size={16} /> Agregar
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <Link to={`/producto/${product.id}`} className="mt-auto flex flex-col flex-1">
                      <div className="text-[10px] text-nativa uppercase tracking-[0.2em] mb-1 font-medium">{product.category}</div>
                      <h3 className="font-brand text-xl text-earth mb-2 group-hover:text-nativa transition-colors line-clamp-2 leading-tight">{product.name}</h3>
                      <div className="text-earth/80 font-medium text-lg mt-auto pt-2">S/ {product.price.toFixed(2)}</div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {filteredAndSortedProducts.length === 0 && (
                <div className="text-center py-20 bg-offwhite/50 rounded-3xl border border-earth/5 mt-8">
                  <ShoppingBag size={48} className="mx-auto text-earth/20 mb-4" />
                  <p className="text-earth text-lg font-medium mb-2">No se encontraron productos</p>
                  <p className="text-earth/60 text-sm">Prueba ajustando los filtros o tu búsqueda.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
