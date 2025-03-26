require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');

// Initialize Sequelize with the connection string from .env
const sequelize = new Sequelize(process.env.PG_CONNECTION_STRING, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false, // Disable logging for cleaner output
  dialectOptions: {
    ssl: {
      require: true, // Enable SSL for Neon
    },
  },
});

// Define the Sector model
const Sector = sequelize.define('Sector', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sector_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  timestamps: false, // Disable createdAt and updatedAt
});

// Define the Project model
const Project = sequelize.define('Project', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  feature_img_url: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  summary_short: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  intro_short: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  impact: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  original_source_url: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  sector_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: false, // Disable createdAt and updatedAt
});

// Define the association between Project and Sector
Project.belongsTo(Sector, { foreignKey: 'sector_id' });

// Initialize function to sync the database
function initialize() {
  return sequelize.sync({ force: true }) // Use { force: true } to drop and recreate tables
    .then(() => {
      console.log('Database synced successfully.');

      // Bulk insert data
      const projectData = require('../data/projectData');
      const sectorData = require('../data/sectorData.json'); // Ensure this is the correct path

      Sector.bulkCreate(sectorData)
        .then(() => {
          return Project.bulkCreate(projectData);
        })
        .then(() => {
          console.log('Data inserted successfully!');
        })
        .catch((err) => {
          console.error('Error inserting data:', err);
        });
    })
    .catch((err) => {
      throw new Error('Unable to sync the database: ' + err);
    });
}

// Get all projects with their associated sectors
function getAllProjects() {
  return Project.findAll({
    include: [Sector], // Include the associated Sector data
  });
}

// Get a single project by ID with its associated sector
function getProjectById(projectId) {
  return Project.findOne({
    where: { id: projectId },
    include: [Sector], // Include the associated Sector data
  }).then((project) => {
    if (project) {
      return project;
    } else {
      throw new Error('Unable to find requested project');
    }
  });
}

// Get projects by sector name
function getProjectsBySector(sector) {
  return Project.findAll({
    include: [Sector],
    where: {
      '$Sector.sector_name$': {
        [Sequelize.Op.iLike]: `%${sector}%`, // Case-insensitive search
      },
    },
  }).then((projects) => {
    if (projects.length > 0) {
      return projects;
    } else {
      throw new Error(`No projects found for sector: ${sector}`);
    }
  });
}

// Add a new project
function addProject(projectData) {
  return Project.create(projectData);
}

// Edit an existing project
function editProject(id, projectData) {
  return Project.update(projectData, {
    where: { id },
  });
}

// Delete a project
function deleteProject(id) {
  return Project.destroy({
    where: { id },
  });
}

// Get all sectors
function getAllSectors() {
  return Sector.findAll();
}

// Export all functions
module.exports = {
  initialize,
  getAllProjects,
  getProjectById,
  getProjectsBySector,
  addProject,
  editProject,
  deleteProject,
  getAllSectors,
};

// Test the database connection
sequelize.authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });