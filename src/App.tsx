/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { CartProvider } from './lib/CartContext';
import { SiteSettingsProvider } from './lib/SiteSettingsContext';
import { ThemeProvider } from './lib/ThemeContext';
import Home from './pages/Home';
import Shop from './pages/Shop';
import About from './pages/About';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Blog from './pages/Blog';
import Workshops from './pages/Workshops';
import Admin from './pages/Admin';
import ProductDetails from './pages/ProductDetails';

import ScrollToTop from './components/ScrollToTop';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <SiteSettingsProvider>
          <CartProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tienda" element={<Shop />} />
                <Route path="/producto/:id" element={<ProductDetails />} />
                <Route path="/nosotros" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/talleres" element={<Workshops />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </Layout>
          </CartProvider>
        </SiteSettingsProvider>
      </ThemeProvider>
      <Toaster position="bottom-right" richColors theme="light" />
    </BrowserRouter>
  );
}
