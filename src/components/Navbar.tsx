import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, User, LogOut, Search } from "lucide-react";
import { useCart, Product } from "../lib/CartContext";
import { useAuth, loginWithGoogle, logout } from "../lib/firebase";
import { useTheme } from "../lib/ThemeContext";
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

export function Navbar() {
  const { items, total } = useCart();
  const { profile, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  // Scroll visibility state
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Product[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Product);
      });
      setAllProducts(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      const results = allProducts.filter(p => 
        p.name.toLowerCase().includes(queryLower) || 
        (p.description && p.description.toLowerCase().includes(queryLower)) ||
        p.category.toLowerCase().includes(queryLower)
      );
      setSearchResults(results.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tienda?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchFocused(false);
      setSearchQuery("");
    }
  };

  const renderSearchForm = (isMobile: boolean) => (
    <form onSubmit={handleSearch} className={`relative w-full ${!isMobile ? "max-w-xs xl:max-w-sm" : ""}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Search className="h-4 w-4 text-earth/50" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
        placeholder="Buscar productos..."
        className="w-full relative z-10 bg-offwhite border border-earth/10 rounded-full py-2 pl-9 pr-4 text-earth placeholder-earth/50 focus:outline-none focus:border-earth transition-colors shadow-sm text-sm"
      />
      {/* Dropdown de autocompletado */}
      {isSearchFocused && searchQuery.trim() !== '' && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-offwhite border border-earth/10 rounded-xl shadow-xl overflow-hidden z-50 text-left">
          {searchResults.length > 0 ? (
            <ul className="max-h-[300px] overflow-y-auto py-2">
              {searchResults.map(product => (
                <li key={product.id}>
                  <Link 
                    to={`/tienda?q=${encodeURIComponent(product.name)}`}
                    onMouseDown={() => {
                      // Using onMouseDown so it fires before onBlur
                      navigate(`/tienda?q=${encodeURIComponent(product.name)}`);
                      setSearchQuery("");
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center gap-3 py-2 px-3 hover:bg-nativa/5 transition-colors border-b border-earth/5 last:border-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-kraft-light overflow-hidden flex-shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-earth/50">S/I</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-brand text-sm text-earth truncate">{product.name}</h4>
                    </div>
                    <div className="text-earth text-sm font-medium whitespace-nowrap">
                      S/ {product.price.toFixed(2)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-earth/60 text-sm font-light">
              No encontramos resultados
            </div>
          )}
        </div>
      )}
    </form>
  );

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className={`sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md flex flex-col transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'} shadow-sm`}>
      {/* Promo Top bar */}
      <div className="hidden lg:flex w-full bg-earth text-offwhite text-[10px] uppercase font-bold tracking-widest py-1.5 px-6 border-b border-earth/20">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="text-offwhite/70">
            Envíos gratis por compras mayores a S/ 150
          </div>
          <div className="flex justify-end gap-6">
            <Link to="#" className="hover:text-nativa transition-colors">Centro de Ayuda</Link>
            <Link to="#" className="hover:text-nativa transition-colors">Seguimiento de pedidos</Link>
            <button className="hover:text-nativa transition-colors uppercase">Únete al Club</button>
          </div>
        </div>
      </div>

      <div className="w-full bg-nativa md:bg-background border-b border-nativa-light/30 md:border-earth/5 shadow-md md:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 lg:h-24 justify-between items-center gap-4 lg:gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3 md:gap-4 flex-none">
              <Link
                to="/"
                className="group flex items-center gap-2"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <span className="font-brand text-3xl md:text-5xl text-offwhite md:text-nativa transition-colors duration-500 hover:text-white md:hover:text-earth leading-none drop-shadow-sm md:drop-shadow-none">
                  sánori
                </span>
              </Link>
            </div>

            {/* Desktop Navigation & Search */}
            <div className="hidden lg:flex flex-1 max-w-2xl justify-center items-center">
              {renderSearchForm(false)}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-4 lg:space-x-6 flex-none">
              {!loading && (
                <div className="hidden lg:block">
                  {profile ? (
                    <div className="flex items-center gap-3 lg:gap-6">
                      {profile.role === "admin" && (
                        <Link
                          to="/admin"
                          className="text-[10px] uppercase tracking-[0.15em] border border-nativa text-nativa px-3 py-1.5 hover:bg-nativa hover:text-offwhite transition-colors"
                        >
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={logout}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] font-medium text-earth/70 hover:text-nativa transition-colors"
                        title="Cerrar sesión"
                      >
                        <LogOut size={16} />
                        <span>Salir</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={loginWithGoogle}
                      className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium text-earth/80 hover:text-nativa transition-colors px-2 py-2"
                    >
                      <User size={20} />
                      <span className="hidden xl:block">Entrar</span>
                    </button>
                  )}
                </div>
              )}

              <Link
                to="/cart"
                className="p-2 text-offwhite md:text-earth md:hover:text-nativa transition-colors relative flex items-center gap-1 sm:gap-2"
              >
                <div className="relative">
                  <ShoppingBag size={22} className="stroke-[2px] md:stroke-[1.5px]" />
                  <span className="absolute -top-1.5 -right-2 bg-offwhite md:bg-nativa text-nativa md:text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm md:shadow-none">
                    {cartItemCount}
                  </span>
                </div>
                <span className="text-xs font-semibold hidden xl:block ml-1 text-earth">S/ {total.toFixed(2)}</span>
              </Link>

              <button
                className="lg:hidden p-2 text-offwhite hover:text-white transition-colors ml-2"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
          
          {/* Mobile Search Bar */}
          <div className="lg:hidden pb-3 mt-1">
            {renderSearchForm(true)}
          </div>
        </div>
      </div>
      
      {/* Secondary Bar Desktop */}
      <div className="hidden lg:block bg-earth text-offwhite border-b border-earth-light/20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex h-12 items-center">
              <div className="relative h-full group">
                 <Link 
                     to="/tienda" 
                     className="h-full px-6 bg-nativa-light/20 flex items-center gap-3 font-semibold tracking-wider group-hover:bg-nativa-light/40 transition-colors uppercase text-sm border-r border-offwhite/10"
                 >
                     <Menu size={18} />
                     <span>Categorías</span>
                 </Link>
                 <div className="absolute top-full left-0 w-72 bg-offwhite border border-earth/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2">
                    {[
                      { name: "Jabones Intencionados" },
                      { name: "Cuidado del cabello (Sólidos)" },
                      { name: "Aromaterapia" },
                      { name: "Cuidado personal" },
                    ].map((cat, i) => (
                      <Link
                        key={i}
                        to={`/tienda?q=${encodeURIComponent(cat.name)}`}
                        className="px-6 py-3 text-earth hover:bg-nativa/5 hover:text-nativa transition-colors font-medium border-b border-earth/5 last:border-0"
                      >
                        {cat.name}
                      </Link>
                    ))}
                 </div>
              </div>
              <div className="flex items-center h-full px-6 gap-8 text-sm font-semibold tracking-wider uppercase">
                <Link
                  to="/"
                  className="hover:text-offwhite/70 transition-colors h-full flex items-center"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Inicio
                </Link>
                <Link
                  to="/tienda"
                  className="hover:text-offwhite/70 transition-colors h-full flex items-center"
                >
                  Tienda
                </Link>
                <Link
                  to="/nosotros"
                  className="hover:text-offwhite/70 transition-colors h-full flex items-center"
                >
                  Nosotros
                </Link>
                <Link
                  to="/blog"
                  className="hover:text-offwhite/70 transition-colors h-full flex items-center"
                >
                  Blog
                </Link>
                <Link
                  to="/talleres"
                  className="hover:text-offwhite/70 transition-colors h-full flex items-center"
                >
                  Talleres
                </Link>
              </div>
           </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-background border-b border-earth/10 px-4 py-4 space-y-4">
          <Link
            to="/"
            className="block text-earth font-medium border-b border-earth/5 pb-3"
            onClick={() => {
              setMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Inicio
          </Link>
          <Link
            to="/tienda"
            className="block text-earth font-medium border-b border-earth/5 pb-3"
            onClick={() => setMenuOpen(false)}
          >
            Tienda
          </Link>
          <Link
            to="/nosotros"
            className="block text-earth font-medium border-b border-earth/5 pb-3"
            onClick={() => setMenuOpen(false)}
          >
            Nosotros
          </Link>
          <Link
            to="/blog"
            className="block text-earth font-medium border-b border-earth/5 pb-3"
            onClick={() => setMenuOpen(false)}
          >
            Blog
          </Link>
          <Link
            to="/talleres"
            className="block text-earth font-medium border-b border-earth/5 pb-3"
            onClick={() => setMenuOpen(false)}
          >
            Talleres
          </Link>
          <div className="pt-2">
            {!loading &&
              (profile ? (
                <div className="space-y-4">
                  {profile.role === "admin" && (
                    <Link
                      to="/admin"
                      className="block text-nativa font-medium"
                      onClick={() => setMenuOpen(false)}
                    >
                      Panel Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 text-earth font-medium w-full text-left"
                  >
                    <LogOut size={20} />
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    loginWithGoogle();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-earth font-medium w-full text-left"
                >
                  <User size={20} />
                  Iniciar sesión
                </button>
              ))}
          </div>
        </div>
      )}
    </nav>
  );
}
