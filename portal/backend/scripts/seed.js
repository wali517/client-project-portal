import mongoose from "mongoose";
import env from "../src/config/env.js";
import connectDB, { disconnectDB } from "../src/config/db.js";
import logger from "../src/utils/logger.js";
import {
  User,
  Request,
  Project,
  ProjectAssignment,
} from "../src/models/index.js";
import {
  generateRequestNumber,
  generateProjectNumber,
} from "../src/services/numbering.service.js";
import {
  ROLES,
  REQUEST_STATUS,
  PROJECT_STATUS,
  PRIORITY,
} from "../src/constants/index.js";

const fresh = process.argv.includes("--fresh");

const upsertUser = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) return existing;
  return User.create(data);
};

const run = async () => {
  await connectDB();
  if (fresh) {
    await mongoose.connection.dropDatabase();
    logger.warn("Database dropped");
  }

  const admin = await upsertUser({
    name: "Portal Admin",
    email: env.seed.adminEmail,
    password: env.seed.adminPassword,
    role: ROLES.ADMIN,
  });

  const staff = await upsertUser({
    name: "Sara Designer",
    email: "staff@portal.test",
    password: "Staff@12345",
    role: ROLES.STAFF,
    phone: "+92 300 0000001",
  });

  const client = await upsertUser({
    name: "Imran Khalid",
    email: "client@portal.test",
    password: "Client@12345",
    role: ROLES.CLIENT,
    company: "Khalid Textiles",
    phone: "+92 300 0000002",
  });

  logger.info("Seed complete");
  logger.info(`  admin  : ${admin.email} / ${env.seed.adminPassword}`);
  logger.info("  staff  : staff@portal.test / Staff@12345");
  logger.info("  client : client@portal.test / Client@12345");

  await disconnectDB();
  process.exit(0);
};

run().catch(async (error) => {
  logger.error(error);
  await disconnectDB();
  process.exit(1);
});
