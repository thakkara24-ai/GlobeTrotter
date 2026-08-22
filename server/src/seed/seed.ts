import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { City } from '../models/City';
import { Activity } from '../models/Activity';
import { Trip } from '../models/Trip';
import { TripStop } from '../models/TripStop';
import { ItinerarySection } from '../models/ItinerarySection';
import { CommunityPost } from '../models/CommunityPost';
import { seedCities, seedActivities } from './seedData';
import { addDays, subDays } from 'date-fns';

export const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log('[Seed] Connecting to database...');
      await connectDB();
    }

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      City.deleteMany({}),
      Activity.deleteMany({}),
      Trip.deleteMany({}),
      TripStop.deleteMany({}),
      ItinerarySection.deleteMany({}),
      CommunityPost.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('password123', salt);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);

    const demoUser = await User.create({
      name: 'Aarav Sharma',
      email: 'demo@globetrotter.com',
      passwordHash: demoPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      languagePreference: 'en',
      role: 'USER',
    });

    const adminUser = await User.create({
      name: 'GlobeTrotter Admin',
      email: 'admin@globetrotter.com',
      passwordHash: adminPasswordHash,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      languagePreference: 'en',
      role: 'ADMIN',
    });

    const userPriya = await User.create({
      name: 'Priya Patel',
      email: 'priya@example.com',
      passwordHash: demoPasswordHash,
      languagePreference: 'en',
      role: 'USER',
    });

    const userRohan = await User.create({
      name: 'Rohan Verma',
      email: 'rohan@example.com',
      passwordHash: demoPasswordHash,
      languagePreference: 'en',
      role: 'USER',
    });

    const userAnanya = await User.create({
      name: 'Ananya Iyer',
      email: 'ananya@example.com',
      passwordHash: demoPasswordHash,
      languagePreference: 'en',
      role: 'USER',
    });

    const userVikram = await User.create({
      name: 'Vikram Malhotra',
      email: 'vikram@example.com',
      passwordHash: demoPasswordHash,
      languagePreference: 'en',
      role: 'USER',
    });

    console.log('[Seed] Inserting cities...');
    const createdCities = await City.insertMany(seedCities);
    const cityMap = new Map<string, any>();
    createdCities.forEach((c) => cityMap.set(c.name, c));

    console.log('[Seed] Inserting activities...');
    const activitiesToInsert = seedActivities
      .filter((act) => cityMap.has(act.cityName))
      .map((act) => {
        const city = cityMap.get(act.cityName);
        return {
          name: act.name,
          cityId: city._id,
          category: act.category,
          description: act.description,
          cost: act.cost,
          duration: act.duration,
          image: act.image,
          popularity: act.popularity,
        };
      });
    const createdActivities = await Activity.insertMany(activitiesToInsert);

    console.log('[Seed] Creating varied sample trips across different statuses...');
    const today = new Date();
    const startDate1 = addDays(today, 7);
    const endDate1 = addDays(startDate1, 5);

    // Trip 1: Royal Rajasthan (CONFIRMED)
    const trip1 = await Trip.create({
      userId: demoUser._id,
      title: 'Royal Rajasthan Heritage & Lakes Expedition',
      description: 'A bespoke 6-day journey across the palaces of Udaipur and the grand hilltop forts of Jaipur.',
      startDate: startDate1,
      endDate: endDate1,
      budget: 35000,
      coverImage: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareToken: 'rajasthan-heritage-2026-demo',
      status: 'CONFIRMED',
    });

    // Trip 2: Goa Beach & Water Sports (PLANNING)
    const trip2 = await Trip.create({
      userId: userPriya._id,
      title: 'Goa Coastal Escapade & Scuba Expedition',
      description: 'Relaxing beach vacation with dolphin cruises, scuba diving at Grand Island, and heritage Latin quarter walks.',
      startDate: addDays(today, 14),
      endDate: addDays(today, 19),
      budget: 28000,
      coverImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareToken: 'goa-coastal-adventure-2026',
      status: 'PLANNING',
    });

    // Trip 3: Himalayan Odyssey (COMPLETED)
    const trip3 = await Trip.create({
      userId: userRohan._id,
      title: 'High Passes of Manali & Leh Ladakh',
      description: 'Completed road trip across Solang Valley, Rohtang Pass, and high-altitude Pangong Tso.',
      startDate: subDays(today, 30),
      endDate: subDays(today, 22),
      budget: 48000,
      coverImage: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareToken: 'ladakh-manali-odyssey-completed',
      status: 'COMPLETED',
    });

    // Trip 4: Kerala Backwaters (PLANNING)
    const trip4 = await Trip.create({
      userId: userAnanya._id,
      title: 'Kerala Emerald Backwaters & Tea Trails',
      description: 'Misty tea plantations in Munnar and luxury houseboat cruise in Alleppey.',
      startDate: addDays(today, 25),
      endDate: addDays(today, 30),
      budget: 32000,
      coverImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareToken: 'kerala-tea-backwaters-2026',
      status: 'PLANNING',
    });

    // Trip 5: Spiritual Varanasi & Agra (CONFIRMED)
    const trip5 = await Trip.create({
      userId: userVikram._id,
      title: 'Spiritual Varanasi Ghats & Taj Mahal Heritage',
      description: 'Witnessing the Ganga Aarti at Dashashwamedh and sunrise at the iconic Taj Mahal.',
      startDate: addDays(today, 10),
      endDate: addDays(today, 15),
      budget: 25000,
      coverImage: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
      isPublic: true,
      shareToken: 'varanasi-taj-heritage-2026',
      status: 'CONFIRMED',
    });

    // Trip 6: Monsoon Weekend in Maharashtra (CANCELLED)
    const trip6 = await Trip.create({
      userId: demoUser._id,
      title: 'Monsoon Forts Trail in Pune & Lonavala',
      description: 'Postponed trek to Sinhagad Fort due to heavy seasonal rains.',
      startDate: subDays(today, 10),
      endDate: subDays(today, 8),
      budget: 12000,
      coverImage: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=1200&q=80',
      isPublic: false,
      status: 'CANCELLED',
    });

    // Add Stops & Sections for Trip 1 (Rajasthan)
    const udaipurCity = cityMap.get('Udaipur');
    const jaipurCity = cityMap.get('Jaipur');
    const goaCity = cityMap.get('Goa');
    const manaliCity = cityMap.get('Manali');
    const ladakhCity = cityMap.get('Leh Ladakh');

    const stop1 = await TripStop.create({
      tripId: trip1._id,
      cityId: udaipurCity._id,
      startDate: startDate1,
      endDate: addDays(startDate1, 2),
      order: 0,
    });

    const stop2 = await TripStop.create({
      tripId: trip1._id,
      cityId: jaipurCity._id,
      startDate: addDays(startDate1, 3),
      endDate: endDate1,
      order: 1,
    });

    // Add Stops for Trip 2 (Goa)
    await TripStop.create({
      tripId: trip2._id,
      cityId: goaCity._id,
      startDate: addDays(today, 14),
      endDate: addDays(today, 19),
      order: 0,
    });

    // Add Stops for Trip 3 (Manali & Ladakh)
    await TripStop.create({
      tripId: trip3._id,
      cityId: manaliCity._id,
      startDate: subDays(today, 30),
      endDate: subDays(today, 26),
      order: 0,
    });
    await TripStop.create({
      tripId: trip3._id,
      cityId: ladakhCity._id,
      startDate: subDays(today, 25),
      endDate: subDays(today, 22),
      order: 1,
    });

    console.log('[Seed] Creating itinerary sections and activities for sample trip...');
    const udaipurBoat = createdActivities.find((a) => a.name.includes('Lake Pichola'));
    const udaipurPalace = createdActivities.find((a) => a.name.includes('City Palace'));
    const jaipurAmber = createdActivities.find((a) => a.name.includes('Amer Fort'));

    // Day 1
    await ItinerarySection.create({
      tripId: trip1._id,
      stopId: stop1._id,
      type: 'Travel',
      title: 'Flight: Mumbai / Delhi to Udaipur (UDR)',
      description: 'Morning flight arrival & transfer to lakeside haveli hotel.',
      date: startDate1,
      startTime: '08:30',
      endTime: '11:00',
      estimatedCost: 4200,
      order: 0,
    });

    await ItinerarySection.create({
      tripId: trip1._id,
      stopId: stop1._id,
      type: 'Hotel',
      title: 'Lakeview Boutique Haveli Check-in',
      description: '3 nights stay with rooftop view of Lake Pichola.',
      date: startDate1,
      startTime: '12:00',
      endTime: '13:00',
      estimatedCost: 6500,
      order: 1,
    });

    if (udaipurBoat) {
      await ItinerarySection.create({
        tripId: trip1._id,
        stopId: stop1._id,
        type: 'Activity',
        title: udaipurBoat.name,
        description: udaipurBoat.description,
        date: startDate1,
        startTime: '16:30',
        endTime: '18:00',
        estimatedCost: udaipurBoat.cost,
        activityId: udaipurBoat._id,
        order: 2,
      });
    }

    // Day 2
    if (udaipurPalace) {
      await ItinerarySection.create({
        tripId: trip1._id,
        stopId: stop1._id,
        type: 'Activity',
        title: udaipurPalace.name,
        description: udaipurPalace.description,
        date: addDays(startDate1, 1),
        startTime: '10:00',
        endTime: '13:00',
        estimatedCost: udaipurPalace.cost,
        activityId: udaipurPalace._id,
        order: 0,
      });
    }

    await ItinerarySection.create({
      tripId: trip1._id,
      stopId: stop1._id,
      type: 'Meals',
      title: 'Rooftop Dinner at Ambrai Restaurant',
      description: 'Fine dining overlooking the illuminated City Palace and Jag Mandir.',
      date: addDays(startDate1, 1),
      startTime: '19:30',
      endTime: '21:30',
      estimatedCost: 2200,
      order: 1,
    });

    // Day 4 (Jaipur)
    await ItinerarySection.create({
      tripId: trip1._id,
      stopId: stop2._id,
      type: 'Travel',
      title: 'Scenic Express Train to Jaipur',
      description: 'Vande Bharat / Intercity AC Chair Car through Aravali landscape.',
      date: addDays(startDate1, 3),
      startTime: '07:00',
      endTime: '12:30',
      estimatedCost: 1400,
      order: 0,
    });

    if (jaipurAmber) {
      await ItinerarySection.create({
        tripId: trip1._id,
        stopId: stop2._id,
        type: 'Activity',
        title: jaipurAmber.name,
        description: jaipurAmber.description,
        date: addDays(startDate1, 4),
        startTime: '09:00',
        endTime: '12:30',
        estimatedCost: jaipurAmber.cost,
        activityId: jaipurAmber._id,
        order: 0,
      });
    }

    console.log('[Seed] Creating multiple authentic community stories...');
    await CommunityPost.create({
      userId: demoUser._id,
      tripId: trip1._id,
      title: 'Unforgettable Sunset on Lake Pichola!',
      content: 'Watching the twilight illuminate the Jag Mandir Palace while gently cruising on Lake Pichola was easily the highlight of my Rajasthan journey. Pro-tip: Book the 5 PM boat slot to catch golden hour and evening lights!',
      destination: 'Udaipur, Rajasthan',
      images: [
        'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80',
      ],
      likes: [adminUser._id, userPriya._id, userRohan._id],
      tags: ['Rajasthan', 'Sunset', 'Udaipur', 'Heritage'],
    });

    await CommunityPost.create({
      userId: userPriya._id,
      tripId: trip2._id,
      title: 'Secret Shacks and Scuba Diving in South Goa',
      content: 'Skip the overcrowded commercial beaches! South Goa beaches like Palolem, Butterfly, and Agonda offer pure serenity, crystal-clear water for snorkeling, and fresh coastal seafood.',
      destination: 'Goa',
      images: [
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
      ],
      likes: [demoUser._id, userAnanya._id],
      tags: ['Goa', 'Beach', 'WaterSports', 'Coastal'],
    });

    await CommunityPost.create({
      userId: userRohan._id,
      tripId: trip3._id,
      title: 'Epic Road Trip to Pangong Tso & Khardung La',
      content: 'Crossing the world\'s highest motorable pass to witness the azure waters of Pangong Tso changing colors under the Himalayan sun was a lifetime experience. Ensure at least 2 days in Leh for acclimatization!',
      destination: 'Leh Ladakh',
      images: [
        'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80',
      ],
      likes: [demoUser._id, adminUser._id, userVikram._id, userAnanya._id],
      tags: ['Ladakh', 'Mountains', 'RoadTrip', 'Himalayas'],
    });

    await CommunityPost.create({
      userId: userAnanya._id,
      tripId: trip4._id,
      title: 'Misty Sunrise at Kolukkumalai Tea Estate Munnar',
      content: 'The 4x4 jeep drive to the world\'s highest organic tea estate was bumpy but the sunrise above the cloud carpet was straight out of a painting. Don\'t forget to try fresh cardamon tea at the factory!',
      destination: 'Munnar & Kochi, Kerala',
      images: [
        'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
      ],
      likes: [userPriya._id, userRohan._id],
      tags: ['Kerala', 'Munnar', 'TeaGardens', 'Nature'],
    });

    console.log('\n=========================================');
    console.log('✅ SEEDING COMPLETE!');
    console.log('=========================================');
    console.log(`Demo User:  demo@globetrotter.com / password123`);
    console.log(`Admin User: admin@globetrotter.com / admin123`);
    console.log(`Total Users: 6 | Total Trips: 6 | Cities: 35 | Activities: ${createdActivities.length}`);
    console.log('=========================================\n');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
};
