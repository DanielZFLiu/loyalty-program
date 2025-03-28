const { PrismaClient, UserRole, TransactionType, PromotionType } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create users
  const users = await Promise.all([
    // Superuser
    prisma.user.create({
      data: {
        utorid: 'SUPER123',
        name: 'Super Admin',
        email: 'super@mail.utoronto.ca',
        password: 'super123',
        role: UserRole.SUPERUSER,
        verified: true,
      },
    }),
    // Manager
    prisma.user.create({
      data: {
        utorid: 'MANAGER1',
        name: 'Store Manager',
        email: 'manager@mail.utoronto.ca',
        password: 'manager123',
        role: UserRole.MANAGER,
        verified: true,
      },
    }),
    // Cashier
    prisma.user.create({
      data: {
        utorid: 'CASHIER1',
        name: 'Store Cashier',
        email: 'cashier@mail.utoronto.ca',
        password: 'cashier123',
        role: UserRole.CASHIER,
        verified: true,
      },
    }),
    // Regular users
    ...Array.from({ length: 7 }, (_, i) => ({
      utorid: `USER${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@mail.utoronto.ca`,
      password: 'user123',
      role: UserRole.REGULAR,
      verified: true,
    })).map(user => prisma.user.create({ data: user })),
  ]);

  // Create promotions
  const promotions = await Promise.all([
    prisma.promotion.create({
      data: {
        name: 'Welcome Bonus',
        description: 'Get 100 points on your first purchase',
        type: PromotionType.ONE_TIME,
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        points: 100,
      },
    }),
    prisma.promotion.create({
      data: {
        name: 'Double Points Weekend',
        description: 'Earn double points on all purchases',
        type: PromotionType.AUTOMATIC,
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        rate: 2.0,
      },
    }),
  ]);

  // Create events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        name: 'Welcome Party',
        description: 'Join us for our grand opening celebration',
        location: 'Main Hall',
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours duration
        totalPoints: 500,
        capacity: 100,
        published: true,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Holiday Special',
        description: 'Special event for the holiday season',
        location: 'Event Center',
        startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours duration
        totalPoints: 1000,
        capacity: 200,
        published: true,
      },
    }),
  ]);

  // Create transactions
  const transactionTypes = [
    TransactionType.PURCHASE,
    TransactionType.ADJUSTMENT,
    TransactionType.REDEMPTION,
    TransactionType.TRANSFER,
    TransactionType.EVENT,
  ];

  // Create at least 2 transactions of each type
  for (const type of transactionTypes) {
    for (let i = 0; i < 2; i++) {
      const amount = Math.floor(Math.random() * 1000) + 100;
      const spent = type === TransactionType.PURCHASE ? amount / 10 : null;
      
      await prisma.transaction.create({
        data: {
          type,
          amount,
          spent,
          remark: `${type} transaction ${i + 1}`,
          userId: users[Math.floor(Math.random() * users.length)].id,
          createdById: users[0].id, // Superuser created all transactions
          processedById: type === TransactionType.REDEMPTION ? users[2].id : null, // Cashier processed redemptions
          suspicious: false,
        },
      });
    }
  }

  // Create more random transactions
  for (let i = 0; i < 20; i++) {
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    const amount = Math.floor(Math.random() * 1000) + 100;
    const spent = type === TransactionType.PURCHASE ? amount / 10 : null;
    
    await prisma.transaction.create({
      data: {
        type,
        amount,
        spent,
        remark: `Random ${type} transaction ${i + 1}`,
        userId: users[Math.floor(Math.random() * users.length)].id,
        createdById: users[0].id,
        processedById: type === TransactionType.REDEMPTION ? users[2].id : null,
        suspicious: Math.random() < 0.1, // 10% chance of being suspicious
      },
    });
  }

  // Assign promotions to users
  for (const user of users) {
    if (user.role === UserRole.REGULAR) {
      await prisma.userPromotion.create({
        data: {
          userId: user.id,
          promotionId: promotions[0].id,
          used: false,
        },
      });
    }
  }

  // Assign event organizers and guests
  for (const event of events) {
    // Add manager as organizer
    await prisma.eventOrganizer.create({
      data: {
        eventId: event.id,
        userId: users[1].id, // Manager
      },
    });

    // Add some regular users as guests
    for (let i = 3; i < 6; i++) { // First 3 regular users
      await prisma.eventGuest.create({
        data: {
          eventId: event.id,
          userId: users[i].id,
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 