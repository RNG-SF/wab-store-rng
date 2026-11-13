import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from './src/db/storage.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'rng-sf-secure-jwt-secret-key-2026-very-strong';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET_KEY || 'midtrans-stripe-shared-webhook-secret';
const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Request body and cookie parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser(process.env.SESSION_COOKIE_SECRET || 'rng-cookie-secret'));

// Static uploads serving
app.use('/uploads', express.static(UPLOAD_DIR));

// CORS and Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ==========================================
// AUTHENTICATION & SECURITY MIDDLEWARE
// ==========================================

export interface AuthenticatedRequest extends Request {
  user?: any;
  sessionToken?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined = req.cookies?.rng_session;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; tokenHash: string };
    const session = storage.getSession(decoded.tokenHash);

    if (session) {
      const user = storage.getUserById(session.userId);
      if (user && user.isActive) {
        req.user = user;
        req.sessionToken = decoded.tokenHash;
      }
    }
  } catch (err) {
    // Invalid token, ignore
  }
  next();
}

app.use(authMiddleware);

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' });
  }

  // Force first-time password change if required
  if (req.user.mustChangePassword && !req.path.startsWith('/api/auth/change-password') && req.path !== '/api/auth/me') {
    return res.status(403).json({
      error: 'Rotasi password wajib dilakukan pada login pertama sebelum mengakses fitur lainnya.',
      mustChangePassword: true,
    });
  }

  next();
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' });
    }
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    if (!storage.hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        error: `Akses ditolak: Akun dengan peran '${req.user.role}' tidak memiliki izin '${permission}'.`,
        requiredPermission: permission,
        userRole: req.user.role,
      });
    }
    next();
  };
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' });
    }
    if (req.user.role === 'SUPER_ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      error: `Akses ditolak: Operasi ini membutuhkan salah satu peran berikut: [${allowedRoles.join(', ')}].`,
      userRole: req.user.role,
    });
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const allowed = ['SUPER_ADMIN', 'STORE_MANAGER', 'CONTENT_MANAGER', 'ADMIN'];
  if (!req.user || !allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Akses ditolak: Memerlukan hak akses Manager atau Administrator.' });
  }
  next();
}

export function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak: Operasi ini hanya diizinkan untuk SUPER_ADMIN (Owner).' });
  }
  next();
}

// ==========================================
// 1. API: HEALTH & SYSTEM
// ==========================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'RNG-SF Multi-Purpose Platform',
    timestamp: new Date().toISOString(),
    database: 'Active (32 Indexed Relational Tables)',
    version: '8.0.0',
    owner: 'Rangga',
  });
});

// ==========================================
// 2. API: AUTH & SESSIONS
// ==========================================

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email dan Password wajib diisi.' });
    }

    // Rate Limit Check (5 attempts / 15 mins)
    if (storage.checkRateLimit(ip, identifier)) {
      return res.status(429).json({
        error: 'Terlalu banyak percobaan login yang gagal. Akun/IP dibatasi sementara selama 15 menit.',
      });
    }

    const user = storage.getUserByEmailOrUsername(identifier);
    if (!user) {
      storage.recordLoginAttempt(identifier, ip, false, req.headers['user-agent']);
      return res.status(401).json({ error: 'Kredensial tidak valid.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      storage.recordLoginAttempt(identifier, ip, false, req.headers['user-agent']);
      return res.status(401).json({ error: 'Kredensial tidak valid.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Akun Anda dinonaktifkan oleh administrator.' });
    }

    // Success login
    storage.recordLoginAttempt(identifier, ip, true, req.headers['user-agent']);

    const tokenHash = crypto.randomBytes(32).toString('hex');
    storage.createSession(user.id, tokenHash, ip, req.headers['user-agent']);

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        tokenHash,
        mustChangePassword: user.mustChangePassword,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure HttpOnly cookie
    res.cookie('rng_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser = storage.getUserById(user.id);
    storage.logAudit(user.id, 'USER_LOGIN', 'AUTH', { username: user.username }, ip);

    return res.json({
      success: true,
      user: safeUser,
      token,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan internal server.' });
  }
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { username, email, password, phone, referralCode } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, Email, dan Password wajib diisi.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter.' });
    }

    const user = storage.createUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone,
      referralCode,
    });

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Silakan login dengan akun baru Anda.',
      user,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const permissions = storage.getUserPermissions(req.user.id);
  res.json({
    user: req.user,
    permissions,
    mustChangePassword: req.user.mustChangePassword,
  });
});

