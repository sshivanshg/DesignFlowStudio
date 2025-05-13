// Seed script for estimate configuration
// Run with: node seed-estimate-configs.js

const { DrizzleStorage } = require("./server/storage");
const schema = require("./shared/schema");
const pg = require("pg");
const { drizzle } = require("drizzle-orm/node-postgres");

const storage = new DrizzleStorage();

// Define pricing configurations
const pricingConfigs = [
  {
    name: "baseRates",
    description: "Base pricing rates for estimates",
    configType: "pricing",
    isActive: true,
    config: {
      baseRate: 20, // Base rate per sqft
      perRoomRate: 1500, // Additional fee per room
      gstRate: 0.05, // GST rate (5%)
      customMaterialsFee: 2500 // Fee for custom material sourcing
    }
  },
  {
    name: "furniture",
    description: "Furniture pricing tiers",
    configType: "pricing",
    isActive: true,
    config: {
      basic: {
        rate: 15,
        description: "Basic furniture package"
      },
      mid: {
        rate: 30,
        description: "Mid-range furniture package"
      },
      premium: {
        rate: 50,
        description: "Premium furniture package"
      }
    }
  },
  {
    name: "appliances",
    description: "Appliance pricing tiers",
    configType: "pricing",
    isActive: true,
    config: {
      basic: {
        rate: 10,
        description: "Basic appliance package"
      },
      mid: {
        rate: 20,
        description: "Mid-range appliance package"
      },
      premium: {
        rate: 35,
        description: "Premium appliance package"
      }
    }
  },
  {
    name: "lighting",
    description: "Lighting pricing tiers",
    configType: "pricing",
    isActive: true,
    config: {
      basic: {
        rate: 5,
        description: "Basic lighting package"
      },
      mid: {
        rate: 12,
        description: "Mid-range lighting package"
      },
      premium: {
        rate: 25,
        description: "Premium lighting package"
      }
    }
  }
];

// Define room types
const roomTypeConfigs = [
  {
    name: "Kitchen",
    description: "Kitchen design configuration",
    configType: "roomType",
    isActive: true,
    config: {
      baseRate: 2500,
      perSqftRate: 25,
      description: "Kitchen design and layout"
    }
  },
  {
    name: "Living Room",
    description: "Living room design configuration",
    configType: "roomType",
    isActive: true,
    config: {
      baseRate: 1800,
      perSqftRate: 15,
      description: "Living room design and layout"
    }
  },
  {
    name: "Bedroom",
    description: "Bedroom design configuration",
    configType: "roomType",
    isActive: true,
    config: {
      baseRate: 1200,
      perSqftRate: 12,
      description: "Bedroom design and layout"
    }
  },
  {
    name: "Bathroom",
    description: "Bathroom design configuration",
    configType: "roomType",
    isActive: true,
    config: {
      baseRate: 2000,
      perSqftRate: 30,
      description: "Bathroom design and layout"
    }
  },
  {
    name: "Dining Room",
    description: "Dining room design configuration",
    configType: "roomType",
    isActive: true,
    config: {
      baseRate: 1500,
      perSqftRate: 12,
      description: "Dining room design and layout"
    }
  },
  {
    name: "Home Office",
    description: "Home office design configuration",
    configType: "roomType",
    isActive: true,
    config: {
      baseRate: 1600,
      perSqftRate: 14,
      description: "Home office design and layout"
    }
  },
  {
    name: "Entryway",
    description: "Entryway design configuration",
    configType: "roomType",
    isActive: true,
    config: {
      baseRate: 800,
      perSqftRate: 10,
      description: "Entryway design and layout"
    }
  }
];

