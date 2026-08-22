import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/database';
import City from '../models/City';
import Activity from '../models/Activity';
import Trip from '../models/Trip';
import TripStop from '../models/TripStop';
import ItinerarySection, { ItinerarySectionType } from '../models/ItinerarySection';
import User from '../models/User';
import { hashPassword } from '../utils/password';

const cities = [
  {
    name: 'Delhi',
    country: 'India',
    countryCode: 'IN',
    description: 'Capital of India, a vibrant blend of ancient heritage and modern culture with iconic landmarks like the Red Fort and India Gate.',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
    tags: ['heritage', 'culture', 'food', 'history'],
  },
  {
    name: 'Jaipur',
    country: 'India',
    countryCode: 'IN',
    description: 'The Pink City of Rajasthan, famous for its stunning palaces, forts, and vibrant bazaars.',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245',
    latitude: 26.9124,
    longitude: 75.7873,
    timezone: 'Asia/Kolkata',
    tags: ['heritage', 'culture', 'shopping', 'architecture'],
  },
  {
    name: 'Paris',
    country: 'France',
    countryCode: 'FR',
    description: 'The City of Light, renowned for the Eiffel Tower, world-class art museums, and exquisite cuisine.',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: 'Europe/Paris',
    tags: ['romance', 'art', 'food', 'culture'],
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    description: 'A dazzling metropolis blending ultramodern technology with traditional temples and cherry blossoms.',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
    tags: ['technology', 'food', 'culture', 'anime'],
  },
  {
    name: 'New York',
    country: 'United States',
    countryCode: 'US',
    description: 'The Big Apple — home to Times Square, Central Park, the Statue of Liberty, and world-class dining.',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: 'America/New_York',
    tags: ['culture', 'food', 'entertainment', 'shopping'],
  },
  {
    name: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    description: 'A historic city with iconic landmarks like Big Ben, the Tower of London, and Buckingham Palace.',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
    tags: ['history', 'culture', 'theatre', 'shopping'],
  },
  {
    name: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    description: 'A futuristic desert city with the Burj Khalifa, luxury shopping malls, and stunning beaches.',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
    latitude: 25.2048,
    longitude: 55.2708,
    timezone: 'Asia/Dubai',
    tags: ['luxury', 'shopping', 'adventure', 'architecture'],
  },
  {
    name: 'Sydney',
    country: 'Australia',
    countryCode: 'AU',
    description: 'A harbour city known for the Opera House, Bondi Beach, and the stunning Blue Mountains.',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9',
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 'Australia/Sydney',
    tags: ['nature', 'beaches', 'culture', 'adventure'],
  },
  {
    name: 'Rome',
    country: 'Italy',
    countryCode: 'IT',
    description: 'The Eternal City filled with ancient ruins, Renaissance art, and world-famous Italian cuisine.',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
    latitude: 41.9028,
    longitude: 12.4964,
    timezone: 'Europe/Rome',
    tags: ['history', 'art', 'food', 'architecture'],
  },
  {
    name: 'Bangkok',
    country: 'Thailand',
    countryCode: 'TH',
    description: 'A vibrant city known for ornate temples, bustling street markets, and incredible street food.',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365',
    latitude: 13.7563,
    longitude: 100.5018,
    timezone: 'Asia/Bangkok',
    tags: ['food', 'culture', 'temples', 'shopping'],
  },
  {
    name: 'Cape Town',
    country: 'South Africa',
    countryCode: 'ZA',
    description: 'A coastal gem beneath Table Mountain, with stunning beaches, vineyards, and diverse wildlife.',
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99',
    latitude: -33.9249,
    longitude: 18.4241,
    timezone: 'Africa/Johannesburg',
    tags: ['nature', 'adventure', 'beaches', 'wine'],
  },
  {
    name: 'Istanbul',
    country: 'Turkey',
    countryCode: 'TR',
    description: 'A transcontinental city bridging Europe and Asia, rich with Byzantine and Ottoman heritage.',
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200',
    latitude: 41.0082,
    longitude: 28.9784,
    timezone: 'Europe/Istanbul',
    tags: ['history', 'culture', 'food', 'architecture'],
  },
];

