const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Coupon = require('./models/couponModel');
const dbConnection = require('./config/database');

dotenv.config({
  path: 'config.env',
});
// Connect to MongoDB
dbConnection();
// Sample coupons data
const sampleCoupons = [
  {
    name: 'WELCOME10',
    discount: 10,
    expire: new Date('2025-12-31T23:59:59.000Z'),
  },
  {
    name: 'SUMMER20',
    discount: 20,
    expire: new Date('2025-12-31T23:59:59.000Z'),
  },
  {
    name: 'SAVE15',
    discount: 15,
    expire: new Date('2025-12-31T23:59:59.000Z'),
  },
  {
    name: 'NEWUSER25',
    discount: 25,
    expire: new Date('2025-12-31T23:59:59.000Z'),
  },
  {
    name: 'GUEST5',
    discount: 5,
    expire: new Date('2025-12-31T23:59:59.000Z'),
  },
];

// Seed function
const seedCoupons = async () => {
  try {
    // Clear existing coupons
    await Coupon.deleteMany();
    console.log('Existing coupons cleared');

    // Insert sample coupons
    await Coupon.insertMany(sampleCoupons);
    console.log('Sample coupons created successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding coupons:', error);
    process.exit(1);
  }
};

seedCoupons();
