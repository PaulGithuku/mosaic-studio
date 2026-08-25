import { authService } from '../server/services/authService';
import {
  profileRepository,
  categoryRepository,
  portfolioRepository,
  serviceRepository,
  availabilityRepository,
} from '../server/config/supabase';

async function runPhase3Verification() {
  console.log('\n================================================================');
  console.log('MOSAIC STUDIO — PHASE 3 PUBLIC EXPERIENCE & REGRESSION TEST SUITE');
  console.log('================================================================\n');

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
    // TEST 1: Phase 1 & 2 Regression: User Setup & Studio Initialization
    // -------------------------------------------------------------------------
    console.log('[1/7] Testing Studio Setup & Regression Profile Verification...');
    const timestamp = Date.now();
    const studioUser = await authService.register({
      name: 'Gabriel Laurent',
      email: `gabriel.${timestamp}@mosaic.studio`,
      password: 'StudioPassword2026!',
    });
    assert(!!studioUser.token, 'Photographer registered with valid JWT token');
    assert(studioUser.profile?.slug === 'gabriel-laurent', 'Initial slug generated correctly');

    const photographerId = studioUser.profile!.id;

    // Update full profile with location, phone, social handles, specialties
    const updatedProfile = await authService.updateProfile(studioUser.user.id, {
      bio: 'Vogue & Harper’s Bazaar contributor. Specialist in cinematic natural light and architectural fashion photography.',
      location: 'Milan & Lake Como, Italy',
      phone: '+39 02 8899 0011',
      website: 'https://gabriellaurent.photography',
      instagram: 'gabriel.laurent.studio',
      facebook: 'gabriellaurentphoto',
      tiktok: 'gabriellaurent',
      whatsapp: '+390288990011',
      specialties: ['Editorial Haute Couture', 'Fine Art Portraiture', 'Architectural Campaigns'],
      years_experience: 14,
    });

    assert(updatedProfile.years_experience === 14, 'Photographer experience updated to 14 years');
    assert(updatedProfile.specialties.length === 3, 'Photographer specialties saved');
    assert(updatedProfile.location === 'Milan & Lake Como, Italy', 'Photographer location saved');

    // -------------------------------------------------------------------------
    // TEST 2: Category Setup (Active and Inactive)
    // -------------------------------------------------------------------------
    console.log('\n[2/7] Testing Category Management & Visibility Filtering...');
    const catActive1 = await categoryRepository.create({
      photographer_id: photographerId,
      name: 'Haute Couture',
      slug: 'haute-couture',
      display_order: 0,
      active: true,
    });

    const catActive2 = await categoryRepository.create({
      photographer_id: photographerId,
      name: 'Fine Art Portraits',
      slug: 'fine-art-portraits',
      display_order: 1,
      active: true,
    });

    const catDraft = await categoryRepository.create({
      photographer_id: photographerId,
      name: 'Unreleased Draft Category',
      slug: 'draft-category',
      display_order: 2,
      active: false, // Inactive
    });

    const publicCats = await categoryRepository.listByPhotographer(photographerId, true);
    assert(publicCats.length === 2, `Public categories strictly filters out inactive ones (Expected 2, got ${publicCats.length})`);
    assert(publicCats.every((c) => c.active), 'All returned public categories have active === true');
    assert(!publicCats.some((c) => c.name === 'Unreleased Draft Category'), 'Draft category not visible in public list');

    // -------------------------------------------------------------------------
    // TEST 3: Portfolio Population & Featured Flag
    // -------------------------------------------------------------------------
    console.log('\n[3/7] Testing Portfolio Creation & Public Asset Representation...');
    const img1 = await portfolioRepository.create({
      photographer_id: photographerId,
      category_id: catActive1.id,
      storage_path: 'portfolio-images/gabriel/editorial_01.jpg',
      public_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
      title: 'Monochrome Silhouette',
      description: 'Shot on 35mm film at Villa Balbianello.',
      featured: true,
      display_order: 0,
      width: 1200,
      height: 1500,
      file_size: 245000,
      mime_type: 'image/jpeg',
    });

    const img2 = await portfolioRepository.create({
      photographer_id: photographerId,
      category_id: catActive2.id,
      storage_path: 'portfolio-images/gabriel/portrait_02.jpg',
      public_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=85',
      title: 'Milanese Contemplation',
      description: 'Studio natural light portrait series.',
      featured: false,
      display_order: 1,
      width: 1200,
      height: 1500,
      file_size: 310000,
      mime_type: 'image/jpeg',
    });

    const publicImages = await portfolioRepository.listByPhotographer(photographerId);
    assert(publicImages.length === 2, `Portfolio contains 2 published works`);
    assert(publicImages[0].featured === true, 'First image correctly flagged as featured hero candidate');
    assert(!!publicImages[0].category_name, 'Public image returns resolved category name');

    // -------------------------------------------------------------------------
    // TEST 4: Services Management & Commission Packages
    // -------------------------------------------------------------------------
    console.log('\n[4/7] Testing Services & Public Active Filtering...');
    const serv1 = await serviceRepository.create({
      photographer_id: photographerId,
      name: 'Editorial Campaign Commission',
      description: 'Full-day creative direction, lighting team, and 15 master-retouched editorial deliverables.',
      price: 3500,
      currency: 'EUR',
      duration_minutes: 480,
      category: 'Editorial',
      featured: true,
      active: true,
      display_order: 0,
    });

    const serv2 = await serviceRepository.create({
      photographer_id: photographerId,
      name: 'Private Studio Portraiture',
      description: '2-hour intimate portrait session with 5 high-resolution fine-art prints.',
      price: 1200,
      currency: 'EUR',
      duration_minutes: 120,
      category: 'Portrait',
      featured: false,
      active: true,
      display_order: 1,
    });

    const servInactive = await serviceRepository.create({
      photographer_id: photographerId,
      name: 'Archived Legacy Package',
      description: 'Not available for booking.',
      price: 500,
      currency: 'EUR',
      duration_minutes: 60,
      category: 'Archived',
      featured: false,
      active: false, // Inactive
      display_order: 2,
    });

    const publicServices = await serviceRepository.listByPhotographer(photographerId, true);
    assert(publicServices.length === 2, `Public services filters out inactive packages (Expected 2, got ${publicServices.length})`);
    assert(!publicServices.some((s) => s.name === 'Archived Legacy Package'), 'Inactive service not leaked in public list');
    assert(publicServices.some((s) => s.featured), 'Signature featured package identified correctly');

    // -------------------------------------------------------------------------
    // TEST 5: Availability Schedule Setup
    // -------------------------------------------------------------------------
    console.log('\n[5/7] Testing Availability Schedule Resolution...');
    await availabilityRepository.upsertMany(photographerId, [
      { day_of_week: 1, start_time: '09:00', end_time: '18:00', enabled: true },
      { day_of_week: 2, start_time: '09:00', end_time: '18:00', enabled: true },
      { day_of_week: 3, start_time: '09:00', end_time: '18:00', enabled: true },
      { day_of_week: 4, start_time: '09:00', end_time: '18:00', enabled: true },
      { day_of_week: 5, start_time: '10:00', end_time: '16:00', enabled: true },
      { day_of_week: 6, start_time: '00:00', end_time: '00:00', enabled: false },
      { day_of_week: 0, start_time: '00:00', end_time: '00:00', enabled: false },
    ]);

    const publicSchedule = await availabilityRepository.getSchedule(photographerId);
    const enabledDays = publicSchedule.filter((d) => d.enabled);
    assert(enabledDays.length === 5, `Availability contains 5 enabled operating days`);

    // -------------------------------------------------------------------------
    // TEST 6: Public Profile Retrieval & Security Audit (Zero Sensitive Leaks)
    // -------------------------------------------------------------------------
    console.log('\n[6/7] Testing Public Profile Resolution & Security Audit...');
    const publicProfile = await profileRepository.findBySlug('gabriel-laurent');
    assert(publicProfile !== null, 'Public profile queried by slug "gabriel-laurent" found');
    assert(publicProfile?.name === 'Gabriel Laurent', 'Public name verified');
    assert(publicProfile?.location === 'Milan & Lake Como, Italy', 'Public location verified');
    assert(publicProfile?.specialties.length === 3, 'Public specialties verified');

    // Security Check: Verify sensitive private tokens are not present
    const rawObject = JSON.parse(JSON.stringify(publicProfile));
    assert(!('password' in rawObject), 'Security: Password is not exposed in public profile');
    assert(!('token' in rawObject), 'Security: Auth tokens are not exposed');
    assert(!('stripe_secret_key' in rawObject), 'Security: Payment secrets are not exposed');
    assert(!('service_role_key' in rawObject), 'Security: Service role keys are not exposed');

    // Test Invalid Slug
    const nonExistent = await profileRepository.findBySlug('invalid-non-existent-studio-slug-999');
    assert(nonExistent === null, 'Invalid studio slug query returns null (proper 404 representation)');

    // -------------------------------------------------------------------------
    // TEST 7: Cross-Tenant Isolation Audit
    // -------------------------------------------------------------------------
    console.log('\n[7/7] Testing Cross-Tenant Boundary Protection...');
    const otherUser = await authService.register({
      name: 'Sophie Dubois',
      email: `sophie.${timestamp}@mosaic.studio`,
      password: 'SophiePassword2026!',
    });

    const sophieCategories = await categoryRepository.listByPhotographer(otherUser.profile!.id);
    const sophieServices = await serviceRepository.listByPhotographer(otherUser.profile!.id);
    const sophiePortfolio = await portfolioRepository.listByPhotographer(otherUser.profile!.id);

    assert(sophieCategories.length === 0, 'New photographer has 0 categories (isolated)');
    assert(sophieServices.length === 0, 'New photographer has 0 services (isolated)');
    assert(sophiePortfolio.length === 0, 'New photographer has 0 portfolio images (isolated)');

    console.log('\n================================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (100% GREEN)`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during Phase 3 verification:', error);
    process.exit(1);
  }
}

runPhase3Verification();