// RBAC Query & Role Assignment
app.get('/api/rbac/roles', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const roles = storage.getRoles().map((r: any) => ({
    ...r,
    permissions: storage.getRolePermissions(r.name),
  }));
  res.json({ roles });
});

app.get('/api/rbac/permissions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const permissions = storage.getPermissions();
  res.json({ permissions });
});

app.post('/api/rbac/assign-role', requireAuth, requirePermission('roles:manage'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetUserId, newRole } = req.body;
    if (!targetUserId || !newRole) {
      return res.status(400).json({ error: 'targetUserId dan newRole wajib diisi.' });
    }
    const updated = storage.updateUserRole(Number(targetUserId), newRole, req.user.id);
    res.json({
      success: true,
      message: `Peran pengguna berhasil diperbarui menjadi ${newRole}.`,
      user: updated,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionToken) {
    storage.revokeSession(req.sessionToken);
  }
  res.clearCookie('rng_session');
  res.json({ success: true, message: 'Berhasil keluar.' });
});

app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password baru minimal 8 karakter.' });
    }

    const user = storage.getUserByEmailOrUsername(req.user.email);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });

    // If changing password voluntarily, check current password
    if (!req.user.mustChangePassword) {
      if (!currentPassword || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
        return res.status(400).json({ error: 'Password saat ini salah.' });
      }
    }

    storage.updateUserPassword(req.user.id, newPassword);

    res.json({
      success: true,
      message: 'Password berhasil diperbarui.',
      user: storage.getUserById(req.user.id),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/sessions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const sessions = storage.getUserSessions(req.user.id);
  res.json({ sessions });
});

// ==========================================
// 3. API: STORE PRODUCTS & CATEGORIES
// ==========================================

app.get('/api/categories', (req: Request, res: Response) => {
  const categories = storage.getCategories();
  res.json({ categories });
});

app.get('/api/products', (req: Request, res: Response) => {
  const { category, search } = req.query;
  const products = storage.getProducts(category as string, search as string);
  res.json({ products });
});

app.get('/api/products/:slug', (req: Request, res: Response) => {
  const product = storage.getProductBySlug(req.params.slug);
  if (!product) {
    return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  }
  res.json({ product });
});

app.post('/api/products', requireAuth, requirePermission('products:create'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = storage.saveProduct(req.body, req.user.id);
    res.status(201).json({ success: true, product });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', requireAuth, requirePermission('products:edit'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = storage.saveProduct({ ...req.body, id: Number(req.params.id) }, req.user.id);
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', requireAuth, requirePermission('products:delete'), (req: AuthenticatedRequest, res: Response) => {
  try {
    storage.deleteProduct(Number(req.params.id), req.user.id);
    res.json({ success: true, message: 'Produk berhasil dihapus.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 4. API: ORDERS & CHECKOUT (IDEMPOTENT)
// ==========================================

app.post('/api/orders/checkout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, paymentMethod, idempotencyKey, customerNotes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Keranjang belanja tidak boleh kosong.' });
    }

    const key = idempotencyKey || `idemp_${req.user.id}_${Date.now()}`;

    const result = storage.createOrder({
      userId: req.user.id,
      items,
      paymentMethod: paymentMethod || 'QRIS',
      idempotencyKey: key,
      customerNotes,
    });

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      order: result.order,
      items: result.items,
      payment: result.payment,
      isDuplicate: result.isDuplicate,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/orders/my-orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const orders = storage.getOrders(req.user.id);
  res.json({ orders });
});

app.get('/api/orders/:orderNumber', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const order = storage.getOrderByNumber(req.params.orderNumber);
  if (!order) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  }

  // Non-admins can only see their own order
  if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }

  res.json({ order });
});

// ==========================================
// 5. API: PAYMENTS & REAL GATEWAY WEBHOOKS
// ==========================================

