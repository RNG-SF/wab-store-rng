import React from 'react';
import { ArrowUpRight, Plus, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext.tsx';

interface ProductCardProps {
  product: any;
  onViewDetail: (product: any) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetail }) => {
  const { addToCart } = useCart();

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      productId: product.id,
      productTitle: product.title,
      unitPrice: product.basePrice,
      imageUrl: product.imageUrl,
      duration: product.duration,
    });
  };

  return (
    <div
      onClick={() => onViewDetail(product)}
      className="group relative rounded-2xl bg-[#0F1011] border border-[#23252A] hover:border-[#34343A] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
    >
      {/* Product Image / Banner */}
      <div className="relative aspect-[16/9] w-full bg-[#141516] overflow-hidden border-b border-[#23252A]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[#62666D]">
            RNG-SF DIGITAL
          </div>
        )}

        {/* Service Status Indicator (Unboxed) */}
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-medium backdrop-blur-md bg-black/60 border border-white/10 text-white">
          {product.serviceStatus === 'ACTIVE' ? 'Tersedia' : 'Maintenance'}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Discipline: Unboxed Text with Separators */}
          <div className="flex items-center gap-2 text-xs text-[#8A8F98] mb-1.5">
            <span>{product.categoryName}</span>
            <span aria-hidden="true">·</span>
            <span>{product.duration || '30 Hari'}</span>
            {product.stock > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">Stok: {product.stock}</span>
              </>
            )}
          </div>

          <h3 className="text-base font-bold text-[#F7F8F8] group-hover:text-white transition-colors line-clamp-1">
            {product.title}
          </h3>

          <p className="mt-1.5 text-xs text-[#8A8F98] line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing and Action Strip */}
        <div className="mt-5 pt-3.5 border-t border-[#23252A] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-[#8A8F98] block">Mulai dari</span>
            <span className="text-base font-bold font-mono tabular-nums text-[#5E6AD2]">
              {formatIDR(product.basePrice)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickAdd}
              className="p-2 rounded-lg bg-[#141516] hover:bg-[#18191A] border border-[#23252A] text-[#8A8F98] hover:text-white transition-colors"
              title="Tambah Cepat ke Keranjang"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(product);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Detail</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
