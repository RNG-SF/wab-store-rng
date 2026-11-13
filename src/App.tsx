import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider, useCart } from './context/CartContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { StoreView } from './components/store/StoreView.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ForcePasswordModal } from './components/ForcePasswordModal.tsx';
import { CustomerPortal } from './components/portal/CustomerPortal.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { HbdPublicView } from './components/hbd/HbdPublicView.tsx';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const { openCart } = useCart();

  // Master view routing: 'home' (Landing Page) | 'store' (Separate Store) | 'portal' | 'admin'
  const [currentView, setCurrentView] = useState<'home' | 'store' | 'portal' | 'admin'>('home');
  const [storeCategory, setStoreCategory] = useState<string>('all');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // Dynamic HBD slug state (supports direct /hbd/:slug paths without any password in URL)
  const [activeHbdSlug, setActiveHbdSlug] = useState<string | null>(() => {
    const match = window.location.pathname.match(/^\/hbd\/([a-z0-9-]+)\/?$/i);
    return match ? match[1] : null;
  });

  // Store data
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products'),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }
    } catch (err) {
      console.error('Error fetching store data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (view: string, targetSection?: string) => {
    setActiveHbdSlug(null);

    if (view === 'store') {
      setCurrentView('store');
      setStoreCategory('all');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'admin') {
      setCurrentView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'portal') {
      setCurrentView('portal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Default to home / Landing Page
    setCurrentView('home');

    if (targetSection) {
      setTimeout(() => {
        const el = document.querySelector(targetSection);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToStoreWithCategory = (categorySlug?: string) => {
    setActiveHbdSlug(null);
    setCurrentView('store');
    if (categorySlug) {
      setStoreCategory(categorySlug);
    } else {
      setStoreCategory('all');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isUserAdmin =
    !!user && ['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'CONTENT_MANAGER'].includes(user.role);

  return (
    <div className="min-h-screen bg-[#010102] text-[#F7F8F8] flex flex-col font-sans selection:bg-[#5E6AD2]/30 selection:text-white">
      {/* Universal Top Bar Navigation */}
      <Navbar
        currentView={activeHbdSlug ? 'hbd' : currentView}
        onNavigate={handleNavigate}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1">
        {/* View 1: Dynamic HBD & Celebration Experience (when active slug is open) */}
        {activeHbdSlug ? (
          <HbdPublicView
            slug={activeHbdSlug}
            onBackToHome={() => {
              setActiveHbdSlug(null);
              setCurrentView('home');
            }}
          />
        ) : currentView === 'store' ? (
          /* View 2: Separate RNG-SF Storefront (/store) */
          <StoreView
            categories={categories}
            products={products}
            loading={loading}
            selectedCategory={storeCategory}
            onSelectCategory={(slug: string) => setStoreCategory(slug)}
            onBackToEcosystem={() => handleNavigate('home')}
            onOpenAuth={() => setAuthModalOpen(true)}
            onProceedCheckout={() => {
              if (!user) {
                setAuthModalOpen(true);
              } else {
                setCheckoutModalOpen(true);
              }
            }}
          />
        ) : currentView === 'admin' && isUserAdmin ? (
          /* View 3: Developer / Owner Console */
          <AdminDashboard
            onNavigateHome={() => handleNavigate('home')}
            onOpenHbdSlug={(slug) => setActiveHbdSlug(slug)}
          />
        ) : currentView === 'portal' && user ? (
          /* View 4: Customer Account & License Vault */
          <CustomerPortal />
        ) : (
          /* View 5: Master Ecosystem Landing Page (Default '/') */
          <LandingPage
            onGoToStore={handleGoToStoreWithCategory}
            onOpenHbdSlug={(slug) => setActiveHbdSlug(slug)}
            onOpenAuth={() => setAuthModalOpen(true)}
            onGoToAdmin={() => handleNavigate('admin')}
            isAdmin={isUserAdmin}
          />
        )}
      </main>

      {/* Slide-Over Cart Drawer */}
      <CartDrawer
        onProceedCheckout={() => {
          if (!user) {
            setAuthModalOpen(true);
          } else {
            setCheckoutModalOpen(true);
          }
        }}
      />

      {/* Checkout Modal with Idempotency & QRIS/Bank Transfer */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onSuccess={(orderNumber) => {
          setCurrentView('portal');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Mandatory First-Time Password Rotation Modal */}
      <ForcePasswordModal />

      {/* Master Ecosystem Footer */}
      <footer className="border-t border-[#23252A] bg-[#0F1011] py-8 text-xs text-[#8A8F98]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F7F8F8]">RNG-SF Multi-Purpose Web Platform</span>
            <span>·</span>
            <span>Hak Cipta © 2026 Rangga Sofyanto</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button onClick={() => handleNavigate('home')} className="hover:text-white transition-colors cursor-pointer">
              Beranda
            </button>
            <span>·</span>
            <button onClick={() => handleNavigate('store')} className="hover:text-white transition-colors cursor-pointer text-[#828FFF] font-semibold">
              RNG-SF Store
            </button>
            <span>·</span>
            <button onClick={() => handleNavigate('home', '#hbd-showcase')} className="hover:text-white transition-colors cursor-pointer">
              HBD & Ucapan
            </button>
            <span>·</span>
            <button onClick={() => handleNavigate('home', '#social-hub')} className="hover:text-white transition-colors cursor-pointer">
              Media Sosial
            </button>
            <span>·</span>
            <button onClick={() => handleNavigate('home', '#about')} className="hover:text-white transition-colors cursor-pointer">
              Tentang
            </button>
            <span>·</span>
            <span className="text-[#27A644]">System Nominal</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
