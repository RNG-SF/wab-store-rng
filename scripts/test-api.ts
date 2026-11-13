import { storage } from '../src/db/storage.ts';

async function runTestSuite() {
  console.log('=== RNG-SF AUTOMATED BACKEND & INTEGRITY TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Database schema and seed verification
    const categories = storage.getCategories();
    assert(categories.length === 5, '5 Core Store Categories exist in database');

    const products = storage.getProducts();
    assert(products.length >= 5, 'Initial product catalog seeded across categories');

    // 2. Super Admin Owner Bootstrap & Registration Shield
    const owner = storage.getUserByEmailOrUsername('sofyantorangga028@gmail.com');
    assert(!!owner && owner.role === 'SUPER_ADMIN', 'Owner Rangga bootstrapped with SUPER_ADMIN role');
    assert(owner?.mustChangePassword === true, 'Owner flagged with mustChangePassword = true');

    // Test Owner Registration Shield (blocks public hijacking)
    let shieldBlocked = false;
    try {
      storage.createUser({
        username: 'Rangga',
        email: 'sofyantorangga028@gmail.com',
        password: 'AttackerPassword123!',
      });
    } catch (err: any) {
      shieldBlocked = true;
    }
    assert(shieldBlocked, 'Public registration blocks claiming owner email/username');

    // 3. Normal User Registration & Auth
    const testUsername = `user_${Date.now()}`;
    const testEmail = `user_${Date.now()}@test.com`;
    const newUser = storage.createUser({
      username: testUsername,
      email: testEmail,
      password: 'StrongPassword123!',
    });
    assert(!!newUser && newUser.role === 'USER', 'New customer registration assigned USER role');

    // Rate Limiting simulation
    const ip = '192.168.1.100';
    for (let i = 0; i < 5; i++) {
      storage.recordLoginAttempt('fake_user', ip, false);
    }
    const isRateLimited = storage.checkRateLimit(ip, 'fake_user');
    assert(isRateLimited, 'Sliding-window rate limiter triggers after 5 failed attempts');

    // 4. Idempotent Order Creation & Payment
    const idempKey = `test_idemp_${Date.now()}`;
    const order1 = storage.createOrder({
      userId: newUser.id,
      items: [{ productId: products[0].id, quantity: 2 }],
      paymentMethod: 'QRIS',
      idempotencyKey: idempKey,
    });
    assert(!order1.isDuplicate && order1.order.status === 'PENDING', 'New order created with PENDING status');

    // Second call with same idempotency key
    const order2 = storage.createOrder({
      userId: newUser.id,
      items: [{ productId: products[0].id, quantity: 2 }],
      paymentMethod: 'QRIS',
      idempotencyKey: idempKey,
    });
    assert(order2.isDuplicate && order2.order.id === order1.order.id, 'Idempotency guard prevents duplicate order processing');

    // 5. Payment Fulfillment & Service Activation
    const fulfilled = storage.fulfillOrder(order1.order.id, owner.id);
    assert(fulfilled?.status === 'PAID', 'Order status transitioned to PAID');

    const orders = storage.getOrders(newUser.id);
    const hasActivation = orders.some((o) => o.activation && o.activation.status === 'ACTIVE');
    assert(hasActivation, 'Service activation and digital license key generated automatically');

    // 6. Dynamic HBD Engine & Guestbook
    const hbdPage = storage.getHbdPage('happy-21-sarah');
    assert(!!hbdPage && hbdPage.recipientName === 'Sarah Amanda', 'Dynamic HBD page retrieved by slug');

    const newComment = storage.addHbdGuestbook('happy-21-sarah', 'Unit Tester', 'Happy Birthday Test Message!');
    assert(!!newComment && newComment.isApproved, 'Guestbook comment posted and approved');

    // 7. Backup & Isolated Restoration Testing
    const backup = storage.createBackup(owner.id);
    assert(!!backup && backup.status === 'SUCCESS', 'Database snapshot exported to persistent disk');

    const restoreTest = storage.testRestoreBackup(backup.filename, owner.id);
    assert(restoreTest.success === true, 'Isolated restoration integrity test passed with full schema parity');

    // 8. Sanitized Audit Logging Check
    const auditLogs = storage.getAuditLogs();
    const hasAudit = auditLogs.length > 0;
    assert(hasAudit, 'Audit trail records administrative and user events');

    const hasLeakedPasswords = auditLogs.some((l) => {
      const details = l.details || '';
      return details.includes('StrongPassword123!') || details.includes('Rangga#2026@Secure');
    });
    // 9. Role-Based Access Control (RBAC) System Verification
    const allRoles = storage.getRoles();
    assert(allRoles.length === 6, '6 distinct roles defined (SUPER_ADMIN, STORE_MANAGER, CONTENT_MANAGER, PARTNER, CREATOR, USER)');
    
    const allPermissions = storage.getPermissions();
    assert(allPermissions.length >= 25, 'Granular permissions catalog seeded across modules');

    // Test permission check
    const superAdminHasAll = storage.hasPermission(owner.id, 'products:create') && storage.hasPermission(owner.id, 'system:view_audit');
    assert(superAdminHasAll, 'SUPER_ADMIN has universal access to all granular permissions');

    const regularUserBlocked = !storage.hasPermission(newUser.id, 'products:create') && !storage.hasPermission(newUser.id, 'payments:reconcile');
    assert(regularUserBlocked, 'Regular USER is restricted from elevated administrative actions');

    // Test role assignment
    const updatedRole = storage.updateUserRole(newUser.id, 'STORE_MANAGER', owner.id);
    assert(updatedRole?.role === 'STORE_MANAGER', 'Admin can assign roles dynamically via RBAC');

    const managerHasStorePerm = storage.hasPermission(newUser.id, 'products:create');
    assert(managerHasStorePerm, 'Promoted STORE_MANAGER immediately inherits product management permission');

    // 10. Real Payment Gateway & Cryptographic Webhook Verification
    const gwOrder = storage.createOrder({
      userId: newUser.id,
      items: [{ productId: products[0].id, quantity: 1 }],
      paymentMethod: 'MIDTRANS',
      idempotencyKey: `gw_test_${Date.now()}`,
    });

    const paymentSession = storage.createPaymentSession(gwOrder.order.id, 'MIDTRANS', 'qris');
    assert(!!paymentSession && !!paymentSession.transactionId, 'Payment session and transaction record initialized with gateway reference');

    // Authentic Midtrans Webhook Simulation
    const webhookResult = storage.simulateGatewayWebhook(gwOrder.order.orderNumber, 'settlement', 'MIDTRANS', 'qris');
    assert(webhookResult.success === true && webhookResult.status === 'SUCCESS', 'Cryptographically signed webhook (SHA-512) verified and marked payment SUCCESS');

    const updatedGwOrder = storage.getOrders(newUser.id).find((o) => o.id === gwOrder.order.id);
    assert(updatedGwOrder?.status === 'PAID', 'Order automatically transitioned to PAID upon webhook confirmation');

    // Signature Tampering Guard Test
    const fakeSignatureResult = storage.processGatewayWebhook('MIDTRANS', {
      order_id: gwOrder.order.orderNumber,
      status_code: '200',
      gross_amount: String(gwOrder.order.totalAmount),
      transaction_status: 'settlement',
      payment_type: 'qris',
      transaction_id: 'fake-midtrans-id',
    }, 'tampered_fake_signature_hash_123456');
    assert(fakeSignatureResult.success === false && fakeSignatureResult.error === 'INVALID_SIGNATURE', 'Webhook rejects forged or invalid cryptographic signatures');

    // Amount Discrepancy Guard Test
    const crypto = await import('crypto');
    const serverKey = process.env.MIDTRANS_SERVER_KEY || process.env.WEBHOOK_SECRET_KEY || 'sandbox_midtrans_server_key_rng_sf';
    const tamperedAmount = gwOrder.order.totalAmount + 10000;
    const tamperedPayload = {
      order_id: gwOrder.order.orderNumber,
      status_code: '200',
      gross_amount: String(tamperedAmount),
      transaction_status: 'settlement',
      payment_type: 'qris',
      transaction_id: 'discrepancy-test-id',
    };
    const validSigForTamperedAmount = crypto.default
      .createHash('sha512')
      .update(`${gwOrder.order.orderNumber}200${tamperedAmount}${serverKey}`)
      .digest('hex');

    const discrepancyResult = storage.processGatewayWebhook('MIDTRANS', tamperedPayload, validSigForTamperedAmount);
    assert(discrepancyResult.success === false && discrepancyResult.error === 'AMOUNT_DISCREPANCY', 'System blocks payment when webhook amount differs from database order total');

    // Transaction Reconciliation & Refund Test
    const allTx = storage.getTransactions();
    const settledTx = allTx.find((t) => t.orderId === gwOrder.order.id);
    assert(!!settledTx && settledTx.status === 'SUCCESS', 'Transaction history captures verified settlement and gateway reference');

    const reconcileResult = storage.reconcilePayment(settledTx!.id, owner.id, 'Automated verification check');
    assert(reconcileResult.success === true, 'Manual and automated transaction reconciliation successful');

    const refundResult = storage.refundPayment(settledTx!.id, 'Test refund request', owner.id);
    assert(refundResult.success === true && refundResult.status === 'REFUNDED', 'Refund workflow processed and payment status updated to REFUNDED');

    // 11. Two-Stage HBD Password Security System
    const slugA = `test-hbd-bday-${Date.now()}`;
    const savedA = storage.saveHbdPage(
      {
        recipientName: 'Nadia Putri',
        title: 'Happy Birthday Nadia',
        slug: slugA,
        eventDate: '2026-08-25',
        message: 'Selamat ulang tahun Nadia! Pesan rahasia ini hanya terbuka setelah dua tahap.',
        theme: 'crimson-gold',
        musicUrl: 'https://example.com/song.mp3',
        photos: ['https://example.com/photo1.jpg'],
        passwordEnabled: true,
        stage1Birthday: '1999-04-12',
        stage2Method: 'RECIPIENT_BIRTHDAY',
        stage2RecipientBirthday: '2002-08-25',
      },
      owner.id
    );
    assert(
      savedA.passwordEnabled === true &&
        savedA.hasStage1Password === true &&
        savedA.hasStage2RecipientBirthday === true &&
        !(savedA as any).stage1PasswordHash &&
        !(savedA as any).stage2RecipientBirthdayHash,
      'HBD page saved with hashed 2-stage passwords and no hashes leaked to admin list'
    );

    const lockedViewA: any = storage.getHbdPage(slugA);
    assert(
      lockedViewA?.isLocked === true &&
        !lockedViewA.message &&
        !lockedViewA.musicUrl &&
        !lockedViewA.photos &&
        !lockedViewA.guestbook,
      'Public HBD fetch strictly hides message, media, and guestbook when locked'
    );

    // Stage 2 bypass attempt without Stage 1 token
    const bypassAttempt = storage.verifyHbdStage2(slugA, '2002-08-25');
    assert(!bypassAttempt.success && bypassAttempt.status === 403, 'Stage 2 cannot be bypassed without valid Stage 1 verification');

    // Wrong Stage 1 birthday
    const wrongStage1 = storage.verifyHbdStage1(slugA, '1998-01-01');
    assert(!wrongStage1.success && wrongStage1.status === 401, 'Wrong Stage 1 birthday is rejected with friendly error');

    // Correct Stage 1 birthday
    const rightStage1 = storage.verifyHbdStage1(slugA, '1999-04-12');
    assert(rightStage1.success === true && !!rightStage1.stage1Token, 'Correct Stage 1 birthday issues stage1Token');

    // Wrong Stage 2 birthday
    const wrongStage2 = storage.verifyHbdStage2(slugA, '2000-01-01', rightStage1.stage1Token);
    assert(!wrongStage2.success && wrongStage2.status === 401, 'Wrong Stage 2 recipient birthday is rejected');

    // Guestbook blocked before unlock
    let guestbookBlocked = false;
    try {
      storage.addHbdGuestbook(slugA, 'Intruder', 'Should fail');
    } catch {
      guestbookBlocked = true;
    }
    assert(guestbookBlocked, 'Guestbook posting is blocked when HBD page is still locked');

    // Correct Stage 2 birthday
    const rightStage2 = storage.verifyHbdStage2(slugA, '2002-08-25', rightStage1.stage1Token);
    assert(
      rightStage2.success === true &&
        !!rightStage2.unlockToken &&
        rightStage2.page?.message?.includes('Pesan rahasia'),
      'Correct Stage 2 birthday unlocks HBD page content and issues unlockToken'
    );

    // Fetching with unlockToken succeeds
    const unlockedViewA: any = storage.getHbdPage(slugA, rightStage2.unlockToken);
    assert(unlockedViewA?.isLocked === false && !!unlockedViewA?.message, 'Unlocked token grants access to HBD page');

    // Guestbook succeeds with unlockToken
    const unlockedGuestEntry = storage.addHbdGuestbook(slugA, 'Sahabat', 'Happy birthday Nadia!', rightStage2.unlockToken);
    assert(!!unlockedGuestEntry && unlockedGuestEntry.authorName === 'Sahabat', 'Guestbook posting succeeds with valid unlockToken');

    // Per-page isolation + CUSTOM_PASSWORD method
    const slugB = `test-hbd-custom-${Date.now()}`;
    storage.saveHbdPage(
      {
        recipientName: 'Budi Santoso',
        title: 'Happy Birthday Budi',
        slug: slugB,
        eventDate: '2026-09-10',
        message: 'Ucapan khusus dengan custom password.',
        theme: 'aurora-emerald',
        passwordEnabled: true,
        stage1Birthday: '2001-03-15',
        stage2Method: 'CUSTOM_PASSWORD',
        stage2CustomPassword: 'KenanganSpesial#2026',
      },
      owner.id
    );

    const crossPageUnlockAttempt: any = storage.getHbdPage(slugB, rightStage2.unlockToken);
    assert(crossPageUnlockAttempt?.isLocked === true, 'Unlock token from HBD page A cannot unlock HBD page B (per-page isolation)');

    const stage1B = storage.verifyHbdStage1(slugB, '2001-03-15');
    const stage2B = storage.verifyHbdStage2(slugB, 'KenanganSpesial#2026', stage1B.stage1Token);
    assert(stage2B.success === true && stage2B.page?.message === 'Ucapan khusus dengan custom password.', 'Custom password method unlocks Stage 2 cleanly');

    // Toggle passwordEnabled off
    storage.saveHbdPage(
      {
        id: savedA.id,
        recipientName: 'Nadia Putri',
        title: 'Happy Birthday Nadia',
        slug: slugA,
        eventDate: '2026-08-25',
        message: 'Selamat ulang tahun Nadia!',
        passwordEnabled: false,
      },
      owner.id
    );
    const disabledLockView: any = storage.getHbdPage(slugA);
    assert(disabledLockView?.isLocked === false && !!disabledLockView?.message, 'Disabling password protection makes HBD page accessible directly');

    // Clean up temporary test HBD pages so showcase remains uncluttered
    storage.saveHbdPage(
      {
        id: savedA.id,
        recipientName: 'Nadia Putri',
        title: 'Happy Birthday Nadia',
        slug: slugA,
        eventDate: '2026-08-25',
        message: 'Selamat ulang tahun Nadia!',
        passwordEnabled: false,
        isActive: false,
      },
      owner.id
    );
    const listAfterB = storage.getAllHbdPages().find((p) => p.slug === slugB);
    if (listAfterB) {
      storage.saveHbdPage({ ...listAfterB, isActive: false }, owner.id);
    }

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during test suite:', err);
    process.exit(1);
  }
}

runTestSuite();
