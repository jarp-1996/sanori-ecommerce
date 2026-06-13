import { motion } from 'motion/react';
import { Mail, CalendarDays, MapPin, Leaf } from 'lucide-react';

const WORKSHOPS = [
  {
    id: '1',
    title: 'Creación de Jabones Intencionados',
    date: 'Sábado 24 de Junio',
    time: '10:00 AM - 01:00 PM',
    location: 'Miraflores, Lima',
    price: 'S/ 150.00',
    description: 'Aprende las bases de la saponificación en frío y cómo utilizar hierbas y aceites esenciales para crear jabones únicos con propósitos específicos. Incluye materiales y tu propio lote de 4 jabones para llevar.',
    image: '',
    level: 'Principiantes'
  },
  {
    id: '2',
    title: 'Introducción a la Aromaterapia y Blends',
    date: 'Domingo 9 de Julio',
    time: '03:00 PM - 06:00 PM',
    location: 'Barranco, Lima',
    price: 'S/ 120.00',
    description: 'Descubre el poder de los aceites esenciales, cómo realizar diluciones seguras y crea tu propio roll-on terapéutico para enfocar la mente o facilitar el descanso profundo.',
    image: '',
    level: 'Todos los niveles'
  }
];

export default function Workshops() {
  return (
    <div className="animate-in fade-in duration-700 min-h-screen pt-12 md:pt-24 pb-20 bg-nativa/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="text-center max-w-3xl mx-auto mb-16 md:mb-24"
        >
          <span className="text-nativa tracking-[0.2em] uppercase text-xs font-bold mb-4 block">Aprende con Sánori</span>
          <h1 className="text-4xl md:text-6xl font-brand text-earth mb-6">Talleres y Experiencias</h1>
          <p className="text-earth/70 text-lg font-light">
            Comparte con nosotros la magia de la cosmética holística. Nuestros talleres presenciales están diseñados para brindarte herramientas prácticas de bienestar mientras reconectas con saberes botánicos ancestrales.
          </p>
        </motion.div>

        <div className="space-y-12 md:space-y-16">
          {WORKSHOPS.map((workshop, i) => (
             <motion.div 
               key={workshop.id}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6 }}
               className="bg-background rounded-3xl overflow-hidden shadow-sm border border-earth/5 flex flex-col lg:flex-row group"
             >
               <div className="lg:w-2/5 xl:w-1/2 relative min-h-[300px] lg:min-h-full bg-earth/5 flex items-center justify-center">
                 {workshop.image ? (
                   <img 
                     src={workshop.image} 
                     alt={workshop.title} 
                     className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" 
                   />
                 ) : (
                   <span className="text-earth/40 text-sm uppercase tracking-widest block py-20 lg:py-0">Sin Imagen</span>
                 )}
                 <div className="absolute top-4 left-4 bg-background px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold text-nativa shadow border border-earth/5">
                   {workshop.level}
                 </div>
               </div>
               
               <div className="lg:w-3/5 xl:w-1/2 p-8 md:p-12 xl:p-16 flex flex-col justify-center relative">
                  <h2 className="text-3xl lg:text-4xl font-brand text-earth mb-6">
                    {workshop.title}
                  </h2>
                  <p className="text-earth/70 font-light mb-8 leading-relaxed">
                    {workshop.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-earth/80 font-medium mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-nativa/10 text-nativa flex items-center justify-center shrink-0">
                        <CalendarDays size={20} />
                      </div>
                      <div>
                        <div className="block">{workshop.date}</div>
                        <div className="font-light text-earth/60">{workshop.time}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-nativa/10 text-nativa flex items-center justify-center shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <div className="block">{workshop.location}</div>
                        <div className="font-light text-earth/60">Cupos limitados</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6 mt-auto">
                    <div className="text-2xl font-bold text-earth">{workshop.price}</div>
                    <a 
                      href="mailto:hola@sanori.pe?subject=Informacion%20sobre%20taller"
                      className="w-full sm:w-auto text-center bg-nativa text-white px-8 py-4 rounded-full uppercase tracking-wider font-bold text-xs hover:bg-earth transition-colors flex items-center justify-center gap-2"
                    >
                      <Mail size={16} /> Solicitar Información
                    </a>
                  </div>
               </div>
             </motion.div>
          ))}
        </div>
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="mt-20 text-center bg-nativa text-white rounded-3xl p-10 md:p-16 relative overflow-hidden"
        >
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-3xl font-brand mb-4">¿Quieres un taller corporativo o privado?</h3>
            <p className="font-light text-white/80 mb-8">
              Llevamos la experiencia Sánori a tu empresa o grupo de amigas. Contáctanos para diseñar un taller de cosmética natural y bienestar a medida.
            </p>
            <a 
              href="mailto:hola@sanori.pe?subject=Taller%20Privado"
              className="bg-white text-nativa px-8 py-4 rounded-full uppercase tracking-wider font-bold text-xs hover:bg-earth hover:text-white transition-colors inline-block"
            >
              Escríbenos
            </a>
          </div>
          <div className="absolute -bottom-24 -right-24 text-white/10 pointer-events-none">
            <Leaf size={300} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