// Define additional services
const serviceConfigs = [
  {
    name: "3D Rendering",
    description: "3D rendering service",
    configType: "service",
    isActive: true,
    config: {
      baseRate: 800,
      hasSqftComponent: false,
      description: "Photorealistic 3D renderings of design"
    }
  },
  {
    name: "Project Management",
    description: "Project management service",
    configType: "service",
    isActive: true,
    config: {
      baseRate: 2500,
      hasSqftComponent: true,
      perSqftRate: 5,
      description: "Full-service project management"
    }
  },
  {
    name: "Furniture Procurement",
    description: "Furniture procurement service",
    configType: "service",
    isActive: true,
    config: {
      baseRate: 1500,
      hasSqftComponent: false,
      description: "Sourcing and procurement of furniture items"
    }
  },
  {
    name: "Custom Millwork Design",
    description: "Custom millwork design service",
    configType: "service",
    isActive: true,
    config: {
      baseRate: 3500,
      hasSqftComponent: true,
      perSqftRate: 8,
      description: "Design and installation of custom millwork"
    }
  },
  {
    name: "Color Consultation",
    description: "Color consultation service",
    configType: "service",
    isActive: true,
    config: {
      baseRate: 500,
      hasSqftComponent: false,
      description: "Professional color scheme consultation"
    }
  },
  {
    name: "Lighting Design",
    description: "Lighting design service",
    configType: "service",
    isActive: true,
    config: {
      baseRate: 1200,
      hasSqftComponent: true,
      perSqftRate: 3,
      description: "Custom lighting design plan"
    }
  }
];

// Define standard templates
const standardTemplates = [
  {
    title: "Modern Residential Kitchen",
    configJSON: {
      scope: {
        projectType: "residential",
        roomCount: 1,
        sqft: 250,
        layoutType: "open",
        rooms: ["Kitchen"],
        furniture: "mid",
        appliances: "mid",
        lighting: "mid",
        customMaterials: false,
        additionalServices: ["3D Rendering"],
        comments: ""
      },
      milestone1Percentage: 40,
      milestone2Percentage: 40,
      milestone3Percentage: 20
    },
    status: "template",
    isTemplate: true
  },
  {
    title: "Premium Whole Home Design",
    configJSON: {
      scope: {
        projectType: "residential",
        roomCount: 5,
        sqft: 2000,
        layoutType: "mixed",
        rooms: ["Living Room", "Kitchen", "Bedroom", "Bathroom", "Dining Room"],
        furniture: "premium",
        appliances: "premium",
        lighting: "premium",
        customMaterials: true,
        additionalServices: ["3D Rendering", "Project Management", "Furniture Procurement"],
        comments: ""
      },
      milestone1Percentage: 50,
      milestone2Percentage: 30,
      milestone3Percentage: 20
    },
    status: "template",
    isTemplate: true
  },
  {
    title: "Basic Bathroom Renovation",
    configJSON: {
      scope: {
        projectType: "residential",
        roomCount: 1,
        sqft: 100,
        layoutType: "traditional",
        rooms: ["Bathroom"],
        furniture: "basic",
        appliances: "basic",
        lighting: "mid",
        customMaterials: false,
        additionalServices: [],
        comments: ""
      },
      milestone1Percentage: 40,
      milestone2Percentage: 40,
      milestone3Percentage: 20
    },
    status: "template",
    isTemplate: true
  }
];

// Function to seed the database
async function seedDatabase() {
  try {
    console.log("Starting to seed estimate configurations...");

    // Seed pricing configs
    for (const config of pricingConfigs) {
      await storage.createEstimateConfig(config);
      console.log(`Created pricing config: ${config.name}`);
    }

    // Seed room type configs
    for (const config of roomTypeConfigs) {
      await storage.createEstimateConfig(config);
      console.log(`Created room type config: ${config.name}`);
    }

    // Seed service configs
    for (const config of serviceConfigs) {
      await storage.createEstimateConfig(config);
      console.log(`Created service config: ${config.name}`);
    }

    // Seed templates
    for (const template of standardTemplates) {
      await storage.createEstimate(template);
      console.log(`Created template: ${template.title}`);
    }

    console.log("Estimate configurations seeded successfully!");
  } catch (error) {
    console.error("Error seeding estimate configurations:", error);
  }
}

// Run the seed function
seedDatabase().then(() => {
  console.log("Seed script completed.");
  process.exit(0);
}).catch(error => {
  console.error("Seed script failed:", error);
  process.exit(1);
});

module.exports = { seedDatabase };