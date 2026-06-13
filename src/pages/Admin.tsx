import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth, storage } from "../lib/firebase";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Product } from "../lib/CartContext";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Settings,
  Package,
  LayoutDashboard,
  Search,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Download,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSiteSettings } from "../lib/SiteSettingsContext";
import { motion } from "motion/react";
import { ImageCropper } from "../components/ImageCropper";
import Papa from "papaparse";

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "settings"
  >("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [stock, setStock] = useState("10");
  const [status, setStatus] = useState<'normal' | 'in_production'>('normal');
  // Cropper State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [currentCropType, setCurrentCropType] = useState<
    "hero" | "about" | "innovate" | "product_image" | null
  >(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadField, setActiveUploadField] = useState<
    "hero" | "about" | "innovate" | null
  >(null);
  const settingsFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "hero" | "about" | "innovate" | "product_image",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageToCrop(url);
    setCurrentCropType(type);
    setCropModalOpen(true);

    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (settingsFileInputRef.current) settingsFileInputRef.current.value = "";
  };

  const handleCropComplete = async (croppedFile: Blob) => {
    setCropModalOpen(false);
    setIsUploading(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        alert("Faltan configurar variables de Cloudinary (VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET)");
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", croppedFile);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Error al subir a Cloudinary");
      }

      const url = data.secure_url;

      if (currentCropType === "hero") {
        setHeroImage(url);
        await setDoc(
          doc(db, "settings", "site"),
          { heroImageUrl: url },
          { merge: true },
        );
      } else if (currentCropType === "about") {
        setAboutImage(url);
        await setDoc(
          doc(db, "settings", "site"),
          { aboutImageUrl: url },
          { merge: true },
        );
      } else if (currentCropType === "innovate") {
        setInnovateImage(url);
        await setDoc(
          doc(db, "settings", "site"),
          { innovateImageUrl: url },
          { merge: true },
        );
      } else if (currentCropType === "product_image") {
        setImageUrl(url);
      }
      
      setIsUploading(false);
      setImageToCrop(null);
      setCurrentCropType(null);
    } catch (err) {
      console.error("Error processing cropped image: ", err);
      alert("Hubo un error al procesar la imagen. Inténtalo de nuevo.");
      setIsUploading(false);
      setImageToCrop(null);
      setCurrentCropType(null);
    }
  };

  // Settings State
  const { settings } = useSiteSettings();
  const [heroImage, setHeroImage] = useState("");
  const [aboutImage, setAboutImage] = useState("");
  const [innovateImage, setInnovateImage] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (settings) {
      setHeroImage(settings.heroImageUrl || "");
      setAboutImage(settings.aboutImageUrl || "");
      setInnovateImage(settings.innovateImageUrl || "");
    }
  }, [settings]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }

    if (isAdmin) {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data: Product[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(data);
      });
      return () => unsubscribe();
    }
  }, [isAdmin, loading, navigate]);

  const openForm = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setName(product.name);
      setDescription(product.description);
      setPrice(product.price.toString());
      setCategory(product.category);
      setImageUrl(product.imageUrl || "");
      setStock(product.stock.toString());
      setStatus(product.status || "normal");
    } else {
      setEditingId(null);
      setName("");
      setDescription("");
      setPrice("");
      setCategory("Jabones");
      setImageUrl("");
      setStock("10");
      setStatus("normal");
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl,
        stock: parseInt(stock, 10),
        status,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error guardando el producto. Revisa tus permisos o reglas.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await setDoc(
        doc(db, "settings", "site"),
        {
          heroImageUrl: heroImage,
          aboutImageUrl: aboutImage,
          innovateImageUrl: innovateImage,
        },
        { merge: true },
      );
      alert("Configuración guardada exitosamente.");
    } catch (err) {
      console.error(err);
      alert("Error guardando configuraciones.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const importCsvRef = useRef<HTMLInputElement>(null);

  const handleExportCsvTemplate = () => {
    const csvContent = Papa.unparse([
      {
        name: "Ejemplo de Producto",
        description: "Descripción del producto detallado",
        price: 25.5,
        category: "Jabones",
        stock: 10,
        imageUrl: "",
      },
    ]);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "plantilla_productos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          let importedCount = 0;
          for (const row of rows) {
            if (row.name && row.price) {
              await addDoc(collection(db, "products"), {
                name: row.name,
                description: row.description || "",
                price: parseFloat(row.price) || 0,
                category: row.category || "Jabones",
                stock: parseInt(row.stock, 10) || 10,
                imageUrl: row.imageUrl || "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              importedCount++;
            }
          }
          alert(`Se importaron ${importedCount} productos correctamente.`);
        } catch (err) {
          console.error("Error importando:", err);
          alert("Ocurrió un error al importar los productos.");
        } finally {
          setIsUploading(false);
          if (importCsvRef.current) importCsvRef.current.value = "";
        }
      },
      error: (error) => {
        console.error("Error parseando CSV:", error);
        alert("Ocurrió un error leyendo el archivo CSV.");
        setIsUploading(false);
      },
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Seguro que deseas eliminar este producto?")) {
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Derived metrics
  const totalProducts = products.length;
  const categoriesCount = new Set(products.map((p) => p.category)).size;
  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) return null;
  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-offwhite border border-kraft/30 p-6 rounded-2xl shadow-sm sticky top-28">
          <h1 className="text-2xl font-brand text-earth mb-8">Panel Admin</h1>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === "overview"
                  ? "bg-earth text-offwhite font-medium shadow-md"
                  : "text-earth hover:bg-mustard/10"
              }`}
            >
              <LayoutDashboard size={20} />{" "}
              <span className="uppercase text-xs tracking-widest">Resumen</span>
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === "products"
                  ? "bg-earth text-offwhite font-medium shadow-md"
                  : "text-earth hover:bg-mustard/10"
              }`}
            >
              <Package size={20} />{" "}
              <span className="uppercase text-xs tracking-widest">
                Catálogo
              </span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === "settings"
                  ? "bg-earth text-offwhite font-medium shadow-md"
                  : "text-earth hover:bg-mustard/10"
              }`}
            >
              <ImageIcon size={20} />{" "}
              <span className="uppercase text-xs tracking-widest">
                Contenido
              </span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-brand text-earth mb-2">
                Vista General
              </h2>
              <p className="text-earth-light">
                Métricas clave de tu tienda holística.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-offwhite border border-earth/10 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Package size={100} />
                </div>
                <p className="text-xs uppercase tracking-widest text-earth/60 mb-2">
                  Total Productos
                </p>
                <p className="text-4xl font-brand text-earth">
                  {totalProducts}
                </p>
              </div>
              <div className="bg-offwhite border border-earth/10 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                  <LayoutDashboard size={100} />
                </div>
                <p className="text-xs uppercase tracking-widest text-earth/60 mb-2">
                  Categorías Activas
                </p>
                <p className="text-4xl font-brand text-earth">
                  {categoriesCount}
                </p>
              </div>
              <div className="bg-mustard/10 border border-mustard/30 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 text-mustard group-hover:scale-110 transition-transform">
                  <AlertCircle size={100} />
                </div>
                <p className="text-xs uppercase tracking-widest text-earth/80 mb-2">
                  Poco Stock ({"≤"}5)
                </p>
                <p className="text-4xl font-brand text-earth">
                  {lowStockCount}
                </p>
              </div>
              <div className="bg-kraft/10 border border-kraft/30 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 text-kraft group-hover:scale-110 transition-transform">
                  <X size={100} />
                </div>
                <p className="text-xs uppercase tracking-widest text-earth/80 mb-2">
                  Sin Stock
                </p>
                <p className="text-4xl font-brand text-earth">
                  {outOfStockCount}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "products" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-brand text-earth mb-1">
                  Catálogo de Productos
                </h2>
                <p className="text-earth-light text-sm">
                  Gestiona tu inventario, precios y detalles.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportCsvTemplate}
                  className="bg-transparent border border-earth/20 text-earth px-4 py-2 sm:py-3 rounded-full flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs uppercase tracking-widest font-bold hover:bg-earth/5 transition-all"
                  title="Descargar plantilla de Excel (CSV) para productos"
                >
                  <Download size={16} /> Plantilla
                </button>
                <button
                  onClick={() => importCsvRef.current?.click()}
                  disabled={isUploading}
                  className="bg-background text-earth border border-earth/20 px-4 py-2 sm:py-3 rounded-full flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs uppercase tracking-widest font-bold hover:bg-earth/5 transition-all disabled:opacity-50"
                  title="Importar productos desde Excel (CSV)"
                >
                  <Upload size={16} />{" "}
                  {isUploading ? "Importando..." : "Importar"}
                </button>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={importCsvRef}
                  onChange={handleImportCsv}
                />
                <button
                  onClick={() => openForm()}
                  className="bg-earth hover:bg-kraft text-offwhite px-4 py-2 sm:py-3 sm:px-5 rounded-full flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs uppercase tracking-widest font-bold transition-all shadow-md hover:shadow-lg"
                >
                  <Plus size={16} /> Nuevo
                </button>
              </div>
            </div>

            <div className="bg-offwhite border border-earth/10 p-2 sm:p-4 rounded-2xl shadow-sm">
              <div className="mb-4 relative max-w-sm">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-earth/40"
                />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 py-2 border border-earth/10 rounded-xl bg-background outline-none text-sm focus:border-mustard transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-earth/5">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-background text-earth text-xs uppercase tracking-wider border-b border-earth/10">
                    <tr>
                      <th className="p-4 font-medium">Producto</th>
                      <th className="p-4 font-medium">Categoría</th>
                      <th className="p-4 font-medium">Precio</th>
                      <th className="p-4 font-medium">Stock</th>
                      <th className="p-4 font-medium">Estado</th>
                      <th className="p-4 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-earth/5">
                    {filteredProducts.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-mustard/5 transition-colors"
                      >
                        <td className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 bg-background rounded-xl overflow-hidden flex-shrink-0 border border-earth/5">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-earth/40 italic">
                                No Img
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-earth block mb-0.5">
                              {p.name}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-earth/50">
                              ID: {p.id.slice(0, 8)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-earth-light">
                          <span className="bg-background border border-earth/10 px-2.5 py-1 rounded-md text-xs">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-4 text-earth font-medium">
                          S/ {p.price.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${p.stock === 0 ? "bg-kraft/10 text-kraft" : p.stock <= 5 ? "bg-mustard/20 text-earth" : "bg-nativa/10 text-nativa"}`}
                          >
                            {p.stock} unid.
                          </span>
                        </td>
                        <td className="p-4">
                          {p.status === "in_production" ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-nativa border border-nativa/20">
                              En Producción
                            </span>
                          ) : p.stock === 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-kraft/10 text-kraft">
                              Agotado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-background text-earth/60">
                              Activo
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openForm(p)}
                              className="p-2 hover:bg-mustard/20 hover:text-earth rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-2 hover:bg-kraft/10 hover:text-kraft rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-12 text-center text-earth/60"
                        >
                          {searchTerm
                            ? "No se encontraron productos para tu búsqueda."
                            : "No hay productos todavía. ¡Crea el primero!"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-3xl font-brand text-earth mb-1">
                Contenido Visual
              </h2>
              <p className="text-earth-light text-sm">
                Actualiza las imágenes que se muestran en el sitio.
              </p>
            </div>

            <div className="bg-offwhite border border-earth/10 p-6 sm:p-8 rounded-2xl shadow-sm max-w-2xl">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={settingsFileInputRef}
                onChange={(e) => {
                  if (activeUploadField)
                    handleImageSelect(e, activeUploadField);
                }}
              />
              <form onSubmit={handleSaveSettings} className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-earth font-medium">
                    Banner Principal (Inicio)
                  </label>
                  <p className="text-[10px] text-earth/60">
                    Se muestra ocupando gran parte de la pantalla de inicio.{" "}
                    <br />
                    <strong className="text-earth/80">
                      Resolución recomendada: 1200x1600px o 1440x1920px (Formato
                      vertical 16:9 apaisado o algo que destaque).
                    </strong>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={heroImage}
                      onChange={(e) => setHeroImage(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 w-full border border-earth/20 p-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveUploadField("hero");
                        settingsFileInputRef.current?.click();
                      }}
                      disabled={isUploading}
                      className="px-4 border border-earth/20 rounded-xl hover:bg-earth/5 transition-colors flex items-center justify-center text-earth"
                    >
                      <Upload size={16} />
                    </button>
                  </div>
                  {heroImage && (
                    <div className="mt-3 rounded-xl overflow-hidden h-40 border border-earth/10 relative group">
                      <img
                        src={heroImage}
                        alt="hero preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-earth font-medium">
                    Imagen "Nuestra Historia"
                  </label>
                  <p className="text-[10px] text-earth/60">
                    Se utiliza en la sección destacada de la historia. <br />
                    <strong className="text-earth/80">
                      Resolución recomendada: 1000x1200px (Formato apaisado o
                      retrato).
                    </strong>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={aboutImage}
                      onChange={(e) => setAboutImage(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 w-full border border-earth/20 p-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveUploadField("about");
                        settingsFileInputRef.current?.click();
                      }}
                      disabled={isUploading}
                      className="px-4 border border-earth/20 rounded-xl hover:bg-earth/5 transition-colors flex items-center justify-center text-earth"
                    >
                      <Upload size={16} />
                    </button>
                  </div>
                  {aboutImage && (
                    <div className="mt-3 rounded-xl overflow-hidden h-40 border border-earth/10 relative group">
                      <img
                        src={aboutImage}
                        alt="about preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-earth font-medium">
                    Imagen "Así innovamos"
                  </label>
                  <p className="text-[10px] text-earth/60">
                    Se utiliza para acompañar la sección de innovación o de
                    proceso. <br />
                    <strong className="text-earth/80">
                      Resolución recomendada: 1200x800px (Formato horizontal).
                    </strong>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={innovateImage}
                      onChange={(e) => setInnovateImage(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 w-full border border-earth/20 p-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveUploadField("innovate");
                        settingsFileInputRef.current?.click();
                      }}
                      disabled={isUploading}
                      className="px-4 border border-earth/20 rounded-xl hover:bg-earth/5 transition-colors flex items-center justify-center text-earth"
                    >
                      <Upload size={16} />
                    </button>
                  </div>
                  {innovateImage && (
                    <div className="mt-3 rounded-xl overflow-hidden h-40 border border-earth/10 relative group">
                      <img
                        src={innovateImage}
                        alt="innovate preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-earth/10">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-3 bg-earth hover:bg-kraft text-offwhite rounded-full uppercase tracking-widest text-xs font-bold transition-all shadow-md disabled:opacity-50"
                  >
                    {isSavingSettings
                      ? "Guardando..."
                      : "Guardar Configuración"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </main>

      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-offwhite border border-earth/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="bg-earth text-offwhite p-6 flex justify-between items-center">
              <div>
                <h2 className="font-brand text-2xl">
                  {editingId ? "Editar Producto" : "Añadir Producto"}
                </h2>
                <p className="text-white/60 text-xs mt-1 uppercase tracking-widest">
                  Completa los detalles
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="p-6 space-y-5 overflow-y-auto custom-scrollbar"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-earth/70 mb-2">
                  Nombre del producto
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-earth/20 px-4 py-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-earth/70 mb-2">
                  Descripción
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-earth/20 px-4 py-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-earth/70 mb-2">
                    Precio (S/)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-earth/20 px-4 py-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-earth/70 mb-2">
                    Categoría
                  </label>
                  <input
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-earth/20 px-4 py-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-earth/70 mb-2">
                    Stock Ini.
                  </label>
                  <input
                    required
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full border border-earth/20 px-4 py-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-earth/70 mb-2">
                    Visualización
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "normal" | "in_production")}
                    className="w-full border border-earth/20 px-4 py-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="in_production">En Producción</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-earth/70 mb-2">
                    Imagen del Producto
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full border border-earth/20 px-4 py-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => handleImageSelect(e, "product_image")}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1 flex items-center justify-center gap-2 py-2 border border-earth/20 rounded-xl text-xs uppercase tracking-widest font-bold text-earth hover:bg-earth/5 transition-colors"
                      >
                        <Upload size={14} />{" "}
                        {isUploading ? "Subiendo..." : "Subir Imagen"}
                      </button>
                    </div>
                  </div>
                  {imageUrl && (
                    <div className="mt-2 h-20 w-20 rounded-xl overflow-hidden border border-earth/10 flex-shrink-0">
                      <img
                        src={imageUrl}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 mt-2 border-t border-earth/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-earth border border-earth/20 rounded-full uppercase tracking-widest text-xs font-bold hover:bg-earth/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-earth hover:bg-kraft text-offwhite rounded-full uppercase tracking-widest text-xs font-bold transition-all shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Cropper Modal */}
      {cropModalOpen && imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropModalOpen(false);
            setImageToCrop(null);
            setCurrentCropType(null);
          }}
          aspectRatio={
            currentCropType === "product_image"
              ? 1
              : currentCropType === "innovate"
                ? 1200 / 800
                : currentCropType === "hero"
                  ? 3 / 4
                  : 1000 / 1200 // about
          }
        />
      )}
    </div>
  );
}
