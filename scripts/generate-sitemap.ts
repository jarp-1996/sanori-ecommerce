import fs from 'fs';
import path from 'path';

// Parse our firebase applet config to retrieve project and database IDs
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const projectId = config.projectId;
const databaseId = config.firestoreDatabaseId;

const sitemapPath = path.resolve(process.cwd(), 'public/sitemap.xml');

async function generate() {
  console.log('🔄 SÁNORI SEO: Iniciando generación de sitemap.xml dinámico...');
  
  // Base website link
  const baseUrl = 'https://sanori-ecommerce.vercel.app';
  
  // Core static pages
  const urls = [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/tienda`, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/nosotros`, changefreq: 'weekly', priority: '0.7' },
    { loc: `${baseUrl}/blog`, changefreq: 'weekly', priority: '0.7' },
    { loc: `${baseUrl}/talleres`, changefreq: 'weekly', priority: '0.7' },
  ];

  try {
    // Call the public Firestore REST API to listing products directly
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/products`;
    const response = await fetch(firestoreUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.documents && Array.isArray(data.documents)) {
        for (const doc of data.documents) {
          // Document name format: projects/{projectId}/databases/{dbId}/documents/products/{productId}
          const parts = doc.name.split('/');
          const productId = parts[parts.length - 1];
          if (productId) {
            urls.push({
              loc: `${baseUrl}/producto/${productId}`,
              changefreq: 'weekly',
              priority: '0.8'
            });
          }
        }
        console.log(`✅ SÁNORI SEO: Se importaron ${data.documents.length} productos dinámicos desde Firestore.`);
      } else {
        console.log('⚠️ SÁNORI SEO: No se encontraron productos o el catálogo está vacío.');
      }
    } else {
      console.error(`❌ SÁNORI SEO: No se pudo obtener el catálogo de Firestore (Status ${response.status}).`);
    }
  } catch (error) {
    console.error('❌ SÁNORI SEO: Error consultando la API de Firestore:', error);
  }

  // Compile XML content
  const today = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  
  xml += '</urlset>\n';

  // Ensure directories exist
  const publicDir = path.dirname(sitemapPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`🎉 SÁNORI SEO: sitemap.xml generado con éxito (${urls.length} URLs totales) en: ${sitemapPath}`);
}

generate();
