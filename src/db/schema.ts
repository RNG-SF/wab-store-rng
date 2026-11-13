import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// ==========================================
// 1. AUTH, IDENTITY & SESSION SECURITY
// ==========================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').default('USER').notNull(), // 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'PARTNER' | 'USER'
  mustChangePassword: boolean('must_change_password').default(false).notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true).notNull(),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  referralCode: text('referral_code').unique(),
  referredBy: integer('referred_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionTokenHash: text('session_token_hash').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResets = pgTable('password_resets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const csrfTokens = pgTable('csrf_tokens', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => userSessions.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const loginAttempts = pgTable('login_attempts', {
  id: serial('id').primaryKey(),
  username: text('username'),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  success: boolean('success').notNull(),
  attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
});

// ==========================================
// 1B. ROLE-BASED ACCESS CONTROL (RBAC)
// ==========================================

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'STORE_MANAGER' | 'PARTNER' | 'CREATOR' | 'USER'
  label: text('label').notNull(),
  description: text('description').notNull(),
  isSystem: boolean('is_system').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g. 'users:manage', 'products:edit', 'orders:refund'
  module: text('module').notNull(), // 'users' | 'products' | 'orders' | 'payments' | 'content' | 'partners' | 'creators' | 'system'
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleName: text('role_name').notNull(),
  permissionName: text('permission_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 2. STORE CATALOG, ASSETS & LICENSES
// ==========================================

export const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  categoryId: integer('category_id').references(() => productCategories.id).notNull(),
  categoryName: text('category_name').notNull(), // 'AI Services' | 'Social Media' | 'Digital Subscription' | 'Hosting & Server' | 'Digital Products'
  subcategory: text('subcategory'),
  description: text('description').notNull(),
  basePrice: integer('base_price').notNull(), // in IDR
  stock: integer('stock').default(-1).notNull(), // -1 = Unlimited
  duration: text('duration'), // e.g. "30 Hari", "1 Tahun", "Lifetime"
  termsOfService: text('terms_of_service'),
  serviceStatus: text('service_status').default('ACTIVE').notNull(), // 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_STOCK'
  imageUrl: text('image_url'),
  specifications: text('specifications'), // JSON string: RAM, CPU, API rate, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productPackages = pgTable('product_packages', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  durationDays: integer('duration_days').default(30).notNull(),
  stock: integer('stock').default(-1).notNull(),
  features: text('features'), // JSON string array
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productAssets = pgTable('product_assets', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const digitalLicenses = pgTable('digital_licenses', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  packageId: integer('package_id').references(() => productPackages.id),
  licenseKey: text('license_key').notNull().unique(),
  isAllocated: boolean('is_allocated').default(false).notNull(),
  orderId: integer('order_id'), // Linked when assigned
  allocatedAt: timestamp('allocated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 3. ORDERS, PAYMENTS & WEBHOOKS
// ==========================================

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id).notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'PAID' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  paymentMethod: text('payment_method').default('QRIS').notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  customerNotes: text('customer_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  packageId: integer('package_id').references(() => productPackages.id),
  productTitle: text('product_title').notNull(),
  packageName: text('package_name'),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: integer('unit_price').notNull(),
  subtotal: integer('subtotal').notNull(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  transactionId: text('transaction_id').notNull().unique(),
  amount: integer('amount').notNull(),
  provider: text('provider').notNull(), // 'MIDTRANS' | 'STRIPE' | 'XENDIT' | 'QRIS_DEV' | 'BANK_MANUAL'
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  gatewayRef: text('gateway_ref'),
  paymentType: text('payment_type'), // 'qris' | 'bank_transfer' | 'gopay' | 'credit_card'
  gatewayResponse: text('gateway_response'), // Raw JSON payload
  settlementTime: timestamp('settlement_time'),
  fraudStatus: text('fraud_status'), // 'accept' | 'challenge' | 'deny'
  paymentProofUrl: text('payment_proof_url'),
  verifiedByUserId: integer('verified_by_user_id').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const refunds = pgTable('refunds', {
  id: serial('id').primaryKey(),
  paymentId: integer('payment_id').references(() => payments.id, { onDelete: 'cascade' }).notNull(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  refundReference: text('refund_reference').notNull().unique(),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  status: text('status').default('REQUESTED').notNull(), // 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
  gatewayRefundId: text('gateway_refund_id'),
  processedByUserId: integer('processed_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const paymentEvents = pgTable('payment_events', {
  id: serial('id').primaryKey(),
  paymentId: integer('payment_id').references(() => payments.id, { onDelete: 'cascade' }).notNull(),
  eventType: text('event_type').notNull(), // 'CREATED' | 'PROOF_UPLOADED' | 'WEBHOOK_RECEIVED' | 'VERIFIED' | 'REFUNDED'
  payload: text('payload').notNull(), // JSON string
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const paymentReconciliations = pgTable('payment_reconciliations', {
  id: serial('id').primaryKey(),
  reconciliationDate: text('reconciliation_date').notNull(),
  totalGatewayAmount: integer('total_gateway_amount').notNull(),
  totalSystemAmount: integer('total_system_amount').notNull(),
  discrepancyCount: integer('discrepancy_count').default(0).notNull(),
  status: text('status').default('MATCHED').notNull(), // 'MATCHED' | 'DISCREPANCY_FOUND' | 'RESOLVED'
  reconciledByUserId: integer('reconciled_by_user_id').references(() => users.id),
  details: text('details'), // JSON string
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const webhookEvents = pgTable('webhook_events', {
  id: serial('id').primaryKey(),
  provider: text('provider').notNull(),
  eventId: text('event_id').notNull().unique(),
  eventName: text('event_name').notNull(),
  signature: text('signature').notNull(),
  payload: text('payload').notNull(), // JSON string
  isProcessed: boolean('is_processed').default(false).notNull(),
  processingError: text('processing_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const idempotencyRecords = pgTable('idempotency_records', {
  id: serial('id').primaryKey(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  requestPath: text('request_path').notNull(),
  requestHash: text('request_hash').notNull(),
  responseStatus: integer('response_status').notNull(),
  responseBody: text('response_body').notNull(), // JSON string
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 4. SERVICE ACTIVATIONS & RENEWALS
// ==========================================

export const serviceActivations = pgTable('service_activations', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  activationKey: text('activation_key').notNull(),
  accessDetails: text('access_details'), // JSON credentials/host/instructions
  validUntil: timestamp('valid_until').notNull(),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const serviceRenewals = pgTable('service_renewals', {
  id: serial('id').primaryKey(),
  activationId: integer('activation_id').references(() => serviceActivations.id, { onDelete: 'cascade' }).notNull(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  previousValidUntil: timestamp('previous_valid_until').notNull(),
  newValidUntil: timestamp('new_valid_until').notNull(),
  extendedDays: integer('extended_days').notNull(),
  cost: integer('cost').notNull(),
  status: text('status').default('COMPLETED').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const expirationHistory = pgTable('expiration_history', {
  id: serial('id').primaryKey(),
  activationId: integer('activation_id').references(() => serviceActivations.id, { onDelete: 'cascade' }).notNull(),
  eventType: text('event_type').notNull(), // 'EXPIRED' | 'NOTIFIED_7_DAYS' | 'NOTIFIED_1_DAY' | 'RENEWED'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 5. GREETINGS & MEDIA ENGINE
// ==========================================

export const hbdPages = pgTable('hbd_pages', {
  id: serial('id').primaryKey(),
  creatorUserId: integer('creator_user_id').references(() => users.id),
  slug: text('slug').notNull().unique(),
  recipientName: text('recipient_name').notNull(),
  title: text('title').notNull(),
  eventDate: text('event_date').notNull(),
  message: text('message').notNull(),
  theme: text('theme').default('lavender-noir').notNull(), // 'lavender-noir' | 'aurora-emerald' | 'crimson-gold'
  musicUrl: text('music_url'),
  videoUrl: text('video_url'),
  photos: text('photos'), // JSON array of photo URLs
  passwordEnabled: boolean('password_enabled').default(false).notNull(),
  stage1PasswordHash: text('stage1_password_hash'),
  stage2Method: text('stage2_method').default('RECIPIENT_BIRTHDAY').notNull(), // 'RECIPIENT_BIRTHDAY' | 'CUSTOM_PASSWORD'
  stage2RecipientBirthdayHash: text('stage2_recipient_birthday_hash'),
  stage2CustomPasswordHash: text('stage2_custom_password_hash'),
  passwordUpdatedAt: timestamp('password_updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  viewsCount: integer('views_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const hbdGuestbook = pgTable('hbd_guestbook', {
  id: serial('id').primaryKey(),
  hbdPageId: integer('hbd_page_id').references(() => hbdPages.id, { onDelete: 'cascade' }).notNull(),
  authorName: text('author_name').notNull(),
  message: text('message').notNull(),
  isApproved: boolean('is_approved').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mediaAssets = pgTable('media_assets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  originalName: text('original_name').notNull(),
  storedFilename: text('stored_filename').notNull().unique(),
  fileUrl: text('file_url').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storageBackend: text('storage_backend').default('PERSISTENT_VOLUME').notNull(), // 'PERSISTENT_VOLUME' | 'S3' | 'R2'
  category: text('category').notNull(), // 'HBD_PHOTO' | 'HBD_MUSIC' | 'PAYMENT_PROOF' | 'PRODUCT_IMAGE'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 6. PARTNERS & CREATORS
// ==========================================

export const partners = pgTable('partners', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  referralCode: text('referral_code').notNull().unique(),
  commissionRate: integer('commission_rate').default(10).notNull(), // 10%
  totalEarnings: integer('total_earnings').default(0).notNull(),
  pendingBalance: integer('pending_balance').default(0).notNull(),
  paidBalance: integer('paid_balance').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const partnerCommissions = pgTable('partner_commissions', {
  id: serial('id').primaryKey(),
  partnerId: integer('partner_id').references(() => partners.id, { onDelete: 'cascade' }).notNull(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  commissionRate: integer('commission_rate').notNull(),
  amount: integer('amount').notNull(),
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'APPROVED' | 'PAID'
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const partnerPayouts = pgTable('partner_payouts', {
  id: serial('id').primaryKey(),
  partnerId: integer('partner_id').references(() => partners.id).notNull(),
  amount: integer('amount').notNull(),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  accountName: text('account_name').notNull(),
  status: text('status').default('REQUESTED').notNull(), // 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
  processedByUserId: integer('processed_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});

export const creatorSubmissions = pgTable('creator_submissions', {
  id: serial('id').primaryKey(),
  creatorId: integer('creator_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  fileUrl: text('file_url').notNull(),
  demoUrl: text('demo_url'),
  status: text('status').default('PENDING_REVIEW').notNull(), // 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
  rewardAmount: integer('reward_amount').default(0).notNull(),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const creatorRewards = pgTable('creator_rewards', {
  id: serial('id').primaryKey(),
  creatorId: integer('creator_id').references(() => users.id).notNull(),
  submissionId: integer('submission_id').references(() => creatorSubmissions.id),
  amount: integer('amount').notNull(),
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'PAID'
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 7. OPERATIONS, NOTIFICATIONS & AUDIT
// ==========================================

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('SYSTEM').notNull(), // 'ORDER' | 'ACTIVATION' | 'COMMISSION' | 'SYSTEM'
  isRead: boolean('is_read').default(false).notNull(),
  actionUrl: text('action_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const backupRecords = pgTable('backup_records', {
  id: serial('id').primaryKey(),
  createdByUserId: integer('created_by_user_id').references(() => users.id).notNull(),
  filename: text('filename').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  checksum: text('checksum').notNull(),
  status: text('status').default('SUCCESS').notNull(), // 'SUCCESS' | 'FAILED'
  downloadUrl: text('download_url').notNull(),
  isolatedTestStatus: text('isolated_test_status').default('PENDING').notNull(), // 'PENDING' | 'VERIFIED' | 'FAILED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const systemSettings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON string
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: integer('updated_by').references(() => users.id),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(), // e.g. 'USER_PROMOTION', 'PRODUCT_EDIT', 'REFUND_APPROVED'
  targetEntity: text('target_entity').notNull(),
  details: text('details'), // JSON string, strictly sanitized without passwords/tokens
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 8. RELATIONS DEFINITIONS
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  orders: many(orders),
  notifications: many(notifications),
  activations: many(serviceActivations),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  packages: many(productPackages),
  assets: many(productAssets),
  licenses: many(digitalLicenses),
}));

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));

export const productPackagesRelations = relations(productPackages, ({ one }) => ({
  product: one(products, {
    fields: [productPackages.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
  activations: many(serviceActivations),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  events: many(paymentEvents),
  refunds: many(refunds),
}));

export const serviceActivationsRelations = relations(serviceActivations, ({ one, many }) => ({
  order: one(orders, {
    fields: [serviceActivations.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [serviceActivations.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [serviceActivations.productId],
    references: [products.id],
  }),
  renewals: many(serviceRenewals),
  expirationEvents: many(expirationHistory),
}));

export const hbdPagesRelations = relations(hbdPages, ({ many }) => ({
  guestbookEntries: many(hbdGuestbook),
}));

export const hbdGuestbookRelations = relations(hbdGuestbook, ({ one }) => ({
  page: one(hbdPages, {
    fields: [hbdGuestbook.hbdPageId],
    references: [hbdPages.id],
  }),
}));
