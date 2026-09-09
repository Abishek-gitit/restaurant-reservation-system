const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Branch = require('../models/Branch');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');

const seedData = async (disconnectAfter = false) => {
  try {
    console.log('[Seed] Initializing database seeding...');
    await connectDB();

    // Ensure model indexes are synchronized with MongoDB
    console.log('[Seed] Synchronizing schema indexes...');
    await User.syncIndexes();
    await Branch.syncIndexes();
    await MenuItem.syncIndexes();
    await Table.syncIndexes();
    await Reservation.syncIndexes();
    await Order.syncIndexes();
    await Feedback.syncIndexes();

    // Clear existing records
    console.log('[Seed] Cleaning old records...');
    await User.deleteMany({});
    await Branch.deleteMany({});
    await MenuItem.deleteMany({});
    await Table.deleteMany({});
    await Reservation.deleteMany({});
    await Order.deleteMany({});
    await Feedback.deleteMany({});

    // 1. Seed Users (4 roles for both @restaurant.com and @example.com)
    console.log('[Seed] Creating demo users...');
    const defaultPassword = 'Password@123';
    const passwordHash = await User.hashPassword(defaultPassword);
    const exampleCustomerHash = await User.hashPassword('Customer@123');
    const exampleKitchenHash = await User.hashPassword('Kitchen@123');
    const exampleManagerHash = await User.hashPassword('Manager@123');
    const exampleAdminHash = await User.hashPassword('Admin@123');

    const users = await User.create([
      {
        name: 'System Admin',
        email: 'admin@restaurant.com',
        passwordHash,
        role: 'admin'
      },
      {
        name: 'Floor Manager',
        email: 'manager@restaurant.com',
        passwordHash,
        role: 'manager'
      },
      {
        name: 'Chef Kitchen',
        email: 'kitchen@restaurant.com',
        passwordHash,
        role: 'kitchen'
      },
      {
        name: 'Customer Abishek',
        email: 'customer@restaurant.com',
        passwordHash,
        role: 'customer'
      },
      {
        name: 'Demo Admin',
        email: 'admin@example.com',
        passwordHash: exampleAdminHash,
        role: 'admin'
      },
      {
        name: 'Demo Manager',
        email: 'manager@example.com',
        passwordHash: exampleManagerHash,
        role: 'manager'
      },
      {
        name: 'Demo Kitchen Staff',
        email: 'kitchen@example.com',
        passwordHash: exampleKitchenHash,
        role: 'kitchen'
      },
      {
        name: 'Demo Customer',
        email: 'customer@example.com',
        passwordHash: exampleCustomerHash,
        role: 'customer'
      }
    ]);
    console.log(`[Seed] Created ${users.length} users across roles.`);

    // 2. Seed Branches (2 branches)
    console.log('[Seed] Creating branches...');
    const branches = await Branch.create([
      {
        name: 'Christ Central Campus Branch',
        address: 'Hosur Road, Bhavani Nagar, S.G. Palya, Bengaluru, Karnataka 560029',
        seatingCapacity: 120,
        isActive: true
      },
      {
        name: 'Christ Kengeri Campus Branch',
        address: 'Kanmanike, Kumbalgodu, Mysore Road, Bengaluru, Karnataka 560074',
        seatingCapacity: 90,
        isActive: true
      }
    ]);
    console.log(`[Seed] Created ${branches.length} branches.`);

    const [centralBranch, kengeriBranch] = branches;

    // Assign Central Branch to Manager
    await User.updateOne(
      { email: 'manager@restaurant.com' },
      { managedBranchIds: [centralBranch._id] }
    );
    console.log('[Seed] Assigned Central Branch to Floor Manager.');

    // 3. Seed Menu Items (12 items distributed across both branches)
    console.log('[Seed] Creating menu items across branches...');
    const menuItems = await MenuItem.create([
      // Central Branch Menu
      {
        branchId: centralBranch._id,
        name: 'Paneer Tikka',
        category: 'Starters',
        price: 240,
        isAvailable: true
      },
      {
        branchId: centralBranch._id,
        name: 'Crispy Chili Baby Corn',
        category: 'Starters',
        price: 190,
        isAvailable: true
      },
      {
        branchId: centralBranch._id,
        name: 'Murgh Malai Tikka',
        category: 'Starters',
        price: 290,
        isAvailable: true
      },
      {
        branchId: centralBranch._id,
        name: 'Paneer Butter Masala',
        category: 'Main Course',
        price: 310,
        isAvailable: true
      },
      {
        branchId: centralBranch._id,
        name: 'Butter Chicken Special',
        category: 'Main Course',
        price: 360,
        isAvailable: true
      },
      {
        branchId: centralBranch._id,
        name: 'Hyderabadi Dum Biryani',
        category: 'Main Course',
        price: 320,
        isAvailable: true
      },
      {
        branchId: centralBranch._id,
        name: 'Sizzling Brownie with Ice Cream',
        category: 'Desserts',
        price: 180,
        isAvailable: true
      },
      {
        branchId: centralBranch._id,
        name: 'Cold Coffee with Cream',
        category: 'Beverages',
        price: 130,
        isAvailable: true
      },

      // Kengeri Branch Menu
      {
        branchId: kengeriBranch._id,
        name: 'Veg Spring Rolls',
        category: 'Starters',
        price: 160,
        isAvailable: true
      },
      {
        branchId: kengeriBranch._id,
        name: 'Crispy Corn Pepper Salt',
        category: 'Starters',
        price: 180,
        isAvailable: true
      },
      {
        branchId: kengeriBranch._id,
        name: 'Dal Makhani Bukhara',
        category: 'Main Course',
        price: 250,
        isAvailable: true
      },
      {
        branchId: kengeriBranch._id,
        name: 'Kadhai Paneer Special',
        category: 'Main Course',
        price: 290,
        isAvailable: true
      },
      {
        branchId: kengeriBranch._id,
        name: 'Chicken Tikka Biryani',
        category: 'Main Course',
        price: 340,
        isAvailable: true
      },
      {
        branchId: kengeriBranch._id,
        name: 'Gulab Jamun with Rabri',
        category: 'Desserts',
        price: 140,
        isAvailable: true
      },
      {
        branchId: kengeriBranch._id,
        name: 'Royal Rasmalai (2 Pcs)',
        category: 'Desserts',
        price: 160,
        isAvailable: true
      },
      {
        branchId: kengeriBranch._id,
        name: 'Fresh Mint Lime Soda',
        category: 'Beverages',
        price: 90,
        isAvailable: true
      },
      {
        branchId: kengeriBranch._id,
        name: 'Masala Spiced Chai',
        category: 'Beverages',
        price: 60,
        isAvailable: true
      }
    ]);
    console.log(`[Seed] Created ${menuItems.length} menu items.`);

    // 4. Seed Tables (5 tables per branch)
    console.log('[Seed] Creating table inventory for both branches...');
    const tables = await Table.create([
      // Central Branch Tables
      { branchId: centralBranch._id, tableNumber: 1, capacity: 2 },
      { branchId: centralBranch._id, tableNumber: 2, capacity: 4 },
      { branchId: centralBranch._id, tableNumber: 3, capacity: 4 },
      { branchId: centralBranch._id, tableNumber: 4, capacity: 6 },
      { branchId: centralBranch._id, tableNumber: 5, capacity: 8 },

      // Kengeri Branch Tables (Notice identical table numbers valid because of branchId compound index)
      { branchId: kengeriBranch._id, tableNumber: 1, capacity: 2 },
      { branchId: kengeriBranch._id, tableNumber: 2, capacity: 4 },
      { branchId: kengeriBranch._id, tableNumber: 3, capacity: 4 },
      { branchId: kengeriBranch._id, tableNumber: 4, capacity: 6 },
      { branchId: kengeriBranch._id, tableNumber: 5, capacity: 8 }
    ]);
    // 5. Seed Reservations (Phase 2)
    console.log('[Seed] Creating demo reservations...');
    const customerUser = users.find((u) => u.role === 'customer');
    const centralTable1 = tables.find(
      (t) => t.branchId.toString() === centralBranch._id.toString() && t.tableNumber === 1
    );
    const kengeriTable2 = tables.find(
      (t) => t.branchId.toString() === kengeriBranch._id.toString() && t.tableNumber === 2
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(20, 0, 0, 0);

    const reservations = await Reservation.create([
      {
        customerId: customerUser._id,
        branchId: centralBranch._id,
        tableId: centralTable1._id,
        dateTime: tomorrow,
        duration: 90,
        endTime: new Date(tomorrow.getTime() + 90 * 60000),
        status: 'CONFIRMED',
        statusHistory: [
          {
            status: 'CONFIRMED',
            changedBy: customerUser._id,
            changedAt: new Date(),
            remarks: 'Initial demo reservation'
          }
        ]
      },
      {
        customerId: customerUser._id,
        branchId: kengeriBranch._id,
        tableId: kengeriTable2._id,
        dateTime: dayAfter,
        duration: 60,
        endTime: new Date(dayAfter.getTime() + 60 * 60000),
        status: 'CONFIRMED',
        statusHistory: [
          {
            status: 'CONFIRMED',
            changedBy: customerUser._id,
            changedAt: new Date(),
            remarks: 'Initial demo reservation'
          }
        ]
      }
    ]);
    console.log(`[Seed] Created ${reservations.length} demo reservations.`);

    // 6. Seed Orders (Phase 2, Phase 3 & Phase 4)
    console.log('[Seed] Creating demo food orders...');
    const paneerTikka = menuItems.find((m) => m.name === 'Paneer Tikka');
    const coldCoffee = menuItems.find((m) => m.name === 'Cold Coffee with Cream');
    const biryani = menuItems.find((m) => m.name === 'Hyderabadi Dum Biryani');
    const brownie = menuItems.find((m) => m.name === 'Sizzling Brownie with Ice Cream');
    const springRolls = menuItems.find((m) => m.name === 'Veg Spring Rolls');
    const dalMakhani = menuItems.find((m) => m.name === 'Dal Makhani Bukhara');

    const order1Subtotal = paneerTikka.price * 2 + coldCoffee.price * 2; // 740
    const order1Tax = Math.round(order1Subtotal * 0.05 * 100) / 100; // 37
    const order1Service = Math.round(order1Subtotal * 0.05 * 100) / 100; // 37
    const order1Total = Math.round((order1Subtotal + order1Tax + order1Service) * 100) / 100; // 814

    const order2Subtotal = springRolls.price + dalMakhani.price; // 410
    const order2Tax = Math.round(order2Subtotal * 0.05 * 100) / 100; // 20.5
    const order2Service = 0; // Takeaway = 0
    const order2Total = Math.round((order2Subtotal + order2Tax + order2Service) * 100) / 100; // 430.5

    // Completed order for Feedback demo
    const completedSubtotal = biryani.price * 2 + brownie.price; // 640 + 180 = 820
    const completedTax = Math.round(completedSubtotal * 0.05 * 100) / 100; // 41
    const completedService = Math.round(completedSubtotal * 0.05 * 100) / 100; // 41
    const completedTotal = Math.round((completedSubtotal + completedTax + completedService) * 100) / 100; // 902

    const orders = await Order.create([
      {
        customerId: customerUser._id,
        branchId: centralBranch._id,
        tableId: centralTable1._id,
        reservationId: reservations[0]._id,
        orderType: 'DINE_IN',
        status: 'PLACED',
        items: [
          {
            menuItemId: paneerTikka._id,
            name: paneerTikka.name,
            unitPrice: paneerTikka.price,
            quantity: 2,
            lineTotal: paneerTikka.price * 2
          },
          {
            menuItemId: coldCoffee._id,
            name: coldCoffee.name,
            unitPrice: coldCoffee.price,
            quantity: 2,
            lineTotal: coldCoffee.price * 2
          }
        ],
        subtotal: order1Subtotal,
        taxAmount: order1Tax,
        serviceCharge: order1Service,
        totalAmount: order1Total,
        statusHistory: [
          {
            status: 'PLACED',
            changedBy: customerUser._id,
            changedAt: new Date(),
            remarks: 'Demo order placed by customer'
          }
        ]
      },
      {
        customerId: customerUser._id,
        branchId: kengeriBranch._id,
        orderType: 'TAKEAWAY',
        status: 'PLACED',
        items: [
          {
            menuItemId: springRolls._id,
            name: springRolls.name,
            unitPrice: springRolls.price,
            quantity: 1,
            lineTotal: springRolls.price
          },
          {
            menuItemId: dalMakhani._id,
            name: dalMakhani.name,
            unitPrice: dalMakhani.price,
            quantity: 1,
            lineTotal: dalMakhani.price
          }
        ],
        subtotal: order2Subtotal,
        taxAmount: order2Tax,
        serviceCharge: order2Service,
        totalAmount: order2Total,
        statusHistory: [
          {
            status: 'PLACED',
            changedBy: customerUser._id,
            changedAt: new Date(),
            remarks: 'Demo order placed by customer'
          }
        ]
      },
      {
        customerId: customerUser._id,
        branchId: centralBranch._id,
        tableId: centralTable1._id,
        reservationId: reservations[0]._id,
        orderType: 'DINE_IN',
        status: 'SERVED',
        items: [
          {
            menuItemId: biryani._id,
            name: biryani.name,
            unitPrice: biryani.price,
            quantity: 2,
            lineTotal: biryani.price * 2
          },
          {
            menuItemId: brownie._id,
            name: brownie.name,
            unitPrice: brownie.price,
            quantity: 1,
            lineTotal: brownie.price
          }
        ],
        subtotal: completedSubtotal,
        taxAmount: completedTax,
        serviceCharge: completedService,
        totalAmount: completedTotal,
        statusHistory: [
          {
            status: 'PLACED',
            changedBy: customerUser._id,
            changedAt: new Date(Date.now() - 3600000),
            remarks: 'Demo completed order'
          },
          {
            status: 'PREPARING',
            changedBy: users.find((u) => u.role === 'kitchen')._id,
            changedAt: new Date(Date.now() - 2700000),
            remarks: 'In preparation'
          },
          {
            status: 'READY',
            changedBy: users.find((u) => u.role === 'kitchen')._id,
            changedAt: new Date(Date.now() - 1800000),
            remarks: 'Ready for service'
          },
          {
            status: 'SERVED',
            changedBy: users.find((u) => u.role === 'kitchen')._id,
            changedAt: new Date(Date.now() - 900000),
            remarks: 'Served to table'
          }
        ]
      }
    ]);
    console.log(`[Seed] Created ${orders.length} demo food orders.`);

    // 7. Seed Feedback (Phase 4)
    console.log('[Seed] Creating demo customer feedback...');
    const completedOrder = orders[2];
    const demoFeedback = await Feedback.create({
      orderId: completedOrder._id,
      customerId: customerUser._id,
      branchId: centralBranch._id,
      rating: 5,
      comment: 'Delicious Dum Biryani and hot Sizzling Brownie! Outstanding dining experience.'
    });
    console.log(`[Seed] Created demo feedback (ID: ${demoFeedback._id}) with rating ${demoFeedback.rating}/5.`);

    // Verify Indexes
    console.log('\n[Seed] Verifying registered MongoDB indexes:');
    const userIndexes = await User.collection.indexes();
    const branchIndexes = await Branch.collection.indexes();
    const menuIndexes = await MenuItem.collection.indexes();
    const tableIndexes = await Table.collection.indexes();
    const reservationIndexes = await Reservation.collection.indexes();
    const orderIndexes = await Order.collection.indexes();
    const feedbackIndexes = await Feedback.collection.indexes();

    console.log(' - User indexes:', userIndexes.map((i) => Object.keys(i.key).join('+')).join(', '));
    console.log(' - Branch indexes:', branchIndexes.map((i) => Object.keys(i.key).join('+')).join(', '));
    console.log(' - MenuItem indexes:', menuIndexes.map((i) => Object.keys(i.key).join('+')).join(', '));
    console.log(' - Table indexes:', tableIndexes.map((i) => Object.keys(i.key).join('+')).join(', '));
    console.log(' - Reservation indexes:', reservationIndexes.map((i) => Object.keys(i.key).join('+')).join(', '));
    console.log(' - Order indexes:', orderIndexes.map((i) => Object.keys(i.key).join('+')).join(', '));
    console.log(' - Feedback indexes:', feedbackIndexes.map((i) => Object.keys(i.key).join('+')).join(', '));


    console.log('\n==================================================');
    console.log('  Database Seeding Completed Successfully!       ');
    console.log('  Demo credentials:                              ');
    console.log('    admin@restaurant.com    / Password@123       ');
    console.log('    manager@restaurant.com  / Password@123       ');
    console.log('    kitchen@restaurant.com  / Password@123       ');
    console.log('    customer@restaurant.com / Password@123       ');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  } finally {
    if (disconnectAfter) {
      await disconnectDB();
    }
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = seedData;
