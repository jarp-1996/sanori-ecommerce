import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Leaf, 
  ShoppingBag, 
  Sparkles, 
  Droplets, 
  Heart, 
  Compass, 
  Check, 
  ArrowUpRight, 
  RotateCcw,
  Sparkle,
  SparkleIcon,
  HelpCircle,
  Award
} from "lucide-react";
import { useSiteSettings } from "../lib/SiteSettingsContext";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Product, useCart } from "../lib/CartContext";

// Simple custom component for star ratings to add luxury finish
function StarRating() {
  return (
    <div className="flex items-center gap-0.5 text-mustard">
      {Array(5).fill(0).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Home() {
  const { settings, loading } = useSiteSettings();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();

  // Interactive Quiz States
  const [quizStep, setQuizStep] = useState<number>(0); // 0: intro, 1: goal, 2: skin/hair type, 3: result
  const [quizAnswers, setQuizAnswers] = useState<{ goal: string; skinType: string }>({
    goal: "",
    skinType: "",
  });
  const [quizRecommendation, setQuizRecommendation] = useState<Product | null>(null);

  // Selected Ingredient State for Interactive Botanics Panel
  const [activeIngredient, setActiveIngredient] = useState<number>(0);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Product[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Product);
      });
      setFeaturedProducts(data);
    });
    return () => unsubscribe();
  }, []);

  // Quiz content definition
  const quizGoals = [
    { id: 'hair', label: 'Cuidado Capilar Saludable', desc: 'Revitalizar, dar volumen y despedirse de sulfatos', icon: '💇‍♀️', category: 'Sólidos' },
    { id: 'skin', label: 'Rostro y Piel Radiante', desc: 'Nutrición botánica profunda, suavidad e hidratación', icon: '✨', category: 'Jabones' },
    { id: 'relax', label: 'Aromaterapia & Calma', desc: 'Sintonizar calma, reducir estrés y propiciar el buen descanso', icon: '🧘‍♀️', category: 'Aromaterapia' },
    { id: 'general', label: 'Higiene & Cuidado Diario', desc: 'Alternativas biodegradables y eco-saludables', icon: '🌿', category: 'Cuidado personal' }
  ];

  const quizSkins = [
    { id: 'dry', label: 'Seco / Sensible', desc: 'Brinda mantecas, aceites suaves y nutrición extra', icon: '🌸' },
    { id: 'oily', label: 'Graso / Mixto', desc: 'Limpieza purificante, aceites ligeros y balance natural', icon: '🍃' },
    { id: 'normal', label: 'Todo tipo / Normal', desc: 'Fórmula equilibrada para limpieza suave y uso diario', icon: '☀️' }
  ];

  const handleGoalSelect = (goalId: string) => {
    setQuizAnswers(prev => ({ ...prev, goal: goalId }));
    setQuizStep(2);
  };

  const handleSkinSelect = (skinId: string) => {
    const updatedAnswers = { ...quizAnswers, skinType: skinId };
    setQuizAnswers(updatedAnswers);
    
    // Find best recommendation based on goal selection
    const selectedGoalObj = quizGoals.find(g => g.id === quizAnswers.goal);
    const targetCategory = selectedGoalObj ? selectedGoalObj.category : '';
    
    // Simple filter: seek products matching the category
    let matches = featuredProducts.filter(p => p.category.toLowerCase().includes(targetCategory.toLowerCase()));
    
    // Fallback if none in category
    if (matches.length === 0) {
      matches = featuredProducts;
    }

    // Dynamic choice: pick the first one matching, or a random matches item
    const recommendedProduct = matches[0] || featuredProducts[0] || null;
    setQuizRecommendation(recommendedProduct);
    setQuizStep(3);
  };

  const resetQuiz = () => {
    setQuizAnswers({ goal: "", skinType: "" });
    setQuizRecommendation(null);
    setQuizStep(1);
  };

  // Ingredients Data for Sensory/Botanics Panel
  const ingredients = [
    {
      name: "Arcilla Roja y Carbón Activo",
      type: "Minerales Purificantes",
      desc: "Extraídos de canteras naturales, limpian la piel a profundidad atrayendo toxinas e impurezas, regulando el exceso de grasa sin deshidratar.",
      benefits: ["Desintoxicación Profunda", "Efecto Matificante", "Exfoliación Delicada"],
      color: "border-red-200 bg-red-50/20 text-red-800",
      image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
      name: "Mantecas de Karité y Cacao",
      type: "Lípidos Nutritivos",
      desc: "Grasas vegetales de presión en frío ricas en ácidos grasos esenciales y vitaminas A, E y F. Crean una barrera natural que retiene la humedad interna.",
      benefits: ["Flexibilidad e Hidratación", "Nutrición Celular Activa", "Efecto Cicatrizante"],
      color: "border-amber-200 bg-amber-50/20 text-amber-800",
      image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
      name: "Aceite Esencial de Lavanda y Árbol de Té",
      type: "Elixires Aromaterapéuticos",
      desc: "Destilados al vapor para preservar su pureza medicinal. La lavanda sosiega el sistema nervioso y regenera tejidos; el árbol de té purifica y controla bacterias.",
      benefits: ["Alivio Emocional Directo", "Poder Antiséptico", "Equilibrio Seborreico"],
      color: "border-purple-200 bg-purple-50/20 text-purple-800",
      image: "https://images.unsplash.com/photo-1527489377706-5bf97e608852?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
      name: "Tensoactivos Derivados del Coco",
      type: "Limpieza Sostenible",
      desc: "Tensoactivos suaves de origen natural (SCI o Coco-Sulfate) biodegradables. Generan espuma lujosa y biocompatible que respeta el pH de la hebra capilar.",
      benefits: ["Respeto a la Barrera Dérmica", "Brillo Natural Prolongado", "Biodegradabilidad Integral"],
      color: "border-emerald-200 bg-emerald-50/20 text-emerald-800",
      image: "https://images.unsplash.com/photo-1548964856-ac67554e8d31?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    }
  ];

  return (
    <div className="bg-background overflow-clip relative selection:bg-mustard selection:text-earth text-earth">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[20%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-mustard/5 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[50%] right-[-10%] w-[50rem] h-[50rem] rounded-full bg-earth/5 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[5%] w-[35rem] h-[35rem] rounded-full bg-kraft/5 blur-3xl pointer-events-none -z-10" />

      {/* Hero: Luxury Avant-Garde Split Layout */}
      <section className="relative min-h-[92vh] w-full flex items-center md:pb-16 pt-8 px-4 sm:px-6 md:px-12 lg:px-20 max-w-[105rem] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* Column Left: High-Presence Typography */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left py-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-earth/10 dark:bg-earth/20 border border-earth/20 backdrop-blur-md text-earth font-bold tracking-[0.25em] uppercase text-[10px] sm:text-xs mb-8 px-4 py-1.5 rounded-full shadow-sm">
                <Sparkles size={12} className="text-mustard fill-mustard animate-pulse" /> 
                Botica Integral & Alquimia Vegetal
              </div>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-4xl sm:text-6xl md:text-7xl xl:text-8xl font-brand font-semibold text-earth leading-[1.05] tracking-tight mb-8"
            >
              Cosmética viva, <br className="hidden sm:inline" />
              hecha con repeto <br className="hidden sm:inline" />
              <span className="relative inline-block mt-1">
                y sabiduría.
                {/* Custom artistic underline stroke */}
                <svg className="absolute -bottom-3 left-0 w-full h-3 text-mustard" viewBox="0 0 300 20" fill="none" preserveAspectRatio="none">
                  <path d="M5 15C100 5 180 5 295 15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl text-earth/80 font-light max-w-xl mb-12 leading-relaxed"
            >
              Diseñamos rituales botánicos y productos artesanales en lotes selectos, intencionados para sanar tu piel, equilibrar tu cabello y nutrir tus sentidos, preservando la pureza de la tierra peruana.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 sm:items-center"
            >
              <Link
                to="/tienda"
                className="group inline-flex items-center justify-center gap-4 bg-earth text-offwhite px-8 py-5 rounded-full uppercase tracking-widest font-bold text-xs hover:bg-mustard hover:text-earth transition-all duration-300 shadow-xl hover:shadow-mustard/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Explorar Elixires</span>
                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
              </Link>
              
              <a
                href="#quiz-orientado"
                className="inline-flex items-center justify-center gap-2 hover:bg-earth/5 text-earth border border-earth/20 px-8 py-5 rounded-full uppercase tracking-widest font-bold text-[11px] transition-all"
              >
                <Compass size={16} className="text-nativa" />
                <span>Encuentra tu Rutina</span>
              </a>
            </motion.div>

            {/* Quick trust stamps */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 1, delay: 1 }}
              className="grid grid-cols-3 gap-6 pt-12 md:pt-16 mt-12 border-t border-earth/10 max-w-lg"
            >
              <div>
                <span className="block text-2xl font-brand font-bold text-earth text-mustard">100%</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-earth/60">Orgánico & Vegano</span>
              </div>
              <div>
                <span className="block text-2xl font-brand font-bold text-earth text-mustard">Mano</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-earth/60">Elaboración local</span>
              </div>
              <div>
                <span className="block text-2xl font-brand font-bold text-earth text-mustard">Libre</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-earth/60">De Sulfatos / Crueldad</span>
              </div>
            </motion.div>
          </div>

          {/* Column Right: Elegant Double Image Collage */}
          <div className="lg:col-span-5 relative flex items-center justify-center py-10">
            
            {/* Organic Shape Rotating Background */}
            <div className="absolute inset-0 w-full h-[110%] max-w-lg mx-auto bg-kraft-light/50 rounded-[4rem] -rotate-6 scale-95 pointer-events-none -z-10" />

            <div className="relative w-full max-w-md aspect-[4/5] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl group border-[10px] border-offwhite">
              {settings?.heroImageUrl ? (
                <img 
                  src={settings.heroImageUrl} 
                  alt="Tratamiento Consciente Sánori" 
                  className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-earth/10 flex items-center justify-center">
                  <Leaf className="w-20 h-20 text-earth/30 animate-pulse" />
                </div>
              )}
              
              {/* Premium Floating overlay widget banner */}
              <div className="absolute bottom-6 left-6 right-6 p-5 bg-white/90 dark:bg-earth/95 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/20 shadow-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-mustard flex items-center justify-center text-earth-light shrink-0 shadow-lg shadow-mustard/30">
                  <Award className="w-6 h-6 text-earth" />
                </div>
                <div>
                  <div className="flex gap-1 items-center mb-0.5">
                    <StarRating />
                    <span className="text-[10px] text-earth/60 font-bold ml-1">4.9/5</span>
                  </div>
                  <p className="text-[11px] text-earth-light dark:text-offwhite/80 font-sans leading-relaxed">
                    "Mi cuero cabelludo sanó y recuperó vitalidad en semanas de uso." <br className="hidden sm:inline" />
                    <strong className="text-earth font-bold text-[10px]">— Camila R.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Overlapping minor aesthetic frame */}
            <div className="hidden xl:block absolute -bottom-4 -left-16 w-48 aspect-[3/4] bg-offwhite border-4 border-white shadow-xl rounded-[2rem] overflow-hidden -rotate-12 transition-transform hover:-rotate-6 duration-500">
              <img 
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=80" 
                alt="Detalle" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Smooth Marquee Banner */}
      <section className="bg-earth text-mustard border-y border-mustard/20 py-8 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-earth to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-earth to-transparent z-10 pointer-events-none" />
        <div className="flex whitespace-nowrap overflow-x-hidden">
          <motion.div 
            animate={{ x: [0, -1202] }} 
            transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
            className="flex space-x-16 items-center text-sm md:text-base font-bold uppercase tracking-[0.25em]"
          >
            {Array(12).fill("· Sabiduría Botánica Ancestral · Hecho a Mano en Perú · 100% Amable con el Planeta · Cosmética Orgánica Real ").map((text, i) => (
              <span key={i} className="flex items-center gap-3">
                <span>{text}</span>
                <Sparkle size={14} className="text-mustard fill-mustard" />
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Luxury Section: Interactive Ingredients & Sensory Walkthrough */}
      <section className="py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-kraft">Pureza Transparente</span>
          <h2 className="text-3xl md:text-5xl font-brand mt-2 mb-4 text-earth">Ingredientes que Sanan</h2>
          <p className="text-sm md:text-base text-earth/70 font-light">
            En Sánori, creemos que lo que pones en tu cuerpo es igual de crucial que lo que comes. Conoce los pilares crudos y puros de nuestro catálogo.
          </p>
          <div className="w-12 h-1 bg-mustard mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Column Left: Beautiful vertical Selector list */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-center">
            {ingredients.map((ing, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIngredient(idx)}
                className={`w-full text-left p-6 md:p-8 rounded-3xl border transition-all duration-300 flex items-start gap-4 cursor-pointer outline-none ${
                  activeIngredient === idx 
                    ? "border-earth bg-earth text-offwhite shadow-lg scale-102" 
                    : "border-earth/10 bg-white/50 text-earth hover:bg-white hover:border-earth/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg select-none shrink-0 ${
                  activeIngredient === idx ? "bg-mustard text-earth" : "bg-earth/5 text-earth-light"
                }`}>
                  0{idx + 1}
                </div>
                <div>
                  <h4 className="font-brand text-lg mb-1">{ing.name}</h4>
                  <p className={`text-xs ${
                    activeIngredient === idx ? "text-offwhite/75" : "text-earth/65"
                  }`}>
                    {ing.type}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Column Right: Elegant Interactive Detail card with animation */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIngredient}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-earth/5 shadow-2xl h-full flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="aspect-[2/1] rounded-[2rem] overflow-hidden shadow-inner relative max-h-[220px]">
                    <img 
                      src={ingredients[activeIngredient].image} 
                      alt={ingredients[activeIngredient].name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <span className="absolute bottom-4 right-4 text-xs font-bold font-sans uppercase tracking-[0.2em] bg-white text-earth px-4 py-1.5 rounded-full shadow">
                      {ingredients[activeIngredient].type}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-brand text-earth">
                    Alquimia detrás de: <br className="hidden sm:inline" />
                    <strong>{ingredients[activeIngredient].name}</strong>
                  </h3>
                  
                  <p className="text-sm md:text-base text-earth/80 font-light leading-relaxed">
                    {ingredients[activeIngredient].desc}
                  </p>

                  <div className="space-y-3 pt-4">
                    <span className="block text-[10px] uppercase font-bold tracking-widest text-kraft">Beneficios Clave:</span>
                    <div className="flex flex-wrap gap-2">
                      {ingredients[activeIngredient].benefits.map((ben, i) => (
                        <span 
                          key={i} 
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-earth/5 border border-earth/10 text-xs font-medium text-earth-light"
                        >
                          <Check size={12} className="text-mustard stroke-[2.5]" />
                          {ben}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-earth/10 mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <span className="text-xs text-earth/60 italic font-sans">Ingredientes de grado comestible, cosechados con ética.</span>
                  <Link 
                    to={`/tienda?q=${encodeURIComponent(ingredients[activeIngredient].name.split(' ')[0])}`} 
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-kraft hover:text-earth transition-colors group"
                  >
                    Ver línea de productos <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* INTERACTIVE WIDGET: Personalized Routine Finder "Encuentra tu Bienestar" */}
      <section id="quiz-orientado" className="py-24 bg-kraft-light/35 border-y border-kraft/10 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-earth">Test Inteligente</span>
            <h2 className="text-3xl md:text-5xl font-brand mt-1 mb-3 text-earth">Asesor de Bienestar Sánori</h2>
            <p className="text-sm text-earth-light">
              ¿No estás seguro de qué producto es mejor para ti? Responde un par de preguntas rápidas y nuestro buscador inteligente te armará la rutina perfecta.
            </p>
          </div>

          <div className="bg-white border border-earth/5 rounded-[2.5rem] p-6 sm:p-10 md:p-14 shadow-2xl relative overflow-hidden min-h-[480px] flex flex-col justify-center">
            
            {/* Step Counter Tag */}
            {quizStep > 0 && quizStep < 3 && (
              <div className="absolute top-6 left-6 text-xs font-sans tracking-wider text-earth/50">
                Paso <strong className="text-earth font-bold">{quizStep}</strong> de 2
              </div>
            )}

            <AnimatePresence mode="wait">
              
              {/* STEP 0: Quiz Intro */}
              {quizStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-8 py-8"
                >
                  <div className="w-16 h-16 bg-earth/5 text-earth border border-earth/10 flex items-center justify-center rounded-full mx-auto shadow-lg">
                    <Compass className="w-8 h-8 text-mustard" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-brand mb-2 text-earth">Encuentra Tu Equilibrio</h3>
                    <p className="text-sm text-earth-light max-w-md mx-auto">
                      En solo 30 segundos, identifica los jabones, aceites o sólidos ideales según las prioridades de tu cuerpo y tipo de piel.
                    </p>
                  </div>
                  <button
                    onClick={() => setQuizStep(1)}
                    className="inline-flex items-center gap-3 bg-earth text-white px-8 py-4 rounded-full uppercase tracking-widest font-bold text-xs hover:bg-mustard hover:text-earth transition-all shadow-lg"
                  >
                    <span>Iniciar Diagnóstico</span>
                    <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}

              {/* STEP 1: Select Main Goal */}
              {quizStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl sm:text-2xl font-serif text-center text-earth mb-8">
                    1. ¿Cuál es tu prioridad principal de bienestar?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {quizGoals.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => handleGoalSelect(g.id)}
                        className="p-5 text-left border border-earth/10 hover:border-earth bg-offwhite/50 hover:bg-white rounded-2xl transition-all hover:shadow-md cursor-pointer group flex items-start gap-4"
                      >
                        <span className="text-2xl select-none">{g.icon}</span>
                        <div>
                          <h4 className="font-brand font-bold text-sm text-earth group-hover:text-kraft transition-colors">{g.label}</h4>
                          <p className="text-xs text-earth/60 font-light mt-1 leading-relaxed">{g.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Select Skin/Hair Type */}
              {quizStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl sm:text-2xl font-serif text-center text-earth mb-8">
                    2. ¿Cuál es tu tipo de piel o cuero cabelludo?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quizSkins.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSkinSelect(s.id)}
                        className="p-6 text-center border border-earth/10 hover:border-earth bg-offwhite/50 hover:bg-white rounded-2xl transition-all hover:shadow-md cursor-pointer group flex flex-col items-center gap-3"
                      >
                        <span className="text-3.5xl lg:text-4xl select-none mb-1">{s.icon}</span>
                        <div>
                          <h4 className="font-brand font-bold text-sm text-earth group-hover:text-kraft transition-colors">{s.label}</h4>
                          <p className="text-xs text-earth/55 font-light mt-1.5 leading-relaxed">{s.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-6 text-center">
                    <button 
                      onClick={() => setQuizStep(1)} 
                      className="text-xs font-bold text-earth/60 hover:text-earth flex items-center gap-1.5 mx-auto"
                    >
                      <RotateCcw size={12} /> Volver a la pregunta anterior
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Beautiful recommendations */}
              {quizStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-4">
                    <div className="inline-flex gap-1 bg-green-50 text-emerald-800 border border-emerald-100 rounded-full py-1 px-4 text-xs font-semibold select-none items-center shadow-inner">
                      ✨ Routine Curada Inteligente
                    </div>
                  </div>

                  {quizRecommendation ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-offwhite/50 rounded-3xl p-6 sm:p-8 border border-earth/5">
                      
                      {/* Left side recom card */}
                      <div className="md:col-span-4 aspect-square rounded-2xl overflow-hidden bg-white border border-earth/5 shadow-md">
                        {quizRecommendation.imageUrl ? (
                          <img 
                            src={quizRecommendation.imageUrl} 
                            alt={quizRecommendation.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs italic bg-offwhite">Sin imagen</div>
                        )}
                      </div>

                      {/* Right side specs */}
                      <div className="md:col-span-8 flex flex-col justify-between text-left space-y-4">
                        <div>
                          <div className="text-[10px] text-nativa uppercase tracking-[0.2em] font-semibold mb-1">
                            {quizRecommendation.category}
                          </div>
                          <h4 className="font-brand text-xl sm:text-2xl text-earth font-bold">
                            {quizRecommendation.name}
                          </h4>
                          <p className="text-xs text-earth/70 font-light mt-2 line-clamp-3 leading-relaxed">
                            {quizRecommendation.description || "Un elixir cuidadosamente formulado en lotes intencionados para un autocuidado orgánico en armonía."}
                          </p>
                        </div>

                        <div className="flex gap-1 items-center bg-white/70 px-3.5 py-1.5 rounded-full border border-earth/5 text-xs w-fit">
                          <Leaf className="w-3.5 h-3.5 text-mustard fill-mustard" />
                          <span className="font-medium text-earth/80">Recomendado para tipo de piel seleccionado</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-earth/10">
                          <div>
                            <span className="text-[10px] text-earth/55 uppercase font-semibold">Valor consciente</span>
                            <p className="text-xl sm:text-2xl font-bold font-brand text-earth">S/ {quizRecommendation.price.toFixed(2)}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => addToCart(quizRecommendation)}
                              className="bg-earth hover:bg-mustard hover:text-earth text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                            >
                              <ShoppingBag size={14} />
                              Añadir a mi Rutina
                            </button>
                            <Link
                              to={`/producto/${quizRecommendation.id}`}
                              className="border border-earth/20 bg-white hover:bg-earth/5 text-earth font-bold text-xs uppercase tracking-widest px-4 py-3.5 rounded-xl transition flex items-center justify-center"
                              title="Ver ficha de producto completo"
                            >
                              Detalles
                            </Link>
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-earth/60">
                      Disculpa, no logramos contrastar un producto de stock ideal en este momento. Revisa nuestra tienda.
                    </div>
                  )}

                  <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-3">
                    <button
                      onClick={resetQuiz}
                      className="text-xs font-semibold text-kraft hover:text-earth border border-kraft/35 hover:bg-kraft/5 px-6 py-2.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 transition"
                    >
                      <RotateCcw size={12} /> Volver a empezar
                    </button>
                    <Link
                      to="/tienda"
                      className="text-xs font-bold text-earth hover:underline flex items-center gap-1 uppercase tracking-wider"
                    >
                      Ir directamente al Catálogo de Tienda <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* HIGHLIGHT: Premium Bento Grid "Mejores Ofertas y Conciencia" */}
      <section className="py-24 px-4 sm:px-6 md:px-12 max-w-[105rem] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-kraft">Edición Limitada</span>
            <h2 className="text-3xl md:text-5xl font-brand mt-1 mb-3 text-earth">Nuestra Selección de Temporada</h2>
            <p className="text-sm md:text-base text-earth/70 font-light">
              Lotes recién intencionados y listos para despacho. Elaboración puramente artesanal en cantidades limitadas.
            </p>
            <div className="w-16 h-1 bg-nativa mt-4 rounded-full"></div>
          </div>
          <Link 
            to="/tienda" 
            className="group flex items-center gap-3 bg-white hover:bg-earth text-earth hover:text-offwhite border-2 border-earth px-8 py-4 rounded-full transition-all duration-300 font-bold uppercase tracking-wider text-xs shadow-lg"
          >
            Ver Catálogo Virtual <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.slice(0, 4).map((product, index) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-[2rem] p-5 border border-earth/5 shadow-xl hover:-translate-y-2 hover:shadow-2xl hover:shadow-earth/10 transition-all duration-500 group relative flex flex-col justify-between"
            >
              <div>
                <Link to={`/producto/${product.id}`} className="block relative aspect-square rounded-[1.5rem] overflow-hidden mb-6 bg-offwhite group-hover:scale-98 transition-transform duration-500">
                  {/* Luxury badge/sticker overlay */}
                  {product.status === 'in_production' ? (
                     <span className="absolute top-4 left-4 z-10 bg-kraft text-white text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-md">
                       Reserva
                     </span>
                  ) : product.stock <= 0 ? (
                     <span className="absolute top-4 left-4 z-10 bg-earth text-white text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-md">
                       Agotado
                     </span>
                  ) : index === 0 ? (
                     <span className="absolute top-4 left-4 z-10 bg-[#d13d3d] text-white text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-md animate-pulse">
                       Más Querido 🌿
                     </span>
                  ) : index === 1 && (
                     <span className="absolute top-4 left-4 z-10 bg-earth text-white text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full shadow-md">
                       Nuevo Lote
                     </span>
                  )}
                  
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-104" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-earth-light text-sm italic">Sin imagen</div>
                  )}

                  {/* Elegant Quick Action add-to-cart on image hover */}
                  {(product.stock > 0 || product.status === 'in_production') && (
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="bg-white/95 text-earth font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-full shadow-xl hover:bg-mustard hover:text-earth transition transform translate-y-3 group-hover:translate-y-0"
                      >
                        Añadir rápido
                      </button>
                    </div>
                  )}
                </Link>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-nativa uppercase tracking-[0.2em] font-medium block">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <StarRating />
                    <span className="text-[9px] text-earth/50 font-bold ml-1">(12)</span>
                  </div>
                </div>

                <Link to={`/producto/${product.id}`} className="block">
                  <h3 className="font-brand font-medium text-lg leading-snug text-earth hover:text-kraft transition-colors line-clamp-2 h-[3rem] mb-2">
                    {product.name}
                  </h3>
                </Link>
              </div>

              {/* Price and Cart Button bar */}
              <div className="flex items-center justify-between pt-4 border-t border-earth/5 mt-4">
                <div className="flex flex-col">
                  {index === 0 && (
                    <span className="text-earth/40 line-through text-[11px] mb-0.5">
                      S/ {(product.price * 1.15).toFixed(2)}
                    </span>
                  )}
                  <span className="text-earth font-bold text-lg font-brand">
                    S/ {product.price.toFixed(2)}
                  </span>
                </div>

                {(product.stock > 0 || product.status === 'in_production') && (
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-11 h-11 rounded-full bg-earth text-mustard flex items-center justify-center hover:bg-mustard hover:text-earth transition-colors shadow shadow-earth/10 group/btn"
                    title="Añadir al carrito"
                  >
                    <ShoppingBag size={18} className="transition-transform group-hover/btn:scale-110" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* RETHINK BENTO GRID: Blog & Workshops Showcase with Organic Layout */}
      <section className="py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          
          {/* Card Left Big: Taller/Workshop Promo with text and background */}
          <div className="md:col-span-8 bg-[#332219] text-offwhite rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden flex flex-col justify-between shadow-xl border border-kraft/15 min-h-[440px]">
            {/* Visual background leaf silhouette watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-[0.03] pointer-events-none -z-10">
              <Leaf className="w-full h-full text-white" />
            </div>

            <div className="space-y-6 max-w-xl">
              <span className="inline-flex gap-1.5 bg-mustard/15 text-mustard border border-mustard/30 rounded-full px-4 py-1 uppercase tracking-widest text-[10px] font-bold">
                TALLERES PRESENCIALES Y ONLINE
              </span>
              <h3 className="text-3xl md:text-5xl font-brand text-offwhite leading-tight">
                Aprende la Alquimia de las Plantas
              </h3>
              <p className="text-xs sm:text-sm text-offwhite/80 font-light leading-relaxed">
                Únete a nuestra escuela de saberes naturales. Te enseñamos a elaborar tu propia cosmética sólida, jabonería saponificada artesanalmente y destilados botánicos para emprender o cuidar de ti.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-10 items-start sm:items-center justify-between border-t border-white/10 mt-8">
              <div className="flex gap-2">
                <span className="text-[10px] bg-white/10 border border-white/15 px-3 py-1 rounded-full uppercase font-bold tracking-wider">Cupos Limitados</span>
                <span className="text-[10px] bg-white/10 border border-white/15 px-3 py-1 rounded-full uppercase font-bold tracking-wider">Lima, Perú</span>
              </div>
              <Link
                to="/talleres"
                className="inline-flex items-center gap-3 bg-mustard hover:bg-white text-earth font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-full shadow-lg transition duration-300"
              >
                <span>Conocer Fechas</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card Right Minor: Blog call-out, organic/earth-themed */}
          <div className="md:col-span-4 bg-white rounded-[2.5rem] p-8 md:p-12 border border-earth/5 shadow-xl flex flex-col justify-between items-start min-h-[440px]">
            <div className="space-y-6">
              <span className="inline-flex gap-1.5 bg-earth/5 text-earth border border-earth/10 rounded-full px-4 py-1 uppercase tracking-widest text-[9px] font-bold">
                BITÁCORA SÁNORI
              </span>
              <h3 className="text-2xl font-brand text-earth leading-snug">
                Saberes para una vida consciente y conectada.
              </h3>
              <p className="text-xs sm:text-sm text-earth-light leading-relaxed font-light">
                Descubre artículos redactados para re-conectar con el bienestar, guías sobre aceites esenciales, el pH de tu piel, y cuidados eco-sostenibles.
              </p>
            </div>

            <div className="pt-8 border-t border-earth/10 w-full flex items-center justify-between mt-8">
              <span className="text-xs text-earth/55 italic">Publicación semanal</span>
              <Link 
                to="/blog" 
                className="w-10 h-10 rounded-full border border-earth/15 text-earth flex items-center justify-center hover:bg-earth hover:text-white transition group"
                title="Leer el blog"
              >
                <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Pure & Artisanal Values / Testimonial Collage */}
      <section className="py-24 px-4 sm:px-6 md:px-12 bg-earth text-offwhite relative overflow-hidden rounded-t-[3rem] md:rounded-t-[4.5rem]">
        {/* Subtle noise watermark overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          <div className="lg:col-span-6 space-y-8">
            <span className="text-[10px] text-mustard uppercase font-bold tracking-[0.3em] block">Sello de Calidad Sánori</span>
            <h3 className="text-3xl md:text-5xl font-brand text-offwhite leading-tight">
              Diseño holístico y <br className="hidden sm:inline" />
              respeto incondicional.
            </h3>
            
            <p className="text-sm md:text-base text-offwhite/85 font-light leading-relaxed max-w-lg">
              Creemos firmemente en que los productos del cuerpo deben provenir de la biodiversidad local manejada responsablemente. Sánori es el fruto de años de investigación botánica, rindiendo tributo a los ingredientes puros.
            </p>

            <div className="space-y-4 pt-4 max-w-md">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-mustard shrink-0 border border-white/10">
                  <Check size={14} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-brand font-bold text-sm text-offwhite">Sin Químicos de Relleno</h4>
                  <p className="text-xs text-offwhite/70 font-light mt-0.5 leading-relaxed">Sin parabenos, sulfatos irritantes, alcoholes secantes, colorantes o fragancias sintéticas.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-mustard shrink-0 border border-white/10">
                  <Check size={14} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-brand font-bold text-sm text-offwhite">Lotes de Producción Estricta</h4>
                  <p className="text-xs text-offwhite/70 font-light mt-0.5 leading-relaxed">Elaboración en cantidades reducidas para garantizar frescura medicinal y óptimo estado de los aceites.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="bg-white/[0.04] backdrop-blur-md rounded-[3rem] p-8 md:p-12 border border-white/10 relative max-w-md w-full">
              {/* Overlapping quotes illustration */}
              <div className="absolute top-8 left-8 text-mustard opacity-20 text-7xl font-serif font-bold italic select-none leading-none">“</div>
              
              <div className="space-y-6 pt-6 relative z-10 text-left">
                <p className="text-sm sm:text-base text-offwhite/95 font-light leading-relaxed italic">
                  "El serum regenerador facial y los shampoos sólidos cambiaron mi vida y mi conexión diaria con el planeta. Realmente se siente el trabajo artesano y cariñoso que le ponen a Sánori. ¡Totalmente recomendados!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-mustard text-earth font-extrabold text-[11px] flex items-center justify-center border-2 border-white/20 select-none uppercase">
                    MT
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-offwhite">María Teresa Valencia</h5>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#fae8e3]/60">Cliente habitual, Cusco</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