const activitiesByCity: Record<string, Array<{
  name: string;
  description: string;
  category: string;
  estimatedCost: number;
  currency: string;
  durationMinutes: number;
  tags: string[];
}>> = {
  Delhi: [
    {
      name: 'Red Fort Tour',
      description: 'Explore the magnificent Mughal-era Red Fort, a UNESCO World Heritage Site.',
      category: 'sightseeing',
      estimatedCost: 10,
      currency: 'USD',
      durationMinutes: 120,
      tags: ['heritage', 'history', 'photography'],
    },
    {
      name: 'Street Food Walk in Chandni Chowk',
      description: 'Taste legendary Delhi street food — paranthas, chaat, jalebi and more.',
      category: 'food',
      estimatedCost: 15,
      currency: 'USD',
      durationMinutes: 180,
      tags: ['food', 'walking', 'local'],
    },
  ],
  Jaipur: [
    {
      name: 'Amber Fort Visit',
      description: 'Tour the stunning hilltop Amber Fort with its blend of Hindu and Mughal architecture.',
      category: 'sightseeing',
      estimatedCost: 12,
      currency: 'USD',
      durationMinutes: 180,
      tags: ['fort', 'history', 'architecture'],
    },
    {
      name: 'Bazaar Shopping Tour',
      description: 'Shop for textiles, jewelry, and handicrafts in Jaipur\'s colourful bazaars.',
      category: 'shopping',
      estimatedCost: 50,
      currency: 'USD',
      durationMinutes: 150,
      tags: ['shopping', 'handicrafts', 'local'],
    },
  ],
  Paris: [
    {
      name: 'Eiffel Tower Visit',
      description: 'Ascend the iconic Eiffel Tower for panoramic views of Paris.',
      category: 'sightseeing',
      estimatedCost: 30,
      currency: 'EUR',
      durationMinutes: 120,
      tags: ['landmark', 'views', 'photography'],
    },
    {
      name: 'Louvre Museum Tour',
      description: 'Discover masterpieces including the Mona Lisa at the world\'s largest art museum.',
      category: 'culture',
      estimatedCost: 20,
      currency: 'EUR',
      durationMinutes: 240,
      tags: ['art', 'museum', 'history'],
    },
  ],
  Tokyo: [
    {
      name: 'Tsukiji Outer Market Food Tour',
      description: 'Sample the freshest sushi and Japanese street food at the famous market.',
      category: 'food',
      estimatedCost: 40,
      currency: 'USD',
      durationMinutes: 150,
      tags: ['food', 'sushi', 'local'],
    },
    {
      name: 'Shibuya Crossing & Harajuku Walk',
      description: 'Experience the world\'s busiest crossing and Harajuku\'s vibrant fashion scene.',
      category: 'entertainment',
      estimatedCost: 10,
      currency: 'USD',
      durationMinutes: 120,
      tags: ['culture', 'fashion', 'photography'],
    },
  ],
  'New York': [
    {
      name: 'Central Park Walking Tour',
      description: 'Stroll through the iconic 843-acre park in the heart of Manhattan.',
      category: 'nature',
      estimatedCost: 0,
      currency: 'USD',
      durationMinutes: 120,
      tags: ['park', 'nature', 'walking'],
    },
    {
      name: 'Broadway Show',
      description: 'Catch a world-class Broadway musical in the Theatre District.',
      category: 'entertainment',
      estimatedCost: 120,
      currency: 'USD',
      durationMinutes: 180,
      tags: ['theatre', 'entertainment', 'music'],
    },
  ],
  London: [
    {
      name: 'Tower of London Tour',
      description: 'Discover 1000 years of history, the Crown Jewels, and the famous ravens.',
      category: 'culture',
      estimatedCost: 35,
      currency: 'GBP',
      durationMinutes: 180,
      tags: ['history', 'castle', 'crown jewels'],
    },
    {
      name: 'West End Theatre Show',
      description: 'Enjoy a legendary theatre production in London\'s West End.',
      category: 'entertainment',
      estimatedCost: 80,
      currency: 'GBP',
      durationMinutes: 180,
      tags: ['theatre', 'entertainment'],
    },
  ],
  Dubai: [
    {
      name: 'Burj Khalifa Observation Deck',
      description: 'Visit the observation deck of the world\'s tallest building for breathtaking views.',
      category: 'sightseeing',
      estimatedCost: 45,
      currency: 'USD',
      durationMinutes: 90,
      tags: ['landmark', 'views', 'architecture'],
    },
    {
      name: 'Desert Safari with BBQ',
      description: 'Dune bashing, camel rides, and a traditional BBQ dinner under the stars.',
      category: 'adventure',
      estimatedCost: 70,
      currency: 'USD',
      durationMinutes: 360,
      tags: ['adventure', 'desert', 'food'],
    },
  ],
  Sydney: [
    {
      name: 'Sydney Opera House Tour',
      description: 'Go behind the scenes of one of the most famous buildings in the world.',
      category: 'culture',
      estimatedCost: 30,
      currency: 'AUD',
      durationMinutes: 90,
      tags: ['architecture', 'music', 'landmark'],
    },
    {
      name: 'Bondi to Coogee Coastal Walk',
      description: 'A stunning 6km coastal walk along Sydney\'s most beautiful beaches.',
      category: 'nature',
      estimatedCost: 0,
      currency: 'AUD',
      durationMinutes: 150,
      tags: ['walking', 'beaches', 'nature'],
    },
  ],
  Rome: [
    {
      name: 'Colosseum & Roman Forum Tour',
      description: 'Walk through ancient Rome\'s greatest amphitheatre and the political heart of the Empire.',
      category: 'sightseeing',
      estimatedCost: 25,
      currency: 'EUR',
      durationMinutes: 210,
      tags: ['history', 'archaeology', 'landmark'],
    },
    {
      name: 'Trastevere Food Tour',
      description: 'Taste authentic Roman cuisine — pasta, supplì, and gelato in the charming Trastevere district.',
      category: 'food',
      estimatedCost: 55,
      currency: 'EUR',
      durationMinutes: 180,
      tags: ['food', 'walking', 'local'],
    },
  ],
  Bangkok: [
    {
      name: 'Grand Palace & Wat Phra Kaew',
      description: 'Visit the dazzling Grand Palace and the Temple of the Emerald Buddha.',
      category: 'culture',
      estimatedCost: 15,
      currency: 'USD',
      durationMinutes: 180,
      tags: ['temple', 'history', 'architecture'],
    },
    {
      name: 'Chatuchak Weekend Market',
      description: 'Browse over 15,000 stalls at one of the world\'s largest open-air markets.',
      category: 'shopping',
      estimatedCost: 30,
      currency: 'USD',
      durationMinutes: 240,
      tags: ['shopping', 'food', 'local'],
    },
  ],
};

