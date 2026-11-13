import React, { useState, useEffect } from 'react';
import {
  Shield,
  Bot,
  Share2,
  CreditCard,
  Server,
  Package,
  Users,
  CreditCard as PaymentIcon,
  Settings,
  Database,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Download,
  Play,
  ExternalLink,
  Search,
  CheckCircle2,
  RefreshCw,
  Gift,
  X,
  RotateCcw,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Unlock,
  Calendar,
  KeyRound,
  UserCheck,
  UserX,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminDashboardProps {
  onNavigateHome: () => void;
  onOpenHbdSlug: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateHome, onOpenHbdSlug }) => {
  const { user, token } = useAuth();

  // Active admin tab
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'transactions'
    | 'roles-rbac'
    | 'ai-services'
    | 'social-media'
    | 'digital-subscription'
    | 'hosting-server'
    | 'digital-products'
    | 'orders'
    | 'users'
    | 'hbd-builder'
    | 'backup-system'
    | 'audit-logs'
  >('overview');

  // Loaded data states
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [hbdPages, setHbdPages] = useState<any[]>([]);
  const [backupRecords, setBackupRecords] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Transaction reconciliation & filter state
  const [txStatusFilter, setTxStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED'>('ALL');
  const [txSearch, setTxSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [refundPromptTx, setRefundPromptTx] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState('');

  // Search filters
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Modals / Form editors
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // HBD Builder form
  const emptyHbdForm = {
    id: undefined as number | undefined,
    recipientName: '',
    title: '',
    slug: '',
    eventDate: new Date().toISOString().split('T')[0],
    message: '',
    theme: 'lavender-noir',
    musicUrl: '',
    videoUrl: '',
    photos: '',
    passwordEnabled: true,
    stage1Birthday: '',
    stage2Method: 'RECIPIENT_BIRTHDAY' as 'RECIPIENT_BIRTHDAY' | 'CUSTOM_PASSWORD',
    stage2RecipientBirthday: '',
    stage2CustomPassword: '',
    hasStage1Password: false,
    hasStage2RecipientBirthday: false,
    hasStage2CustomPassword: false,
  };
  const [hbdForm, setHbdForm] = useState(emptyHbdForm);
  const [showAdminCustomPw, setShowAdminCustomPw] = useState(false);

  // Isolated Restore Test state
  const [testingRestore, setTestingRestore] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any | null>(null);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();

      const [prodRes, catRes, ordRes, usrRes, txRes, rbacRes, permRes, hbdRes, bkpRes, logRes, setRes] =
        await Promise.all([
          fetch('/api/products', { headers }),
          fetch('/api/categories', { headers }),
          fetch('/api/admin/orders', { headers }),
          fetch('/api/admin/users', { headers }),
          fetch('/api/admin/transactions', { headers }),
          fetch('/api/rbac/roles', { headers }),
          fetch('/api/rbac/permissions', { headers }),
          fetch('/api/hbd-admin/list', { headers }),
          fetch('/api/admin/backup/list', { headers }),
          fetch('/api/admin/audit-logs', { headers }),
          fetch('/api/admin/system-settings', { headers }),
        ]);

      if (prodRes.ok) {
        const d = await prodRes.json();
        setProducts(d.products || []);
      }
      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories || []);
      }
      if (ordRes.ok) {
        const d = await ordRes.json();
        setOrders(d.orders || []);
      }
      if (usrRes.ok) {
        const d = await usrRes.json();
        setUsersList(d.users || []);
      }
      if (txRes.ok) {
        const d = await txRes.json();
        setTransactions(d.transactions || []);
      }
      if (rbacRes.ok) {
        const d = await rbacRes.json();
        setRoles(d.roles || []);
      }
      if (permRes.ok) {
        const d = await permRes.json();
        setPermissions(d.permissions || []);
      }
      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories || []);
      }
      if (ordRes.ok) {
        const d = await ordRes.json();
        setOrders(d.orders || []);
      }
      if (usrRes.ok) {
        const d = await usrRes.json();
        setUsersList(d.users || []);
      }
      if (hbdRes.ok) {
        const d = await hbdRes.json();
        setHbdPages(d.pages || []);
      }
      if (bkpRes.ok) {
        const d = await bkpRes.json();
        setBackupRecords(d.records || []);
      }
      if (logRes.ok) {
        const d = await logRes.json();
        setAuditLogs(d.logs || []);
      }
      if (setRes.ok) {
        const d = await setRes.json();
        setSystemSettings(d.settings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingProduct?.id ? 'PUT' : 'POST';
      const endpoint = editingProduct?.id ? `/api/products/${editingProduct.id}` : '/api/products';

      const res = await fetch(endpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(editingProduct),
      });

      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Produk berhasil disimpan ke database.' });
        setShowProductModal(false);
        setEditingProduct(null);
        loadAllAdminData();
      } else {
        const d = await res.json();
        setStatusMsg({ type: 'error', text: d.error || 'Gagal menyimpan produk.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Koneksi gagal.' });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Produk berhasil dihapus.' });
        loadAllAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Role pengguna berhasil diubah ke ${newRole}.` });
        loadAllAdminData();
      } else {
        const d = await res.json();
        setStatusMsg({ type: 'error', text: d.error || 'Gagal mengubah role.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Koneksi gagal.' });
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Status aktif pengguna berhasil diubah.' });
        loadAllAdminData();
      } else {
        const d = await res.json();
        setStatusMsg({ type: 'error', text: d.error || 'Gagal mengubah status pengguna.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleReconcileTransaction = async (paymentId: number) => {
    try {
      const res = await fetch(`/api/admin/transactions/${paymentId}/reconcile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes: 'Rekonsiliasi manual disetujui via dashboard' }),
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Transaksi berhasil direkonsiliasi dan dicocokkan.' });
        loadAllAdminData();
      } else {
        const d = await res.json();
        setStatusMsg({ type: 'error', text: d.error || 'Gagal merekonsiliasi transaksi.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleRefundTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundPromptTx) return;

    try {
      const res = await fetch(`/api/admin/transactions/${refundPromptTx.id}/refund`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: refundReason || 'Pengembalian dana diproses admin' }),
      });
      const d = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Refund pesanan #${refundPromptTx.orderNumber} berhasil diproses.` });
        setRefundPromptTx(null);
        setRefundReason('');
        loadAllAdminData();
      } else {
        setStatusMsg({ type: 'error', text: d.error || 'Gagal memproses refund.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleSimulateWebhookTest = async (orderNumber: string) => {
    try {
      const res = await fetch('/api/payments/simulate-webhook', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          orderNumber,
          targetStatus: 'settlement',
          provider: 'MIDTRANS',
          paymentType: 'qris',
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Uji webhook signed SHA-512 sukses: ${d.message}` });
        loadAllAdminData();
      } else {
        setStatusMsg({ type: 'error', text: d.error || 'Simulasi webhook gagal.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleFulfillOrder = async (orderId: number) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/fulfill`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Pesanan diverifikasi & lisensi diaktifkan!' });
        loadAllAdminData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleEditHbdPage = (pg: any) => {
    const photosStr = Array.isArray(pg.photos)
      ? pg.photos.join(', ')
      : typeof pg.photos === 'string'
      ? pg.photos
      : '';
    setHbdForm({
      id: pg.id,
      recipientName: pg.recipientName || '',
      title: pg.title || '',
      slug: pg.slug || '',
      eventDate: pg.eventDate || new Date().toISOString().split('T')[0],
      message: pg.message || '',
      theme: pg.theme || 'lavender-noir',
      musicUrl: pg.musicUrl || '',
      videoUrl: pg.videoUrl || '',
      photos: photosStr,
      passwordEnabled: Boolean(pg.passwordEnabled),
      stage1Birthday: '',
      stage2Method: pg.stage2Method || 'RECIPIENT_BIRTHDAY',
      stage2RecipientBirthday: '',
      stage2CustomPassword: '',
      hasStage1Password: Boolean(pg.hasStage1Password),
      hasStage2RecipientBirthday: Boolean(pg.hasStage2RecipientBirthday),
      hasStage2CustomPassword: Boolean(pg.hasStage2CustomPassword),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveHbd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let photosArr = [];
      try {
        photosArr = typeof hbdForm.photos === 'string' ? JSON.parse(hbdForm.photos) : hbdForm.photos;
      } catch {
        photosArr = hbdForm.photos.split(',').map((s) => s.trim()).filter(Boolean);
      }

      const res = await fetch('/api/hbd-admin/save', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...hbdForm, photos: photosArr }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: hbdForm.passwordEnabled
            ? 'Halaman ucapan & keamanan sandi 2 tahap berhasil disimpan!'
            : 'Halaman ucapan HBD berhasil disimpan dan aktif!',
        });
        if (data.page) {
          handleEditHbdPage(data.page);
        }
        loadAllAdminData();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Gagal menyimpan pengaturan HBD.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Gagal menyimpan.' });
    }
  };

  const handleCreateBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Snapshot database berhasil dibuat & disimpan ke persistent storage.' });
        loadAllAdminData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleTestRestore = async (filename: string) => {
    setTestingRestore(true);
    setRestoreResult(null);
    try {
      const res = await fetch('/api/admin/backup/test-restore', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      setTestingRestore(false);
      if (res.ok) {
        setRestoreResult(data);
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Uji coba restore gagal.' });
      }
    } catch (err: any) {
      setTestingRestore(false);
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const totalRevenue = orders.filter((o) => o.status === 'PAID').reduce((sum, o) => sum + o.totalAmount, 0);

  const getCategoryProducts = (categorySlug: string) => {
    const cat = categories.find((c) => c.slug === categorySlug);
    if (!cat) return [];
    return products.filter((p) => p.categoryId === cat.id);
  };

  return (
    <div className="min-h-screen bg-[#010102] text-[#F7F8F8]">
      {/* Admin Mobile Top Bar */}
      <div className="border-b border-[#23252A] bg-[#0F1011] sticky top-16 z-30 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 flex items-center justify-center text-[#5E6AD2]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>RNG-SF Developer Console</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#5E6AD2]/20 text-[#828FFF] font-mono">
                {user?.role}
              </span>
            </div>
            <div className="text-[11px] text-[#8A8F98]">Owner: Rangga (sofyantorangga028@gmail.com)</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllAdminData}
            className="p-1.5 rounded-lg bg-[#141516] border border-[#23252A] text-[#8A8F98] hover:text-white"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateHome}
            className="px-3 py-1.5 rounded-lg bg-[#18191A] border border-[#23252A] text-xs text-[#D0D6E0] hover:text-white"
          >
            Lihat Toko
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`mb-6 p-3.5 rounded-xl text-xs flex items-center justify-between ${
              statusMsg.type === 'success'
                ? 'bg-[#27A644]/10 border border-[#27A644]/30 text-[#27A644]'
                : 'bg-[#EE0000]/10 border border-[#EE0000]/30 text-[#EE0000]'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-white hover:underline text-[11px]">
              Tutup
            </button>
          </div>
        )}

        {/* Horizontal Navigation Tabs (Phone & Desktop optimized) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-[#23252A] no-scrollbar">
          {[
            { id: 'overview', label: 'Ringkasan', icon: <Shield className="w-3.5 h-3.5" /> },
            { id: 'transactions', label: 'Transaksi & Gateway', count: transactions.length, icon: <Zap className="w-3.5 h-3.5 text-[#F5A623]" /> },
            { id: 'roles-rbac', label: 'Peran & Akses (RBAC)', count: roles.length, icon: <KeyRound className="w-3.5 h-3.5 text-[#828FFF]" /> },
            { id: 'orders', label: 'Pesanan Toko', count: orders.length, icon: <PaymentIcon className="w-3.5 h-3.5" /> },
            { id: 'ai-services', label: 'AI Services', icon: <Bot className="w-3.5 h-3.5" /> },
            { id: 'social-media', label: 'Social Media', icon: <Share2 className="w-3.5 h-3.5" /> },
            { id: 'digital-subscription', label: 'Subscriptions', icon: <CreditCard className="w-3.5 h-3.5" /> },
            { id: 'hosting-server', label: 'Hosting & Server', icon: <Server className="w-3.5 h-3.5" /> },
            { id: 'digital-products', label: 'Digital Products', icon: <Package className="w-3.5 h-3.5" /> },
            { id: 'users', label: 'Manajemen Akun', count: usersList.length, icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'hbd-builder', label: 'HBD Builder', icon: <Gift className="w-3.5 h-3.5" /> },
            { id: 'backup-system', label: 'Backup & Restore Test', icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'audit-logs', label: 'Audit Logs', count: auditLogs.length, icon: <FileText className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#5E6AD2] text-white'
                  : 'bg-[#0F1011] border border-[#23252A] text-[#8A8F98] hover:text-white hover:bg-[#141516]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0F1011] border border-[#23252A]">
                <span className="text-[11px] uppercase font-mono text-[#8A8F98]">Total Pendapatan Lunas</span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#27A644] mt-1">
                  {formatIDR(totalRevenue)}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-[#0F1011] border border-[#23252A]">
                <span className="text-[11px] uppercase font-mono text-[#8A8F98]">Total Pesanan</span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#F7F8F8] mt-1">
                  {orders.length}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-[#0F1011] border border-[#23252A]">
                <span className="text-[11px] uppercase font-mono text-[#8A8F98]">Total Produk Aktif</span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#5E6AD2] mt-1">
                  {products.length}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-[#0F1011] border border-[#23252A]">
                <span className="text-[11px] uppercase font-mono text-[#8A8F98]">Total Pengguna Terdaftar</span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#F7F8F8] mt-1">
                  {usersList.length}
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0F1011] border border-[#23252A]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#F7F8F8]">Pesanan Terbaru</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs text-[#5E6AD2] hover:underline">
                    Lihat Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {orders.slice(0, 5).map((ord) => (
                    <div key={ord.id} className="p-3.5 rounded-xl bg-[#141516] border border-[#23252A] flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-white">#{ord.orderNumber}</span>
                          <span className="text-[#8A8F98]">·</span>
                          <span className="text-[#8A8F98]">{ord.user?.username || 'Client'}</span>
                        </div>
                        <div className="text-[11px] text-[#62666D] mt-0.5 font-mono">{ord.paymentMethod}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-white">{formatIDR(ord.totalAmount)}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${ord.status === 'PAID' ? 'bg-[#27A644]/20 text-[#27A644]' : 'bg-[#F5A623]/20 text-[#F5A623]'}`}>
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Server State & Fast Actions */}
              <div className="p-6 rounded-2xl bg-[#0F1011] border border-[#23252A] space-y-4">
                <h3 className="text-sm font-bold text-[#F7F8F8]">Status Ekosistem</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#23252A]">
                    <span className="text-[#8A8F98]">Database Tables:</span>
                    <span className="font-mono font-bold text-[#27A644]">32 Indexed Tables</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#23252A]">
                    <span className="text-[#8A8F98]">Storage Engine:</span>
                    <span className="font-mono text-[#D0D6E0]">Persistent Mount</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#23252A]">
                    <span className="text-[#8A8F98]">Gateway Webhook:</span>
                    <span className="font-mono text-[#5E6AD2]">HMAC-SHA256 Active</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#8A8F98]">Super Admin:</span>
                    <span className="font-mono text-white">Rangga (Protected)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setEditingProduct({
                        title: '',
                        slug: '',
                        categoryId: categories[0]?.id || 1,
                        description: '',
                        basePrice: 50000,
                        stock: -1,
                        duration: '30 Hari',
                        termsOfService: '',
                        serviceStatus: 'ACTIVE',
                        imageUrl: '',
                        specifications: '{}',
                      });
                      setShowProductModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Produk Baru</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Real Transactions & Gateway Reconciliation */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#F7F8F8]">
                  Rekonsiliasi Transaksi & Payment Gateway
                </h3>
                <p className="text-xs text-[#8A8F98]">
                  Verifikasi backend webhook bertanda tangan kriptografis (Midtrans SHA-512 & Token Xendit), status transaksi, dan pengembalian dana (refund).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadAllAdminData}
                  className="px-3 py-1.5 rounded-lg bg-[#141516] border border-[#23252A] text-xs text-[#8A8F98] hover:text-white flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Transaksi</span>
                </button>
              </div>
            </div>

            {/* Transaction Stats Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-[#0F1011] border border-[#23252A]">
                <span className="text-[10px] font-mono uppercase text-[#8A8F98]">Total Transaksi</span>
                <div className="text-lg font-bold font-mono text-white mt-0.5">{transactions.length}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0F1011] border border-[#23252A]">
                <span className="text-[10px] font-mono uppercase text-[#27A644]">Lunas / Settled</span>
                <div className="text-lg font-bold font-mono text-[#27A644] mt-0.5">
                  {transactions.filter((t) => t.status === 'SUCCESS').length}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0F1011] border border-[#23252A]">
                <span className="text-[10px] font-mono uppercase text-[#F5A623]">Menunggu Bayar</span>
                <div className="text-lg font-bold font-mono text-[#F5A623] mt-0.5">
                  {transactions.filter((t) => t.status === 'PENDING').length}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0F1011] border border-[#23252A]">
                <span className="text-[10px] font-mono uppercase text-[#EE0000]">Ditolak / Expired</span>
                <div className="text-lg font-bold font-mono text-[#EE0000] mt-0.5">
                  {transactions.filter((t) => t.status === 'FAILED').length}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0F1011] border border-[#23252A]">
                <span className="text-[10px] font-mono uppercase text-[#A855F7]">Refund Selesai</span>
                <div className="text-lg font-bold font-mono text-[#A855F7] mt-0.5">
                  {transactions.filter((t) => t.status === 'REFUNDED').length}
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 rounded-xl bg-[#0F1011] border border-[#23252A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTxStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-colors ${
                      txStatusFilter === st
                        ? 'bg-[#5E6AD2] text-white'
                        : 'bg-[#141516] border border-[#23252A] text-[#8A8F98] hover:text-white'
                    }`}
                  >
                    {st === 'ALL' ? 'Semua' : st}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8A8F98]" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Cari TRX ID, Order #, atau Ref..."
                  className="w-full bg-[#141516] border border-[#23252A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#62666D] outline-none focus:border-[#5E6AD2]"
                />
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto rounded-xl border border-[#23252A] bg-[#0F1011]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141516] text-[#8A8F98] border-b border-[#23252A] font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">TRX & No. Pesanan</th>
                    <th className="p-3">Pelanggan</th>
                    <th className="p-3">Gateway & Provider</th>
                    <th className="p-3">Metode Bayar</th>
                    <th className="p-3">Jumlah</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Waktu Settlement</th>
                    <th className="p-3 text-right">Aksi & Rekonsiliasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23252A]">
                  {transactions
                    .filter((tx) => txStatusFilter === 'ALL' || tx.status === txStatusFilter)
                    .filter(
                      (tx) =>
                        !txSearch ||
                        tx.transactionId?.toLowerCase().includes(txSearch.toLowerCase()) ||
                        tx.orderNumber?.toLowerCase().includes(txSearch.toLowerCase()) ||
                        tx.gatewayRef?.toLowerCase().includes(txSearch.toLowerCase())
                    )
                    .map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#141516]/50">
                        <td className="p-3 font-mono">
                          <div className="text-white font-bold">{tx.transactionId}</div>
                          <div className="text-[11px] text-[#5E6AD2]">#{tx.orderNumber}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-white font-medium">{tx.buyer?.username || 'Client'}</div>
                          <div className="text-[11px] text-[#8A8F98]">{tx.buyer?.email}</div>
                        </td>
                        <td className="p-3 font-mono">
                          <span className="px-2 py-0.5 rounded bg-[#18191A] border border-[#23252A] text-[10px] text-[#D0D6E0] font-bold">
                            {tx.provider || 'MIDTRANS'}
                          </span>
                          <div className="text-[10px] text-[#8A8F98] mt-0.5 truncate max-w-[120px]">
                            {tx.gatewayRef || '-'}
                          </div>
                        </td>
                        <td className="p-3 text-[#D0D6E0] uppercase font-mono text-[11px]">
                          {tx.paymentType || 'QRIS'}
                        </td>
                        <td className="p-3 font-mono font-bold text-white">
                          {formatIDR(tx.amount)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold ${
                              tx.status === 'SUCCESS'
                                ? 'bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20'
                                : tx.status === 'PENDING'
                                ? 'bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20'
                                : tx.status === 'REFUNDED'
                                ? 'bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20'
                                : 'bg-[#EE0000]/10 text-[#EE0000] border border-[#EE0000]/20'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-3 text-[#8A8F98] text-[11px] font-mono">
                          {tx.settlementTime
                            ? new Date(tx.settlementTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                            : '-'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="px-2 py-1 rounded bg-[#141516] border border-[#23252A] hover:border-[#5E6AD2] text-[11px] text-[#D0D6E0] hover:text-white flex items-center gap-1 cursor-pointer"
                              title="Lihat Detail Webhook"
                            >
                              <Eye className="w-3 h-3 text-[#828FFF]" />
                              <span>Log</span>
                            </button>

                            {tx.status === 'PENDING' && (
                              <button
                                onClick={() => handleSimulateWebhookTest(tx.orderNumber)}
                                className="px-2 py-1 rounded bg-[#F5A623]/10 hover:bg-[#F5A623]/20 border border-[#F5A623]/30 text-[#F5A623] text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                                title="Uji Webhook Settlement Midtrans"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Simulasi Lunas</span>
                              </button>
                            )}

                            {tx.status === 'SUCCESS' && (
                              <>
                                <button
                                  onClick={() => handleReconcileTransaction(tx.id)}
                                  className="px-2 py-1 rounded bg-[#27A644]/10 hover:bg-[#27A644]/20 border border-[#27A644]/30 text-[#27A644] text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                                  title="Rekonsiliasi Manual"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Cocokkan</span>
                                </button>

                                <button
                                  onClick={() => setRefundPromptTx(tx)}
                                  className="px-2 py-1 rounded bg-[#EE0000]/10 hover:bg-[#EE0000]/20 border border-[#EE0000]/30 text-[#EE0000] text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                                  title="Ajukan Refund"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Refund</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {transactions.length === 0 && (
                <div className="p-8 text-center text-[#8A8F98] text-xs">
                  Belum ada transaksi pembayaran yang tercatat di gateway.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Role-Based Access Control (RBAC) */}
        {activeTab === 'roles-rbac' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#F7F8F8]">
                  Role-Based Access Control (RBAC) & Izin Granular
                </h3>
                <p className="text-xs text-[#8A8F98]">
                  Sistem kontrol akses multi-peran dengan 6 peran terdefinisi dan penegakan izin pada API backend.
                </p>
              </div>

              <div className="px-3 py-1 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 text-[#828FFF] text-xs font-mono">
                RBAC Enforcement: ACTIVE
              </div>
            </div>

            {/* 6 Defined Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((r) => (
                <div key={r.id} className="p-5 rounded-2xl bg-[#0F1011] border border-[#23252A] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-[#828FFF] px-2 py-0.5 rounded bg-[#5E6AD2]/20 border border-[#5E6AD2]/30">
                        {r.name}
                      </span>
                      <span className="text-[10px] text-[#8A8F98]">
                        {r.permissions?.length || 0} Izin
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{r.label}</h4>
                    <p className="text-xs text-[#8A8F98] mt-1.5 leading-relaxed">{r.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#23252A]">
                    <div className="text-[10px] font-mono uppercase text-[#8A8F98] mb-1.5">Izin Terkoneksi:</div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {r.name === 'SUPER_ADMIN' ? (
                        <span className="px-2 py-0.5 rounded bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20 text-[10px] font-mono">
                          ★ Full Platform Access (Semua 30+ Izin)
                        </span>
                      ) : (
                        (r.permissions || []).map((perm: string) => (
                          <span
                            key={perm}
                            className="px-1.5 py-0.5 rounded bg-[#141516] border border-[#23252A] text-[10px] font-mono text-[#D0D6E0]"
                          >
                            {perm}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* User Role Assignment & Status Management Table */}
            <div className="p-6 rounded-2xl bg-[#0F1011] border border-[#23252A] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white">Penetapan Peran Pengguna (Role Assignment)</h4>
                  <p className="text-xs text-[#8A8F98]">
                    Ubah peran dan aktifkan/blokir pengguna. Hak akses API diperbarui secara real-time.
                  </p>
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8A8F98]" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Filter nama atau email..."
                    className="w-full bg-[#141516] border border-[#23252A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-[#5E6AD2]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#23252A]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141516] text-[#8A8F98] border-b border-[#23252A] font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3">ID & Pengguna</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Peran Saat Ini</th>
                      <th className="p-3">Status Akun</th>
                      <th className="p-3">Ubah Peran (RBAC)</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#23252A]">
                    {usersList
                      .filter(
                        (u) =>
                          u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase())
                      )
                      .map((usr) => (
                        <tr key={usr.id} className="hover:bg-[#141516]/50">
                          <td className="p-3 font-medium text-white">
                            <div>#{usr.id} {usr.username}</div>
                          </td>
                          <td className="p-3 text-[#D0D6E0]">{usr.email}</td>
                          <td className="p-3 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                usr.role === 'SUPER_ADMIN'
                                  ? 'bg-[#5E6AD2]/20 text-[#828FFF] border border-[#5E6AD2]/30'
                                  : usr.role === 'STORE_MANAGER'
                                  ? 'bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/30'
                                  : usr.role === 'CONTENT_MANAGER'
                                  ? 'bg-[#27A644]/20 text-[#27A644] border border-[#27A644]/30'
                                  : 'bg-[#18191A] text-white'
                              }`}
                            >
                              {usr.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                                usr.isActive !== false
                                  ? 'text-[#27A644] bg-[#27A644]/10 border border-[#27A644]/20'
                                  : 'text-[#EE0000] bg-[#EE0000]/10 border border-[#EE0000]/20'
                              }`}
                            >
                              {usr.isActive !== false ? 'AKTIF' : 'DIBLOKIR'}
                            </span>
                          </td>
                          <td className="p-3">
                            {usr.role !== 'SUPER_ADMIN' ? (
                              <select
                                value={usr.role}
                                onChange={(e) => handleUpdateUserRole(usr.id, e.target.value)}
                                className="bg-[#141516] border border-[#23252A] rounded px-2.5 py-1 text-xs text-white outline-none cursor-pointer focus:border-[#5E6AD2]"
                              >
                                <option value="USER">USER (Regular User)</option>
                                <option value="STORE_MANAGER">STORE_MANAGER (Katalog & Toko)</option>
                                <option value="CONTENT_MANAGER">CONTENT_MANAGER (HBD & Media)</option>
                                <option value="PARTNER">PARTNER (Afiliasi & Komisi)</option>
                                <option value="CREATOR">CREATOR (Submission Template)</option>
                                <option value="SUPER_ADMIN">SUPER_ADMIN (Promosi Owner)</option>
                              </select>
                            ) : (
                              <span className="text-[11px] text-[#8A8F98] italic">Protected Owner</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {usr.role !== 'SUPER_ADMIN' && (
                              <button
                                onClick={() => handleToggleUserStatus(usr.id)}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                                  usr.isActive !== false
                                    ? 'bg-[#EE0000]/10 text-[#EE0000] hover:bg-[#EE0000]/20 border border-[#EE0000]/30'
                                    : 'bg-[#27A644]/10 text-[#27A644] hover:bg-[#27A644]/20 border border-[#27A644]/30'
                                }`}
                              >
                                {usr.isActive !== false ? 'Blokir' : 'Aktifkan'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {['ai-services', 'social-media', 'digital-subscription', 'hosting-server', 'digital-products'].includes(activeTab) && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#F7F8F8] capitalize">
                  Pengelolaan {activeTab.replace('-', ' ')}
                </h3>
                <p className="text-xs text-[#8A8F98]">
                  Tambah, edit harga, ubah stok, dan kelola masa berlaku produk untuk kategori ini.
                </p>
              </div>

              <button
                onClick={() => {
                  const matchedCat = categories.find((c) => c.slug === activeTab);
                  setEditingProduct({
                    title: '',
                    slug: '',
                    categoryId: matchedCat?.id || 1,
                    description: '',
                    basePrice: 50000,
                    stock: -1,
                    duration: '30 Hari',
                    termsOfService: '',
                    serviceStatus: 'ACTIVE',
                    imageUrl: '',
                    specifications: '{}',
                  });
                  setShowProductModal(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold flex items-center gap-1.5 self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </button>
            </div>

            {/* Product Table / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getCategoryProducts(activeTab).map((prod) => (
                <div key={prod.id} className="p-5 rounded-2xl bg-[#0F1011] border border-[#23252A] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8A8F98] mb-1">
                      <span>{prod.categoryName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${prod.serviceStatus === 'ACTIVE' ? 'text-[#27A644] bg-[#27A644]/10' : 'text-[#EE0000] bg-[#EE0000]/10'}`}>
                        {prod.serviceStatus}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{prod.title}</h4>
                    <p className="text-xs text-[#8A8F98] mt-1 line-clamp-2">{prod.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-mono">
                      <span className="text-[#5E6AD2] font-bold">{formatIDR(prod.basePrice)}</span>
                      <span>·</span>
                      <span className="text-[#8A8F98]">{prod.duration || '30 Hari'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#23252A] flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(prod);
                        setShowProductModal(true);
                      }}
                      className="p-1.5 rounded-lg bg-[#141516] border border-[#23252A] text-[#8A8F98] hover:text-white"
                      title="Edit Produk"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="p-1.5 rounded-lg bg-[#141516] border border-[#23252A] text-[#8A8F98] hover:text-[#EE0000]"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Orders & Payment Approvals */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#F7F8F8]">Kelola Pesanan & Pembayaran</h3>

            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="p-4 rounded-xl bg-[#0F1011] border border-[#23252A] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-white">#{ord.orderNumber}</span>
                      <span className="text-[#8A8F98]">·</span>
                      <span className="text-[#8A8F98]">{new Date(ord.createdAt).toLocaleDateString('id-ID')}</span>
                      <span className="text-[#8A8F98]">·</span>
                      <span className="text-white font-medium">{ord.user?.username || 'Client'} ({ord.user?.email})</span>
                    </div>

                    <div className="text-xs text-[#D0D6E0] mt-1.5">
                      {ord.items?.map((i: any) => `${i.productTitle} × ${i.quantity}`).join(', ')}
                    </div>

                    {ord.customerNotes && (
                      <div className="text-[11px] text-[#8A8F98] mt-1">
                        Catatan: <span className="italic text-white">{ord.customerNotes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-[#F7F8F8]">{formatIDR(ord.totalAmount)}</div>
                      <div className="text-[10px] font-mono text-[#8A8F98]">{ord.paymentMethod}</div>
                    </div>

                    <span className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold ${ord.status === 'PAID' ? 'bg-[#27A644]/20 text-[#27A644]' : 'bg-[#F5A623]/20 text-[#F5A623]'}`}>
                      {ord.status}
                    </span>

                    {ord.status !== 'PAID' && (
                      <button
                        onClick={() => handleFulfillOrder(ord.id)}
                        className="px-3 py-1.5 bg-[#27A644] hover:bg-[#208b39] text-white text-xs font-semibold rounded-lg"
                      >
                        Verifikasi Lunas
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: User Management & RBAC */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#F7F8F8]">Manajemen Pengguna & Hak Akses (RBAC)</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#8A8F98]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari user / email..."
                  className="w-full bg-[#141516] border border-[#23252A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#23252A] bg-[#0F1011]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141516] text-[#8A8F98] border-b border-[#23252A] font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">ID / User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Referral</th>
                    <th className="p-3">Ubah Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23252A]">
                  {usersList
                    .filter((u) => u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                    .map((usr) => (
                      <tr key={usr.id} className="hover:bg-[#141516]/50">
                        <td className="p-3 font-medium text-white">
                          <div>#{usr.id} {usr.username}</div>
                        </td>
                        <td className="p-3 text-[#D0D6E0]">{usr.email}</td>
                        <td className="p-3 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${usr.role === 'SUPER_ADMIN' ? 'bg-[#5E6AD2]/20 text-[#828FFF]' : 'bg-[#18191A] text-white'}`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[#8A8F98]">{usr.referralCode || '-'}</td>
                        <td className="p-3">
                          {usr.role !== 'SUPER_ADMIN' ? (
                            <select
                              value={usr.role}
                              onChange={(e) => handleUpdateUserRole(usr.id, e.target.value)}
                              className="bg-[#141516] border border-[#23252A] rounded px-2 py-1 text-xs text-white outline-none cursor-pointer"
                            >
                              <option value="USER">USER</option>
                              <option value="PARTNER">PARTNER</option>
                              <option value="STAFF">STAFF</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          ) : (
                            <span className="text-[11px] text-[#8A8F98]">Protected Owner</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: HBD Builder */}
        {activeTab === 'hbd-builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-[#0F1011] border border-[#23252A]">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-[#F7F8F8] mb-1">
                    {hbdForm.id ? 'Edit & Atur Keamanan Halaman HBD' : 'Buat Halaman HBD & Wishes Baru'}
                  </h3>
                  <p className="text-xs text-[#8A8F98]">
                    Konfigurasikan ucapan personal, media, tema, serta sistem keamanan dua tahap khusus per halaman.
                  </p>
                </div>

                {hbdForm.id && (
                  <button
                    type="button"
                    onClick={() => setHbdForm(emptyHbdForm)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#141516] border border-[#23252A] hover:border-[#5E6AD2] text-[11px] text-[#D0D6E0] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    + Buat Baru
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveHbd} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Nama Penerima</label>
                    <input
                      type="text"
                      required
                      value={hbdForm.recipientName}
                      onChange={(e) => setHbdForm({ ...hbdForm, recipientName: e.target.value })}
                      placeholder="Contoh: Sarah Amanda"
                      className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5E6AD2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Tema Visual</label>
                    <select
                      value={hbdForm.theme}
                      onChange={(e) => setHbdForm({ ...hbdForm, theme: e.target.value })}
                      className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5E6AD2]"
                    >
                      <option value="lavender-noir">Lavender Noir (Romantis Gelap)</option>
                      <option value="aurora-emerald">Aurora Emerald (Tenang & Segar)</option>
                      <option value="crimson-gold">Crimson Gold (Hangat & Elegan)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Judul Halaman</label>
                  <input
                    type="text"
                    required
                    value={hbdForm.title}
                    onChange={(e) => setHbdForm({ ...hbdForm, title: e.target.value })}
                    placeholder="Happy 21st Birthday, Sarah! ✨"
                    className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5E6AD2]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Slug Tautan (URL)</label>
                    <input
                      type="text"
                      required
                      value={hbdForm.slug}
                      onChange={(e) => setHbdForm({ ...hbdForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                      placeholder="happy-21-sarah"
                      className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-[#5E6AD2]"
                    />
                    <span className="text-[10px] text-[#8A8F98] mt-1 block">Tautan publik: /hbd/{hbdForm.slug || 'slug-anda'}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Tanggal Acara</label>
                    <input
                      type="date"
                      required
                      value={hbdForm.eventDate}
                      onChange={(e) => setHbdForm({ ...hbdForm, eventDate: e.target.value })}
                      className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5E6AD2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Pesan / Surat Personal</label>
                  <textarea
                    required
                    rows={4}
                    value={hbdForm.message}
                    onChange={(e) => setHbdForm({ ...hbdForm, message: e.target.value })}
                    placeholder="Tuliskan ucapan selamat ulang tahun penuh doa dan kehangatan..."
                    className="w-full bg-[#141516] border border-[#23252A] rounded-lg p-3 text-xs text-white outline-none focus:border-[#5E6AD2]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#D0D6E0] mb-1">URL Audio / Musik Latar (MP3)</label>
                    <input
                      type="url"
                      value={hbdForm.musicUrl}
                      onChange={(e) => setHbdForm({ ...hbdForm, musicUrl: e.target.value })}
                      placeholder="https://.../music.mp3"
                      className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5E6AD2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#D0D6E0] mb-1">URL Video Ucapan (Opsional)</label>
                    <input
                      type="url"
                      value={hbdForm.videoUrl}
                      onChange={(e) => setHbdForm({ ...hbdForm, videoUrl: e.target.value })}
                      placeholder="https://.../video.mp4"
                      className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5E6AD2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D0D6E0] mb-1">URL Foto (Pisahkan dengan koma)</label>
                  <textarea
                    rows={2}
                    value={hbdForm.photos}
                    onChange={(e) => setHbdForm({ ...hbdForm, photos: e.target.value })}
                    placeholder="https://... , https://..."
                    className="w-full bg-[#141516] border border-[#23252A] rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#5E6AD2]"
                  />
                </div>

                {/* Two-Stage Password Configuration Panel */}
                <div className="pt-4 mt-2 border-t border-[#23252A] space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-[#F7F8F8]">
                        <Lock className="w-3.5 h-3.5 text-[#828FFF]" />
                        <span>Keamanan Dua Tahap (Password Halaman)</span>
                      </div>
                      <p className="text-[11px] text-[#8A8F98] mt-0.5">
                        Lindungi isi ucapan dengan verifikasi 2 tahap yang tersimpan terenkripsi (hash) di server.
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={hbdForm.passwordEnabled}
                      onClick={() => setHbdForm({ ...hbdForm, passwordEnabled: !hbdForm.passwordEnabled })}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        hbdForm.passwordEnabled
                          ? 'bg-[#27A644]/15 border-[#27A644]/40 text-[#27A644]'
                          : 'bg-[#141516] border-[#23252A] text-[#8A8F98] hover:text-white'
                      }`}
                    >
                      {hbdForm.passwordEnabled ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </div>

                  {hbdForm.passwordEnabled && (
                    <div className="space-y-4 pt-2">
                      {/* Stage 1 Password */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-[#D0D6E0]">
                            Tahap 1: Tanggal Ulang Tahun Pembuat Ucapan
                          </label>
                          {hbdForm.hasStage1Password && (
                            <span className="text-[10px] font-mono text-[#27A644]">Sudah tersimpan</span>
                          )}
                        </div>
                        <div className="relative">
                          <Calendar className="w-3.5 h-3.5 text-[#8A8F98] absolute left-3 top-2.5 pointer-events-none" />
                          <input
                            type="date"
                            required={hbdForm.passwordEnabled && !hbdForm.hasStage1Password}
                            value={hbdForm.stage1Birthday}
                            onChange={(e) => setHbdForm({ ...hbdForm, stage1Birthday: e.target.value })}
                            className="w-full bg-[#141516] border border-[#23252A] rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[#5E6AD2]"
                          />
                        </div>
                        {hbdForm.hasStage1Password && (
                          <span className="text-[10px] text-[#8A8F98] mt-1 block">
                            Biarkan kosong jika tidak ingin mengubah tanggal Tahap 1 saat ini.
                          </span>
                        )}
                      </div>

                      {/* Stage 2 Method Choice */}
                      <div>
                        <label className="block text-xs font-medium text-[#D0D6E0] mb-1.5">
                          Tahap 2: Pilih Metode Password
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setHbdForm({ ...hbdForm, stage2Method: 'RECIPIENT_BIRTHDAY' })}
                            className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                              hbdForm.stage2Method === 'RECIPIENT_BIRTHDAY'
                                ? 'bg-[#5E6AD2]/15 border-[#5E6AD2] text-white'
                                : 'bg-[#141516] border-[#23252A] text-[#8A8F98] hover:text-white'
                            }`}
                          >
                            <div className="font-semibold">Tanggal Lahir Penerima</div>
                            <div className="text-[10px] opacity-80 mt-0.5">Pengunjung isi ultah penerima</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setHbdForm({ ...hbdForm, stage2Method: 'CUSTOM_PASSWORD' })}
                            className={`p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                              hbdForm.stage2Method === 'CUSTOM_PASSWORD'
                                ? 'bg-[#5E6AD2]/15 border-[#5E6AD2] text-white'
                                : 'bg-[#141516] border-[#23252A] text-[#8A8F98] hover:text-white'
                            }`}
                          >
                            <div className="font-semibold">Password Khusus</div>
                            <div className="text-[10px] opacity-80 mt-0.5">Sandi buatan pembuat HBD</div>
                          </button>
                        </div>
                      </div>

                      {/* Stage 2 Secret Input */}
                      {hbdForm.stage2Method === 'RECIPIENT_BIRTHDAY' ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-[#D0D6E0]">
                              Tanggal Ulang Tahun Penerima
                            </label>
                            {hbdForm.hasStage2RecipientBirthday && (
                              <span className="text-[10px] font-mono text-[#27A644]">Sudah tersimpan</span>
                            )}
                          </div>
                          <div className="relative">
                            <Calendar className="w-3.5 h-3.5 text-[#8A8F98] absolute left-3 top-2.5 pointer-events-none" />
                            <input
                              type="date"
                              required={
                                hbdForm.passwordEnabled &&
                                hbdForm.stage2Method === 'RECIPIENT_BIRTHDAY' &&
                                !hbdForm.hasStage2RecipientBirthday
                              }
                              value={hbdForm.stage2RecipientBirthday}
                              onChange={(e) => setHbdForm({ ...hbdForm, stage2RecipientBirthday: e.target.value })}
                              className="w-full bg-[#141516] border border-[#23252A] rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[#5E6AD2]"
                            />
                          </div>
                          {hbdForm.hasStage2RecipientBirthday && (
                            <span className="text-[10px] text-[#8A8F98] mt-1 block">
                              Biarkan kosong jika tidak ingin mengganti tanggal lahir penerima.
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-[#D0D6E0]">
                              Buat Password Khusus Tahap 2
                            </label>
                            {hbdForm.hasStage2CustomPassword && (
                              <span className="text-[10px] font-mono text-[#27A644]">Sudah tersimpan</span>
                            )}
                          </div>
                          <div className="relative">
                            <KeyRound className="w-3.5 h-3.5 text-[#8A8F98] absolute left-3 top-2.5 pointer-events-none" />
                            <input
                              type={showAdminCustomPw ? 'text' : 'password'}
                              required={
                                hbdForm.passwordEnabled &&
                                hbdForm.stage2Method === 'CUSTOM_PASSWORD' &&
                                !hbdForm.hasStage2CustomPassword
                              }
                              autoComplete="new-password"
                              value={hbdForm.stage2CustomPassword}
                              onChange={(e) => setHbdForm({ ...hbdForm, stage2CustomPassword: e.target.value })}
                              placeholder={
                                hbdForm.hasStage2CustomPassword
                                  ? 'Isi sandi baru jika ingin mengubah...'
                                  : 'Contoh: kenangan2026'
                              }
                              className="w-full bg-[#141516] border border-[#23252A] rounded-lg pl-9 pr-10 py-2 text-xs text-white outline-none focus:border-[#5E6AD2]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowAdminCustomPw((v) => !v)}
                              className="absolute right-3 top-2 text-[#8A8F98] hover:text-white cursor-pointer"
                            >
                              {showAdminCustomPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Simpan Pengaturan & Publikasikan Halaman HBD
                </button>
              </form>
            </div>

            {/* List of existing HBD pages */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#F7F8F8]">Halaman Ucapan Tersimpan ({hbdPages.length})</h3>

              <div className="space-y-3">
                {hbdPages.map((pg) => (
                  <div key={pg.id} className="p-4 rounded-xl bg-[#0F1011] border border-[#23252A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white">{pg.title}</div>
                      <div className="text-[11px] text-[#8A8F98] mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span>Penerima: <span className="text-[#D0D6E0]">{pg.recipientName}</span></span>
                        <span>·</span>
                        <span>Views: {pg.viewsCount}</span>
                        <span>·</span>
                        <span className={pg.passwordEnabled ? 'text-[#27A644]' : 'text-[#8A8F98]'}>
                          {pg.passwordEnabled
                            ? `Sandi 2 Tahap (${pg.stage2Method === 'CUSTOM_PASSWORD' ? 'Sandi Khusus' : 'Ultah Penerima'})`
                            : 'Publik Tanpa Sandi'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#5E6AD2] mt-1">/hbd/{pg.slug}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditHbdPage(pg)}
                        className="px-3 py-1.5 rounded-lg bg-[#141516] border border-[#23252A] hover:border-[#5E6AD2] text-xs text-[#D0D6E0] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit / Sandi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenHbdSlug(pg.slug)}
                        className="px-3 py-1.5 rounded-lg bg-[#141516] border border-[#23252A] text-xs text-[#828FFF] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <span>Lihat</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Backup & Isolated Restoration Testing */}
        {activeTab === 'backup-system' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0F1011] border border-[#23252A]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#F7F8F8]">Snapshot Database & Uji Coba Pemulihan</h3>
                  <p className="text-xs text-[#8A8F98] mt-0.5">
                    Buat cadangan database terenkripsi dan jalankan uji verifikasi integritas pemulihan pada database terisolasi.
                  </p>
                </div>

                <button
                  onClick={handleCreateBackup}
                  className="px-4 py-2 bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start"
                >
                  <Database className="w-4 h-4" />
                  <span>Buat Backup Baru</span>
                </button>
              </div>

              {restoreResult && (
                <div className="mt-5 p-4 rounded-xl bg-[#27A644]/10 border border-[#27A644]/30 text-xs text-[#27A644] space-y-1">
                  <div className="font-bold">{restoreResult.message}</div>
                  <div className="text-[11px] text-[#D0D6E0] font-mono">
                    Verifikasi Tabel: Users ({restoreResult.tableSummary?.users}), Products ({restoreResult.tableSummary?.products}), Orders ({restoreResult.tableSummary?.orders})
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-mono uppercase text-[#8A8F98]">Arsip Snapshot Database</h4>
                {backupRecords.map((bkp) => (
                  <div key={bkp.id} className="p-3.5 rounded-xl bg-[#141516] border border-[#23252A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-mono font-bold text-white">{bkp.filename}</div>
                      <div className="text-[11px] text-[#8A8F98] mt-0.5">
                        Ukuran: {Math.round(bkp.sizeBytes / 1024)} KB · Checksum: {bkp.checksum}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestRestore(bkp.filename)}
                        disabled={testingRestore}
                        className="px-3 py-1.5 rounded-lg bg-[#18191A] border border-[#34343A] hover:border-[#5E6AD2] text-[#828FFF] text-xs font-medium flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{testingRestore ? 'Menguji...' : 'Uji Restore Terisolasi'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Audit Logs */}
        {activeTab === 'audit-logs' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#F7F8F8]">Audit Log Aktivitas Admin (Tersanitasi)</h3>
            <p className="text-xs text-[#8A8F98]">
              Semua log aktivitas telah disaring secara otomatis; password, token, dan secret tidak disimpan.
            </p>

            <div className="overflow-x-auto rounded-xl border border-[#23252A] bg-[#0F1011]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141516] text-[#8A8F98] border-b border-[#23252A] font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Aksi</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Detail (Sanitized)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23252A] font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#141516]/50">
                      <td className="p-3 text-[#8A8F98] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-[#5E6AD2] font-semibold">{log.action}</td>
                      <td className="p-3 text-white">{log.targetEntity}</td>
                      <td className="p-3 text-[#8A8F98]">{log.ipAddress}</td>
                      <td className="p-3 text-[#D0D6E0] max-w-xs truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product CRUD Modal */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0F1011] border border-[#23252A] rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowProductModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#8A8F98] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4">
              {editingProduct.id ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#5E6AD2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Kategori</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: Number(e.target.value) })}
                    className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Harga Dasar (IDR)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.basePrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, basePrice: Number(e.target.value) })}
                    className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#5E6AD2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Stok (-1 = Unlimited)</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Durasi Layanan</label>
                  <input
                    type="text"
                    value={editingProduct.duration}
                    onChange={(e) => setEditingProduct({ ...editingProduct, duration: e.target.value })}
                    placeholder="30 Hari / Lifetime"
                    className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Deskripsi Produk</label>
                <textarea
                  rows={3}
                  required
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-[#141516] border border-[#23252A] rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#5E6AD2]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#D0D6E0] mb-1">URL Gambar Banner</label>
                <input
                  type="url"
                  value={editingProduct.imageUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#D0D6E0] mb-1">Syarat & Ketentuan</label>
                <input
                  type="text"
                  value={editingProduct.termsOfService || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, termsOfService: e.target.value })}
                  placeholder="Ketentuan penggunaan resmi..."
                  className="w-full bg-[#141516] border border-[#23252A] rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#5E6AD2] hover:bg-[#828FFF] text-white text-xs font-semibold rounded-lg mt-2 cursor-pointer"
              >
                Simpan Produk
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Webhook Inspection Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#0F1011] border border-[#23252A] rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 p-1.5 text-[#8A8F98] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-[#F5A623]" />
              <h3 className="text-base font-bold text-white">
                Log Transaksi & Webhook Gateway
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#141516] border border-[#23252A]">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8A8F98]">Transaction ID</span>
                  <div className="font-mono font-bold text-white mt-0.5">{selectedTx.transactionId}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8A8F98]">Nomor Pesanan</span>
                  <div className="font-mono text-[#5E6AD2] mt-0.5">#{selectedTx.orderNumber}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8A8F98]">Provider & Metode</span>
                  <div className="font-mono text-white mt-0.5">
                    {selectedTx.provider || 'MIDTRANS'} · {selectedTx.paymentType || 'QRIS'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8A8F98]">Gateway Ref / Token</span>
                  <div className="font-mono text-[#D0D6E0] mt-0.5 truncate">
                    {selectedTx.gatewayRef || '-'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8A8F98]">Status Saat Ini</span>
                  <div className="mt-0.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        selectedTx.status === 'SUCCESS'
                          ? 'bg-[#27A644]/20 text-[#27A644]'
                          : selectedTx.status === 'PENDING'
                          ? 'bg-[#F5A623]/20 text-[#F5A623]'
                          : selectedTx.status === 'REFUNDED'
                          ? 'bg-[#A855F7]/20 text-[#A855F7]'
                          : 'bg-[#EE0000]/20 text-[#EE0000]'
                      }`}
                    >
                      {selectedTx.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#8A8F98]">Waktu Settlement</span>
                  <div className="font-mono text-[#8A8F98] mt-0.5">
                    {selectedTx.settlementTime
                      ? new Date(selectedTx.settlementTime).toLocaleString('id-ID')
                      : 'Belum settlement'}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono uppercase text-[#8A8F98] block mb-1.5">
                  Payload Respon Gateway (Tersanitasi)
                </span>
                <pre className="p-3.5 rounded-xl bg-[#010102] border border-[#23252A] font-mono text-[11px] text-[#27A644] overflow-x-auto max-h-60">
                  {selectedTx.gatewayResponse
                    ? typeof selectedTx.gatewayResponse === 'string'
                      ? selectedTx.gatewayResponse
                      : JSON.stringify(selectedTx.gatewayResponse, null, 2)
                    : '// Tidak ada payload webhook eksternal yang dicatat'}
                </pre>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedTx(null)}
                  className="px-4 py-2 rounded-lg bg-[#141516] border border-[#23252A] text-xs text-[#D0D6E0] hover:text-white"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Prompt Modal */}
      {refundPromptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0F1011] border border-[#23252A] rounded-2xl shadow-2xl p-6">
            <button
              onClick={() => {
                setRefundPromptTx(null);
                setRefundReason('');
              }}
              className="absolute top-4 right-4 p-1.5 text-[#8A8F98] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="w-4 h-4 text-[#EE0000]" />
              <h3 className="text-base font-bold text-white">Proses Refund Transaksi</h3>
            </div>

            <p className="text-xs text-[#8A8F98] mb-4">
              Pengembalian dana untuk pesanan <span className="font-mono text-white font-bold">#{refundPromptTx.orderNumber}</span> sebesar{' '}
              <span className="font-mono text-[#27A644] font-bold">{formatIDR(refundPromptTx.amount)}</span>.
            </p>

            <form onSubmit={handleRefundTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#D0D6E0] mb-1">
                  Alasan Pengembalian Dana (Refund)
                </label>
                <textarea
                  required
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Contoh: Permintaan pembatalan pelanggan sebelum aktivasi lisensi..."
                  className="w-full bg-[#141516] border border-[#23252A] rounded-lg p-2.5 text-xs text-white outline-none focus:border-[#EE0000]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRefundPromptTx(null);
                    setRefundReason('');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#141516] border border-[#23252A] text-xs text-[#8A8F98] hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#EE0000] hover:bg-[#CC0000] text-white text-xs font-semibold"
                >
                  Konfirmasi Pengembalian Dana
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
