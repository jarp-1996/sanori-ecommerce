import { motion } from 'motion/react';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const BLOG_POSTS = [
  {
    id: '1',
    title: 'Los beneficios de la aromaterapia en la vida diaria',
    excerpt: 'Descubre cómo los aceites esenciales pueden calmar tu mente y energizar tu cuerpo frente a la rutina diaria y el estrés constante.',
    category: 'Bienestar',
    date: '12 de Mayo, 2026',
    readTime: '4 min',
    image: '',
  },
  {
    id: '2',
    title: 'Transición al shampoo sólido: Guía definitiva',
    excerpt: 'El cuidado del cabello ecológico no solo ayuda al planeta, sino que libera a tu cuero cabelludo de parabenos y sulfatos agresivos...',
    category: 'Cuidado Capilar',
    date: '28 de Abril, 2026',
    readTime: '6 min',
    image: '',
  },
  {
    id: '3',
    title: 'Jabones intencionados: Más que simple limpieza',
    excerpt: 'Conoce los rituales detrás de nuestras barras y cómo incorporar la magia botánica a tu higiene diaria para manifestar abundancia.',
    category: 'Rituales',
    date: '15 de Marzo, 2026',
    readTime: '5 min',
    image: '',
  }
];

export default function Blog() {
  return (
    <div className="animate-in fade-in duration-700 min-h-screen pt-12 md:pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="text-center max-w-2xl mx-auto mb-16 md:mb-24"
        >
          <span className="text-nativa tracking-[0.2em] uppercase text-xs font-bold mb-4 block">Diario Botánico</span>
          <h1 className="text-4xl md:text-6xl font-brand text-earth mb-6">Nuestro Blog</h1>
          <p className="text-earth/70 text-lg md:text-xl font-light">
            Reflexiones, guías y saberes sobre el cuidado holístico. Un espacio para reconectar con la naturaleza y tu propio bienestar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {BLOG_POSTS.map((post, i) => (
             <motion.article 
               key={post.id}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5, delay: i * 0.1 }}
               className="group cursor-pointer flex flex-col"
             >
               <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-earth/5 flex items-center justify-center">
                 {post.image ? (
                   <img 
                     src={post.image} 
                     alt={post.title} 
                     className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                   />
                 ) : (
                   <span className="text-earth/40 text-sm uppercase tracking-widest">Sin Imagen</span>
                 )}
                 <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold text-nativa">
                   {post.category}
                 </div>
               </div>
               
               <div className="flex-1 flex flex-col">
                 <div className="flex items-center gap-4 text-xs text-earth/50 mb-3 font-medium">
                   <span className="flex items-center gap-1.5"><Calendar size={14} />{post.date}</span>
                   <span className="flex items-center gap-1.5"><Clock size={14} />{post.readTime}</span>
                 </div>
                 <h2 className="text-2xl font-brand text-earth mb-3 group-hover:text-nativa transition-colors">
                   {post.title}
                 </h2>
                 <p className="text-earth/70 font-light mb-6 flex-1 line-clamp-3">
                   {post.excerpt}
                 </p>
                 <div className="flex items-center gap-2 text-nativa font-medium text-sm mt-auto group-hover:gap-3 transition-all">
                   Leer artículo completo <ArrowRight size={16} />
                 </div>
               </div>
             </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
