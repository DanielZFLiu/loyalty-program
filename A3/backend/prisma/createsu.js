"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    console.error("usage: node prisma/createsu.js utorid email password");
    process.exit(1);
  }

  const [utorid, email, password] = args;

  try {
    const superuser = await prisma.user.create({
      data: {
        utorid,
        email,
        password, 
        name: utorid, 
        role: "SUPERUSER",
        verified: true, 
      },
    });
    console.log("superuser created:", superuser);
  } catch (error) {
    console.error("error creating superuser:", error);
    process.exit(1);
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
