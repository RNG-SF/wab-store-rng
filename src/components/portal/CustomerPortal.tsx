import React, { useState, useEffect } from 'react';
import { Key, Clock, Shield, Share2, Copy, Check, ShoppingBag, Terminal, CheckCircle2, AlertCircle, X, Printer, FileCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const CustomerPortal: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'services' | 'orders' | 'partner' | 'security'>('services');

  const [orders, setOrders] = useState<any[]>([]);
  const [partnerData, setPartnerData] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Security password state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Load orders
      const ordersRes = await fetch('/api/orders/my-orders', { headers });
      if (ordersRes.ok) {
        const d = await ordersRes.json();
        setOrders(d.orders || []);
      }

      // Load partner
      const partnerRes = await fetch('/api/partner/dashboard', { headers });
      if (partnerRes.ok) {
        const d = await partnerRes.json();
        setPartnerData(d);
      }

      // Load sessions
      const sessRes = await fetch('/api/auth/sessions', { headers });
      if (sessRes.ok) {
        const d = await sessRes.json();
        setSessions(d.sessions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'key' | 'ref') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(text);
      setTimeout(() => setCopiedKey(null), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPassword: oldPass, newPassword: newPass }),
      });
      const data = await res.json();

      if (res.ok) {
        setPassMsg({ type: 'success', text: 'Password berhasil diubah!' });
        setOldPass('');
        setNewPass('');
      } else {
        setPassMsg({ type: 'error', text: data.error || 'Gagal mengubah password.' });
      }
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.message || 'Koneksi gagal.' });
    }
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const allActivations = orders
    .filter((o) => o.activation)
    .map((o) => ({
      ...o.activation,
      orderNumber: o.orderNumber,
      orderTitle: o.items?.[0]?.productTitle || 'Digital Service',
    }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#23252A] mb-8">
        <div>
          <span className="text-xs font-mono font-medium text-[#5E6AD2]">CUSTOMER ACCOUNT & VAULT</span>
          <h1 className="text-2xl font-extrabold text-[#F7F8F8] mt-1">Portal Pelanggan</h1>
          <p className="text-xs text-[#8A8F98] mt-0.5">
            Kelola lisensi aktif, riwayat transaksi, kode referral, dan pengaturan keamanan akun.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[#141516] border border-[#23252A] text-xs font-mono text-[#D0D6E0]">
            User ID: <span className="text-[#5E6AD2] font-bold">#{user?.id}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 text-xs font-mono text-[#828FFF] font-semibold">
            {user?.role}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-[#23252A] pb-4">
        {[
          { id: 'services', label: 'Layanan & Lisensi Aktif', count: allActivations.length },
          { id: 'orders', label: 'Riwayat Pesanan', count: orders.length },
          { id: 'partner', label: 'Program Referral & Komisi' },
          { id: 'security', label: 'Keamanan Akun' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#5E6AD2] text-white shadow-sm'
                : 'bg-[#141516] border border-[#23252A] text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-[#18191A]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Active Services & Licenses */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {allActivations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0F1011] border border-[#23252A]">
              <Key className="w-10 h-10 text-[#62666D] mx-auto mb-3" />
              <h3 className="text-sm font-bold text-[#F7F8F8]">Belum Ada Layanan Aktif</h3>
              <p className="text-xs text-[#8A8F98] mt-1">
                Layanan atau lisensi yang Anda beli akan muncul di sini setelah pembayaran diverifikasi.
              </p>
            </div>
          ) : (
            allActivations.map((act) => (
              <div
                key={act.id}
                className="p-5 rounded-2xl bg-[#0F1011] border border-[#23252A] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#8A8F98] mb-1">
                    <span>Pesanan #{act.orderNumber}</span>
                    <span>·</span>
                    <span className="text-[#27A644] font-medium">Status: {act.status}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#F7F8F8]">{act.orderTitle}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-[#8A8F98]">Kunci Lisensi / Token:</span>
                    <code className="px-2 py-0.5 rounded bg-[#141516] border border-[#23252A] text-xs font-mono text-[#5E6AD2]">
                      {act.activationKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(act.activationKey, 'key')}
                      className="p-1 text-[#8A8F98] hover:text-white"
                      title="Salin Kunci"
                    >
                      {copiedKey === act.activationKey ? <Check className="w-3.5 h-3.5 text-[#27A644]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-1.5 pt-3 md:pt-0 border-t md:border-t-0 border-[#23252A]">
                  <div className="flex items-center gap-1.5 text-xs text-[#8A8F98]">
                    <Clock className="w-3.5 h-3.5 text-[#5E6AD2]" />
                    <span>Masa Berlaku Hingga:</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#F7F8F8]">
                    {new Date(act.validUntil).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0F1011] border border-[#23252A]">
              <ShoppingBag className="w-10 h-10 text-[#62666D] mx-auto mb-3" />
              <h3 className="text-sm font-bold text-[#F7F8F8]">Belum Ada Riwayat Pesanan</h3>
              <p className="text-xs text-[#8A8F98] mt-1">Lakukan pembelian pertama Anda di Digital Store.</p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-xl bg-[#0F1011] border border-[#23252A] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#F7F8F8]">#{ord.orderNumber}</span>
                    <span>·</span>
                    <span className="text-[#8A8F98]">{new Date(ord.createdAt).toLocaleDateString('id-ID')}</span>
                    <span>·</span>
                    <span className="text-[#5E6AD2] font-mono uppercase text-[11px]">{ord.paymentMethod}</span>
                  </div>
                  <div className="text-xs text-[#D0D6E0] mt-1 font-medium">
                    {ord.items?.map((i: any) => `${i.productTitle} (${i.quantity}x)`).join(', ')}
                  </div>
                  {ord.payment?.transactionId && (
                    <div className="text-[10px] font-mono text-[#8A8F98] mt-1">
                      TRX ID: {ord.payment.transactionId} · Gateway: {ord.payment.provider || 'MIDTRANS'}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-[#F7F8F8]">
                      {formatIDR(ord.totalAmount)}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold ${
                      ord.status === 'PAID'
                        ? 'bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20'
                        : 'bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20'
                    }`}
                  >
                    {ord.status}
                  </span>

                  <button
                    onClick={() => setSelectedInvoice(ord)}
                    className="px-2.5 py-1 rounded bg-[#141516] border border-[#23252A] hover:border-[#5E6AD2] text-xs text-[#828FFF] hover:text-white transition-colors cursor-pointer"
                  >
                    Struk / Invoice
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Partner & Commission */}
      {activeTab === 'partner' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F1011] border border-[#23252A]">
            <h3 className="text-base font-bold text-[#F7F8F8] mb-1">Tautan Referral Anda</h3>
            <p className="text-xs text-[#8A8F98] mb-4">
              Bagikan tautan ini ke teman atau klien. Dapatkan komisi {partnerData?.partner?.commissionRate || 10}% dari setiap transaksi yang berhasil.
            </p>

            <div className="flex items-center gap-2 max-w-lg">
              <input
                type="text"
                readOnly
                value={`https://rng-sf.id/?ref=${user?.referralCode || 'RNG-REF'}`}
                className="flex-1 bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs font-mono text-[#5E6AD2] outline-none"
              />
              <button
                onClick={() => copyToClipboard(`https://rng-sf.id/?ref=${user?.referralCode || 'RNG-REF'}`, 'ref')}
                className="px-3.5 py-2 bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRef ? 'Tersalin!' : 'Salin Tautan'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#0F1011] border border-[#23252A]">
              <span className="text-xs text-[#8A8F98] uppercase font-mono">Total Pendapatan</span>
              <div className="text-xl font-bold font-mono text-[#F7F8F8] mt-1">
                {formatIDR(partnerData?.partner?.totalEarnings || 0)}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0F1011] border border-[#23252A]">
              <span className="text-xs text-[#8A8F98] uppercase font-mono">Saldo Tersedia (Pending)</span>
              <div className="text-xl font-bold font-mono text-[#5E6AD2] mt-1">
                {formatIDR(partnerData?.partner?.pendingBalance || 0)}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0F1011] border border-[#23252A]">
              <span className="text-xs text-[#8A8F98] uppercase font-mono">Total Dicairkan</span>
              <div className="text-xl font-bold font-mono text-[#27A644] mt-1">
                {formatIDR(partnerData?.partner?.paidBalance || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Password */}
      {activeTab === 'security' && (
        <div className="max-w-md space-y-6">
          <div className="p-6 rounded-2xl bg-[#0F1011] border border-[#23252A]">
            <h3 className="text-base font-bold text-[#F7F8F8] mb-1">Ganti Password Akun</h3>
            <p className="text-xs text-[#8A8F98] mb-4">Pastikan menggunakan kombinasi password yang kuat dan aman.</p>

            {passMsg && (
              <div
                className={`p-3 rounded-lg text-xs mb-4 flex items-center gap-2 ${
                  passMsg.type === 'success'
                    ? 'bg-[#27A644]/10 border border-[#27A644]/30 text-[#27A644]'
                    : 'bg-[#EE0000]/10 border border-[#EE0000]/30 text-[#EE0000]'
                }`}
              >
                {passMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{passMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Password Saat Ini</label>
                <input
                  type="password"
                  required
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Password Baru (Min. 8 Karakter)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-[#141516] border border-[#23252A] focus:border-[#5E6AD2] rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Simpan Perubahan Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Official Digital Invoice / Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0F1011] border border-[#23252A] rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 p-1.5 text-[#8A8F98] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Invoice Header */}
            <div className="border-b border-[#23252A] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 flex items-center justify-center text-[#5E6AD2]">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">RNG-SF Official Receipt</h3>
                  <p className="text-[11px] text-[#8A8F98]">Bukti Pembayaran Sah Ekosistem Digital</p>
                </div>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#141516] border border-[#23252A] text-xs mb-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#8A8F98]">No. Pesanan</span>
                <div className="font-mono font-bold text-white mt-0.5">#{selectedInvoice.orderNumber}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#8A8F98]">Tanggal Pembelian</span>
                <div className="font-mono text-[#D0D6E0] mt-0.5">
                  {new Date(selectedInvoice.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#8A8F98]">Metode & Gateway</span>
                <div className="font-mono text-white mt-0.5">
                  {selectedInvoice.paymentMethod} ({selectedInvoice.payment?.provider || 'MIDTRANS'})
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#8A8F98]">Status Transaksi</span>
                <div className="mt-0.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      selectedInvoice.status === 'PAID'
                        ? 'bg-[#27A644]/20 text-[#27A644]'
                        : 'bg-[#F5A623]/20 text-[#F5A623]'
                    }`}
                  >
                    {selectedInvoice.status === 'PAID' ? 'LUNAS (SETTLED)' : selectedInvoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2 mb-5">
              <span className="text-[10px] uppercase font-mono text-[#8A8F98] block">Rincian Item</span>
              <div className="rounded-xl border border-[#23252A] overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#141516] text-[#8A8F98] font-mono text-[10px] uppercase border-b border-[#23252A]">
                    <tr>
                      <th className="p-2.5">Produk / Layanan</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#23252A]">
                    {selectedInvoice.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="p-2.5 text-white font-medium">{item.productTitle}</td>
                        <td className="p-2.5 text-center text-[#8A8F98] font-mono">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono text-white font-bold">
                          {formatIDR(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary */}
            <div className="flex justify-between items-center p-3.5 rounded-xl bg-[#141516] border border-[#23252A] mb-4">
              <span className="text-xs font-semibold text-white">Total Pembayaran</span>
              <span className="text-base font-bold font-mono text-[#27A644]">
                {formatIDR(selectedInvoice.totalAmount)}
              </span>
            </div>

            {/* Security Verification Stamp */}
            <div className="p-3 rounded-lg bg-[#27A644]/5 border border-[#27A644]/20 text-[11px] text-[#27A644] flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Diverifikasi secara backend melalui webhook resmi bertanda tangan kriptografis SHA-512.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#23252A]">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-lg bg-[#141516] border border-[#23252A] text-xs text-[#8A8F98] hover:text-white"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Bukti</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
