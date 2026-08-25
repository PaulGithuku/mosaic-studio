import { authService } from '../server/services/authService';
import { categoryRepository, serviceRepository, availabilityRepository, portfolioRepository, profileRepository } from '../server/config/supabase';
import { storageService, StorageValidationError } from '../server/services/storageService';

async function runPhase2Verification() {
  console.log('\n======================================================');
  console.log('MOSAIC STUDIO — PHASE 1 & PHASE 2 VERIFICATION SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Phase 1 Authentication & Profile Registration
    // -------------------------------------------------------------------------
    console.log('[1/7] Testing Authentication & User Setup...');
    const userA = await authService.register({
      name: 'Julian Bennett',
      email: `julian.${Date.now()}@mosaic.photo`,
      password: 'SecurePassword123!',
    });
    assert(!!userA.token, 'User A registered and received valid JWT token');
    assert(userA.profile?.slug === 'julian-bennett', `Profile slug correctly initialized as "julian-bennett" (got: ${userA.profile?.slug})`);

    const userB = await authService.register({
      name: 'Elena Rostova',
      email: `elena.${Date.now()}@mosaic.photo`,
      password: 'SecurePassword456!',
    });
    assert(!!userB.token, 'User B registered successfully');
    assert(userB.profile?.id !== userA.profile?.id, 'Photographer profiles are strictly isolated');

    // -------------------------------------------------------------------------
    // TEST 2: Profile Updates
    // -------------------------------------------------------------------------
    console.log('\n[2/7] Testing Photographer Profile Customization...');
    const updatedProfile = await authService.updateProfile(userA.user.id, {
      bio: 'Editorial and haute couture photographer based in Paris.',
      location: 'Paris, France',
      instagram: 'julian.editorial',
      specialties: ['Editorial', 'Fashion', 'Portrait'],
      years_experience: 12,
    });
    assert(updatedProfile.bio === 'Editorial and haute couture photographer based in Paris.', 'Bio updated successfully');
    assert(updatedProfile.specialties.length === 3, 'Specialties stored and retrieved as array');
    assert(updatedProfile.years_experience === 12, 'Years of experience saved');

    // -------------------------------------------------------------------------
    // TEST 3: Category Management & Reordering
    // -------------------------------------------------------------------------
    console.log('\n[3/7] Testing Portfolio Categories...');
    const cat1 = await categoryRepository.create({
      photographer_id: userA.profile!.id,
      name: 'Editorial Haute Couture',
      slug: 'editorial-haute-couture',
      display_order: 0,
      active: true,
    });
    const cat2 = await categoryRepository.create({
      photographer_id: userA.profile!.id,
      name: 'Black and White Portraits',
      slug: 'black-and-white-portraits',
      display_order: 1,
      active: true,
    });
    assert(!!cat1.id && !!cat2.id, 'Created multiple portfolio categories for User A');

    const userACategories = await categoryRepository.findByPhotographer(userA.profile!.id);
    assert(userACategories.length >= 2, 'Retrieved photographer categories list');

    // Cross-isolation: User B categories should be empty
    const userBCategories = await categoryRepository.findByPhotographer(userB.profile!.id);
    assert(userBCategories.length === 0, 'User B sees 0 categories (isolated multi-tenancy)');

    // -------------------------------------------------------------------------
    // TEST 4: Services Management (Pricing & Durations)
    // -------------------------------------------------------------------------
    console.log('\n[4/7] Testing Services & Offerings...');
    const service1 = await serviceRepository.create({
      photographer_id: userA.profile!.id,
      name: 'Full Day Editorial Commission',
      description: 'Comprehensive high-fashion shoot with 20 retouched deliverables.',
      price: 2400.00,
      currency: 'USD',
      duration_minutes: 480,
      category: 'Editorial',
      featured: true,
      active: true,
      display_order: 0,
    });
    assert(service1.price === 2400.00, 'Service created with correct pricing');
    assert(service1.duration_minutes === 480, 'Service created with duration 480 mins');
    assert(service1.featured === true, 'Service featured flag set correctly');

    // Update service
    const updatedService = await serviceRepository.update(service1.id, userA.profile!.id, {
      price: 2600.00,
    });
    assert(updatedService?.price === 2600.00, 'Service price updated by owner');

    // IDOR check: User B attempting to modify User A's service
    const idorServiceUpdate = await serviceRepository.update(service1.id, userB.profile!.id, {
      price: 1.00,
    });
    assert(idorServiceUpdate === null, 'IDOR Prevention: User B cannot modify User A service');

    // -------------------------------------------------------------------------
    // TEST 5: Availability Schedule & Time Validation
    // -------------------------------------------------------------------------
    console.log('\n[5/7] Testing Studio Availability Calendar...');
    const scheduleDays = [
      { day_of_week: 1, start_time: '09:00', end_time: '17:00', enabled: true },
      { day_of_week: 2, start_time: '09:00', end_time: '17:00', enabled: true },
      { day_of_week: 3, start_time: '09:00', end_time: '17:00', enabled: true },
      { day_of_week: 4, start_time: '09:00', end_time: '17:00', enabled: true },
      { day_of_week: 5, start_time: '09:00', end_time: '17:00', enabled: true },
      { day_of_week: 6, start_time: '10:00', end_time: '16:00', enabled: true },
      { day_of_week: 0, start_time: '09:00', end_time: '17:00', enabled: false },
    ];

    const savedSchedule = await availabilityRepository.upsertMany(userA.profile!.id, scheduleDays);
    assert(savedSchedule.length === 7, 'Saved complete 7-day schedule for User A');

    const loadedSchedule = await availabilityRepository.findByPhotographer(userA.profile!.id);
    const saturday = loadedSchedule.find((s) => s.day_of_week === 6);
    assert(saturday?.start_time.startsWith('10:00'), 'Saturday hours correctly stored as 10:00');
    assert(saturday?.enabled === true, 'Saturday enabled status verified');

    // -------------------------------------------------------------------------
    // TEST 6: File Storage Magic Byte Validation & Upload Handling
    // -------------------------------------------------------------------------
    console.log('\n[6/7] Testing Storage Security & Byte Validation...');
    // Valid JPEG Header (FF D8 FF)
    const validJpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    const mockFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'editorial_cover.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: validJpegBuffer,
      size: validJpegBuffer.length,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const uploadRes = await storageService.uploadImage(mockFile, 'portfolio-images', userA.profile!.id);
    assert(!!uploadRes.public_url, `Valid JPEG upload passed magic number inspection (URL: ${uploadRes.public_url})`);

    // Invalid file (e.g. executable spoofed as jpeg)
    const fakeFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'malicious.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('MZ\x90\x00\x03\x00\x00\x00'), // Windows PE executable header
      size: 8,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    let caughtSpoof = false;
    try {
      await storageService.uploadImage(fakeFile, 'portfolio-images', userA.profile!.id);
    } catch (e: any) {
      if (e instanceof StorageValidationError) {
        caughtSpoof = true;
      }
    }
    assert(caughtSpoof, 'Security check passed: Rejected spoofed executable file masquerading as image/jpeg');

    // -------------------------------------------------------------------------
    // TEST 7: Public API Endpoints Resolution
    // -------------------------------------------------------------------------
    console.log('\n[7/7] Testing Public Studio Endpoints...');
    const publicProfile = await authService.getPublicProfile(userA.profile!.slug);
    assert(publicProfile !== null, 'Public profile queried by slug successfully');
    assert(publicProfile?.name === 'Julian Bennett', 'Public profile name matches');
    assert(publicProfile?.bio === 'Editorial and haute couture photographer based in Paris.', 'Public bio matches');

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during test execution:', error);
    process.exit(1);
  }
}

runPhase2Verification();
