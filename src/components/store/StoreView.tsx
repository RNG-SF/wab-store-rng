import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Package } from 'lucide-react';
import { ProductCard } from './ProductCard.tsx';
import { ProductDetailModal } from './ProductDetailModal.tsx';
import { useCart } from '../../context/CartContext.tsx';

interface StoreViewProps {
  products: any[];
  loading: boolean;
  onBackToEcosystem: () => void;
  onProceedCheckout: () => void;
  categories?: any[];
  selectedCategory?: string;
  onSelectCategory?: (slug: string) => void;
  onOpenAuth?: () => void;
}

export const StoreView: React.FC<StoreViewProps> = ({
  products,
  loading,
  onBackToEcosystem,
  onProceedCheckout,
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const { openCart, totalCount } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Filter to active products, optionally by selected category
  const activeProducts = products.filter((p) => {
    if (p.serviceStatus !== 'ACTIVE') return false;
    if (!selectedCategory || selectedCategory === 'all') return true;
    return p.categoryId === selectedCategory || p.categorySlug === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-[#010102] text-[#F7F8F8] pb-20">
      {/* Top Header Bar */}
      <div className="border-b border-[#1E2028] bg-[#0A0B0E] sticky top-16 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBackToEcosystem}
            className="flex items-center gap-2 text-xs font-semibold text-[#8A8F98] hover:text-white transition-colors cursor-pointer group"
          >
            <div className="p-1 rounded bg-[#15171E] border border-[#232530] group-hover:border-[#5E6AD2]">
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
            <span>Kembali ke Beranda</span>
          </button>

          <button
            onClick={openCart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#15171E] hover:bg-[#1E2028] border border-[#232530] text-[#D0D6E0] text-xs font-semibold transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#828FFF]" />
            <span>Keranjang ({totalCount})</span>
          </button>
        </div>
      </div>

      {/* Clean Store Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-8">
        <div>
          <span className="text-xs font-mono text-[#5E6AD2] uppercase tracking-wider block mb-1">
            RNG-SF STORE
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F7F8F8]">
            Produk & Layanan Tersedia
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#8A8F98]">
            Daftar produk digital dan layanan terverifikasi yang siap diaktivasi.
          </p>
        </div>

        {/* Product Cards Grid (Clean, Realistic Layout) */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[1, 2].map((n) => (
                <div key={n} className="rounded-2xl bg-[#0F1014] border border-[#1E2028] p-5 h-64 animate-pulse" />
              ))}
            </div>
          ) : activeProducts.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-[#0F1014] border border-[#1E2028]">
              <Package className="w-8 h-8 text-[#62666D] mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#F7F8F8]">Belum Ada Produk Tersedia</h3>
              <p className="text-xs text-[#8A8F98] mt-1">Produk baru akan segera diumumkan di sini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {activeProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onViewDetail={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onInstantCheckout={onProceedCheckout}
        />
      )}
    </div>
  );
};
