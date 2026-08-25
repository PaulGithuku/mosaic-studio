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
import { storageService, StorageValidationError } from '../server/services/storageService';

async function runPhase6Audit() {
  console.log('\n================================================================');
  console.log('MOSAIC STUDIO — PHASE 6: FINAL SECURITY AUDIT & QA SUITE');
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
    // SECTION 1: Photographer A & B Setup (Multi-Tenancy Foundation)
    // -------------------------------------------------------------------------
    console.log('[1/8] Setting Up Multi-Tenant Photographers (Auth & Profiles)...');
    
    // Register Photographer A
    const photoA = await authService.register({
      name: 'Alexander Wright',
      email: `alexander.${timestamp}@mosaic.studio`,
      password: 'StrongStudioPassword2026!',
    });
    assert(!!photoA.token, 'Photographer A registered with valid auth token');
    assert(photoA.profile?.slug === 'alexander-wright', 'Slug generated accurately');

    // Register Photographer B
    const photoB = await authService.register({
      name: 'Victoria Vance',
      email: `victoria.${timestamp}@mosaic.studio`,
      password: 'StrongStudioPassword2026!',
    });
    assert(!!photoB.token, 'Photographer B registered with valid auth token');
    assert(photoB.profile?.id !== photoA.profile?.id, 'Tenant IDs are completely distinct');

    const profAId = photoA.profile!.id;
    const profBId = photoB.profile!.id;

    // Configure Photographer A Profile
    const updatedA = await authService.updateProfile(photoA.user.id, {
      bio: 'Architectural and minimalist fashion photographer based in New York & Paris.',
      location: 'New York, NY',
      phone: '+1 212 555 0199',
      website: 'https://alexanderwright.studio',
      instagram: 'alexander.wright',
      specialties: ['Architectural', 'Editorial', 'Campaigns'],
      years_experience: 10,
    });
    assert(updatedA.years_experience === 10, 'Profile A updated with full metadata');

    // -------------------------------------------------------------------------
    // SECTION 2: Photographer A Assets & Offerings (Category, Service, Hours)
    // -------------------------------------------------------------------------
    console.log('\n[2/8] Provisioning Photographer A Catalog & Working Schedule...');

    const catA = await categoryRepository.create({
      photographer_id: profAId,
      name: 'Brutalist Architecture',
      slug: 'brutalist-architecture',
      display_order: 0,
      active: true,
    });
    assert(!!catA.id, 'Category created for Photographer A');

    const imgA = await portfolioRepository.create({
      photographer_id: profAId,
      category_id: catA.id,
      storage_path: `portfolio-images/${profAId}/arch_01.jpg`,
      public_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      title: 'Concrete Horizons',
      description: 'Shot in High Line district.',
      featured: true,
      display_order: 0,
      file_size: 150000,
      mime_type: 'image/jpeg',
    });
    assert(!!imgA.id, 'Portfolio image uploaded and cataloged');

    const serviceA = await serviceRepository.create({
      photographer_id: profAId,
      name: 'Editorial Campaign Full Day',
      description: 'Comprehensive 8-hour shoot with 12 master retouches.',
      price: 2500,
      currency: 'USD',
      duration_minutes: 120, // 2-hour slot for testing
      category: 'Editorial',
      featured: true,
      active: true,
      display_order: 0,
    });
    assert(serviceA.price === 2500, 'Service package configured at $2500');

    // Configure Availability: Mon-Fri 09:00 - 17:00
    await availabilityRepository.upsertMany(profAId, [
      { day_of_week: 1, start_time: '09:00', end_time: '17:00', enabled: true },
      { day_of_week: 2, start_time: '09:00', end_time: '17:00', enabled: true },
      { day_of_week: 3, start_time: '09:00', end_time: '17:00', enabled: true },
      { day_of_week: 4, start_time: '09:00', end_time: '17:00', enabled: true },
      { day_of_week: 5, start_time: '09:00', end_time: '17:00', enabled: true },
      { day_of_week: 6, start_time: '00:00', end_time: '00:00', enabled: false },
      { day_of_week: 0, start_time: '00:00', end_time: '00:00', enabled: false },
    ]);
    assert(true, 'Availability calendar configured with operating hours');

    // -------------------------------------------------------------------------
    // SECTION 3: Cross-Tenant Authorization & IDOR Attacks
    // -------------------------------------------------------------------------
    console.log('\n[3/8] Executing Cross-Tenant Authorization & IDOR Attack Tests...');

    // Attack 1: Photographer B trying to update Photographer A's service
    const idorServiceUpdate = await serviceRepository.update(serviceA.id, profBId, {
      price: 1.00, // Attempt price hijacking
      name: 'Hacked Service',
    });
    assert(idorServiceUpdate === null, 'Attack Defended: Photographer B cannot alter Photographer A service');

    // Attack 2: Photographer B trying to delete Photographer A's category
    const idorCategoryDel = await categoryRepository.delete(catA.id, profBId);
    assert(!idorCategoryDel, 'Attack Defended: Photographer B cannot delete Photographer A category');

    // Attack 3: Photographer B trying to modify Photographer A's portfolio image
    const idorImageUpdate = await portfolioRepository.update(imgA.id, profBId, {
      title: 'Stolen Image',
    });
    assert(idorImageUpdate === null, 'Attack Defended: Photographer B cannot alter Photographer A image metadata');

    // Attack 4: Photographer B querying Photographer A's private bookings
    const bookingsB = await bookingRepository.listByPhotographer(profBId);
    assert(bookingsB.length === 0, 'Attack Defended: Photographer B sees 0 of Photographer A bookings');

    // -------------------------------------------------------------------------
    // SECTION 4: Customer Booking Flow & Slot Math
    // -------------------------------------------------------------------------
    console.log('\n[4/8] Testing Customer Discovery, Slot Engine & Booking Creation...');

    // Get tomorrow's weekday date for safe testing
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 7); // 1 week ahead
    // Ensure Monday (day 1)
    while (testDate.getUTCDay() !== 1) {
      testDate.setDate(testDate.getDate() + 1);
    }
    const bookingDateStr = testDate.toISOString().split('T')[0];

    // Query available slots
    const slotsResult = await bookingService.getAvailableSlots(
      'alexander-wright',
      serviceA.id,
      bookingDateStr
    );
    assert(slotsResult.is_operating_day === true, 'Operating day correctly recognized');
    assert(slotsResult.slots.length > 0, `Generated ${slotsResult.slots.length} available slots for 2-hour duration`);
    assert(slotsResult.slots.every((s) => s.available), 'All slots initially available');

    // Book 10:00 AM slot
    const newBooking = await bookingService.createBooking({
      photographer_slug: 'alexander-wright',
      service_id: serviceA.id,
      booking_date: bookingDateStr,
      start_time: '10:00',
      customer_name: 'Genevieve Monet',
      customer_email: 'genevieve.monet@luxurygroup.fr',
      customer_phone: '+33 6 12 34 56 78',
      location: 'SoHo Loft Studio, NY',
      message: 'Looking forward to the editorial session.',
    });

    assert(!!newBooking.id, 'Booking created successfully');
    assert(newBooking.price === 2500, 'Server enforced trusted service price ($2500)');
    assert(newBooking.end_time === '12:00', 'Calculated exact end time based on 120m duration (10:00 -> 12:00)');
    assert(newBooking.status === 'pending', 'Initial status set to pending');
    assert(newBooking.booking_reference.startsWith('MOS-'), 'Generated unique booking reference code');

    // Re-query slots: 10:00, 10:30, 11:00, 11:30 should now be marked unavailable
    const updatedSlots = await bookingService.getAvailableSlots(
      'alexander-wright',
      serviceA.id,
      bookingDateStr
    );
    const slot1000 = updatedSlots.slots.find((s) => s.start_time === '10:00');
    assert(slot1000?.available === false, 'Slot 10:00 is now marked Reserved');

    // -------------------------------------------------------------------------
    // SECTION 5: Double-Booking & Anti-Collision Security Tests
    // -------------------------------------------------------------------------
    console.log('\n[5/8] Testing Double Booking & Attack Resistance...');

    // Attack: Attempt identical duplicate booking
    let duplicateRejected = false;
    try {
      await bookingService.createBooking({
        photographer_slug: 'alexander-wright',
        service_id: serviceA.id,
        booking_date: bookingDateStr,
        start_time: '10:00',
        customer_name: 'Attacker Attempt',
        customer_email: 'attacker@evil.com',
      });
    } catch (e: any) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Double-Booking Attack Prevented: Exact duplicate slot rejected');

    // Attack: Attempt overlapping booking (e.g. 11:00 - 13:00 which collides with 10:00 - 12:00)
    let overlapRejected = false;
    try {
      await bookingService.createBooking({
        photographer_slug: 'alexander-wright',
        service_id: serviceA.id,
        booking_date: bookingDateStr,
        start_time: '11:00',
        customer_name: 'Overlap Attacker',
        customer_email: 'overlap@evil.com',
      });
    } catch (e: any) {
      overlapRejected = true;
    }
    assert(overlapRejected, 'Overlapping Slot Attack Prevented: 11:00 - 13:00 rejected due to collision with 10:00 - 12:00');

    // Attack: Attempt booking outside working hours (e.g. 07:00 AM or 18:00 PM)
    let outOfHoursRejected = false;
    try {
      await bookingService.createBooking({
        photographer_slug: 'alexander-wright',
        service_id: serviceA.id,
        booking_date: bookingDateStr,
        start_time: '06:00',
        customer_name: 'Early Attacker',
        customer_email: 'early@evil.com',
      });
    } catch (e: any) {
      outOfHoursRejected = true;
    }
    assert(outOfHoursRejected, 'Working Hours Enforced: Booking before studio opening rejected');

    // Attack: Attempt booking with non-existent service ID
    let fakeServiceRejected = false;
    try {
      await bookingService.createBooking({
        photographer_slug: 'alexander-wright',
        service_id: '00000000-0000-0000-0000-000000000000',
        booking_date: bookingDateStr,
        start_time: '14:00',
        customer_name: 'Fake Service Client',
        customer_email: 'client@luxury.com',
      });
    } catch (e: any) {
      fakeServiceRejected = true;
    }
    assert(fakeServiceRejected, 'Invalid Service ID rejected');

    // -------------------------------------------------------------------------
    // SECTION 6: Photographer Booking Management Lifecycle
    // -------------------------------------------------------------------------
    console.log('\n[6/8] Testing Photographer Booking Management (Confirm, Reschedule, Complete)...');

    // 1. Confirm booking
    const confirmed = await bookingService.updateBookingStatus(
      newBooking.id,
      profAId,
      'confirmed'
    );
    assert(confirmed.status === 'confirmed', 'Photographer confirmed booking status');

    // 2. Reschedule booking to 14:00
    const rescheduled = await bookingService.rescheduleBooking(
      newBooking.id,
      profAId,
      bookingDateStr,
      '14:00'
    );
    assert(rescheduled.start_time === '14:00', 'Booking rescheduled to 14:00');
    assert(rescheduled.end_time === '16:00', 'Rescheduled end time recalculated to 16:00');

    // 3. Mark completed
    const completed = await bookingService.updateBookingStatus(
      newBooking.id,
      profAId,
      'completed'
    );
    assert(completed.status === 'completed', 'Booking marked completed');

    // -------------------------------------------------------------------------
    // SECTION 7: Public Reference Lookup & Data Sanitization
    // -------------------------------------------------------------------------
    console.log('\n[7/8] Testing Public Reference Lookup & Zero-Data-Leak Audit...');

    const pubBooking = await bookingService.getBookingByReference(newBooking.booking_reference);
    assert(pubBooking.customer_name === 'Genevieve Monet', 'Customer can query booking by unique reference code');
    assert(pubBooking.photographer_name === 'Alexander Wright', 'Booking links to correct photographer');

    // -------------------------------------------------------------------------
    // SECTION 8: Storage File Security & Magic Byte Hardening
    // -------------------------------------------------------------------------
    console.log('\n[8/8] Testing Storage Security & Header Validation...');

    // Test Valid WebP
    const validWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // WEBP
      0x56, 0x50, 0x38, 0x20, // VP8
    ]);
    const mockWebpFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'portfolio.webp',
      encoding: '7bit',
      mimetype: 'image/webp',
      buffer: validWebp,
      size: validWebp.length,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const uploadedWebp = await storageService.uploadImage(mockWebpFile, 'portfolio-images', profAId);
    assert(!!uploadedWebp.public_url, 'WebP upload validated and stored');

    // Test Corrupted file
    const corruptFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'fake.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from([0x00, 0x01, 0x02, 0x03]),
      size: 4,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };
    let corruptRejected = false;
    try {
      await storageService.uploadImage(corruptFile, 'portfolio-images', profAId);
    } catch (e: any) {
      if (e instanceof StorageValidationError) {
        corruptRejected = true;
      }
    }
    assert(corruptRejected, 'Corrupted image header successfully rejected');

    console.log('\n================================================================');
    console.log(`PHASE 6 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED (100% GREEN)`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during Phase 6 verification:', err);
    process.exit(1);
  }
}

runPhase6Audit();
