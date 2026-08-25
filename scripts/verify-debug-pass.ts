import { authService } from '../server/services/authService';
import {
  profileRepository,
  categoryRepository,
  portfolioRepository,
  serviceRepository,
  availabilityRepository,
  bookingRepository,
} from '../server/config/supabase';
import { bookingService } from '../server/services/bookingService';

async function runProductionDebugPassAudit() {
  console.log('\n================================================================');
  console.log('MOSAIC STUDIO — PRODUCTION DEBUGGING & INTEGRATION VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();

    // -------------------------------------------------------------------------
    // TEST 1: New Photographer Registration with Instant Profile Creation
    // -------------------------------------------------------------------------
    console.log('[1/7] Testing User Registration & Profile Initialization...');
    const regResult = await authService.register({
      name: 'Claire Beauchamp',
      email: `claire.${timestamp}@mosaic.studio`,
      password: 'StrongStudioPassword2026!',
    });
    assert(!!regResult.token, 'Registration returns valid token');
    assert(!!regResult.user.id, 'User ID is UUID from auth provider');
    assert(!!regResult.profile, 'Profile is automatically initialized upon registration');
    assert(regResult.profile?.user_id === regResult.user.id, 'Profile user_id matches authenticated user id');
    assert(regResult.profile?.slug.startsWith('claire-beauchamp'), 'Slug generated accurately from display name');

    // -------------------------------------------------------------------------
    // TEST 2: JIT Auto-Healing for Users Lacking Profiles (Simulating External Auth / Race Condition)
    // -------------------------------------------------------------------------
    console.log('\n[2/7] Testing JIT Profile Auto-Healing for Arbitrary / Existing Users...');
    
    // Create an un-profiled user ID (simulating what happened to d9689a96-360c-4aef-b4b7-3ea02f39e400)
    const testUserId = `test-user-${timestamp}`;
    const testEmail = `external.photographer.${timestamp}@mosaic.studio`;

    // 1. Calling ensureProfile directly
    const healedProfile = await profileRepository.ensureProfile({
      user_id: testUserId,
      email: testEmail,
      name: 'External Photographer',
    });
    assert(!!healedProfile.id, 'ensureProfile created profile successfully');
    assert(healedProfile.user_id === testUserId, 'healedProfile user_id links directly to auth user id');
    assert(healedProfile.email === testEmail, 'healedProfile email matches');

    // 2. Calling getCurrentUser for a user without prior profile
    const unprofiledUserId = `fresh-auth-user-${timestamp}`;
    const freshCurrentUser = await authService.getCurrentUser(
      unprofiledUserId,
      `fresh.${timestamp}@mosaic.studio`
    );
    assert(!!freshCurrentUser.profile, 'getCurrentUser auto-heals and returns profile');
    assert(freshCurrentUser.profile?.user_id === unprofiledUserId, 'Auto-healed profile has correct user_id');

    // 3. Updating profile for a user without prior profile
    const unprofiledUserId2 = `update-user-${timestamp}`;
    const updatedNewUser = await profileRepository.update(unprofiledUserId2, {
      bio: 'New photographer biography.',
      location: 'London, UK',
    });
    assert(updatedNewUser.bio === 'New photographer biography.', 'Profile update auto-initializes and saves without throwing');
    assert(updatedNewUser.user_id === unprofiledUserId2, 'Updated profile is associated with target user_id');

    // -------------------------------------------------------------------------
    // TEST 3: Specific User Case Simulation (Generic Non-Hardcoded Resolution)
    // -------------------------------------------------------------------------
    console.log('\n[3/7] Testing Resolution of Previous Uninitialized User (d9689a96-360c-4aef-b4b7-3ea02f39e400)...');
    const targetUserId = 'd9689a96-360c-4aef-b4b7-3ea02f39e400';
    const resolvedTarget = await profileRepository.ensureProfile({
      user_id: targetUserId,
      email: 'alex.rivers@mosaic.studio',
      name: 'Alex Rivers',
    });
    assert(resolvedTarget.user_id === targetUserId, 'Target user profile resolved cleanly');
    assert(!!resolvedTarget.id, 'Target user profile has valid database ID');

    // Verify lookup by user_id
    const retrievedTarget = await profileRepository.findByUserId(targetUserId);
    assert(retrievedTarget?.id === resolvedTarget.id, 'findByUserId retrieves the healed profile record');

    // -------------------------------------------------------------------------
    // TEST 4: Dashboard Stats Aggregation Without 404
    // -------------------------------------------------------------------------
    console.log('\n[4/7] Testing Dashboard Metrics Aggregation Engine...');
    const photographerProfile = regResult.profile!;
    
    // Provision sample service & category for photographer
    const category = await categoryRepository.create({
      photographer_id: photographerProfile.id,
      name: 'Fine Art Portraiture',
      slug: 'fine-art-portraiture',
      display_order: 0,
      active: true,
    });
    assert(!!category.id, 'Category created');

    const service = await serviceRepository.create({
      photographer_id: photographerProfile.id,
      name: 'Fine Art Session',
      price: 1200,
      currency: 'USD',
      duration_minutes: 90,
      category: 'Portrait',
      featured: true,
      active: true,
      display_order: 0,
    });
    assert(service.price === 1200, 'Service package created');

    await availabilityRepository.upsertMany(photographerProfile.id, [
      { day_of_week: 1, start_time: '10:00', end_time: '18:00', enabled: true },
      { day_of_week: 2, start_time: '10:00', end_time: '18:00', enabled: true },
      { day_of_week: 3, start_time: '10:00', end_time: '18:00', enabled: true },
    ]);

    // Test Counts & Stats
    const [pCount, sCount, sched, bStats] = await Promise.all([
      portfolioRepository.countByPhotographer(photographerProfile.id),
      serviceRepository.countByPhotographer(photographerProfile.id),
      availabilityRepository.getSchedule(photographerProfile.id),
      bookingRepository.getDashboardBookingStats(photographerProfile.id),
    ]);

    assert(sCount >= 1, `Services count correctly calculated (got: ${sCount})`);
    assert(sched.filter((d) => d.enabled).length === 3, 'Active operating days count matches (3 days)');
    assert(bStats.totalRevenue !== undefined, 'Revenue metric computed');
    assert(bStats.totalBookings !== undefined, 'Bookings metric computed');
    assert(Array.isArray(bStats.monthlyTrends), 'Monthly trend array computed');

    // -------------------------------------------------------------------------
    // TEST 5: Booking Lifecycle & Conflict Prevention
    // -------------------------------------------------------------------------
    console.log('\n[5/7] Testing Booking Engine & Conflict Prevention...');
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 7);
    while (testDate.getUTCDay() !== 1) {
      testDate.setDate(testDate.getDate() + 1);
    }
    const bookingDateStr = testDate.toISOString().split('T')[0];

    const booking = await bookingService.createBooking({
      photographer_slug: photographerProfile.slug,
      service_id: service.id,
      booking_date: bookingDateStr,
      start_time: '11:00',
      customer_name: 'Helena Vance',
      customer_email: 'helena.vance@example.com',
      message: 'Excited for the fine art portrait shoot.',
    });
    assert(!!booking.id, 'Booking created successfully');
    assert(booking.end_time === '12:30', 'Booking calculated 90m duration accurately (11:00 -> 12:30)');

    // Attempt overlapping slot
    let collisionBlocked = false;
    try {
      await bookingService.createBooking({
        photographer_slug: photographerProfile.slug,
        service_id: service.id,
        booking_date: bookingDateStr,
        start_time: '11:30',
        customer_name: 'Collision Client',
        customer_email: 'collision@example.com',
      });
    } catch {
      collisionBlocked = true;
    }
    assert(collisionBlocked, 'Overlapping booking collision successfully blocked');

    // -------------------------------------------------------------------------
    // TEST 6: Multi-Tenant Data Isolation (Security Check)
    // -------------------------------------------------------------------------
    console.log('\n[6/7] Testing Multi-Tenant Data Isolation...');
    const otherUser = await authService.register({
      name: 'Marcus Sterling',
      email: `marcus.${timestamp}@mosaic.studio`,
      password: 'StrongStudioPassword2026!',
    });

    const otherBookings = await bookingRepository.listByPhotographer(otherUser.profile!.id);
    assert(otherBookings.length === 0, 'Photographer B sees 0 bookings belonging to Photographer A');

    const otherServices = await serviceRepository.listByPhotographer(otherUser.profile!.id);
    assert(otherServices.length === 0, 'Photographer B sees 0 services belonging to Photographer A');

    // -------------------------------------------------------------------------
    // TEST 7: Public Discovery & Safe Data Exposure
    // -------------------------------------------------------------------------
    console.log('\n[7/7] Testing Public Studio Discovery & Data Sanitization...');
    const publicProfile = await authService.getPublicProfile(photographerProfile.slug);
    assert(!!publicProfile, 'Public profile queried by slug successfully');
    assert(publicProfile?.name === 'Claire Beauchamp', 'Public name matches');
    assert(!('password' in (publicProfile || {})), 'No password leak in profile payload');

    console.log('\n================================================================');
    console.log(`PRODUCTION DEBUG AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during verification:', err);
    process.exit(1);
  }
}

runProductionDebugPassAudit();
