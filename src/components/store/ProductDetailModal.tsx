import React, { useState } from 'react';
import { X, Check, ShieldCheck, Clock, Layers, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext.tsx';

interface ProductDetailModalProps {
  product: any | null;
  onClose: () => void;
  onInstantCheckout?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onInstantCheckout,
}) => {
  const { addToCart } = useCart();
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);

  if (!product) return null;

  const packages = product.packages || [];
  const selectedPackage = packages.find((p: any) => p.id === selectedPackageId) || null;
  const currentPrice = selectedPackage ? selectedPackage.price : product.basePrice;

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  let specsObj: Record<string, string> = {};
  try {
    specsObj = typeof product.specifications === 'string' ? JSON.parse(product.specifications) : product.specifications || {};
  } catch {
    specsObj = {};
  }

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      packageId: selectedPackage?.id,
      productTitle: product.title,
      packageName: selectedPackage ? selectedPackage.name : 'Standar Tier',
      unitPrice: currentPrice,
      imageUrl: product.imageUrl,
      duration: selectedPackage ? `${selectedPackage.durationDays} Hari` : product.duration,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F1011] border border-[#23252A] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-black/50 text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-black/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Header & Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#141516] border border-[#23252A]">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[#8A8F98]">
                  RNG-SF ASSET
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-[#8A8F98] mb-1.5">
                <span>{product.categoryName}</span>
                <span aria-hidden="true">·</span>
                <span>{product.subcategory || 'Layanan Digital'}</span>
              </div>

              <h2 className="text-xl font-bold text-[#F7F8F8] leading-tight">
                {product.title}
              </h2>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold font-mono text-[#5E6AD2]">
                  {formatIDR(currentPrice)}
                </span>
                <span className="text-xs text-[#8A8F98]">/ {product.duration || 'Bulan'}</span>
              </div>

              <div className="mt-4 flex items-center gap-3 text-xs text-[#27A644]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Garansi Aktivasi Penuh & Dukungan Resmi</span>
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8A8F98] mb-2">
              Deskripsi Layanan
            </h4>
            <p className="text-xs sm:text-sm text-[#D0D6E0] leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Specifications Table (if available) */}
          {Object.keys(specsObj).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8A8F98] mb-2.5">
                Spesifikasi Teknis
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Object.entries(specsObj).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-lg bg-[#141516] border border-[#23252A]">
                    <span className="text-[10px] uppercase font-mono text-[#8A8F98] block capitalize">
                      {key}
                    </span>
                    <span className="text-xs font-bold text-[#F7F8F8] mt-0.5 block truncate">
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Package / Variation Picker */}
          {packages.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8A8F98] mb-2.5">
                Pilih Paket / Variasi
              </h4>
              <div className="space-y-2">
                <div
                  onClick={() => setSelectedPackageId(null)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    selectedPackageId === null
                      ? 'bg-[#18191A] border-[#5E6AD2]'
                      : 'bg-[#141516] border-[#23252A] hover:bg-[#18191A]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-[#F7F8F8]">Paket Standar Dasar</div>
                    <div className="text-[11px] text-[#8A8F98]">{product.duration || '30 Hari'}</div>
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#5E6AD2]">
                    {formatIDR(product.basePrice)}
                  </div>
                </div>

                {packages.map((pkg: any) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      selectedPackageId === pkg.id
                        ? 'bg-[#18191A] border-[#5E6AD2]'
                        : 'bg-[#141516] border-[#23252A] hover:bg-[#18191A]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#F7F8F8]">{pkg.name}</div>
                      <div className="text-[11px] text-[#8A8F98]">Durasi: {pkg.durationDays} Hari</div>
                    </div>
                    <div className="font-mono text-xs font-semibold text-[#5E6AD2]">
                      {formatIDR(pkg.price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms of Service */}
          {product.termsOfService && (
            <div className="p-3.5 rounded-xl bg-[#141516] border border-[#23252A] text-xs text-[#8A8F98] leading-relaxed">
              <span className="font-semibold text-[#D0D6E0] block mb-1">Syarat & Ketentuan Penggunaan:</span>
              {product.termsOfService}
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-5 border-t border-[#23252A] bg-[#0F1011] flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-[#8A8F98] block">Total Harga:</span>
            <span className="text-lg font-bold font-mono text-[#F7F8F8]">
              {formatIDR(currentPrice)}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleAddToCart}
              className="px-4 py-2.5 rounded-lg bg-[#141516] hover:bg-[#18191A] border border-[#34343A] text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tambah ke Keranjang</span>
            </button>
            <button
              onClick={() => {
                handleAddToCart();
                if (onInstantCheckout) onInstantCheckout();
              }}
              className="px-5 py-2.5 rounded-lg bg-[#5E6AD2] hover:bg-[#828FFF] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Pesan Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
