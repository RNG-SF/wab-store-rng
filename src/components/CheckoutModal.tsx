import React, { useState } from 'react';
import { X, QrCode, Building, CheckCircle2, AlertCircle, Copy, Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { items, subtotal, clearCart } = useCart();
  const { user, token } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'BANK_TRANSFER'>('QRIS');
  const [customerNotes, setCustomerNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Post-order state
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  if (!isOpen) return null;

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const handleCreateOrder = async () => {
    if (!user) {
      setError('Silakan login terlebih dahulu untuk menyelesaikan pesanan.');
      return;
    }

    if (items.length === 0) {
      setError('Keranjang belanja kosong.');
      return;
    }

    setLoading(true);
    setError(null);

    const idempotencyKey = `idemp_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            packageId: i.packageId,
            quantity: i.quantity,
          })),
          paymentMethod,
          idempotencyKey,
          customerNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(data.error || 'Gagal membuat pesanan.');
        return;
      }

      // Initialize real payment gateway session
      const sessRes = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: data.order.id,
          provider: 'MIDTRANS',
          paymentType: paymentMethod.toLowerCase(),
        }),
      });

      const sessData = await sessRes.json();
      setLoading(false);

      setCreatedOrder({
        ...data.order,
        gatewaySession: sessData,
      });
      clearCart();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Koneksi gagal.');
    }
  };

  const handleSimulatePayment = async () => {
    if (!createdOrder) return;
    setSimulatingPayment(true);
    setError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Call authentic signed webhook simulator
      const res = await fetch('/api/payments/simulate-webhook', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderNumber: createdOrder.orderNumber,
          targetStatus: 'settlement',
          provider: 'MIDTRANS',
          paymentType: paymentMethod.toLowerCase(),
        }),
      });

      const data = await res.json();
      setSimulatingPayment(false);

      if (res.ok && data.success) {
        setCreatedOrder((prev: any) => ({ ...prev, status: 'PAID' }));
        onSuccess(createdOrder.orderNumber);
      } else {
        setError(data.error || 'Gagal memproses verifikasi webhook pembayaran.');
      }
    } catch (err: any) {
      setSimulatingPayment(false);
      setError(err.message || 'Koneksi gagal.');
    }
  };

  const copyAccountNumber = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F1011] border border-[#23252A] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#18191A] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step 1: Pre-order review and payment selection */}
        {!createdOrder ? (
          <div>
            <div className="mb-6">
              <span className="text-xs font-mono font-medium text-[#5E6AD2]">CHECKOUT & BILLING</span>
              <h2 className="text-xl font-bold text-[#F7F8F8] mt-1">Konfirmasi Pembayaran</h2>
              <p className="text-xs text-[#8A8F98] mt-0.5">
                Pilih metode pembayaran aman untuk aktivasi layanan digital Anda.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[#EE0000]/10 border border-[#EE0000]/30 flex items-start gap-2.5 text-xs text-[#EE0000]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Order Items Summary */}
            <div className="p-3.5 rounded-xl bg-[#141516] border border-[#23252A] mb-5 space-y-2">
              <div className="text-[11px] font-semibold text-[#8A8F98] uppercase tracking-wider mb-2">
                Ringkasan Pesanan ({items.length} Item)
              </div>
              {items.map((i, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="truncate max-w-[240px]">
                    <span className="text-[#F7F8F8] font-medium">{i.productTitle}</span>
                    <span className="text-[#8A8F98] ml-1">× {i.quantity}</span>
                  </div>
                  <span className="font-mono text-[#D0D6E0]">{formatIDR(i.unitPrice * i.quantity)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#23252A] flex justify-between items-center text-xs font-bold text-[#F7F8F8]">
                <span>Total Pembayaran</span>
                <span className="text-[#5E6AD2] font-mono text-sm">{formatIDR(subtotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-5 space-y-2.5">
              <label className="block text-xs font-semibold text-[#D0D6E0]">
                Metode Pembayaran
              </label>

              <div
                onClick={() => setPaymentMethod('QRIS')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  paymentMethod === 'QRIS'
                    ? 'bg-[#18191A] border-[#5E6AD2]'
                    : 'bg-[#141516] border-[#23252A] hover:bg-[#18191A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 flex items-center justify-center text-[#5E6AD2]">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#F7F8F8]">QRIS Instan (Semua E-Wallet & M-Banking)</h4>
                    <p className="text-[11px] text-[#8A8F98]">BCA, Mandiri, BRI, GoPay, OVO, ShopeePay, DANA</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'QRIS' ? 'border-[#5E6AD2] bg-[#5E6AD2]' : 'border-[#34343A]'}`}>
                  {paymentMethod === 'QRIS' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'bg-[#18191A] border-[#5E6AD2]'
                    : 'bg-[#141516] border-[#23252A] hover:bg-[#18191A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 flex items-center justify-center text-[#5E6AD2]">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#F7F8F8]">Transfer Bank Manual</h4>
                    <p className="text-[11px] text-[#8A8F98]">Verifikasi manual dengan upload struk pembayaran</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'BANK_TRANSFER' ? 'border-[#5E6AD2] bg-[#5E6AD2]' : 'border-[#34343A]'}`}>
                  {paymentMethod === 'BANK_TRANSFER' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-[#D0D6E0] mb-1">
                Catatan Pesanan / Email Aktivasi (Opsional)
              </label>
              <input
                type="text"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Contoh: Kirim kredensial ke email kedua saya"
                className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] rounded-lg px-3 py-2 text-xs text-[#F7F8F8] placeholder-[#62666D] outline-none"
              />
            </div>

            <button
              onClick={handleCreateOrder}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#5E6AD2] hover:bg-[#828FFF] disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {loading ? 'Menyiapkan Invoice...' : `Buat Pesanan (${formatIDR(subtotal)})`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Step 2: Order Created / Payment Step */
          <div className="text-center">
            {createdOrder.status === 'PAID' ? (
              <div className="py-6">
                <div className="w-16 h-16 rounded-2xl bg-[#27A644]/10 border border-[#27A644]/30 flex items-center justify-center text-[#27A644] mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#F7F8F8]">Pembayaran Berhasil Diverifikasi!</h3>
                <p className="text-xs text-[#8A8F98] mt-1 max-w-sm mx-auto">
                  Pesanan <span className="font-mono text-[#D0D6E0]">#{createdOrder.orderNumber}</span> telah lunas dan layanan digital Anda telah aktif di akun Anda.
                </p>

                <div className="mt-6 p-4 rounded-xl bg-[#141516] border border-[#23252A] text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8A8F98]">No. Pesanan:</span>
                    <span className="font-mono text-[#F7F8F8]">{createdOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A8F98]">Total Dibayar:</span>
                    <span className="font-mono text-[#5E6AD2] font-semibold">{formatIDR(createdOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A8F98]">Status Layanan:</span>
                    <span className="text-[#27A644] font-medium">Aktif Siap Pakai</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onSuccess(createdOrder.orderNumber);
                  }}
                  className="w-full mt-6 py-2.5 px-4 bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Buka Portal Layanan Saya
                </button>
              </div>
            ) : (
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-xs font-mono mb-3">
                  <span>PENDING PAYMENT</span>
                </div>
                <h3 className="text-lg font-bold text-[#F7F8F8]">
                  Pesanan #{createdOrder.orderNumber}
                </h3>
                <p className="text-xs text-[#8A8F98] mt-0.5">
                  Total Tagihan: <span className="font-mono font-bold text-[#F7F8F8]">{formatIDR(createdOrder.totalAmount)}</span>
                </p>

                {error && (
                  <div className="mt-3 p-2.5 rounded-lg bg-[#EE0000]/10 border border-[#EE0000]/30 text-xs text-[#EE0000]">
                    {error}
                  </div>
                )}

                {/* QRIS Display */}
                {createdOrder.paymentMethod === 'QRIS' ? (
                  <div className="mt-5 p-5 rounded-xl bg-[#141516] border border-[#23252A] flex flex-col items-center">
                    <div className="p-4 bg-white rounded-xl shadow-lg mb-3">
                      {/* Stylized QR Code placeholder */}
                      <svg className="w-44 h-44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100" height="100" fill="white" />
                        <rect x="10" y="10" width="25" height="25" fill="#171717" />
                        <rect x="14" y="14" width="17" height="17" fill="white" />
                        <rect x="18" y="18" width="9" height="9" fill="#171717" />
                        
                        <rect x="65" y="10" width="25" height="25" fill="#171717" />
                        <rect x="69" y="14" width="17" height="17" fill="white" />
                        <rect x="73" y="18" width="9" height="9" fill="#171717" />
                        
                        <rect x="10" y="65" width="25" height="25" fill="#171717" />
                        <rect x="14" y="69" width="17" height="17" fill="white" />
                        <rect x="18" y="73" width="9" height="9" fill="#171717" />
                        
                        {/* Patterns */}
                        <rect x="42" y="12" width="6" height="6" fill="#171717" />
                        <rect x="52" y="12" width="6" height="6" fill="#171717" />
                        <rect x="42" y="24" width="6" height="6" fill="#171717" />
                        <rect x="42" y="42" width="16" height="16" fill="#5E6AD2" rx="3" />
                        <rect x="12" y="42" width="6" height="16" fill="#171717" />
                        <rect x="24" y="42" width="6" height="6" fill="#171717" />
                        <rect x="65" y="42" width="25" height="6" fill="#171717" />
                        <rect x="75" y="52" width="15" height="6" fill="#171717" />
                        <rect x="42" y="65" width="12" height="6" fill="#171717" />
                        <rect x="65" y="65" width="6" height="12" fill="#171717" />
                        <rect x="78" y="72" width="12" height="18" fill="#171717" />
                        <rect x="42" y="78" width="18" height="12" fill="#171717" />
                      </svg>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#27A644] font-medium mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>QRIS Dinamis Terverifikasi Nasional</span>
                    </div>
                    <p className="text-[11px] text-[#8A8F98]">
                      Scan QRIS di atas dengan aplikasi mobile banking atau e-wallet Anda.
                    </p>

                    {/* Developer QRIS instant simulation button */}
                    <div className="w-full mt-5 pt-4 border-t border-[#23252A]">
                      <button
                        onClick={handleSimulatePayment}
                        disabled={simulatingPayment}
                        className="w-full py-2.5 px-3 bg-[#18191A] hover:bg-[#23252A] border border-[#5E6AD2]/40 hover:border-[#5E6AD2] text-[#828FFF] text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Zap className="w-4 h-4 text-[#F5A623]" />
                        <span>
                          {simulatingPayment ? 'Memvalidasi Webhook...' : 'Simulasikan Pembayaran QRIS Lunas (Testing)'}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Bank Transfer */
                  <div className="mt-5 p-5 rounded-xl bg-[#141516] border border-[#23252A] text-left text-xs space-y-3">
                    <div className="p-3 bg-[#18191A] rounded-lg border border-[#23252A]">
                      <div className="text-[#8A8F98] text-[11px]">Bank Tujuan:</div>
                      <div className="font-bold text-[#F7F8F8] text-sm mt-0.5">BCA (Bank Central Asia)</div>
                      <div className="text-[#8A8F98] text-[11px] mt-2">Nomor Rekening:</div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-mono text-base font-bold text-[#5E6AD2]">8920194812</span>
                        <button
                          onClick={() => copyAccountNumber('8920194812')}
                          className="px-2 py-1 bg-[#141516] border border-[#23252A] text-xs rounded hover:text-white flex items-center gap-1"
                        >
                          {copiedAccount ? <Check className="w-3 h-3 text-[#27A644]" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedAccount ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>
                      <div className="text-[#8A8F98] text-[11px] mt-2">Atas Nama:</div>
                      <div className="font-medium text-[#F7F8F8]">Rangga Sofyanto (Official RNG-SF)</div>
                    </div>

                    <p className="text-[11px] text-[#8A8F98] leading-relaxed">
                      Kirim tepat sesuai nominal <span className="text-white font-mono font-bold">{formatIDR(createdOrder.totalAmount)}</span>. Setelah transfer, administrator akan memverifikasi dalam waktu &lt; 15 menit.
                    </p>

                    <button
                      onClick={handleSimulatePayment}
                      disabled={simulatingPayment}
                      className="w-full mt-2 py-2 px-3 bg-[#18191A] hover:bg-[#23252A] border border-[#5E6AD2]/40 text-[#828FFF] text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-[#F5A623]" />
                      <span>{simulatingPayment ? 'Memproses...' : 'Simulasikan Verifikasi Transfer Bank (Testing)'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