// Create Real Payment Gateway Session (Midtrans Snap / Dynamic QRIS / Bank Transfer)
app.post('/api/payments/create-session', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, provider, paymentType } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId wajib disertakan.' });
    }

    const session = storage.createPaymentSession(Number(orderId), provider || 'MIDTRANS', paymentType || 'qris');
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Official Signed Gateway Webhook Receiver (Midtrans SHA-512 & Xendit Token Verification)
app.post('/api/payments/webhook', (req: Request, res: Response) => {
  try {
    const provider = (req.query.provider as string) || (req.headers['x-callback-token'] ? 'XENDIT' : 'MIDTRANS');
    const signatureOrToken =
      (req.headers['x-callback-token'] as string) ||
      (req.headers['x-midtrans-signature'] as string) ||
      req.body.signature_key;

    const result = storage.processGatewayWebhook(provider, req.body, signatureOrToken);
    if (result && result.success === false) {
      return res.status(result.error === 'INVALID_SIGNATURE' ? 401 : 400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Real Sandbox Webhook Simulator (Calculates authentic SHA-512 signature and executes pipeline)
app.post('/api/payments/simulate-webhook', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderNumber, targetStatus, provider, paymentType } = req.body;
    if (!orderNumber) {
      return res.status(400).json({ error: 'orderNumber wajib disertakan.' });
    }

    const result = storage.simulateGatewayWebhook(
      orderNumber,
      targetStatus || 'settlement',
      provider || 'MIDTRANS',
      paymentType || 'qris'
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Dev / Demo QRIS instant verification endpoint (Backward Compatibility)
app.post('/api/payments/simulate-qris-paid', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderNumber } = req.body;
    const order = storage.getOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    if (order.status === 'PAID') {
      return res.json({ success: true, message: 'Pesanan sudah berstatus LUNAS.', order });
    }

    const updated = storage.fulfillOrder(order.id, req.user.id);
    res.json({
      success: true,
      message: 'Pembayaran QRIS berhasil disimulasikan dan diverifikasi secara instan.',
      order: updated,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Transaction History & Reconciliation API (Admin)
app.get('/api/admin/transactions', requireAuth, requirePermission('payments:read'), (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status as string;
  const search = req.query.search as string;
  const transactions = storage.getTransactions(status, search);
  res.json({ transactions });
});

app.post('/api/admin/transactions/:id/reconcile', requireAuth, requirePermission('payments:reconcile'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const result = storage.reconcilePayment(Number(req.params.id), req.user.id, notes);
    res.json({ success: true, reconciliation: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/transactions/:id/refund', requireAuth, requirePermission('orders:refund'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const result = storage.refundPayment(Number(req.params.id), reason, req.user.id);
    res.json({ success: true, refund: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 6. API: DYNAMIC HBD & GREETINGS (WITH 2-STAGE PASSWORD SECURITY)
// ==========================================

app.get('/api/hbd/public-list', (req: Request, res: Response) => {
  const pages = storage.getHbdPublicList();
  res.json({ pages });
});

app.get('/api/hbd/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug;
  const unlockToken =
    (req.headers['x-hbd-unlock-token'] as string) ||
    req.cookies?.[`rng_hbd_unlock_${slug}`];

  const page = storage.getHbdPage(slug, unlockToken);
  if (!page) {
    return res.status(404).json({ error: 'Halaman ucapan tidak ditemukan atau dinonaktifkan.' });
  }
  res.json({ locked: Boolean((page as any).isLocked), page });
});

app.post('/api/hbd/:slug/verify-stage1', (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const { birthday } = req.body;
    if (!birthday || !String(birthday).trim()) {
      return res.status(400).json({ success: false, error: 'Masukkan tanggal ulang tahunnya dulu ya.' });
    }

    const result = storage.verifyHbdStage1(slug, String(birthday));
    if (!result.success) {
      return res.status(result.status || 401).json({ success: false, error: result.error });
    }

    if (result.stage1Token) {
      res.cookie(`rng_hbd_stage1_${slug}`, result.stage1Token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });
    }

    if (result.unlockToken) {
      res.cookie(`rng_hbd_unlock_${slug}`, result.unlockToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 2 * 60 * 60 * 1000,
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/hbd/:slug/verify-stage2', (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const { secret, stage1Token } = req.body;
    if (!secret || !String(secret).trim()) {
      return res.status(400).json({ success: false, error: 'Isi kata sandi atau tanggal lahirnya dulu ya.' });
    }

    const tokenToVerify = stage1Token || req.cookies?.[`rng_hbd_stage1_${slug}`];
    const result = storage.verifyHbdStage2(slug, String(secret), tokenToVerify);
    if (!result.success) {
      return res.status(result.status || 401).json({
        success: false,
        stageResetRequired: Boolean((result as any).stageResetRequired),
        error: result.error,
      });
    }

    res.clearCookie(`rng_hbd_stage1_${slug}`);
    if (result.unlockToken) {
      res.cookie(`rng_hbd_unlock_${slug}`, result.unlockToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 2 * 60 * 60 * 1000,
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/hbd/:slug/guestbook', (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const { authorName, message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Pesan ucapan tidak boleh kosong.' });
    }
    const unlockToken =
      (req.headers['x-hbd-unlock-token'] as string) ||
      req.cookies?.[`rng_hbd_unlock_${slug}`];

    const entry = storage.addHbdGuestbook(slug, authorName, message, unlockToken);
    res.status(201).json({ success: true, entry });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.get('/api/hbd-admin/list', requireAuth, requirePermission('content:read'), (req: AuthenticatedRequest, res: Response) => {
  const pages = storage.getAllHbdPages();
  res.json({ pages });
});

app.post('/api/hbd-admin/save', requireAuth, requirePermission('content:manage_hbd'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = storage.saveHbdPage(req.body, req.user.id);
    res.status(201).json({ success: true, page });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 7. API: PARTNERS & CREATORS
// ==========================================

app.get('/api/partner/dashboard', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const data = storage.getPartnerDashboard(req.user.id);
  res.json(data);
});

app.post('/api/partner/payout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    if (!amount || amount < 50000) {
      return res.status(400).json({ error: 'Minimal penarikan komisi adalah Rp 50.000.' });
    }
    const payout = storage.createPayoutRequest(req.user.id, amount, { bankName, accountNumber, accountName });
    res.status(201).json({ success: true, payout });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 8. API: ADMIN & OWNER CONSOLE
// ==========================================

app.get('/api/admin/users', requireAuth, requirePermission('users:read'), (req: AuthenticatedRequest, res: Response) => {
  const users = storage.getUsers();
  res.json({ users });
});

app.put('/api/admin/users/:id/role', requireAuth, requirePermission('roles:manage'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.body;
    const updated = storage.updateUserRole(Number(req.params.id), role, req.user.id);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/toggle-status', requireAuth, requirePermission('users:manage'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = storage.toggleUserStatus(Number(req.params.id), req.user.id);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/orders', requireAuth, requirePermission('orders:read'), (req: AuthenticatedRequest, res: Response) => {
  const orders = storage.getOrders();
  res.json({ orders });
});

app.put('/api/admin/orders/:id/fulfill', requireAuth, requirePermission('orders:manage'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = storage.fulfillOrder(Number(req.params.id), req.user.id);
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/audit-logs', requireAuth, requirePermission('system:audit_logs'), (req: AuthenticatedRequest, res: Response) => {
  const logs = storage.getAuditLogs();
  res.json({ logs });
});

app.get('/api/admin/system-settings', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const settings = storage.getSystemSettings();
  res.json({ settings });
});

app.put('/api/admin/system-settings', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key, value } = req.body;
    storage.updateSystemSetting(key, value, req.user.id);
    res.json({ success: true, message: 'Pengaturan sistem berhasil disimpan.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Backup & Isolated Restoration Testing
app.post('/api/admin/backup/create', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  try {
    const record = storage.createBackup(req.user.id);
    res.status(201).json({ success: true, record });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.get('/api/admin/backup/list', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const records = storage.getBackupRecords();
  res.json({ records });
});

app.post('/api/admin/backup/test-restore', requireAuth, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filename } = req.body;
    const result = storage.testRestoreBackup(filename, req.user.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Notifications
app.get('/api/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const notifs = storage.getNotifications(req.user.id);
  res.json({ notifications: notifs });
});

app.put('/api/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  storage.markNotificationRead(Number(req.params.id));
  res.json({ success: true });
});

// Media Uploads
app.post('/api/uploads', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filename, base64Data, category } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'Data file tidak valid.' });
    }

    const buffer = Buffer.from(base64Data.replace(/^data:.*,/, ''), 'base64');
    if (buffer.length > 50 * 1024 * 1024) {
      return res.status(400).json({ error: 'Ukuran file melebihi batas 50MB.' });
    }

    const ext = path.extname(filename || 'asset.png') || '.png';
    const uniqueName = `upload_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    const targetPath = path.join(UPLOAD_DIR, uniqueName);

    fs.writeFileSync(targetPath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;
    res.json({
      success: true,
      fileUrl,
      filename: uniqueName,
      sizeBytes: buffer.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// VITE DEV MIDDLEWARE / STATIC PRODUCTION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RNG-SF SERVER] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    console.log(`[RNG-SF SERVER] Super Admin: sofyantorangga028@gmail.com (Rangga)`);
  });
}

startServer();
