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
  ShoppingBag,
  Bell,
  Mail,
  MailOpen,
  CheckCircle,
  Clock,
  Truck,
  CreditCard,
  Check,
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
    "overview" | "products" | "settings" | "orders"
  >("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Orders & Notifications State
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'pending' | 'prepared' | 'shipped' | 'delivered'>('all');
  const [activeOrdersSubTab, setActiveOrdersSubTab] = useState<'list' | 'inbox'>('list');
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("read_order_notifications");
    if (saved) {
      setReadNotificationIds(JSON.parse(saved));
    }
  }, []);

  const markNotificationAsRead = (orderId: string) => {
    if (!readNotificationIds.includes(orderId)) {
      const updated = [...readNotificationIds, orderId];
      setReadNotificationIds(updated);
      localStorage.setItem("read_order_notifications", JSON.stringify(updated));
    }
  };

  const unreadCount = useMemo(() => {
    return orders.filter(o => !readNotificationIds.includes(o.id)).length;
  }, [orders, readNotificationIds]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = 
        (o.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.customerEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.customerPhone || "").includes(searchTerm) ||
        (o.id || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchFilter = ordersFilter === 'all' ? true : o.status === ordersFilter;
      return matchSearch && matchFilter;
    });
  }, [orders, ordersFilter, searchTerm]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
      }

      // Notificar automáticamente por WhatsApp si la API autohospedada está activa
      if (settings?.whatsappEnabled && settings?.whatsappApiUrl) {
        const orderData = orders.find(o => o.id === orderId);
        if (orderData && orderData.customerPhone) {
          let statusLabel = "";
          let advice = "";
          if (newStatus === "prepared") {
            statusLabel = "PREPARADO 📦";
            advice = "Hemos verificado tus detalles y nuestros artesanos ya comenzaron a preparar tu lote con insumos botánicos frescos de esta temporada.";
          } else if (newStatus === "shipped") {
            statusLabel = "DSPACHADO & EN CAMINO 🚚";
            advice = "Tu pedido ya se encuentra bajo la responsabilidad de nuestro courier y está rumbo a tu dirección de destino. ¡Esperamos que lo disfrutes mucho!";
          } else if (newStatus === "completed") {
            statusLabel = "ENTREGADO 🎉";
            advice = "¡Tu pedido ha sido marcado como entregado exitosamente! Nos encantaría saber tu opinión sobre tu nueva rutina de bienestar.";
          }

          if (statusLabel) {
            const clientMessageText = `🌿 *Sánori - Actualización de tu Pedido* 🌿\n\n` +
              `¡Hola *${orderData.customerName}*! Tu pedido de Sánori con ID \`${orderId}\` ha cambiado de estado.\n\n` +
              `*Nuevo Estado:* ${statusLabel}\n\n` +
              `${advice}\n\n` +
              `Cualquier consulta adicional puedes escribirnos por este medio. ¡Muchas gracias por tu amor a lo natural!`;

            let cleanPhone = orderData.customerPhone.replace(/\D/g, "");
            if (cleanPhone.length === 9) {
              cleanPhone = "51" + cleanPhone;
            }

            fetch(settings.whatsappApiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                number: cleanPhone,
                message: clientMessageText,
                token: settings.whatsappToken || "",
                session: settings.whatsappSession || "sanori"
              })
            }).catch(e => console.error("Error al disparar notificación de WhatsApp:", e));
          }
        }
      }
    } catch (err: any) {
      console.error("Error updating order status:", err);
      alert("No se pudo actualizar el estado del pedido: " + (err?.message || String(err)));
    }
  };

  const togglePaymentVerification = async (orderId: string, currentVerified: boolean) => {
    try {
      const nextVerified = !currentVerified;
      await updateDoc(doc(db, "orders", orderId), {
        paymentVerified: nextVerified,
        updatedAt: serverTimestamp()
      });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => prev ? { ...prev, paymentVerified: nextVerified } : null);
      }

      // Notificar automáticamente cuando se marque verificado (pagado)
      if (nextVerified && settings?.whatsappEnabled && settings?.whatsappApiUrl) {
        const orderData = orders.find(o => o.id === orderId);
        if (orderData && orderData.customerPhone) {
          const clientMessageText = `🌿 *Sánori - ¡Pago Verificado!* ✅\n\n` +
            `¡Hola *${orderData.customerName}*!\n\nHemos verificado correctamente tu comprobante por un valor de *S/ ${(orderData.total || 0).toFixed(2)}* para el ID de pedido \`${orderId}\`.\n\nTu orden ha avanzado a la cola de preparación en nuestro taller artesanal. Te notificaremos de inmediato en cuanto sea despachado. ¡Gracias por confiar en Sánori! 🌸`;

          let cleanPhone = orderData.customerPhone.replace(/\D/g, "");
          if (cleanPhone.length === 9) {
            cleanPhone = "51" + cleanPhone;
          }

          fetch(settings.whatsappApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              number: cleanPhone,
              message: clientMessageText,
              token: settings.whatsappToken || "",
              session: settings.whatsappSession || "sanori"
            })
          }).catch(e => console.error("Error al disparar WhatsApp de Pago Verificado:", e));
        }
      }
    } catch (err: any) {
      console.error("Error updating payment verification:", err);
      alert("No se pudo actualizar el estado de verificación de pago: " + (err?.message || String(err)));
    }
  };

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
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappApiUrl, setWhatsappApiUrl] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappSession, setWhatsappSession] = useState("sanori");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (settings) {
      setHeroImage(settings.heroImageUrl || "");
      setAboutImage(settings.aboutImageUrl || "");
      setInnovateImage(settings.innovateImageUrl || "");
      setTelegramEnabled(!!settings.telegramEnabled);
      setTelegramBotToken(settings.telegramBotToken || "");
      setTelegramChatId(settings.telegramChatId || "");
      setWhatsappEnabled(!!settings.whatsappEnabled);
      setWhatsappApiUrl(settings.whatsappApiUrl || "");
      setWhatsappToken(settings.whatsappToken || "");
      setWhatsappSession(settings.whatsappSession || "sanori");
    }
  }, [settings]);

  const testTelegramMessage = async () => {
    if (!telegramBotToken || !telegramChatId) {
      alert("Por favor ingresa un Token de Bot y un Chat ID primero.");
      return;
    }
    try {
      const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: "🌿 *Sánori - Compra Consciente*\n\n¡Prueba exitosa! Este es un mensaje de prueba de tu sistema de ventas para recibir las compras en tiempo real.",
          parse_mode: "Markdown"
        })
      });
      if (response.ok) {
        alert("¡Mensaje de prueba enviado! Revisa tu chat en Telegram.");
      } else {
        const data = await response.json();
        alert(`Error al enviar: ${data.description || "Verifica las credenciales"}`);
      }
    } catch (err: any) {
      alert(`Error al enviar: ${err.message || String(err)}`);
    }
  };

  const testWhatsappMessage = async () => {
    if (!whatsappApiUrl) {
      alert("Por favor ingresa la URL de tu API de WhatsApp primero.");
      return;
    }
    const testNum = prompt("Ingresa el número de teléfono para la prueba (con código de país, ej: 51987654321):", "51999999999");
    if (!testNum) return;
    
    try {
      const response = await fetch(whatsappApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: testNum.replace(/\D/g, ''),
          message: "🌿 *Sánori - Notificaciones*\n\n¡Prueba exitosa! Este es un mensaje automatizado desde tu sistema de ventas Sánori a través de tu API de WhatsApp autohospedada.",
          token: whatsappToken,
          session: whatsappSession
        })
      });
      if (response.ok) {
        alert(`¡Petición enviada exitosamente al número ${testNum}! Revisa el chat de WhatsApp.`);
      } else {
        alert(`Error: servidor respondió con código ${response.status}. Verifica que la sesión de tu API esté activa.`);
      }
    } catch (err: any) {
      alert(`Error de red/conexión al conectar con tu API de WhatsApp: ${err.message || String(err)}`);
    }
  };

  const getWhatsAppManualUrl = (order: any, type: 'payment_pending' | 'payment_verified' | 'order_shipped') => {
    if (!order) return '';
    const name = order.customerName || 'Cliente';
    const id = order.id;
    const total = (order.total || 0).toFixed(2);
    
    let text = "";
    if (type === 'payment_pending') {
      text = `¡Hola *${name}*! 🌿 Te saluda Sánori.\n\nVimos que registraste un pedido con el ID \`${id}\` por un total de *S/ ${total}*.\n\nQueremos ayudarte a finalizar tu compra de cosmética viva artesanal. ¿Pudiste realizar tu pago por Yape o Tarjeta? Si es así, por favor compártenos el comprobante por aquí para agendar tu envío hoy mismo. ¡Muchas gracias!`;
    } else if (type === 'payment_verified') {
      text = `¡Hola *${name}*! 🌿 Excelentes noticias.\n\nHemos verificado con éxito tu pago de *S/ ${total}* para tu pedido de Sánori (ID: \`${id}\`).\n\nNuestros artesanos ya comenzaron a prepararlo en el taller de Sánori con insumos frescos de temporada. ¡Gracias por elegir bienestar consciente!`;
    } else if (type === 'order_shipped') {
      text = `¡Hola *${name}*! 🌿 Te saluda Sánori.\n\nTe escribimos para avisarte que tu pedido (ID: \`${id}\`) ya fue despachado y se encuentra en camino a tu dirección de envío. 🚚\n\nEsperamos que lo disfrutes mucho y que te brinde una experiencia única y natural.`;
    }
    
    const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
    const prefix = cleanPhone.length === 9 ? '51' : '';
    return `https://wa.me/${prefix}${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

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

  useEffect(() => {
    if (isAdmin) {
      const qOrders = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
        const fetchedOrders: any[] = [];
        snapshot.forEach((doc) => {
          fetchedOrders.push({ id: doc.id, ...doc.data() });
        });
        setOrders(fetchedOrders);
      });
      return () => unsubscribeOrders();
    }
  }, [isAdmin]);

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
          telegramEnabled: telegramEnabled,
          telegramBotToken: telegramBotToken,
          telegramChatId: telegramChatId,
          whatsappEnabled: whatsappEnabled,
          whatsappApiUrl: whatsappApiUrl,
          whatsappToken: whatsappToken,
          whatsappSession: whatsappSession,
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
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === "orders"
                  ? "bg-earth text-offwhite font-medium shadow-md"
                  : "text-earth hover:bg-mustard/10"
              }`}
            >
              <ShoppingBag size={20} />{" "}
              <span className="uppercase text-xs tracking-widest flex items-center justify-between w-full">
                <span>Pedidos</span>
                {unreadCount > 0 && (
                  <span className="bg-kraft text-offwhite text-[10px] h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
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

                {/* CONFIGURACIÓN DE NOTIFICACIONES TELEGRAM */}
                <div className="pt-6 border-t border-earth/10 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-earth flex items-center gap-2">
                    <span>📢 Notificaciones de Compras (Telegram)</span>
                  </h3>
                  <p className="text-[11px] text-earth-light leading-relaxed">
                    Recibe un mensaje automático en tu celular por Telegram cada vez que un cliente complete su pago o registre un pedido.
                  </p>
                  
                  <div className="flex items-center gap-3 bg-earth/5 p-3 rounded-xl border border-earth/10">
                    <input
                      type="checkbox"
                      id="telegramEnabled"
                      checked={telegramEnabled}
                      onChange={(e) => setTelegramEnabled(e.target.checked)}
                      className="w-4 h-4 accent-nativa cursor-pointer"
                    />
                    <label htmlFor="telegramEnabled" className="text-xs font-semibold text-earth cursor-pointer select-none">
                      Activar alertas en tiempo real
                    </label>
                  </div>

                  {telegramEnabled && (
                    <div className="space-y-4 pt-2 animate-in fade-in">
                      <div className="space-y-1">
                        <label className="block text-[11px] uppercase tracking-widest text-earth/70 font-semibold">
                          Token del Bot (HTTP API Token)
                        </label>
                        <input
                          type="text"
                          value={telegramBotToken}
                          onChange={(e) => setTelegramBotToken(e.target.value)}
                          placeholder="Ej: 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                          className="w-full border border-earth/20 p-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] uppercase tracking-widest text-earth/70 font-semibold">
                          Chat ID (Tu número identificador)
                        </label>
                        <input
                          type="text"
                          value={telegramChatId}
                          onChange={(e) => setTelegramChatId(e.target.value)}
                          placeholder="Ej: 987654321"
                          className="w-full border border-earth/20 p-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={testTelegramMessage}
                          className="mt-2 text-[10px] text-nativa uppercase tracking-widest font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          🧪 Enviar mensaje de prueba
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CONFIGURACIÓN DE NOTIFICACIONES WHATSAPP AUTOMÁTICAS */}
                <div className="pt-6 border-t border-earth/10 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-earth flex items-center gap-2">
                    <span>🟢 Mensajería de Clientes Automatizada (WhatsApp API)</span>
                  </h3>
                  <p className="text-[11px] text-earth-light leading-relaxed">
                    Envía avisos automáticos por WhatsApp a tus clientes cuando realicen una compra, su pago sea verificado y cuando despaches su pedido. Utiliza una API autohospedada gratuita para no pagar comisiones.
                  </p>

                  <div className="flex items-center gap-3 bg-earth/5 p-3 rounded-xl border border-earth/10">
                    <input
                      type="checkbox"
                      id="whatsappEnabled"
                      checked={whatsappEnabled}
                      onChange={(e) => setWhatsappEnabled(e.target.checked)}
                      className="w-4 h-4 accent-nativa cursor-pointer"
                    />
                    <label htmlFor="whatsappEnabled" className="text-xs font-semibold text-earth cursor-pointer select-none">
                      Activar respuestas de WhatsApp automatizadas
                    </label>
                  </div>

                  {whatsappEnabled && (
                    <div className="space-y-4 pt-2 animate-in fade-in">
                      <div className="space-y-1">
                        <label className="block text-[11px] uppercase tracking-widest text-earth/70 font-semibold">
                          URL de tu API de WhatsApp
                        </label>
                        <input
                          type="url"
                          value={whatsappApiUrl}
                          onChange={(e) => setWhatsappApiUrl(e.target.value)}
                          placeholder="Ej: http://localhost:8080/api/sendText o https://tu-api.railway.app/send-message"
                          className="w-full border border-earth/20 p-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors text-xs font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[11px] uppercase tracking-widest text-earth/70 font-semibold">
                            Token de Seguridad / API Key
                          </label>
                          <input
                            type="password"
                            value={whatsappToken}
                            onChange={(e) => setWhatsappToken(e.target.value)}
                            placeholder="Opcional"
                            className="w-full border border-earth/20 p-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] uppercase tracking-widest text-earth/70 font-semibold">
                            ID de Sesión (Session ID)
                          </label>
                          <input
                            type="text"
                            value={whatsappSession}
                            onChange={(e) => setWhatsappSession(e.target.value)}
                            placeholder="Ej: sanori"
                            className="w-full border border-earth/20 p-3 outline-none focus:border-nativa rounded-xl bg-background transition-colors text-xs font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={testWhatsappMessage}
                        className="mt-2 text-[10px] text-nativa uppercase tracking-widest font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        🧪 Enviar WhatsApp de prueba a número custom
                      </button>
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

        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Tab Header & Quick Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-brand text-earth mb-1">
                  Control de Pedidos
                </h2>
                <p className="text-earth-light text-sm">
                  Valida pagos, gestiona estados de entrega y revisa alertas de venta gratuitas.
                </p>
              </div>

              {/* Sub-tabs: Inbox vs List */}
              <div className="bg-kraft-light/20 p-1 rounded-xl border border-kraft/20 flex gap-1">
                <button
                  onClick={() => setActiveOrdersSubTab('list')}
                  className={`px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold transition-all ${
                    activeOrdersSubTab === 'list'
                      ? 'bg-earth text-offwhite shadow-sm'
                      : 'text-earth hover:bg-earth/5'
                  }`}
                >
                  Gestión de Pedidos
                </button>
                <button
                  onClick={() => setActiveOrdersSubTab('inbox')}
                  className={`px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2 ${
                    activeOrdersSubTab === 'inbox'
                      ? 'bg-earth text-offwhite shadow-sm'
                      : 'text-earth hover:bg-earth/5'
                  }`}
                >
                  <Bell size={14} className={unreadCount > 0 ? "text-mustard animate-bounce" : ""} />
                  Buzón de Ventas
                  {unreadCount > 0 && (
                    <span className="bg-kraft text-offwhite text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* List Tracking Subtab */}
            {activeOrdersSubTab === 'list' && (
              <div className="space-y-6">
                {/* Search & Status Filters */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                  {/* Status buttons */}
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'pending', 'prepared', 'shipped', 'delivered'] as const).map((filter) => {
                      const labels = {
                        all: 'Todos',
                        pending: 'Por preparar',
                        prepared: 'Preparado',
                        shipped: 'Enviado',
                        delivered: 'Recibido'
                      };
                      const active = ordersFilter === filter;
                      return (
                        <button
                          key={filter}
                          onClick={() => setOrdersFilter(filter)}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
                            active
                              ? 'bg-earth text-offwhite shadow-sm'
                              : 'bg-offwhite border border-earth/10 text-earth hover:bg-earth/5'
                          }`}
                        >
                          {labels[filter]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Bar */}
                  <div className="relative max-w-sm w-full">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-earth/40"
                    />
                    <input
                      type="text"
                      placeholder="Buscar por cliente, email, fono o ID..."
                      className="w-full pl-10 pr-4 py-2 border border-earth/10 rounded-xl bg-offwhite outline-none text-sm focus:border-mustard transition-colors text-earth"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Orders Content Table */}
                <div className="bg-offwhite border border-earth/10 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-background text-earth text-xs uppercase tracking-wider border-b border-earth/10">
                        <tr>
                          <th className="p-4 font-medium">Pedido ID</th>
                          <th className="p-4 font-medium">Cliente</th>
                          <th className="p-4 font-medium">Pago</th>
                          <th className="p-4 font-medium">Meteodo / Total</th>
                          <th className="p-4 font-medium">Estado</th>
                          <th className="p-4 text-right font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-earth/5">
                        {filteredOrders.map((order) => {
                          const statusInfo = {
                            pending: { label: "Por preparar", color: "bg-amber-100/70 text-amber-800 border-amber-200" },
                            prepared: { label: "Preparado", color: "bg-blue-100/70 text-blue-800 border-blue-200" },
                            shipped: { label: "Enviado", color: "bg-indigo-100/70 text-indigo-800 border-indigo-200" },
                            delivered: { label: "Recibido", color: "bg-green-100/70 text-green-800 border-green-200" }
                          };
                          const currentStatus = (order.status || 'pending') as keyof typeof statusInfo;
                          const info = statusInfo[currentStatus] || { label: order.status, color: "bg-kraft/10 text-kraft border-kraft/20" };

                          return (
                            <tr key={order.id} className="hover:bg-mustard/5 transition-colors">
                              {/* Order ID & Date */}
                              <td className="p-4">
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    markNotificationAsRead(order.id);
                                  }}
                                  className="font-mono text-xs text-earth hover:text-nativa font-medium underline text-left block"
                                >
                                  #{order.id.slice(0, 8)}
                                </button>
                                <span className="text-[10px] text-earth/50 block mt-0.5">
                                  {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'Reciente'}
                                </span>
                              </td>

                              {/* Customer info */}
                              <td className="p-4">
                                <span className="font-medium text-earth block">
                                  {order.customerName || "Compra de Invitado"}
                                </span>
                                <span className="text-xs text-earth-light block">
                                  {order.customerEmail || "Sin email"}
                                </span>
                                {order.customerPhone && (
                                  <a
                                    href={`https://wa.me/51${order.customerPhone.replace(/[\s\-]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-nativa hover:underline font-bold"
                                    title="Chatear en WhatsApp"
                                  >
                                    WhatsApp: {order.customerPhone}
                                  </a>
                                )}
                              </td>

                              {/* Payment Verification */}
                              <td className="p-4">
                                <button
                                  onClick={() => togglePaymentVerification(order.id, !!order.paymentVerified)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                                    order.paymentVerified
                                      ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                                      : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                                  }`}
                                  title="Haz click para cambiar el estado de verificación de pago"
                                >
                                  {order.paymentVerified ? (
                                    <>
                                      <Check size={12} /> Pago Verificado
                                    </>
                                  ) : (
                                    <>
                                      <Clock size={12} /> Pago Pendiente
                                    </>
                                  )}
                                </button>
                              </td>

                              {/* Method & Total */}
                              <td className="p-4 text-earth">
                                <span className="text-xs font-medium block uppercase tracking-wider">
                                  {order.paymentMethod === 'yape' ? '⚡ Yape' : '💳 Tarjeta'}
                                </span>
                                <span className="font-bold text-sm block mt-0.5">
                                  S/ {(order.total || 0).toFixed(2)}
                                </span>
                              </td>

                              {/* Tracking Status Badge */}
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${info.color}`}>
                                  {info.label}
                                </span>
                              </td>

                              {/* Quick Stage Progression */}
                              <td className="p-4 text-right">
                                <div className="inline-flex rounded-md shadow-sm" role="group">
                                  {currentStatus === 'pending' && (
                                    <button
                                      onClick={() => updateOrderStatus(order.id, 'prepared')}
                                      className="px-3 py-1.5 text-xs bg-earth hover:bg-earth-light text-offwhite rounded-md transition-colors font-semibold"
                                    >
                                      Listo para Preparar ➔
                                    </button>
                                  )}
                                  {currentStatus === 'prepared' && (
                                    <button
                                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                                      className="px-3 py-1.5 text-xs bg-nativa hover:bg-nativa-light text-offwhite rounded-md transition-colors font-semibold"
                                    >
                                      Marcar como Enviado ➔
                                    </button>
                                  )}
                                  {currentStatus === 'shipped' && (
                                    <button
                                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                                      className="px-3 py-1.5 text-xs bg-green-700 hover:bg-green-600 text-offwhite rounded-md transition-colors font-semibold"
                                    >
                                      Marcar como Recibido ✓
                                    </button>
                                  )}
                                  {currentStatus === 'delivered' && (
                                    <span className="text-xs text-earth/50 italic py-1.5">
                                      Pedido Completado ✓
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-earth/60">
                              {searchTerm
                                ? "No se encontraron pedidos para tu búsqueda."
                                : "No hay pedidos con el estado seleccionado."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Alerts Inbox Subtab */}
            {activeOrdersSubTab === 'inbox' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* List of custom letters (alerts) */}
                <div className="md:col-span-1 bg-offwhite border border-earth/10 rounded-2xl p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                  <h3 className="font-serif text-lg text-earth border-b border-earth/10 pb-2 mb-2 flex items-center justify-between">
                    <span>Buzón del Propietario</span>
                    <span className="text-xs text-earth-light font-sans">{orders.length} alertas</span>
                  </h3>

                  {orders.map((order) => {
                    const isRead = readNotificationIds.includes(order.id);
                    const formattedDate = order.createdAt
                      ? new Date(order.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : 'Hoy';

                    return (
                      <button
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          markNotificationAsRead(order.id);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                          selectedOrder?.id === order.id
                            ? 'bg-nativa/10 border-nativa shadow-sm'
                            : isRead
                              ? 'bg-offwhite border-earth/5 hover:bg-mustard/5'
                              : 'bg-mustard/10 border-mustard/30 shadow-xs'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className={`text-xs uppercase tracking-widest font-bold text-earth ${!isRead ? 'font-black text-nativa' : ''}`}>
                            {order.customerName || "Compra de Invitado"}
                          </span>
                          <span className="text-[10px] text-earth-light">
                            {formattedDate}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-earth truncate">
                          {!isRead && <span className="inline-block w-2 h-2 bg-kraft rounded-full mr-1.5 animate-ping" />}
                          🌿 ¡Nueva venta! S/ {(order.total || 0).toFixed(2)} [{(order.paymentMethod || 'yape').toUpperCase()}]
                        </div>

                        <div className="text-[11px] text-earth/60 line-clamp-1">
                          Dirección: {order.shippingInfo?.address || 'Sin dirección'}
                        </div>
                      </button>
                    );
                  })}

                  {orders.length === 0 && (
                    <div className="text-center py-12 text-earth/50 text-sm">
                      Limpio. No hay alertas de compra recibidas aún.
                    </div>
                  )}
                </div>

                {/* Simulated Email Detail Panel */}
                <div className="md:col-span-2 bg-offwhite border border-earth/10 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[70vh]">
                  {selectedOrder ? (
                    <div className="flex flex-col h-full">
                      {/* Header resembling an email header */}
                      <div className="p-6 bg-background border-b border-earth/10">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-lg font-serif text-earth">
                            Asunto: 🌿 ¡Nueva venta recibida de Sánori! - S/ {(selectedOrder.total || 0).toFixed(2)} por {selectedOrder.customerName || "Invitado"}
                          </h4>
                          <span className="text-xs bg-kraft/10 text-kraft font-mono border border-kraft/20 px-2.5 py-1 rounded">
                            ID: {selectedOrder.id}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-earth/80 font-sans">
                          <div>
                            <strong className="text-earth">De:</strong> Sánori Tienda &lt;alertas@sanori.com&gt;
                          </div>
                          <div>
                            <strong className="text-earth">Para:</strong> Propietario de Sánori &lt;{user?.email || 'admin@sanori.com'}&gt;
                          </div>
                          <div>
                            <strong className="text-earth">Fecha:</strong> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt.seconds * 1000).toLocaleString() : 'Recente'}
                          </div>
                        </div>
                      </div>

                      {/* Mock Email Contents */}
                      <div className="p-6 overflow-y-auto flex-1 space-y-6 text-earth font-sans text-sm">
                        <div className="bg-kraft-light/20 p-4 border border-kraft/30 rounded-sm">
                          <p className="font-serif text-base text-earth mb-2">🌿 ¡Hola, Sánori!</p>
                          <p className="text-earth-light">
                            Buenas noticias. Tu tienda en línea acaba de recibir un nuevo pedido. A continuación se detallan los datos del cliente y los productos solicitados para que puedas verificar el pago y procesar la preparación.
                          </p>
                        </div>

                        {/* Customer Information Section */}
                        <div>
                          <h5 className="font-serif text-md text-earth border-b border-earth/10 pb-2 mb-3 uppercase tracking-wider text-xs">
                            Datos del Cliente para Verificación
                          </h5>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <strong className="block text-earth-light mb-1">Nombre Completo:</strong>
                              <p className="font-medium text-earth">{selectedOrder.customerName || 'N/A'}</p>
                            </div>
                            <div>
                              <strong className="block text-earth-light mb-1">Email de Registro:</strong>
                              <p className="font-medium text-earth">{selectedOrder.customerEmail || 'N/A'}</p>
                            </div>
                            <div>
                              <strong className="block text-earth-light mb-1">Teléfono / WhatsApp:</strong>
                              <p className="font-medium text-earth">{selectedOrder.customerPhone || 'N/A'}</p>
                            </div>
                            <div>
                              <strong className="block text-earth-light mb-1">Método de Pago Seleccionado:</strong>
                              <p className="font-medium uppercase text-earth">{selectedOrder.paymentMethod || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Shipping details */}
                        <div>
                          <h5 className="font-serif text-md text-earth border-b border-earth/10 pb-2 mb-3 uppercase tracking-wider text-xs">
                            Detalles de Envío
                          </h5>
                          <div className="text-xs">
                            <strong className="block text-earth-light mb-1">Destino:</strong>
                            <p className="font-medium inline-block bg-earth/5 border border-earth/10 px-2 py-1 rounded text-earth uppercase tracking-widest text-[10px] mb-2">
                              {selectedOrder.shippingInfo?.district === 'lima' ? 'Lima Metropolitana' : 'Provincia'}
                            </p>
                            <p className="font-medium text-earth">Dirección: {selectedOrder.shippingInfo?.address || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Order Items Table */}
                        <div>
                          <h5 className="font-serif text-md text-earth border-b border-earth/10 pb-2 mb-3 uppercase tracking-wider text-xs">
                            Carro de Compra
                          </h5>
                          <div className="space-y-2">
                            {selectedOrder.items?.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between items-center bg-background/50 border border-earth/5 p-3 rounded-lg text-xs">
                                <div className="flex items-center gap-3">
                                  {item.imageUrl && (
                                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded border border-earth/5" />
                                  )}
                                  <div>
                                    <p className="font-medium text-earth">{item.name}</p>
                                    <p className="text-[10px] text-earth-light">Cantidad: {item.quantity} | S/ {item.price.toFixed(2)} c/u</p>
                                  </div>
                                </div>
                                <span className="font-bold text-earth">S/ {(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="pt-3 border-t border-earth/10 flex justify-between font-bold text-sm text-earth">
                              <span>Total con Envío</span>
                              <span>S/ {(selectedOrder.total || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Control Inside Email */}
                        <div className="bg-mustard/10 p-5 rounded-xl border border-mustard/30 space-y-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-earth">
                            Acciones de Verificación:
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            <button
                              onClick={() => togglePaymentVerification(selectedOrder.id, !!selectedOrder.paymentVerified)}
                              className={`px-3.5 py-1.5 text-xs rounded-full font-bold uppercase tracking-wider transition-all border ${
                                selectedOrder.paymentVerified
                                  ? 'bg-green-700 text-offwhite border-green-800 hover:bg-green-800'
                                  : 'bg-earth text-offwhite border-earth hover:bg-kraft'
                              }`}
                            >
                              {selectedOrder.paymentVerified ? '✓ Pago Verificado' : '⚙ Marcar Pago Verificado'}
                            </button>

                            <button
                              onClick={() => {
                                updateOrderStatus(selectedOrder.id, 'prepared');
                                alert("Pedido marcado como 'Preparado'. Ha avanzado a la etapa siguiente.");
                              }}
                              disabled={selectedOrder.status !== 'pending'}
                              className="px-3.5 py-1.5 border border-earth text-earth hover:bg-earth/5 disabled:opacity-50 text-xs font-bold uppercase tracking-wider rounded-full font-sans"
                            >
                              Preparado para Despacho
                            </button>
                          </div>

                          {selectedOrder.customerPhone && (
                            <div className="pt-3 border-t border-earth/10 space-y-2">
                              <p className="text-[11px] font-bold uppercase tracking-widest text-earth-light">
                                💬 Notificar por WhatsApp de Cliente:
                              </p>
                              {settings?.whatsappEnabled ? (
                                <p className="text-[10px] text-green-700 font-medium">
                                  ✨ API Automatizada Activa. Los cambios de estado disparan mensajes automáticos.
                                </p>
                              ) : (
                                <p className="text-[10px] text-earth-light">
                                  Modo Marcha Blanca: Elige una plantilla abajo para abrir el chat con el mensaje pre-redactado.
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 pt-1">
                                <a
                                  href={getWhatsAppManualUrl(selectedOrder, 'payment_pending')}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-nativa/10 border border-nativa/30 hover:bg-nativa/20 text-nativa rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5"
                                  title="Solicitar comprobante de pago por WhatsApp"
                                >
                                  ⏳ Recordar Pago / Yape
                                </a>
                                <a
                                  href={getWhatsAppManualUrl(selectedOrder, 'payment_verified')}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-green-50 border border-green-200 hover:bg-green-100 text-green-800 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5"
                                  title="Confirmar recepción del pago"
                                >
                                  ✅ Confirmar Pago
                                </a>
                                <a
                                  href={getWhatsAppManualUrl(selectedOrder, 'order_shipped')}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5"
                                  title="Enviar código/notificación de envío"
                                >
                                  🚚 Notificar Despacho
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="m-auto text-center p-8 text-earth/50 space-y-3">
                      <Mail size={48} className="mx-auto text-earth/20" />
                      <div>
                        <p className="font-serif text-lg">Buzón de Notificaciones de Sánori</p>
                        <p className="text-xs text-earth-light">Selecciona una alerta de compra de la lista para ver el correo de detalles.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
