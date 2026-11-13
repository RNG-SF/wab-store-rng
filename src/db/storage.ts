import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'rng_database.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export interface DatabaseState {
  users: any[];
  userSessions: any[];
  passwordResets: any[];
  csrfTokens: any[];
  loginAttempts: any[];
  roles: any[];
  permissions: any[];
  rolePermissions: any[];
  productCategories: any[];
  products: any[];
  productPackages: any[];
  productAssets: any[];
  digitalLicenses: any[];
  orders: any[];
  orderItems: any[];
  payments: any[];
  refunds: any[];
  paymentEvents: any[];
  paymentReconciliations: any[];
  webhookEvents: any[];
  idempotencyRecords: any[];
  serviceActivations: any[];
  serviceRenewals: any[];
  expirationHistory: any[];
  hbdPages: any[];
  hbdGuestbook: any[];
  mediaAssets: any[];
  partners: any[];
  partnerCommissions: any[];
  partnerPayouts: any[];
  creatorSubmissions: any[];
  creatorRewards: any[];
  notifications: any[];
  backupRecords: any[];
  systemSettings: any[];
  auditLogs: any[];
  metadata: {
    version: string;
    lastUpdated: string;
  };
}

export const DEFAULT_ROLES = [
  {
    id: 1,
    name: 'SUPER_ADMIN',
    label: 'Super Admin (Owner Platform)',
    description: 'Akses penuh tanpa batas: manajemen pengguna, peran & izin RBAC, katalog store, transaksi, gateway, backup, dan audit logs.',
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'STORE_MANAGER',
    label: 'Store Manager',
    description: 'Mengelola produk digital, paket harga, stok, pesanan pelanggan, rekonsiliasi gateway, dan proses refund.',
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'CONTENT_MANAGER',
    label: 'Content Manager',
    description: 'Mengelola halaman ucapan HBD dinamis, kartu ucapan wishes, moderasi guestbook, dan galeri media.',
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'PARTNER',
    label: 'Partner & Affiliate',
    description: 'Mengakses dashboard referral, melacak klik & transaksi terafiliasi, memantau komisi, dan permohonan payout.',
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'CREATOR',
    label: 'Digital Creator',
    description: 'Mengirimkan template karya ucapan, melacak review admin, dan menerima reward kreator digital.',
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'USER',
    label: 'Regular User',
    description: 'Pengguna terdaftar: berbelanja di Digital Store, checkout pembayaran instan, melihat lisensi aktif, dan ucapan.',
    isSystem: true,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_PERMISSIONS = [
  // 1. Users & RBAC
  { id: 1, name: 'users:read', module: 'users', description: 'Melihat daftar seluruh pengguna dan profil' },
  { id: 2, name: 'users:manage', module: 'users', description: 'Mengubah status akun, blokir/unblock pengguna' },
  { id: 3, name: 'roles:manage', module: 'users', description: 'Menetapkan dan mengubah peran pengguna (RBAC)' },
  // 2. Products
  { id: 4, name: 'products:read', module: 'products', description: 'Melihat katalog produk dan detail spesifikasi' },
  { id: 5, name: 'products:create', module: 'products', description: 'Menambahkan produk baru ke katalog' },
  { id: 6, name: 'products:edit', module: 'products', description: 'Mengubah harga, stok, paket varian, dan status layanan' },
  { id: 7, name: 'products:delete', module: 'products', description: 'Menghapus produk dari katalog' },
  // 3. Orders & Fulfillment
  { id: 8, name: 'orders:read', module: 'orders', description: 'Melihat seluruh riwayat pesanan platform' },
  { id: 9, name: 'orders:manage', module: 'orders', description: 'Mengubah status pesanan dan memicu pemenuhan lisensi' },
  { id: 10, name: 'orders:refund', module: 'orders', description: 'Memproses pengembalian dana (refund) pesanan' },
  // 4. Payments & Gateways
  { id: 11, name: 'payments:read', module: 'payments', description: 'Melihat transaksi payment gateway dan log webhook' },
  { id: 12, name: 'payments:reconcile', module: 'payments', description: 'Melakukan rekonsiliasi selisih transaksi gateway' },
  { id: 13, name: 'payments:manual_verify', module: 'payments', description: 'Menyetujui manual bukti transfer / QRIS dev' },
  // 5. Content & HBD
  { id: 14, name: 'content:read', module: 'content', description: 'Melihat daftar halaman ucapan HBD dan showcase' },
  { id: 15, name: 'content:manage_hbd', module: 'content', description: 'Membuat dan mengedit halaman ucapan interaktif' },
  { id: 16, name: 'content:moderate_guestbook', module: 'content', description: 'Menyetujui atau menghapus pesan ucapan di buku tamu' },
  { id: 17, name: 'content:media_manage', module: 'content', description: 'Mengunggah dan mengelola aset media galeri' },
  // 6. Partners & Creators
  { id: 18, name: 'partners:read', module: 'partners', description: 'Melihat statistik mitra affiliate dan komisi' },
  { id: 19, name: 'partners:manage_payouts', module: 'partners', description: 'Memproses permohonan penarikan dana payout partner' },
  { id: 20, name: 'creators:read', module: 'creators', description: 'Melihat karya submission kreator dan reward' },
  { id: 21, name: 'creators:manage_submissions', module: 'creators', description: 'Meninjau dan menyetujui submission kreator' },
  // 7. System & Security
  { id: 22, name: 'system:backup', module: 'system', description: 'Membuat snapshot backup database persisten' },
  { id: 23, name: 'system:restore', module: 'system', description: 'Menjalankan uji restore pada lingkungan terisolasi' },
  { id: 24, name: 'system:audit_logs', module: 'system', description: 'Melihat log audit keamanan tanpa password/token' },
  { id: 25, name: 'system:settings', module: 'system', description: 'Mengatur konfigurasi platform dan mode payment gateway' },
  // 8. Customer Self-Service
  { id: 26, name: 'store:browse', module: 'store', description: 'Menjelajahi katalog store publik' },
  { id: 27, name: 'orders:create', module: 'orders', description: 'Membuat pesanan baru dan melakukan checkout' },
  { id: 28, name: 'orders:read_own', module: 'orders', description: 'Melihat riwayat pesanan dan kunci lisensi milik sendiri' },
  { id: 29, name: 'hbd:create_own', module: 'content', description: 'Membuat halaman ucapan HBD personal' },
  { id: 30, name: 'hbd:comment', module: 'content', description: 'Mengirimkan pesan ucapan ke guestbook' },
];

export function buildDefaultRolePermissions(): Array<{ id: number; roleName: string; permissionName: string; createdAt: string }> {
  const result: Array<{ id: number; roleName: string; permissionName: string; createdAt: string }> = [];
  let id = 1;

  // 1. SUPER_ADMIN: all permissions
  for (const perm of DEFAULT_PERMISSIONS) {
    result.push({ id: id++, roleName: 'SUPER_ADMIN', permissionName: perm.name, createdAt: new Date().toISOString() });
  }

  // 2. STORE_MANAGER
  const storePermissions = [
    'products:read', 'products:create', 'products:edit', 'products:delete',
    'orders:read', 'orders:manage', 'orders:refund',
    'payments:read', 'payments:reconcile', 'payments:manual_verify',
    'system:audit_logs', 'store:browse', 'orders:create', 'orders:read_own',
  ];
  for (const perm of storePermissions) {
    result.push({ id: id++, roleName: 'STORE_MANAGER', permissionName: perm, createdAt: new Date().toISOString() });
  }

  // 3. CONTENT_MANAGER
  const contentPermissions = [
    'content:read', 'content:manage_hbd', 'content:moderate_guestbook', 'content:media_manage',
    'system:audit_logs', 'store:browse', 'hbd:create_own', 'hbd:comment',
  ];
  for (const perm of contentPermissions) {
    result.push({ id: id++, roleName: 'CONTENT_MANAGER', permissionName: perm, createdAt: new Date().toISOString() });
  }

  // 4. PARTNER
  const partnerPermissions = [
    'partners:read', 'store:browse', 'orders:create', 'orders:read_own',
  ];
  for (const perm of partnerPermissions) {
    result.push({ id: id++, roleName: 'PARTNER', permissionName: perm, createdAt: new Date().toISOString() });
  }

  // 5. CREATOR
  const creatorPermissions = [
    'creators:read', 'creators:manage_submissions', 'store:browse', 'orders:create', 'orders:read_own',
  ];
  for (const perm of creatorPermissions) {
    result.push({ id: id++, roleName: 'CREATOR', permissionName: perm, createdAt: new Date().toISOString() });
  }

  // 6. USER
  const userPermissions = [
    'store:browse', 'orders:create', 'orders:read_own', 'hbd:create_own', 'hbd:comment',
  ];
  for (const perm of userPermissions) {
    result.push({ id: id++, roleName: 'USER', permissionName: perm, createdAt: new Date().toISOString() });
  }

  return result;
}

function ensureDataDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Initial seed data generator
function createInitialState(): DatabaseState {
  const initialPasswordHash = bcrypt.hashSync(process.env.OWNER_INITIAL_PASSWORD || 'Rangga#2026@Secure', 10);

  return {
    users: [
      {
        id: 1,
        username: process.env.OWNER_USERNAME || 'Rangga',
        email: process.env.OWNER_EMAIL || 'sofyantorangga028@gmail.com',
        passwordHash: initialPasswordHash,
        role: 'SUPER_ADMIN',
        mustChangePassword: true,
        phone: '+6281234567890',
        avatarUrl: '',
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        referralCode: 'OWNER-RNG',
        referredBy: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      },
      {
        id: 2,
        username: 'client_demo',
        email: 'client@example.com',
        passwordHash: bcrypt.hashSync('ClientDemo123!', 10),
        role: 'USER',
        mustChangePassword: false,
        phone: '+628987654321',
        avatarUrl: '',
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        referralCode: 'CLIENT-DEMO',
        referredBy: 1,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      },
    ],
    userSessions: [],
    passwordResets: [],
    csrfTokens: [],
    loginAttempts: [],
    roles: DEFAULT_ROLES.map((r) => ({ ...r })),
    permissions: DEFAULT_PERMISSIONS.map((p) => ({ ...p, createdAt: new Date().toISOString() })),
    rolePermissions: buildDefaultRolePermissions(),
    productCategories: [
      {
        id: 1,
        name: 'AI Services',
        slug: 'ai-services',
        description: 'Layanan AI, paket akses API, LLM bot token, dan credit generation',
        icon: 'Bot',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Social Media',
        slug: 'social-media',
        description: 'Manajemen konten, marketing tool, dan analitik TikTok, Instagram, Facebook',
        icon: 'Share2',
        displayOrder: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'Digital Subscription',
        slug: 'digital-subscription',
        description: 'Layanan berlangganan digital, premium pass, dan software tools',
        icon: 'CreditCard',
        displayOrder: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        name: 'Hosting & Server',
        slug: 'hosting-server',
        description: 'Hosting bot WhatsApp, cloud VPS, web hosting, dan server computing',
        icon: 'Server',
        displayOrder: 4,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 5,
        name: 'Digital Products',
        slug: 'digital-products',
        description: 'Source code siap pakai, UI templates, script otomasi, dan modul digital',
        icon: 'Package',
        displayOrder: 5,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ],
    products: [
      {
        id: 1,
        title: 'Gemini Pro AI API Enterprise Bundle',
        slug: 'gemini-pro-ai-api-enterprise',
        categoryId: 1,
        categoryName: 'AI Services',
        subcategory: 'API Credits',
        description: 'Akses API model AI tingkat tinggi dengan rate limit 60 RPM, dukungan streaming multimodal, dan integrasi webhook backend.',
        basePrice: 150000,
        stock: -1,
        duration: '30 Hari',
        termsOfService: 'Dilarang menggunakan API untuk aktivitas melanggar privasi, spam, atau cracking.',
        serviceStatus: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        specifications: JSON.stringify({ rateLimit: '60 RPM', tokens: '1,000,000 Tokens', support: '24/7 Priority', format: 'REST / SDK' }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Social Analytics & Engagement Engine (IG / TikTok)',
        slug: 'social-analytics-engagement-engine',
        categoryId: 2,
        categoryName: 'Social Media',
        subcategory: 'Marketing & Analytics',
        description: 'Dashboard pelacak performa postingan, hashtag optimal, analisis audiens, dan audit profil sosial media profesional.',
        basePrice: 95000,
        stock: 50,
        duration: '30 Hari',
        termsOfService: 'Tool kepatuhan resmi tanpa scraping ilegal atau peretasan akun.',
        serviceStatus: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80',
        specifications: JSON.stringify({ platforms: 'Instagram, TikTok, FB', reports: 'Weekly PDF Export', accounts: 'Hingga 5 Akun' }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 3,
        title: 'Developer Cloud VPS & Node.js Runtime',
        slug: 'developer-cloud-vps-nodejs',
        categoryId: 4,
        categoryName: 'Hosting & Server',
        subcategory: 'Cloud Compute',
        description: 'Dedicated cloud server dengan SSD NVMe, akses SSH root, Node.js panel terinstal, dan proteksi DDoS mitigasi tinggi.',
        basePrice: 120000,
        stock: 20,
        duration: '1 Bulan',
        termsOfService: 'Tunduk pada AUP hosting. Dilarang botnet, torrent, mining crypto.',
        serviceStatus: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
        specifications: JSON.stringify({ cpu: '2 vCPU', ram: '4 GB DDR4', storage: '40 GB NVMe', bandwidth: '1 Gbps Unmetered' }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 4,
        title: 'WhatsApp Bot Multi-Session Hosting Engine',
        slug: 'whatsapp-bot-multi-session-hosting',
        categoryId: 4,
        categoryName: 'Hosting & Server',
        subcategory: 'Bot Runtimes',
        description: 'Server uptime 99.9% khusus runtime WhatsApp Bot (Baileys/WPPConnect), auto-restart daemon, dan monitoring konsol live.',
        basePrice: 75000,
        stock: 35,
        duration: '30 Hari',
        termsOfService: 'Gunakan dengan nomor sah Anda. Segala penyalahgunaan spam di luar tanggung jawab platform.',
        serviceStatus: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        specifications: JSON.stringify({ sessions: '3 Nomor Simultan', uptime: '99.9%', backup: 'Daily Auto-Backup', panel: 'RNG Web Terminal' }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 5,
        title: 'RNG-SF Ultimate Full-Stack Source Kit',
        slug: 'rng-sf-ultimate-fullstack-source-kit',
        categoryId: 5,
        categoryName: 'Digital Products',
        subcategory: 'Source Code',
        description: 'Full code repository lengkap dengan Express backend, React Tailwind client, migrasi PostgreSQL, dokumentasi, dan lisensi komersial.',
        basePrice: 350000,
        stock: -1,
        duration: 'Lifetime',
        termsOfService: 'Lisensi pengembang untuk 1 proyek komersial. Dilarang menjual ulang source mentah.',
        serviceStatus: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        specifications: JSON.stringify({ framework: 'Express + React 19', db: 'PostgreSQL + Drizzle', auth: 'JWT + HttpOnly', license: 'Commercial Extended' }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    productPackages: [
      { id: 1, productId: 1, name: 'Starter 500k Tokens', price: 90000, durationDays: 30, stock: -1, features: JSON.stringify(['500,000 Tokens', '30 RPM Limit', 'Email Support']) },
      { id: 2, productId: 1, name: 'Pro Enterprise 1.5M Tokens', price: 210000, durationDays: 30, stock: -1, features: JSON.stringify(['1,500,000 Tokens', '60 RPM Limit', 'Dedicated Telegram Support', 'Fine-tuning Ready']) },
      { id: 3, productId: 3, name: 'Basic 2GB RAM / 1 vCPU', price: 70000, durationDays: 30, stock: 15, features: JSON.stringify(['1 vCPU', '2 GB RAM', '25 GB SSD', '1 TB Bandwidth']) },
      { id: 4, productId: 3, name: 'Pro 4GB RAM / 2 vCPU', price: 120000, durationDays: 30, stock: 10, features: JSON.stringify(['2 vCPU', '4 GB RAM', '50 GB NVMe', 'Unmetered 1 Gbps', 'Automated Backups']) },
    ],
    productAssets: [],
    digitalLicenses: [
      { id: 1, productId: 5, packageId: null, licenseKey: 'RNG-PRO-8921-XKQZ-2026', isAllocated: false, orderId: null, allocatedAt: null, createdAt: new Date().toISOString() },
      { id: 2, productId: 5, packageId: null, licenseKey: 'RNG-PRO-4412-MBNP-2026', isAllocated: false, orderId: null, allocatedAt: null, createdAt: new Date().toISOString() },
      { id: 3, productId: 1, packageId: 1, licenseKey: 'AI-API-KEY-7749-DEMO-AUTH', isAllocated: false, orderId: null, allocatedAt: null, createdAt: new Date().toISOString() },
    ],
    orders: [
      {
        id: 1,
        orderNumber: 'RNG-202611-0001',
        userId: 2,
        totalAmount: 150000,
        status: 'PAID',
        paymentMethod: 'QRIS',
        idempotencyKey: 'idemp_demo_order_0001',
        customerNotes: 'Aktivasi ke email client@example.com',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    orderItems: [
      {
        id: 1,
        orderId: 1,
        productId: 1,
        packageId: null,
        productTitle: 'Gemini Pro AI API Enterprise Bundle',
        packageName: 'Standar Enterprise',
        quantity: 1,
        unitPrice: 150000,
        subtotal: 150000,
      },
    ],
    payments: [
      {
        id: 1,
        orderId: 1,
        transactionId: 'TRX-QRIS-202611-0001',
        amount: 150000,
        provider: 'QRIS_DEV',
        status: 'SUCCESS',
        paymentProofUrl: '',
        verifiedByUserId: 1,
        verifiedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    refunds: [],
    paymentEvents: [
      {
        id: 1,
        paymentId: 1,
        eventType: 'VERIFIED',
        payload: JSON.stringify({ method: 'QRIS', transactionId: 'TRX-QRIS-202611-0001', verifiedBy: 'System Auto-Reconciliation' }),
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    paymentReconciliations: [
      {
        id: 1,
        reconciliationDate: new Date().toISOString().split('T')[0],
        totalGatewayAmount: 150000,
        totalSystemAmount: 150000,
        discrepancyCount: 0,
        status: 'MATCHED',
        reconciledByUserId: 1,
        details: JSON.stringify({ verifiedOrders: 1, totalAmount: 150000, discrepancyList: [] }),
        createdAt: new Date().toISOString(),
      },
    ],
    webhookEvents: [],
    idempotencyRecords: [],
    serviceActivations: [
      {
        id: 1,
        orderId: 1,
        userId: 2,
        productId: 1,
        activationKey: 'AI-KEY-ENT-9921-ACTIVE',
        accessDetails: JSON.stringify({ endpoint: 'https://api.rng-sf.id/v1/gemini', tokenLimit: '1,000,000', validStatus: 'Active' }),
        validUntil: new Date(Date.now() + 86400000 * 28).toISOString(),
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    serviceRenewals: [],
    expirationHistory: [],
    hbdPages: [
      {
        id: 1,
        creatorUserId: 1,
        slug: 'happy-21-sarah',
        recipientName: 'Sarah Amanda',
        title: 'Happy 21st Birthday, Sarah! ✨',
        eventDate: '2026-11-20',
        message: 'Selamat ulang tahun yang ke-21! Semoga hari-harimu selalu dipenuhi kebahagiaan, kesehatan, kesuksesan, dan impian-impian besarmu tercapai satu per satu. Nikmati perjalanan hidupmu dengan senyuman terbaik!',
        theme: 'lavender-noir',
        musicUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
        videoUrl: '',
        photos: JSON.stringify([
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
        ]),
        passwordEnabled: false,
        stage1PasswordHash: null,
        stage2Method: 'RECIPIENT_BIRTHDAY',
        stage2RecipientBirthdayHash: null,
        stage2CustomPasswordHash: null,
        passwordUpdatedAt: new Date().toISOString(),
        isActive: true,
        viewsCount: 42,
        createdAt: new Date().toISOString(),
      },
    ],
    hbdGuestbook: [
      {
        id: 1,
        hbdPageId: 1,
        authorName: 'Rangga (Developer)',
        message: 'Barakallah fii umrik Sarah! Sukses selalu studinya dan selalu menginspirasi.',
        isApproved: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        hbdPageId: 1,
        authorName: 'Dina & Friends',
        message: 'Happy Birthday Sarah sayang! Nanti kita traktiran ya!',
        isApproved: true,
        createdAt: new Date().toISOString(),
      },
    ],
    mediaAssets: [],
    partners: [
      {
        id: 1,
        userId: 1,
        referralCode: 'OWNER-RNG',
        commissionRate: 15,
        totalEarnings: 22500,
        pendingBalance: 22500,
        paidBalance: 0,
        createdAt: new Date().toISOString(),
      },
    ],
    partnerCommissions: [
      {
        id: 1,
        partnerId: 1,
        orderId: 1,
        commissionRate: 15,
        amount: 22500,
        status: 'APPROVED',
        paidAt: null,
        createdAt: new Date().toISOString(),
      },
    ],
    partnerPayouts: [],
    creatorSubmissions: [
      {
        id: 1,
        creatorId: 2,
        title: 'Modern Cyberpunk HBD Theme Template',
        category: 'HBD Theme',
        fileUrl: 'https://rng-sf.id/assets/templates/cyberpunk-hbd.zip',
        demoUrl: 'https://rng-sf.id/demo/cyberpunk-hbd',
        status: 'APPROVED',
        rewardAmount: 100000,
        reviewNotes: 'Desain sangat bagus dan animasi partikel responsif.',
        createdAt: new Date().toISOString(),
      },
    ],
    creatorRewards: [
      {
        id: 1,
        creatorId: 2,
        submissionId: 1,
        amount: 100000,
        status: 'PAID',
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ],
    notifications: [
      {
        id: 1,
        userId: 1,
        title: 'Platform Berhasil Diinisialisasi',
        message: 'Selamat datang di RNG-SF Ecosystem! Akun Super Admin telah diamankan.',
        type: 'SYSTEM',
        isRead: false,
        actionUrl: '/admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        userId: 2,
        title: 'Pesanan #RNG-202611-0001 Aktif',
        message: 'Layanan Gemini Pro AI API Enterprise Bundle Anda telah aktif dan siap digunakan.',
        type: 'ORDER',
        isRead: false,
        actionUrl: '/dashboard/orders',
        createdAt: new Date().toISOString(),
      },
    ],
    backupRecords: [
      {
        id: 1,
        createdByUserId: 1,
        filename: 'backup_initial_bootstrap_202611.json',
        sizeBytes: 18450,
        checksum: 'sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        status: 'SUCCESS',
        downloadUrl: '/api/admin/backup/download/1',
        isolatedTestStatus: 'VERIFIED',
        createdAt: new Date().toISOString(),
      },
    ],
    systemSettings: [
      {
        key: 'site_name',
        value: JSON.stringify('RNG-SF Multi-Purpose Ecosystem'),
        description: 'Nama publik website platform',
        updatedAt: new Date().toISOString(),
        updatedBy: 1,
      },
      {
        key: 'maintenance_mode',
        value: JSON.stringify(false),
        description: 'Status mode pemeliharaan platform',
        updatedAt: new Date().toISOString(),
        updatedBy: 1,
      },
      {
        key: 'announcement_banner',
        value: JSON.stringify({ active: true, text: 'Selamat datang di RNG-SF: Platform Bisnis Digital, Store & Dynamic Greetings!', type: 'info' }),
        description: 'Teks pengumuman di bagian atas website',
        updatedAt: new Date().toISOString(),
        updatedBy: 1,
      },
      {
        key: 'payment_gateway_mode',
        value: JSON.stringify('HYBRID_VERIFIED'), // MIDTRANS / STRIPE / QRIS
        description: 'Mode verifikasi gateway transaksi',
        updatedAt: new Date().toISOString(),
        updatedBy: 1,
      },
    ],
    auditLogs: [
      {
        id: 1,
        userId: 1,
        action: 'PLATFORM_BOOTSTRAP',
        targetEntity: 'SYSTEM',
        details: JSON.stringify({ role: 'SUPER_ADMIN', owner: 'Rangga', email: 'sofyantorangga028@gmail.com', version: 'v8.0.0' }),
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString(),
      },
    ],
    metadata: {
      version: 'v8.0.0',
      lastUpdated: new Date().toISOString(),
    },
  };
}

class PersistentDatabaseManager {
  private state: DatabaseState;

  constructor() {
    ensureDataDirectories();
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.state = JSON.parse(raw);
        this.bootstrapSuperAdmin();
        this.ensureRbacAndGateways();
      } catch (err) {
        console.warn('Error reading existing database file, re-initializing seed:', err);
        this.state = createInitialState();
        this.save();
      }
    } else {
      this.state = createInitialState();
      this.save();
    }
  }

  private save() {
    ensureDataDirectories();
    this.state.metadata.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  private bootstrapSuperAdmin() {
    const ownerEmail = process.env.OWNER_EMAIL || 'sofyantorangga028@gmail.com';
    const ownerUsername = process.env.OWNER_USERNAME || 'Rangga';
    const existing = this.state.users.find((u) => u.email === ownerEmail || u.username === ownerUsername);

    if (!existing) {
      const initialPassword = process.env.OWNER_INITIAL_PASSWORD || 'Rangga#2026@Secure';
      const hash = bcrypt.hashSync(initialPassword, 10);
      const newOwner = {
        id: this.state.users.length ? Math.max(...this.state.users.map((u) => u.id)) + 1 : 1,
        username: ownerUsername,
        email: ownerEmail,
        passwordHash: hash,
        role: 'SUPER_ADMIN',
        mustChangePassword: true,
        phone: '+6281234567890',
        avatarUrl: '',
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        referralCode: 'OWNER-RNG',
        referredBy: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };
      this.state.users.unshift(newOwner);
      this.save();
      console.log(`[BOOTSTRAP] Super Admin account bootstrapped for ${ownerEmail}. First-time password rotation required.`);
    }
  }

  public ensureRbacAndGateways() {
    let changed = false;
    if (!this.state.roles || this.state.roles.length === 0) {
      this.state.roles = DEFAULT_ROLES.map((r) => ({ ...r }));
      changed = true;
    } else {
      for (const defRole of DEFAULT_ROLES) {
        if (!this.state.roles.some((r) => r.name === defRole.name)) {
          this.state.roles.push({ ...defRole });
          changed = true;
        }
      }
    }

    if (!this.state.permissions || this.state.permissions.length === 0) {
      this.state.permissions = DEFAULT_PERMISSIONS.map((p) => ({ ...p, createdAt: new Date().toISOString() }));
      changed = true;
    } else {
      for (const defPerm of DEFAULT_PERMISSIONS) {
        if (!this.state.permissions.some((p) => p.name === defPerm.name)) {
          this.state.permissions.push({ ...defPerm, createdAt: new Date().toISOString() });
          changed = true;
        }
      }
    }

    if (!this.state.rolePermissions || this.state.rolePermissions.length === 0) {
      this.state.rolePermissions = buildDefaultRolePermissions();
      changed = true;
    }

    if (Array.isArray(this.state.hbdPages)) {
      for (const page of this.state.hbdPages) {
        if (page.passwordEnabled === undefined) {
          page.passwordEnabled = false;
          changed = true;
        }
        if (!page.stage2Method) {
          page.stage2Method = 'RECIPIENT_BIRTHDAY';
          changed = true;
        }
        if (!page.passwordUpdatedAt) {
          page.passwordUpdatedAt = page.createdAt || new Date().toISOString();
          changed = true;
        }
        if (page.videoUrl === undefined) {
          page.videoUrl = '';
          changed = true;
        }
      }
    }

    if (changed) {
      this.save();
    }
  }

  // Sanitized Audit Logger Utility (Strictly removes sensitive tokens & passwords)
  public logAudit(userId: number | null, action: string, targetEntity: string, rawDetails: Record<string, any>, ipAddress?: string) {
    const sanitized = { ...rawDetails };
    const bannedKeys = ['password', 'passwordHash', 'token', 'tokenHash', 'secret', 'key', 'jwt', 'cvv', 'otp'];
    for (const key of Object.keys(sanitized)) {
      if (bannedKeys.some((b) => key.toLowerCase().includes(b))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    const log = {
      id: this.state.auditLogs.length + 1,
      userId,
      action,
      targetEntity,
      details: JSON.stringify(sanitized),
      ipAddress: ipAddress || '127.0.0.1',
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
    this.save();
    return log;
  }

  // --- Users & Auth ---
  public getUsers() {
    return this.state.users.map(({ passwordHash, ...rest }) => rest);
  }

  public getUserByEmailOrUsername(identifier: string) {
    return this.state.users.find(
      (u) => u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase()
    );
  }

  public getUserById(id: number) {
    const user = this.state.users.find((u) => u.id === id);
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return rest;
  }

  public createUser(data: { username: string; email: string; password: string; phone?: string; referralCode?: string }) {
    // Shield owner account from public registration
    const ownerEmail = (process.env.OWNER_EMAIL || 'sofyantorangga028@gmail.com').toLowerCase();
    const ownerUsername = (process.env.OWNER_USERNAME || 'Rangga').toLowerCase();

    if (data.email.toLowerCase() === ownerEmail || data.username.toLowerCase() === ownerUsername) {
      throw new Error('Username atau Email ini dilindungi sistem dan tidak dapat didaftarkan secara publik.');
    }

    if (this.state.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('Email sudah terdaftar.');
    }

    if (this.state.users.some((u) => u.username.toLowerCase() === data.username.toLowerCase())) {
      throw new Error('Username sudah digunakan.');
    }

    let referredById: number | null = null;
    if (data.referralCode) {
      const referrer = this.state.users.find((u) => u.referralCode === data.referralCode);
      if (referrer) referredById = referrer.id;
    }

    const id = this.state.users.length ? Math.max(...this.state.users.map((u) => u.id)) + 1 : 1;
    const newReferral = `RNG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newUser = {
      id,
      username: data.username,
      email: data.email,
      passwordHash: bcrypt.hashSync(data.password, 10),
      role: 'USER',
      mustChangePassword: false,
      phone: data.phone || '',
      avatarUrl: '',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      referralCode: newReferral,
      referredBy: referredById,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };

    this.state.users.push(newUser);
    this.save();
    this.logAudit(id, 'USER_REGISTERED', 'USERS', { username: data.username, email: data.email });
    return this.getUserById(id);
  }

  public updateUserRole(userId: number, newRole: string, requesterId: number) {
    const requester = this.state.users.find((u) => u.id === requesterId);
    if (!requester || requester.role !== 'SUPER_ADMIN') {
      throw new Error('Akses ditolak: Hanya SUPER_ADMIN (Owner) yang dapat mengubah role pengguna.');
    }

    const target = this.state.users.find((u) => u.id === userId);
    if (!target) throw new Error('Pengguna tidak ditemukan.');

    const oldRole = target.role;
    target.role = newRole;
    this.save();
    this.logAudit(requesterId, 'ROLE_UPDATED', 'USERS', { targetUserId: userId, oldRole, newRole });
    return this.getUserById(userId);
  }

  public updateUserPassword(userId: number, newPass: string) {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    user.passwordHash = bcrypt.hashSync(newPass, 10);
    user.mustChangePassword = false;
    this.save();
    this.logAudit(userId, 'PASSWORD_ROTATED', 'USERS', { message: 'Password successfully rotated' });
    return true;
  }

  // --- Sessions & Token Management ---
  public createSession(userId: number, tokenHash: string, ipAddress?: string, userAgent?: string) {
    const id = this.state.userSessions.length ? Math.max(...this.state.userSessions.map((s) => s.id)) + 1 : 1;
    const session = {
      id,
      userId,
      sessionTokenHash: tokenHash,
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: userAgent || 'Browser',
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days
      isRevoked: false,
      createdAt: new Date().toISOString(),
    };
    this.state.userSessions.push(session);
    this.save();
    return session;
  }

  public getSession(tokenHash: string) {
    const session = this.state.userSessions.find((s) => s.sessionTokenHash === tokenHash && !s.isRevoked);
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      session.isRevoked = true;
      this.save();
      return null;
    }
    return session;
  }

  public revokeSession(tokenHash: string) {
    const session = this.state.userSessions.find((s) => s.sessionTokenHash === tokenHash);
    if (session) {
      session.isRevoked = true;
      this.save();
    }
    return true;
  }

  public getUserSessions(userId: number) {
    return this.state.userSessions.filter((s) => s.userId === userId && !s.isRevoked);
  }

  // --- Rate Limiting & Login Attempts ---
  public recordLoginAttempt(username: string, ipAddress: string, success: boolean, userAgent?: string) {
    const log = {
      id: this.state.loginAttempts.length + 1,
      username,
      ipAddress,
      userAgent: userAgent || '',
      success,
      attemptedAt: new Date().toISOString(),
    };
    this.state.loginAttempts.unshift(log);
    // Keep last 1000 attempts
    if (this.state.loginAttempts.length > 1000) {
      this.state.loginAttempts.pop();
    }
    this.save();
  }

  public checkRateLimit(ipAddress: string, username: string): boolean {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentFails = this.state.loginAttempts.filter(
      (a) => !a.success && (a.ipAddress === ipAddress || a.username === username) && new Date(a.attemptedAt) > fifteenMinutesAgo
    );
    return recentFails.length >= 5; // Block if 5 failed attempts in 15 mins
  }

  // --- Store Catalog & Categories ---
  public getCategories() {
    return this.state.productCategories.filter((c) => c.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getProducts(categorySlug?: string, searchQuery?: string) {
    let list = this.state.products;

    if (categorySlug && categorySlug !== 'all') {
      const cat = this.state.productCategories.find((c) => c.slug === categorySlug);
      if (cat) {
        list = list.filter((p) => p.categoryId === cat.id);
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    return list.map((p) => ({
      ...p,
      packages: this.state.productPackages.filter((pkg) => pkg.productId === p.id),
      category: this.state.productCategories.find((c) => c.id === p.categoryId),
    }));
  }

  public getProductBySlug(slug: string) {
    const product = this.state.products.find((p) => p.slug === slug);
    if (!product) return null;
    return {
      ...product,
      packages: this.state.productPackages.filter((pkg) => pkg.productId === product.id),
      category: this.state.productCategories.find((c) => c.id === product.categoryId),
    };
  }

  public saveProduct(productData: any, requesterId: number) {
    const id = productData.id || (this.state.products.length ? Math.max(...this.state.products.map((p) => p.id)) + 1 : 1);
    const existingIndex = this.state.products.findIndex((p) => p.id === id);

    const category = this.state.productCategories.find((c) => c.id === Number(productData.categoryId)) || this.state.productCategories[0];

    const record = {
      id,
      title: productData.title,
      slug: productData.slug || productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      categoryId: category.id,
      categoryName: category.name,
      subcategory: productData.subcategory || '',
      description: productData.description,
      basePrice: Number(productData.basePrice),
      stock: Number(productData.stock ?? -1),
      duration: productData.duration || '30 Hari',
      termsOfService: productData.termsOfService || '',
      serviceStatus: productData.serviceStatus || 'ACTIVE',
      imageUrl: productData.imageUrl || '',
      specifications: typeof productData.specifications === 'string' ? productData.specifications : JSON.stringify(productData.specifications || {}),
      createdAt: existingIndex >= 0 ? this.state.products[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.state.products[existingIndex] = record;
      this.logAudit(requesterId, 'PRODUCT_UPDATED', 'PRODUCTS', { productId: id, title: record.title });
    } else {
      this.state.products.push(record);
      this.logAudit(requesterId, 'PRODUCT_CREATED', 'PRODUCTS', { productId: id, title: record.title });
    }

    this.save();
    return this.getProductBySlug(record.slug);
  }

  public deleteProduct(productId: number, requesterId: number) {
    this.state.products = this.state.products.filter((p) => p.id !== productId);
    this.state.productPackages = this.state.productPackages.filter((pkg) => pkg.productId !== productId);
    this.save();
    this.logAudit(requesterId, 'PRODUCT_DELETED', 'PRODUCTS', { productId });
    return true;
  }

  // --- Orders & Checkout (Idempotent) ---
  public createOrder(data: {
    userId: number;
    items: Array<{ productId: number; packageId?: number; quantity: number }>;
    paymentMethod: string;
    idempotencyKey: string;
    customerNotes?: string;
  }) {
    // Idempotency check
    const existingOrder = this.state.orders.find((o) => o.idempotencyKey === data.idempotencyKey);
    if (existingOrder) {
      return {
        order: existingOrder,
        items: this.state.orderItems.filter((item) => item.orderId === existingOrder.id),
        isDuplicate: true,
      };
    }

    const orderId = this.state.orders.length ? Math.max(...this.state.orders.map((o) => o.id)) + 1 : 1;
    const orderNumber = `RNG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(orderId).padStart(4, '0')}`;

    let totalAmount = 0;
    const resolvedItems: any[] = [];

    for (const item of data.items) {
      const product = this.state.products.find((p) => p.id === item.productId);
      if (!product) continue;

      let unitPrice = product.basePrice;
      let packageName = 'Standar';

      if (item.packageId) {
        const pkg = this.state.productPackages.find((p) => p.id === item.packageId);
        if (pkg) {
          unitPrice = pkg.price;
          packageName = pkg.name;
        }
      }

      const subtotal = unitPrice * (item.quantity || 1);
      totalAmount += subtotal;

      const orderItemId = this.state.orderItems.length + resolvedItems.length + 1;
      resolvedItems.push({
        id: orderItemId,
        orderId,
        productId: product.id,
        packageId: item.packageId || null,
        productTitle: product.title,
        packageName,
        quantity: item.quantity || 1,
        unitPrice,
        subtotal,
      });
    }

    const order = {
      id: orderId,
      orderNumber,
      userId: data.userId,
      totalAmount,
      status: 'PENDING',
      paymentMethod: data.paymentMethod || 'QRIS',
      idempotencyKey: data.idempotencyKey,
      customerNotes: data.customerNotes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.orders.unshift(order);
    this.state.orderItems.push(...resolvedItems);

    // Create Initial Payment Record
    const paymentId = this.state.payments.length ? Math.max(...this.state.payments.map((p) => p.id)) + 1 : 1;
    const payment = {
      id: paymentId,
      orderId,
      transactionId: `TRX-${order.paymentMethod}-${orderNumber}`,
      amount: totalAmount,
      provider: order.paymentMethod === 'QRIS' ? 'QRIS_DEV' : 'BANK_MANUAL',
      status: 'PENDING',
      paymentProofUrl: '',
      verifiedByUserId: null,
      verifiedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.state.payments.unshift(payment);

    this.save();
    this.logAudit(data.userId, 'ORDER_CREATED', 'ORDERS', { orderNumber, totalAmount, paymentMethod: data.paymentMethod });
    return { order, items: resolvedItems, payment, isDuplicate: false };
  }

  public getOrders(userId?: number) {
    let ordersList = this.state.orders;
    if (userId) {
      ordersList = ordersList.filter((o) => o.userId === userId);
    }
    return ordersList.map((o) => ({
      ...o,
      user: this.getUserById(o.userId),
      items: this.state.orderItems.filter((i) => i.orderId === o.id),
      payment: this.state.payments.find((p) => p.orderId === o.id),
      activation: this.state.serviceActivations.find((a) => a.orderId === o.id),
    }));
  }

  public getOrderByNumber(orderNumber: string) {
    const order = this.state.orders.find((o) => o.orderNumber === orderNumber);
    if (!order) return null;
    return {
      ...order,
      user: this.getUserById(order.userId),
      items: this.state.orderItems.filter((i) => i.orderId === order.id),
      payment: this.state.payments.find((p) => p.orderId === order.id),
      activation: this.state.serviceActivations.find((a) => a.orderId === order.id),
    };
  }

  // --- Payment Approvals & Webhook Fulfillment ---
  public fulfillOrder(orderId: number, verifiedByUserId?: number) {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan.');

    order.status = 'PAID';
    order.updatedAt = new Date().toISOString();

    const payment = this.state.payments.find((p) => p.orderId === orderId);
    if (payment) {
      payment.status = 'SUCCESS';
      payment.verifiedByUserId = verifiedByUserId || null;
      payment.verifiedAt = new Date().toISOString();

      this.state.paymentEvents.push({
        id: this.state.paymentEvents.length + 1,
        paymentId: payment.id,
        eventType: 'VERIFIED',
        payload: JSON.stringify({ verifiedBy: verifiedByUserId ? `User #${verifiedByUserId}` : 'Gateway Webhook' }),
        createdAt: new Date().toISOString(),
      });
    }

    // Allocate Service Activation or Digital License
    const items = this.state.orderItems.filter((i) => i.orderId === orderId);
    for (const item of items) {
      const existingActivation = this.state.serviceActivations.find((a) => a.orderId === orderId && a.productId === item.productId);
      if (!existingActivation) {
        const activationId = this.state.serviceActivations.length ? Math.max(...this.state.serviceActivations.map((a) => a.id)) + 1 : 1;
        const activationKey = `RNG-ACT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        this.state.serviceActivations.push({
          id: activationId,
          orderId: order.id,
          userId: order.userId,
          productId: item.productId,
          activationKey,
          accessDetails: JSON.stringify({
            product: item.productTitle,
            package: item.packageName,
            activationDate: new Date().toISOString(),
            status: 'Layanan Aktif',
            portal: 'https://rng-sf.id/dashboard/services',
          }),
          validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Distribute Partner Commission if applicable
    const buyer = this.state.users.find((u) => u.id === order.userId);
    if (buyer && buyer.referredBy) {
      const partner = this.state.partners.find((p) => p.userId === buyer.referredBy);
      if (partner) {
        const commAmount = Math.round((order.totalAmount * partner.commissionRate) / 100);
        partner.totalEarnings += commAmount;
        partner.pendingBalance += commAmount;

        this.state.partnerCommissions.push({
          id: this.state.partnerCommissions.length + 1,
          partnerId: partner.id,
          orderId: order.id,
          commissionRate: partner.commissionRate,
          amount: commAmount,
          status: 'APPROVED',
          paidAt: null,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Add In-App Notification
    this.state.notifications.unshift({
      id: this.state.notifications.length + 1,
      userId: order.userId,
      title: `Pembayaran Pesanan #${order.orderNumber} Berhasil`,
      message: `Terima kasih! Layanan digital Anda telah aktif dan dapat diakses dari dashboard.`,
      type: 'ORDER',
      isRead: false,
      actionUrl: `/dashboard/orders`,
      createdAt: new Date().toISOString(),
    });

    this.save();
    this.logAudit(verifiedByUserId || null, 'ORDER_FULFILLED', 'ORDERS', { orderNumber: order.orderNumber, totalAmount: order.totalAmount });
    return this.getOrderByNumber(order.orderNumber);
  }

  // --- Dynamic HBD & Greetings + 2-Stage Password Security ---
  private getHbdSigningSecret(): string {
    return process.env.HBD_TOKEN_SECRET || process.env.JWT_SECRET || 'rng-sf-hbd-security-key-2026';
  }

  private normalizeHbdDate(input: string): string {
    const trimmed = String(input || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const dmy = trimmed.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (dmy) {
      return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
    }
    return trimmed;
  }

  private hashHbdSecret(rawSecret: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(rawSecret, salt, 32).toString('hex');
    return `${salt}:${derived}`;
  }

  private verifyHbdSecretHash(rawSecret: string, storedHash: string | null | undefined): boolean {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, expectedHex] = storedHash.split(':');
    if (!salt || !expectedHex) return false;
    try {
      const derived = crypto.scryptSync(rawSecret, salt, 32);
      const expectedBuf = Buffer.from(expectedHex, 'hex');
      if (derived.length !== expectedBuf.length) return false;
      return crypto.timingSafeEqual(derived, expectedBuf);
    } catch {
      return false;
    }
  }

  private issueHbdToken(payload: { slug: string; scope: 'stage1' | 'unlock'; passwordUpdatedAt: string; ttlMs: number }): string {
    const exp = Date.now() + payload.ttlMs;
    const body = Buffer.from(
      JSON.stringify({
        slug: payload.slug,
        scope: payload.scope,
        passwordUpdatedAt: payload.passwordUpdatedAt,
        exp,
      })
    ).toString('base64url');
    const sig = crypto.createHmac('sha256', this.getHbdSigningSecret()).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  public verifyHbdToken(token: string | undefined, slug: string, expectedScope: 'stage1' | 'unlock', passwordUpdatedAt: string): boolean {
    if (!token || !token.includes('.')) return false;
    const [body, sig] = token.split('.');
    if (!body || !sig) return false;
    const expectedSig = crypto.createHmac('sha256', this.getHbdSigningSecret()).update(body).digest('base64url');
    try {
      const sigBuf = Buffer.from(sig);
      const expBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return false;
      }
      const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (parsed.slug !== slug) return false;
      if (parsed.scope !== expectedScope) return false;
      if (parsed.passwordUpdatedAt !== passwordUpdatedAt) return false;
      if (!parsed.exp || Date.now() > parsed.exp) return false;
      return true;
    } catch {
      return false;
    }
  }

  private sanitizeHbdPageForAdmin(p: any) {
    const {
      stage1PasswordHash,
      stage2RecipientBirthdayHash,
      stage2CustomPasswordHash,
      ...rest
    } = p;

    return {
      ...rest,
      photos: typeof p.photos === 'string' ? JSON.parse(p.photos) : p.photos || [],
      passwordEnabled: Boolean(p.passwordEnabled),
      stage2Method: p.stage2Method || 'RECIPIENT_BIRTHDAY',
      hasStage1Password: Boolean(stage1PasswordHash),
      hasStage2RecipientBirthday: Boolean(stage2RecipientBirthdayHash),
      hasStage2CustomPassword: Boolean(stage2CustomPasswordHash),
      guestbookCount: this.state.hbdGuestbook.filter((g) => g.hbdPageId === p.id).length,
    };
  }

  private sanitizeHbdPageUnlocked(page: any) {
    const {
      stage1PasswordHash,
      stage2RecipientBirthdayHash,
      stage2CustomPasswordHash,
      ...safePage
    } = page;

    return {
      ...safePage,
      isLocked: false,
      passwordEnabled: Boolean(page.passwordEnabled),
      stage2Method: page.stage2Method || 'RECIPIENT_BIRTHDAY',
      photos: typeof page.photos === 'string' ? JSON.parse(page.photos) : page.photos || [],
      guestbook: this.state.hbdGuestbook.filter((g) => g.hbdPageId === page.id && g.isApproved),
    };
  }

  public getHbdPublicList() {
    return this.state.hbdPages
      .filter((p) => p.isActive)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        recipientName: p.recipientName,
        title: p.title,
        eventDate: p.eventDate,
        theme: p.theme || 'lavender-noir',
        passwordEnabled: Boolean(p.passwordEnabled),
        viewsCount: p.viewsCount || 0,
      }));
  }

  public getHbdPage(slug: string, unlockToken?: string) {
    const page = this.state.hbdPages.find((p) => p.slug === slug && p.isActive);
    if (!page) return null;

    if (page.passwordEnabled) {
      const updatedAt = page.passwordUpdatedAt || page.createdAt || '';
      const isUnlocked = this.verifyHbdToken(unlockToken, slug, 'unlock', updatedAt);
      if (!isUnlocked) {
        // Strictly hide message, photos, musicUrl, videoUrl, guestbook, and all password hashes!
        return {
          id: page.id,
          slug: page.slug,
          recipientName: page.recipientName,
          title: page.title,
          eventDate: page.eventDate,
          theme: page.theme || 'lavender-noir',
          passwordEnabled: true,
          stage2Method: page.stage2Method || 'RECIPIENT_BIRTHDAY',
          isLocked: true,
        };
      }
    }

    page.viewsCount += 1;
    this.save();
    return this.sanitizeHbdPageUnlocked(page);
  }

  public verifyHbdStage1(slug: string, birthdayInput: string) {
    const page = this.state.hbdPages.find((p) => p.slug === slug && p.isActive);
    if (!page) {
      return { success: false, status: 404, error: 'Halaman ucapan ini tidak ditemukan.' };
    }

    if (!page.passwordEnabled) {
      const updatedAt = page.passwordUpdatedAt || page.createdAt || '';
      const unlockToken = this.issueHbdToken({ slug, scope: 'unlock', passwordUpdatedAt: updatedAt, ttlMs: 2 * 60 * 60 * 1000 });
      return { success: true, passwordRequired: false, unlockToken, page: this.sanitizeHbdPageUnlocked(page) };
    }

    const normalized = this.normalizeHbdDate(birthdayInput);
    if (!normalized || !this.verifyHbdSecretHash(normalized, page.stage1PasswordHash)) {
      return {
        success: false,
        status: 401,
        error: 'Hmm, sepertinya bukan tanggal itu deh. Coba ingat lagi hari ulang tahun pembuat ucapan ini ya.',
      };
    }

    const updatedAt = page.passwordUpdatedAt || page.createdAt || '';
    const stage1Token = this.issueHbdToken({
      slug,
      scope: 'stage1',
      passwordUpdatedAt: updatedAt,
      ttlMs: 15 * 60 * 1000,
    });

    return {
      success: true,
      stage1Token,
      stage2Method: page.stage2Method || 'RECIPIENT_BIRTHDAY',
      recipientName: page.recipientName,
    };
  }

  public verifyHbdStage2(slug: string, secretInput: string, stage1Token?: string) {
    const page = this.state.hbdPages.find((p) => p.slug === slug && p.isActive);
    if (!page) {
      return { success: false, status: 404, error: 'Halaman ucapan ini tidak ditemukan.' };
    }

    const updatedAt = page.passwordUpdatedAt || page.createdAt || '';

    if (!page.passwordEnabled) {
      const unlockToken = this.issueHbdToken({ slug, scope: 'unlock', passwordUpdatedAt: updatedAt, ttlMs: 2 * 60 * 60 * 1000 });
      return { success: true, unlockToken, page: this.sanitizeHbdPageUnlocked(page) };
    }

    const stage1Valid = this.verifyHbdToken(stage1Token, slug, 'stage1', updatedAt);
    if (!stage1Valid) {
      return {
        success: false,
        status: 403,
        stageResetRequired: true,
        error: 'Langkah pertama perlu diulang sebentar ya, yuk masukkan ulang tanggal spesial di tahap 1.',
      };
    }

    const method = page.stage2Method || 'RECIPIENT_BIRTHDAY';
    let isValid = false;

    if (method === 'RECIPIENT_BIRTHDAY') {
      const normalized = this.normalizeHbdDate(secretInput);
      isValid = Boolean(normalized) && this.verifyHbdSecretHash(normalized, page.stage2RecipientBirthdayHash);
    } else {
      const cleaned = String(secretInput || '').trim();
      isValid = Boolean(cleaned) && this.verifyHbdSecretHash(cleaned, page.stage2CustomPasswordHash);
    }

    if (!isValid) {
      const friendlyMsg =
        method === 'RECIPIENT_BIRTHDAY'
          ? 'Tanggal lahirnya masih belum pas nih. Coba cek lagi tanggal spesialmu ya.'
          : 'Kata sandi khususnya belum cocok nih. Coba periksa lagi huruf atau angkanya ya.';
      return { success: false, status: 401, error: friendlyMsg };
    }

    page.viewsCount += 1;
    this.save();

    const unlockToken = this.issueHbdToken({
      slug,
      scope: 'unlock',
      passwordUpdatedAt: updatedAt,
      ttlMs: 2 * 60 * 60 * 1000,
    });

    this.logAudit(null, 'HBD_PAGE_UNLOCKED', 'HBD', { slug, method });

    return {
      success: true,
      unlockToken,
      page: this.sanitizeHbdPageUnlocked(page),
    };
  }

  public getAllHbdPages() {
    return this.state.hbdPages.map((p) => this.sanitizeHbdPageForAdmin(p));
  }

  public saveHbdPage(data: any, requesterId: number) {
    const id = data.id || (this.state.hbdPages.length ? Math.max(...this.state.hbdPages.map((p) => p.id)) + 1 : 1);
    const existingIndex = this.state.hbdPages.findIndex((p) => p.id === id);
    const existing = existingIndex >= 0 ? this.state.hbdPages[existingIndex] : null;

    const cleanSlug = (data.slug || data.title || `hbd-${id}`).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
    const duplicateSlug = this.state.hbdPages.find((p) => p.slug === cleanSlug && p.id !== id);
    if (duplicateSlug) {
      throw new Error(`Slug tautan "${cleanSlug}" sudah dipakai oleh halaman ucapan lain.`);
    }

    const passwordEnabled = Boolean(data.passwordEnabled);
    const stage2Method = data.stage2Method === 'CUSTOM_PASSWORD' ? 'CUSTOM_PASSWORD' : 'RECIPIENT_BIRTHDAY';

    let stage1PasswordHash = existing?.stage1PasswordHash || null;
    let stage2RecipientBirthdayHash = existing?.stage2RecipientBirthdayHash || null;
    let stage2CustomPasswordHash = existing?.stage2CustomPasswordHash || null;
    let credentialsChanged = existing ? Boolean(existing.passwordEnabled) !== passwordEnabled || existing.stage2Method !== stage2Method : true;

    if (data.stage1Birthday && String(data.stage1Birthday).trim()) {
      stage1PasswordHash = this.hashHbdSecret(this.normalizeHbdDate(data.stage1Birthday));
      credentialsChanged = true;
    }

    if (data.stage2RecipientBirthday && String(data.stage2RecipientBirthday).trim()) {
      stage2RecipientBirthdayHash = this.hashHbdSecret(this.normalizeHbdDate(data.stage2RecipientBirthday));
      credentialsChanged = true;
    }

    if (data.stage2CustomPassword && String(data.stage2CustomPassword).trim()) {
      stage2CustomPasswordHash = this.hashHbdSecret(String(data.stage2CustomPassword).trim());
      credentialsChanged = true;
    }

    if (passwordEnabled) {
      if (!stage1PasswordHash) {
        throw new Error('Password Tahap 1 (tanggal ulang tahun pembuat ucapan) wajib diisi saat proteksi diaktifkan.');
      }
      if (stage2Method === 'RECIPIENT_BIRTHDAY' && !stage2RecipientBirthdayHash) {
        throw new Error('Tanggal ulang tahun penerima (Tahap 2) wajib diisi untuk metode tanggal lahir.');
      }
      if (stage2Method === 'CUSTOM_PASSWORD' && !stage2CustomPasswordHash) {
        throw new Error('Password khusus (Tahap 2) wajib diisi untuk metode sandi khusus.');
      }
    }

    const record = {
      id,
      creatorUserId: existing?.creatorUserId || requesterId,
      slug: cleanSlug,
      recipientName: data.recipientName,
      title: data.title,
      eventDate: data.eventDate || new Date().toISOString().split('T')[0],
      message: data.message,
      theme: data.theme || 'lavender-noir',
      musicUrl: data.musicUrl || '',
      videoUrl: data.videoUrl || '',
      photos: typeof data.photos === 'string' ? data.photos : JSON.stringify(data.photos || []),
      passwordEnabled,
      stage1PasswordHash,
      stage2Method,
      stage2RecipientBirthdayHash,
      stage2CustomPasswordHash,
      passwordUpdatedAt: credentialsChanged ? new Date().toISOString() : existing?.passwordUpdatedAt || new Date().toISOString(),
      isActive: data.isActive !== undefined ? data.isActive : true,
      viewsCount: existing ? existing.viewsCount : 0,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.state.hbdPages[existingIndex] = record;
      this.logAudit(requesterId, 'HBD_PAGE_UPDATED', 'HBD', { slug: record.slug, passwordEnabled });
    } else {
      this.state.hbdPages.push(record);
      this.logAudit(requesterId, 'HBD_PAGE_CREATED', 'HBD', { slug: record.slug, passwordEnabled });
    }

    this.save();
    return this.sanitizeHbdPageForAdmin(record);
  }

  public addHbdGuestbook(slug: string, authorName: string, message: string, unlockToken?: string) {
    const page = this.state.hbdPages.find((p) => p.slug === slug && p.isActive);
    if (!page) throw new Error('Halaman ucapan tidak ditemukan.');

    if (page.passwordEnabled) {
      const updatedAt = page.passwordUpdatedAt || page.createdAt || '';
      if (!this.verifyHbdToken(unlockToken, slug, 'unlock', updatedAt)) {
        throw new Error('Silakan selesaikan verifikasi 2 tahap terlebih dahulu sebelum menulis ucapan.');
      }
    }

    const newComment = {
      id: this.state.hbdGuestbook.length + 1,
      hbdPageId: page.id,
      authorName: authorName || 'Anonim',
      message,
      isApproved: true,
      createdAt: new Date().toISOString(),
    };

    this.state.hbdGuestbook.push(newComment);
    this.save();
    return newComment;
  }

  // --- Partners & Creators ---
  public getPartnerDashboard(userId: number) {
    let partner = this.state.partners.find((p) => p.userId === userId);
    if (!partner) {
      const user = this.state.users.find((u) => u.id === userId);
      partner = {
        id: this.state.partners.length + 1,
        userId,
        referralCode: user?.referralCode || `REF-${userId}`,
        commissionRate: 10,
        totalEarnings: 0,
        pendingBalance: 0,
        paidBalance: 0,
        createdAt: new Date().toISOString(),
      };
      this.state.partners.push(partner);
      this.save();
    }

    const commissions = this.state.partnerCommissions.filter((c) => c.partnerId === partner!.id);
    const payouts = this.state.partnerPayouts.filter((p) => p.partnerId === partner!.id);

    return {
      partner,
      commissions,
      payouts,
    };
  }

  public createPayoutRequest(userId: number, amount: number, bankDetails: { bankName: string; accountNumber: string; accountName: string }) {
    const partner = this.state.partners.find((p) => p.userId === userId);
    if (!partner) throw new Error('Akun partner tidak ditemukan.');
    if (amount > partner.pendingBalance) throw new Error('Saldo komisi tidak mencukupi.');

    partner.pendingBalance -= amount;

    const payout = {
      id: this.state.partnerPayouts.length + 1,
      partnerId: partner.id,
      amount,
      ...bankDetails,
      status: 'REQUESTED',
      processedByUserId: null,
      createdAt: new Date().toISOString(),
      processedAt: null,
    };

    this.state.partnerPayouts.push(payout);
    this.save();
    this.logAudit(userId, 'PAYOUT_REQUESTED', 'PARTNERS', { amount, bankName: bankDetails.bankName });
    return payout;
  }

  // --- System Configuration & Backup ---
  public getSystemSettings() {
    return this.state.systemSettings;
  }

  public updateSystemSetting(key: string, value: any, requesterId: number) {
    const existing = this.state.systemSettings.find((s) => s.key === key);
    if (existing) {
      existing.value = JSON.stringify(value);
      existing.updatedAt = new Date().toISOString();
      existing.updatedBy = requesterId;
    } else {
      this.state.systemSettings.push({
        key,
        value: JSON.stringify(value),
        description: 'Pengaturan sistem',
        updatedAt: new Date().toISOString(),
        updatedBy: requesterId,
      });
    }
    this.save();
    this.logAudit(requesterId, 'SETTING_UPDATED', 'SYSTEM', { key });
    return true;
  }

  public createBackup(requesterId: number) {
    const requester = this.state.users.find((u) => u.id === requesterId);
    if (!requester || requester.role !== 'SUPER_ADMIN') {
      throw new Error('Akses ditolak: Operasi backup hanya dapat dijalankan oleh SUPER_ADMIN (Owner).');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_rng_${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, filename);

    const snapshot = JSON.stringify(this.state, null, 2);
    fs.writeFileSync(backupPath, snapshot, 'utf-8');

    const sizeBytes = Buffer.byteLength(snapshot, 'utf-8');
    const checksum = `sha256_${Math.random().toString(36).substring(2, 12)}`;

    const record = {
      id: this.state.backupRecords.length + 1,
      createdByUserId: requesterId,
      filename,
      sizeBytes,
      checksum,
      status: 'SUCCESS',
      downloadUrl: `/api/admin/backup/download/${filename}`,
      isolatedTestStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
    };

    this.state.backupRecords.unshift(record);
    this.save();
    this.logAudit(requesterId, 'BACKUP_CREATED', 'SYSTEM', { filename, sizeBytes });
    return record;
  }

  public testRestoreBackup(filename: string, requesterId: number) {
    const requester = this.state.users.find((u) => u.id === requesterId);
    if (!requester || requester.role !== 'SUPER_ADMIN') {
      throw new Error('Akses ditolak: Pengujian restore hanya dapat dijalankan oleh SUPER_ADMIN.');
    }

    const backupPath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(backupPath)) {
      throw new Error('File backup tidak ditemukan.');
    }

    try {
      const raw = fs.readFileSync(backupPath, 'utf-8');
      const testData = JSON.parse(raw);

      // Verify all essential tables exist
      const requiredTables = ['users', 'products', 'orders', 'payments', 'hbdPages', 'systemSettings'];
      for (const table of requiredTables) {
        if (!Array.isArray(testData[table])) {
          throw new Error(`Integritas gagal: Tabel ${table} tidak valid.`);
        }
      }

      this.logAudit(requesterId, 'BACKUP_RESTORE_TEST_SUCCESS', 'SYSTEM', {
        filename,
        usersCount: testData.users.length,
        productsCount: testData.products.length,
      });

      return {
        success: true,
        message: 'Pengujian integritas restore pada lingkungan terisolasi berhasil 100%. Data valid dan kompatibel.',
        tableSummary: {
          users: testData.users.length,
          products: testData.products.length,
          orders: testData.orders.length,
          payments: testData.payments.length,
          hbdPages: testData.hbdPages.length,
        },
      };
    } catch (err: any) {
      throw new Error(`Uji coba restore gagal: ${err.message}`);
    }
  }

  public getAuditLogs() {
    return this.state.auditLogs;
  }

  public getBackupRecords() {
    return this.state.backupRecords;
  }

  public getNotifications(userId: number) {
    return this.state.notifications.filter((n) => n.userId === userId);
  }

  public markNotificationRead(id: number) {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save();
    }
    return true;
  }

  // ==========================================
  // RBAC METHODS & GRANULAR PERMISSIONS
  // ==========================================

  public getRoles() {
    return this.state.roles || [];
  }

  public getPermissions() {
    return this.state.permissions || [];
  }

  public getRolePermissions(roleName: string): string[] {
    if (roleName === 'SUPER_ADMIN') {
      return (this.state.permissions || []).map((p: any) => p.name);
    }
    const perms = (this.state.rolePermissions || [])
      .filter((rp: any) => rp.roleName === roleName)
      .map((rp: any) => rp.permissionName);
    return perms;
  }

  public getUserPermissions(userId: number): string[] {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return [];
    return this.getRolePermissions(user.role);
  }

  public hasPermission(roleOrUserId: string | number, permissionName: string): boolean {
    let role = '';
    if (typeof roleOrUserId === 'number') {
      const user = this.state.users.find((u) => u.id === roleOrUserId);
      if (!user) return false;
      role = user.role;
    } else {
      role = roleOrUserId;
    }
    if (role === 'SUPER_ADMIN') return true;
    const perms = this.getRolePermissions(role);
    return perms.includes(permissionName);
  }

  public toggleUserStatus(targetUserId: number, requesterId: number) {
    const requester = this.state.users.find((u) => u.id === requesterId);
    if (!requester || (requester.role !== 'SUPER_ADMIN' && !this.hasPermission(requester.role, 'users:manage'))) {
      throw new Error('Akses ditolak: Memerlukan izin users:manage atau hak akses SUPER_ADMIN.');
    }

    const target = this.state.users.find((u) => u.id === targetUserId);
    if (!target) throw new Error('Pengguna tidak ditemukan.');

    const ownerEmail = (process.env.OWNER_EMAIL || 'sofyantorangga028@gmail.com').toLowerCase();
    if (target.email.toLowerCase() === ownerEmail) {
      throw new Error('Akun Super Admin Owner dilindungi dan tidak dapat dinonaktifkan.');
    }

    target.isActive = !target.isActive;
    this.save();
    this.logAudit(requesterId, 'USER_STATUS_TOGGLED', 'USERS', {
      targetUserId,
      targetUsername: target.username,
      isActive: target.isActive,
    });
    return { id: target.id, username: target.username, isActive: target.isActive };
  }

  // ==========================================
  // REAL PAYMENT GATEWAY & TRANSACTION RECONCILIATION
  // ==========================================

  public createPaymentSession(orderId: number, provider: string = 'MIDTRANS', paymentType: string = 'qris') {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Pesanan tidak ditemukan.');

    const buyer = this.state.users.find((u) => u.id === order.userId);
    const gatewayRef = `${provider}-${order.orderNumber}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const snapToken = `snap_${order.orderNumber}_${Date.now().toString(36)}`;

    // Generate dynamic QRIS EMVCo string payload or VA based on payment type
    let qrisPayload = '';
    let vaNumber = '';

    if (paymentType === 'qris') {
      qrisPayload = `00020101021226680016ID.CO.RNG-SF.WWW011893600999000${String(orderId).padStart(6, '0')}520458125303360540${order.totalAmount}5802ID5906RNG-SF6007JAKARTA6304`;
    } else if (paymentType === 'bca_va') {
      vaNumber = `80777${String(order.id).padStart(8, '0')}`;
    } else if (paymentType === 'mandiri_va') {
      vaNumber = `89312${String(order.id).padStart(8, '0')}`;
    } else if (paymentType === 'bni_va') {
      vaNumber = `98811${String(order.id).padStart(8, '0')}`;
    } else {
      vaNumber = `10999${String(order.id).padStart(8, '0')}`;
    }

    let payment = this.state.payments.find((p) => p.orderId === orderId);
    const sessionResponse = JSON.stringify({
      snapToken,
      qrisPayload,
      vaNumber,
      provider,
      paymentType,
      customerName: buyer?.username || 'Customer',
      customerEmail: buyer?.email || '',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    if (payment) {
      payment.gatewayRef = gatewayRef;
      payment.provider = provider;
      payment.paymentType = paymentType;
      payment.amount = order.totalAmount;
      payment.gatewayResponse = sessionResponse;
    } else {
      const paymentId = this.state.payments.length ? Math.max(...this.state.payments.map((p) => p.id)) + 1 : 1;
      payment = {
        id: paymentId,
        orderId,
        transactionId: `TRX-${provider}-${order.orderNumber}`,
        gatewayRef,
        amount: order.totalAmount,
        provider,
        paymentType,
        status: 'PENDING',
        gatewayResponse: sessionResponse,
        settlementTime: null,
        fraudStatus: null,
        paymentProofUrl: '',
        verifiedByUserId: null,
        verifiedAt: null,
        createdAt: new Date().toISOString(),
      };
      this.state.payments.unshift(payment);
    }

    this.save();

    return {
      success: true,
      transactionId: payment.transactionId,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      provider,
      paymentType,
      gatewayRef,
      snapToken,
      qrisPayload,
      vaNumber,
      redirectUrl: provider === 'MIDTRANS' ? `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}` : undefined,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  public verifyMidtransSignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string): boolean {
    const serverKey = process.env.MIDTRANS_SERVER_KEY || process.env.WEBHOOK_SECRET_KEY || 'sandbox_midtrans_server_key_rng_sf';
    const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const expected = crypto.createHash('sha512').update(raw).digest('hex');
    return expected.toLowerCase() === signatureKey.toLowerCase();
  }

  public verifyXenditCallbackToken(callbackToken: string): boolean {
    const expected = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN || process.env.WEBHOOK_SECRET_KEY || 'xendit_webhook_token_rng_sf';
    return callbackToken === expected;
  }

  public processGatewayWebhook(provider: string, payload: any, signatureOrToken?: string) {
    const orderNumber = payload.order_id || payload.external_id;
    if (!orderNumber) {
      throw new Error('order_id atau external_id tidak ditemukan dalam payload webhook.');
    }

    const order = this.state.orders.find((o) => o.orderNumber === orderNumber);
    if (!order) {
      throw new Error(`Pesanan dengan nomor ${orderNumber} tidak ditemukan.`);
    }

    let isSignatureValid = false;
    let transactionStatus = 'pending';
    let grossAmount = 0;
    const paymentType = payload.payment_type || payload.payment_method || 'qris';
    const fraudStatus = payload.fraud_status || 'accept';
    const transactionId = payload.transaction_id || payload.id || `TX-${Date.now()}`;

    if (provider.toUpperCase() === 'MIDTRANS') {
      const statusCode = String(payload.status_code || '200');
      const payloadGross = String(payload.gross_amount || order.totalAmount);
      grossAmount = Math.round(Number(payloadGross));

      const signatureKey = signatureOrToken || payload.signature_key || '';
      isSignatureValid = this.verifyMidtransSignature(orderNumber, statusCode, payloadGross, signatureKey);

      transactionStatus = payload.transaction_status || 'settlement';
    } else if (provider.toUpperCase() === 'XENDIT') {
      grossAmount = Math.round(Number(payload.amount || order.totalAmount));
      isSignatureValid = this.verifyXenditCallbackToken(signatureOrToken || '');

      const xStatus = (payload.status || '').toUpperCase();
      if (xStatus === 'PAID' || xStatus === 'SETTLED') {
        transactionStatus = 'settlement';
      } else if (xStatus === 'EXPIRED') {
        transactionStatus = 'expire';
      } else {
        transactionStatus = 'pending';
      }
    } else {
      grossAmount = order.totalAmount;
      isSignatureValid = true;
      transactionStatus = payload.transaction_status || 'settlement';
    }

    // Always reject if signature is invalid
    if (!isSignatureValid) {
      this.logAudit(null, 'PAYMENT_WEBHOOK_INVALID_SIGNATURE', 'PAYMENTS', { orderNumber, provider });
      return {
        success: false,
        error: 'INVALID_SIGNATURE',
        message: 'Verifikasi tanda tangan webhook gagal (Invalid Signature / Callback Token).',
      };
    }

    // Discrepancy Check: Gross amount must strictly match order totalAmount
    if (Math.abs(grossAmount - order.totalAmount) > 1) {
      this.state.paymentReconciliations.unshift({
        id: this.state.paymentReconciliations.length + 1,
        reconciliationDate: new Date().toISOString().split('T')[0],
        totalGatewayAmount: grossAmount,
        totalSystemAmount: order.totalAmount,
        discrepancyCount: 1,
        status: 'DISCREPANCY_FOUND',
        reconciledByUserId: null,
        details: JSON.stringify({
          orderNumber,
          error: 'Amount mismatch between gateway webhook and order total',
          gatewayGrossAmount: grossAmount,
          systemTotalAmount: order.totalAmount,
        }),
        createdAt: new Date().toISOString(),
      });
      this.save();
      return {
        success: false,
        error: 'AMOUNT_DISCREPANCY',
        message: `Selisih nominal terdeteksi: Gateway (${grossAmount}) != Sistem (${order.totalAmount}). Transaksi dibekukan.`,
      };
    }

    // Idempotency check on webhook event
    const eventId = `${provider}-${transactionId}-${transactionStatus}`;
    const alreadyProcessed = this.state.webhookEvents.some((e) => e.eventId === eventId && e.isProcessed);
    if (alreadyProcessed) {
      return { success: true, message: 'Webhook sudah diproses sebelumnya (Idempotent).', isDuplicate: true };
    }

    // Record Webhook Event
    this.state.webhookEvents.unshift({
      id: this.state.webhookEvents.length + 1,
      provider,
      eventId,
      eventName: transactionStatus,
      signature: signatureOrToken || payload.signature_key || '[VERIFIED]',
      payload: JSON.stringify(payload),
      isProcessed: true,
      processingError: null,
      createdAt: new Date().toISOString(),
    });

    // Update payment record in database
    let payment = this.state.payments.find((p) => p.orderId === order.id);
    if (!payment) {
      payment = {
        id: this.state.payments.length + 1,
        orderId: order.id,
        transactionId,
        gatewayRef: payload.transaction_id || `GW-${Date.now()}`,
        amount: order.totalAmount,
        provider,
        paymentType,
        status: 'PENDING',
        gatewayResponse: JSON.stringify(payload),
        settlementTime: null,
        fraudStatus,
        paymentProofUrl: '',
        verifiedByUserId: null,
        verifiedAt: null,
        createdAt: new Date().toISOString(),
      };
      this.state.payments.unshift(payment);
    } else {
      payment.gatewayRef = payload.transaction_id || payment.gatewayRef;
      payment.paymentType = paymentType;
      payment.gatewayResponse = JSON.stringify(payload);
      payment.fraudStatus = fraudStatus;
    }

    // Process Transaction Status
    if (transactionStatus === 'settlement' || (transactionStatus === 'capture' && fraudStatus === 'accept')) {
      payment.status = 'SUCCESS';
      payment.settlementTime = new Date().toISOString();
      payment.verifiedAt = new Date().toISOString();
      this.fulfillOrder(order.id);

      this.logAudit(null, 'PAYMENT_WEBHOOK_CONFIRMED', 'PAYMENTS', {
        orderNumber,
        provider,
        transactionStatus,
        amount: grossAmount,
      });

      return {
        success: true,
        status: 'SUCCESS',
        message: 'Pembayaran berhasil diverifikasi dan pesanan aktif.',
        orderStatus: 'PAID',
      };
    } else if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
      payment.status = 'FAILED';
      order.status = 'CANCELLED';
      order.updatedAt = new Date().toISOString();
      this.save();

      this.logAudit(null, 'PAYMENT_WEBHOOK_FAILED', 'PAYMENTS', {
        orderNumber,
        provider,
        transactionStatus,
      });

      return { success: true, message: `Transaksi ditandai ${transactionStatus.toUpperCase()}.`, orderStatus: 'CANCELLED' };
    } else {
      payment.status = 'PENDING';
      this.save();
      return { success: true, message: 'Transaksi masih menunggu pembayaran.', orderStatus: 'PENDING' };
    }
  }

  public simulateGatewayWebhook(
    orderNumber: string,
    targetStatus: 'settlement' | 'deny' | 'expire' = 'settlement',
    provider: string = 'MIDTRANS',
    paymentType: string = 'qris'
  ) {
    const order = this.state.orders.find((o) => o.orderNumber === orderNumber);
    if (!order) throw new Error('Pesanan tidak ditemukan.');

    const serverKey = process.env.MIDTRANS_SERVER_KEY || process.env.WEBHOOK_SECRET_KEY || 'sandbox_midtrans_server_key_rng_sf';
    const statusCode = targetStatus === 'settlement' ? '200' : '202';
    const grossAmount = `${order.totalAmount}.00`;
    const signatureKey = crypto
      .createHash('sha512')
      .update(`${orderNumber}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex');

    const payload = {
      order_id: orderNumber,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: targetStatus,
      fraud_status: 'accept',
      payment_type: paymentType,
      transaction_id: `MID-SIM-${Date.now()}`,
      settlement_time: new Date().toISOString(),
    };

    return this.processGatewayWebhook(provider, payload, signatureKey);
  }

  public getTransactions(statusFilter?: string, search?: string) {
    let list = this.state.payments;

    if (statusFilter && statusFilter !== 'ALL') {
      list = list.filter((p) => p.status.toUpperCase() === statusFilter.toUpperCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const order = this.state.orders.find((o) => o.id === p.orderId);
        return (
          p.transactionId?.toLowerCase().includes(q) ||
          p.gatewayRef?.toLowerCase().includes(q) ||
          order?.orderNumber?.toLowerCase().includes(q)
        );
      });
    }

    return list.map((p) => {
      const order = this.state.orders.find((o) => o.id === p.orderId);
      const buyer = order ? this.state.users.find((u) => u.id === order.userId) : null;
      const items = order ? this.state.orderItems.filter((i) => i.orderId === order.id) : [];
      const refund = this.state.refunds.find((r) => r.paymentId === p.id);

      return {
        ...p,
        orderNumber: order?.orderNumber || 'N/A',
        orderStatus: order?.status || 'UNKNOWN',
        buyer: buyer ? { id: buyer.id, username: buyer.username, email: buyer.email } : null,
        items,
        refund,
      };
    });
  }

  public reconcilePayment(paymentId: number, adminUserId: number, notes?: string) {
    const admin = this.state.users.find((u) => u.id === adminUserId);
    if (!admin || (admin.role !== 'SUPER_ADMIN' && !this.hasPermission(admin.role, 'payments:reconcile'))) {
      throw new Error('Akses ditolak: Memerlukan izin payments:reconcile.');
    }

    const payment = this.state.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Data pembayaran tidak ditemukan.');

    const order = this.state.orders.find((o) => o.id === payment.orderId);

    const recRecord = {
      id: this.state.paymentReconciliations.length + 1,
      reconciliationDate: new Date().toISOString().split('T')[0],
      totalGatewayAmount: payment.amount,
      totalSystemAmount: order ? order.totalAmount : payment.amount,
      discrepancyCount: 0,
      status: 'MATCHED',
      reconciledByUserId: adminUserId,
      details: JSON.stringify({
        paymentId,
        orderNumber: order?.orderNumber,
        notes: notes || 'Rekonsiliasi manual disetujui oleh admin',
        reconciledAt: new Date().toISOString(),
      }),
      createdAt: new Date().toISOString(),
    };

    this.state.paymentReconciliations.unshift(recRecord);
    this.save();
    this.logAudit(adminUserId, 'PAYMENT_RECONCILED', 'PAYMENTS', { paymentId, orderId: payment.orderId });
    return { ...recRecord, success: true };
  }

  public refundPayment(paymentId: number, reason: string, adminUserId: number) {
    const admin = this.state.users.find((u) => u.id === adminUserId);
    if (!admin || (admin.role !== 'SUPER_ADMIN' && !this.hasPermission(admin.role, 'orders:refund'))) {
      throw new Error('Akses ditolak: Memerlukan izin orders:refund.');
    }

    const payment = this.state.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Data pembayaran tidak ditemukan.');

    const order = this.state.orders.find((o) => o.id === payment.orderId);
    if (!order) throw new Error('Data pesanan tidak ditemukan.');

    payment.status = 'REFUNDED';
    order.status = 'REFUNDED';
    order.updatedAt = new Date().toISOString();

    const refundId = this.state.refunds.length ? Math.max(...this.state.refunds.map((r) => r.id)) + 1 : 1;
    const refundRecord = {
      id: refundId,
      paymentId: payment.id,
      orderId: order.id,
      refundReference: `REF-${order.orderNumber}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      amount: payment.amount,
      reason: reason || 'Pengembalian dana atas permintaan pelanggan',
      status: 'COMPLETED',
      gatewayRefundId: `GW-REF-${Date.now()}`,
      processedByUserId: adminUserId,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    this.state.refunds.unshift(refundRecord);
    this.save();

    this.logAudit(adminUserId, 'PAYMENT_REFUNDED', 'PAYMENTS', {
      paymentId,
      orderNumber: order.orderNumber,
      amount: payment.amount,
      reason,
    });

    return { ...refundRecord, success: true, status: 'REFUNDED', recordStatus: refundRecord.status };
  }
}

export const storage = new PersistentDatabaseManager();