async function seed() {
  try {
    await connectDB();
    console.log('Starting seed...');

    // Seed cities (upsert by name + country to avoid duplicates)
    const cityDocs: Record<string, mongoose.Types.ObjectId> = {};

    for (const cityData of cities) {
      const city = await City.findOneAndUpdate(
        { name: cityData.name, country: cityData.country },
        { $set: cityData },
        { upsert: true, new: true }
      );
      cityDocs[cityData.name] = city._id as mongoose.Types.ObjectId;
      console.log(`  City: ${cityData.name} (${city._id})`);
    }

    // Seed activities (upsert by name + city to avoid duplicates)
    const activityDocs: Record<string, mongoose.Types.ObjectId> = {};
    let activityCount = 0;
    for (const [cityName, activities] of Object.entries(activitiesByCity)) {
      const cityId = cityDocs[cityName];
      if (!cityId) {
        console.warn(`  Skipping activities for unknown city: ${cityName}`);
        continue;
      }

      for (const actData of activities) {
        const act = await Activity.findOneAndUpdate(
          { name: actData.name, city: cityId },
          { $set: { ...actData, city: cityId } },
          { upsert: true, new: true }
        );
        activityDocs[actData.name] = act._id as mongoose.Types.ObjectId;
        activityCount++;
      }
    }

    console.log(`Seed complete: ${cities.length} cities, ${activityCount} activities`);

    // Create a demo user for sample itinerary data
    const demoPasswordHash = await hashPassword('DemoUser123!');
    const demoUser = await User.findOneAndUpdate(
      { email: 'demo@globetrotter.local' },
      {
        $set: {
          name: 'Demo Traveler',
          email: 'demo@globetrotter.local',
          passwordHash: demoPasswordHash,
        },
      },
      { upsert: true, new: true }
    );

    // Create a sample trip with multiple stops and sections
    const delhiId = cityDocs['Delhi'];
    const jaipurId = cityDocs['Jaipur'];

    if (delhiId && jaipurId) {
      const sampleTrip = await Trip.findOneAndUpdate(
        { user: demoUser._id, title: 'Golden Triangle Explorer' },
        {
          $set: {
            user: demoUser._id,
            title: 'Golden Triangle Explorer',
            description: 'Exploration of historical wonders across Delhi and Jaipur.',
            startDate: new Date('2026-10-01'),
            endDate: new Date('2026-10-08'),
            cities: [delhiId, jaipurId],
            status: 'PLANNING',
          },
        },
        { upsert: true, new: true }
      );

      // Stop 1: Delhi
      const stop1 = await TripStop.findOneAndUpdate(
        { tripId: sampleTrip._id, cityId: delhiId },
        {
          $set: {
            tripId: sampleTrip._id,
            cityId: delhiId,
            startDate: new Date('2026-10-01'),
            endDate: new Date('2026-10-04'),
            order: 1,
          },
        },
        { upsert: true, new: true }
      );

      // Stop 2: Jaipur
      const stop2 = await TripStop.findOneAndUpdate(
        { tripId: sampleTrip._id, cityId: jaipurId },
        {
          $set: {
            tripId: sampleTrip._id,
            cityId: jaipurId,
            startDate: new Date('2026-10-04'),
            endDate: new Date('2026-10-08'),
            order: 2,
          },
        },
        { upsert: true, new: true }
      );

      // Section 1 on Stop 1: Red Fort
      const redFortId = activityDocs['Red Fort Tour'];
      await ItinerarySection.findOneAndUpdate(
        { stopId: stop1._id, title: 'Explore Red Fort' },
        {
          $set: {
            tripId: sampleTrip._id,
            stopId: stop1._id,
            type: ItinerarySectionType.ACTIVITY,
            title: 'Explore Red Fort',
            description: 'Morning historical walking tour',
            date: new Date('2026-10-02'),
            startTime: '09:30',
            endTime: '12:00',
            estimatedCost: 10,
            activityId: redFortId,
            order: 1,
          },
        },
        { upsert: true, new: true }
      );

      // Section 2 on Stop 1: Street Food
      const streetFoodId = activityDocs['Street Food Walk in Chandni Chowk'];
      await ItinerarySection.findOneAndUpdate(
        { stopId: stop1._id, title: 'Chandni Chowk Dinner' },
        {
          $set: {
            tripId: sampleTrip._id,
            stopId: stop1._id,
            type: ItinerarySectionType.MEAL,
            title: 'Chandni Chowk Dinner',
            description: 'Authentic local street food experience',
            date: new Date('2026-10-02'),
            startTime: '18:00',
            endTime: '20:30',
            estimatedCost: 15,
            activityId: streetFoodId,
            order: 2,
          },
        },
        { upsert: true, new: true }
      );

      // Section 1 on Stop 2: Amber Fort
      const amberFortId = activityDocs['Amber Fort Visit'];
      await ItinerarySection.findOneAndUpdate(
        { stopId: stop2._id, title: 'Amber Fort Morning Visit' },
        {
          $set: {
            tripId: sampleTrip._id,
            stopId: stop2._id,
            type: ItinerarySectionType.ACTIVITY,
            title: 'Amber Fort Morning Visit',
            description: 'Panoramic views and Rajput architecture',
            date: new Date('2026-10-05'),
            startTime: '09:00',
            endTime: '12:30',
            estimatedCost: 12,
            activityId: amberFortId,
            order: 1,
          },
        },
        { upsert: true, new: true }
      );

      console.log(`Sample itinerary seeded for trip "${sampleTrip.title}" with 2 stops and 3 sections`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
