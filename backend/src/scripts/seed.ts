import "dotenv/config";
import argon2 from "argon2";
import { connectDatabase, disconnectDatabase } from "../lib/db.js";
import { Department, Incident, IncidentCategory, User, Ward } from "../models/index.js";
import { logger } from "../utils/logger.js";

async function seed() {
  logger.info("Starting CityOS database seeding...");

  await connectDatabase();

  // Clear existing collections for a clean reproducible seed
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Ward.deleteMany({}),
    IncidentCategory.deleteMany({}),
    Incident.deleteMany({}),
  ]);

  logger.info("Cleared existing records.");

  // 1. Create Departments
  const deptPWD = await Department.create({
    name: "Public Works Department (Roads & Infrastructure)",
    code: "PWD",
    description: "Maintenance and repair of urban roads, pavements, and public structures",
    contactEmail: "pwd@cityos.local",
  });

  const deptSanitation = await Department.create({
    name: "Solid Waste Management & Sanitation",
    code: "SWM",
    description: "Garbage collection, waste management, and street sweeping",
    contactEmail: "sanitation@cityos.local",
  });

  const deptWater = await Department.create({
    name: "Water Supply & Sewerage Board",
    code: "WSSB",
    description: "Drinking water distribution, leakage control, and drainage management",
    contactEmail: "water@cityos.local",
  });

  const deptElectrical = await Department.create({
    name: "Streetlight & Electrical Infrastructure",
    code: "ELEC",
    description: "Streetlights, traffic signals, and electrical urban assets",
    contactEmail: "electrical@cityos.local",
  });

  logger.info("Created 4 departments.");

  // 2. Create Categories
  const catPothole = await IncidentCategory.create({
    name: "Pothole & Road Damage",
    slug: "pothole",
    description: "Dangerous potholes, cracked asphalt, or sunken manholes on roadways",
    defaultDepartment: deptPWD._id,
    defaultSeverity: "HIGH",
    slaHours: 24,
    icon: "hammer",
  });

  await IncidentCategory.create({
    name: "Garbage Accumulation & Illegal Dumping",
    slug: "garbage",
    description: "Overflowing bins, illegal roadside waste, or uncollected garbage",
    defaultDepartment: deptSanitation._id,
    defaultSeverity: "MEDIUM",
    slaHours: 12,
    icon: "trash-2",
  });

  await IncidentCategory.create({
    name: "Water Main Leakage & Open Drain",
    slug: "water-leak",
    description: "Burst pipeline, fresh water wastage, or overflowing drain water",
    defaultDepartment: deptWater._id,
    defaultSeverity: "HIGH",
    slaHours: 12,
    icon: "droplet",
  });

  const catStreetlight = await IncidentCategory.create({
    name: "Broken Streetlight & Dark Spot",
    slug: "streetlight",
    description: "Non-functional streetlight, exposed wiring, or safety risk",
    defaultDepartment: deptElectrical._id,
    defaultSeverity: "MEDIUM",
    slaHours: 48,
    icon: "lightbulb",
  });

  logger.info("Created 4 categories.");

  // 3. Create Wards with GeoJSON Polygon boundaries
  const ward1 = await Ward.create({
    name: "Central Business District Ward 1",
    wardNumber: 101,
    zone: "Zone A - Central",
    population: 45000,
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [77.58, 12.96],
          [77.62, 12.96],
          [77.62, 13.0],
          [77.58, 13.0],
          [77.58, 12.96],
        ],
      ],
    },
  });

  const ward2 = await Ward.create({
    name: "Indiranagar Ward 2",
    wardNumber: 102,
    zone: "Zone B - East",
    population: 62000,
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [77.63, 12.96],
          [77.66, 12.96],
          [77.66, 13.0],
          [77.63, 13.0],
          [77.63, 12.96],
        ],
      ],
    },
  });

  logger.info("Created 2 wards with GeoJSON Polygon boundaries.");

  // 4. Create Users (Argon2 Hashed Passwords)
  const defaultPassword = "Password@123";
  const passwordHash = await argon2.hash(defaultPassword);

  await User.create({
    name: "CityOS Administrator",
    email: "admin@cityos.local",
    passwordHash,
    role: "SUPER_ADMIN",
    phone: "+919800000001",
  });

  await User.create({
    name: "Municipal Commissioner",
    email: "commissioner@cityos.local",
    passwordHash,
    role: "CITY_ADMIN",
    phone: "+919800000002",
  });

  const officer = await User.create({
    name: "PWD Nodal Officer",
    email: "officer.pwd@cityos.local",
    passwordHash,
    role: "OFFICER",
    department: deptPWD._id,
    phone: "+919800000003",
  });

  const fieldWorker = await User.create({
    name: "Ramesh Kumar (Field Technician)",
    email: "worker.pwd@cityos.local",
    passwordHash,
    role: "FIELD_WORKER",
    department: deptPWD._id,
    phone: "+919800000004",
  });

  const citizen = await User.create({
    name: "Aarav Sharma (Citizen)",
    email: "citizen@cityos.local",
    passwordHash,
    role: "CITIZEN",
    phone: "+919800000005",
  });

  logger.info("Created 5 seed users across all key roles.");

  // 5. Create Sample GeoJSON Incidents
  await Incident.create({
    incidentNumber: "INC-202611-001",
    title: "Deep pothole near 80ft Road Junction",
    description: "Severe pothole causing two-wheelers to skid, approximately 2 feet wide.",
    reporter: citizen._id,
    category: catPothole._id,
    status: "REPORTED",
    priority: "HIGH",
    priorityScore: 82,
    priorityFactors: {
      severityScore: 80,
      safetyScore: 90,
      repeatFactor: 60,
      unresolvedAgingScore: 70,
      explanation: "High vehicle density route + deep pothole creates imminent accident hazard.",
    },
    aiAnalysis: {
      category: "pothole",
      confidence: 0.94,
      severity: "HIGH",
      detectedObjects: ["pothole", "asphalt_crack"],
      processedAt: new Date(),
    },
    location: {
      type: "Point",
      coordinates: [77.6012, 12.9754],
    },
    address: "80ft Road, Near Metro Pillar 42, Ward 101",
    ward: ward1._id,
    zone: ward1.zone,
    department: deptPWD._id,
    media: [
      {
        mediaId: "media-seed-001",
        url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800",
        mimeType: "image/jpeg",
        phase: "initial",
        uploadedAt: new Date(),
      },
    ],
    statusHistory: [
      {
        fromStatus: "REPORTED",
        toStatus: "REPORTED",
        changedBy: citizen._id,
        reason: "Citizen initial report submitted via CityOS",
        timestamp: new Date(),
      },
    ],
  });

  await Incident.create({
    incidentNumber: "INC-202611-002",
    title: "Broken streetlight causing dark stretch",
    description: "Three consecutive streetlights are dark, public safety issue after 7 PM.",
    reporter: citizen._id,
    category: catStreetlight._id,
    status: "ASSIGNED",
    priority: "MEDIUM",
    priorityScore: 65,
    priorityFactors: {
      severityScore: 60,
      safetyScore: 70,
      repeatFactor: 40,
      unresolvedAgingScore: 50,
      explanation: "Pedestrian safety concern in residential neighborhood.",
    },
    location: {
      type: "Point",
      coordinates: [77.6415, 12.9782],
    },
    address: "12th Main, 4th Cross, Indiranagar, Ward 102",
    ward: ward2._id,
    zone: ward2.zone,
    department: deptElectrical._id,
    assignedWorker: fieldWorker._id,
    media: [
      {
        mediaId: "media-seed-002",
        url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800",
        mimeType: "image/jpeg",
        phase: "initial",
        uploadedAt: new Date(),
      },
    ],
    statusHistory: [
      {
        fromStatus: "REPORTED",
        toStatus: "VERIFIED",
        changedBy: officer._id,
        reason: "Officer verified incident report",
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        fromStatus: "VERIFIED",
        toStatus: "ASSIGNED",
        changedBy: officer._id,
        reason: "Assigned to electrical maintenance team",
        timestamp: new Date(),
      },
    ],
  });

  logger.info("Created 2 seed incidents with GeoJSON points.");
  logger.info("CityOS Database Seeding completed successfully!");
  logger.info("--------------------------------------------------");
  logger.info("Default Accounts Created (Password: Password@123):");
  logger.info("  Super Admin:   admin@cityos.local");
  logger.info("  City Admin:    commissioner@cityos.local");
  logger.info("  Nodal Officer: officer.pwd@cityos.local");
  logger.info("  Field Worker:  worker.pwd@cityos.local");
  logger.info("  Citizen:       citizen@cityos.local");
  logger.info("--------------------------------------------------");

  await disconnectDatabase();
}

seed().catch((err) => {
  logger.error("Seeding failed", { error: err instanceof Error ? err.message : err });
  process.exit(1);
});
