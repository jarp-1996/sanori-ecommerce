import { useSiteSettings } from "../lib/SiteSettingsContext";
import { motion } from "motion/react";

export default function About() {
  const { settings, loading } = useSiteSettings();

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 md:py-32">
        <div className="text-center mb-16 md:mb-24">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-nativa/80 font-medium tracking-[0.2em] uppercase text-[10px] mb-8 block"
          >
            Nuestra Filosofía
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-[8rem] font-brand text-earth mb-8 leading-none"
          >
            Menos es más.
          </motion.h1>
        </div>

        {!loading && settings?.aboutImageUrl && (
          <div className="w-full aspect-video md:aspect-[21/9] overflow-hidden mb-24 md:mb-32">
            <img
              src={settings.aboutImageUrl}
              alt="Nuestra Historia"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-12 text-lg md:text-xl text-earth/70 font-light leading-relaxed text-center">
          <p>
            <strong>"Sánori"</strong> proviene de la lengua amazónica Asháninka y significa 
            <em>"verdadero, genuino o puro"</em>. Elegimos esta palabra porque encarna el corazón de 
            nuestra marca: volver a nuestro origen, conectando con las raíces puras y verdaderas de la 
            madre tierra, la Amazonía y los Andes del Perú. Nuestros productos no pretenden esconder ni 
            cambiar tu naturaleza, sino celebrarla de la manera más genuina y franca posible.
          </p>

          <p>
            En Sánori, creemos que el cuidado personal no debería venir a expensas
            de nuestro planeta ni de los animales. Nacimos de la necesidad de
            encontrar productos intencionados, artesanales y, sobre todo,
            transparentes en su formulación.
          </p>

          <p>
            Nos enfocamos en una tienda donde menos es más. No te abrumaremos
            con mil opciones idénticas; nuestra selección está cuidadosamente
            curada para ofrecerte lo mejor de la cosmética natural, jabones
            artesanales con procesos en frío, desodorantes libres de aluminio y
            alternativas sostenibles como las pastillas de crema dental.
          </p>
        </div>
      </div>

      <div className="bg-offwhite py-24 md:py-32 w-full mt-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center text-lg md:text-xl text-earth/70 font-light leading-relaxed">
          <h3 className="text-4xl md:text-5xl font-brand text-earth mb-12 tracking-tight">
            Ingredientes Puros
          </h3>
          <p>
            No usamos conservantes químicos, aromas sintéticos ni colorantes
            artificiales. Trabajamos con la riqueza de la naturaleza,
            incorporando insumos andinos y amazónicos como la harina de açai y
            el camu camu, integrando la sabiduría tradicional a tu rutina
            diaria.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-24 md:py-32 text-lg md:text-xl text-earth/70 font-light leading-relaxed text-center">
        <p>
          Llevamos nuestro catálogo, incluyendo marcas como YOZE y otras líneas
          consientes, a todo el país. Creemos que la cosmética viva debe estar
          al alcance de todos los que buscan un cambio en su estilo de vida,
          asegurando siempre entregas responsables.
        </p>
      </div>
    </div>
  );
}
