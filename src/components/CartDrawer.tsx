import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface CartDrawerProps {
  onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedCheckout }) => {
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, subtotal, totalCount } = useCart();

  if (!isOpen) return null;

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0F1011] border-l border-[#23252A] h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#23252A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 flex items-center justify-center text-[#5E6AD2]">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F7F8F8]">Keranjang Belanja</h3>
              <p className="text-[11px] text-[#8A8F98]">{totalCount} Item Terpilih</p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#18191A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8A8F98]">
              <div className="w-16 h-16 rounded-2xl bg-[#141516] border border-[#23252A] flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 text-[#62666D]" />
              </div>
              <p className="text-sm font-semibold text-[#D0D6E0]">Keranjang Masih Kosong</p>
              <p className="text-xs text-[#8A8F98] mt-1 max-w-xs">
                Jelajahi produk di Digital Store dan tambahkan layanan yang Anda butuhkan.
              </p>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={`${item.productId}-${item.packageId || 'default'}-${index}`}
                className="p-3.5 rounded-xl bg-[#141516] border border-[#23252A] flex gap-3 items-center"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productTitle}
                    className="w-14 h-14 rounded-lg object-cover border border-[#23252A] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-[#18191A] border border-[#23252A] flex items-center justify-center text-[#8A8F98] shrink-0 text-xs font-mono">
                    RNG
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#F7F8F8] truncate">{item.productTitle}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#8A8F98] mt-0.5">
                    <span>{item.packageName || 'Standar'}</span>
                    {item.duration && (
                      <>
                        <span>·</span>
                        <span>{item.duration}</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs font-mono font-semibold text-[#5E6AD2] mt-1">
                    {formatIDR(item.unitPrice)}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => removeFromCart(item.productId, item.packageId)}
                    className="p-1 text-[#8A8F98] hover:text-[#EE0000] transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5 bg-[#18191A] border border-[#23252A] rounded-md px-1.5 py-0.5">
                    <button
                      onClick={() => updateQuantity(item.productId, item.packageId, item.quantity - 1)}
                      className="p-0.5 text-[#8A8F98] hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono font-medium text-white px-1">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.packageId, item.quantity + 1)}
                      className="p-0.5 text-[#8A8F98] hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#23252A] bg-[#0F1011] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#8A8F98]">
              <span>Subtotal Layanan:</span>
              <span className="text-sm font-mono font-bold text-[#F7F8F8]">{formatIDR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#62666D]">
              <span>Pajak & Biaya Transaksi:</span>
              <span>Rp 0 (Termasuk)</span>
            </div>

            <button
              onClick={() => {
                closeCart();
                onProceedCheckout();
              }}
              className="w-full py-2.5 px-4 bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Lanjutkan ke Pembayaran</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
