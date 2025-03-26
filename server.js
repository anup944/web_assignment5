const express = require("express");
const path = require("path");
const projects = require("./modules/projects");

const app = express();
const PORT = process.env.PORT || 8080;

// Set up static files directory
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize the database
projects.initialize()
  .then(() => {
    console.log('Database initialized successfully.');
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });

// Routes
app.get('/', (req, res) => {
  res.render('home', { page: '/' });
});

app.get('/about', (req, res) => {
  res.render('about', { page: '/about' });
});

app.get('/solutions/projects', (req, res) => {
  projects.getAllProjects()
    .then((data) => {
      let filteredProjects = data;

      if (req.query.sector) {
        const sectorMap = {
          'ind': 'Industry',
          'gov': 'Government',
          'edu': 'Education',
          'trans': 'Transportation'
        };

        const targetSector = sectorMap[req.query.sector];
        if (targetSector) {
          filteredProjects = data.filter(project => 
            project.Sector.sector_name === targetSector
          );
        }
      }

      res.render('projects', {
        projects: filteredProjects,
        page: '/solutions/projects'
      });
    })
    .catch((err) => {
      res.status(500).render('500', { message: err.message });
    });
});

app.get('/solutions/projects/:id', (req, res) => {
  const projectId = parseInt(req.params.id);

  projects.getProjectById(projectId)
    .then((project) => {
      res.render('project', { project: project, page: '' });
    })
    .catch((err) => {
      res.status(404).render('404', { message: err.message });
    });
});

app.get('/solutions/addProject', (req, res) => {
  projects.getAllSectors()
    .then((sectors) => {
      res.render('addProject', { sectors: sectors, page: '/solutions/addProject' });
    })
    .catch((err) => {
      res.status(500).render('500', { message: err.message });
    });
});

app.post('/solutions/addProject', (req, res) => {
  projects.addProject(req.body)
    .then(() => {
      res.redirect('/solutions/projects');
    })
    .catch((err) => {
      res.status(500).render('500', { message: err.message });
    });
});

app.get('/solutions/editProject/:id', (req, res) => {
  const projectId = parseInt(req.params.id);

  Promise.all([
    projects.getProjectById(projectId),
    projects.getAllSectors()
  ])
    .then(([project, sectors]) => {
      res.render('editProject', { project: project, sectors: sectors, page: '' });
    })
    .catch((err) => {
      res.status(404).render('404', { message: err.message });
    });
});

app.post('/solutions/editProject', (req, res) => {
  const projectId = req.body.id;

  projects.editProject(projectId, req.body)
    .then(() => {
      res.redirect('/solutions/projects');
    })
    .catch((err) => {
      res.status(500).render('500', { message: err.message });
    });
});

app.get('/solutions/deleteProject/:id', (req, res) => {
  const projectId = parseInt(req.params.id);

  projects.deleteProject(projectId)
    .then(() => {
      res.redirect('/solutions/projects');
    })
    .catch((err) => {
      res.status(500).render('500', { message: err.message });
    });
});

// Test route to force a 500 error
app.get('/test-error', (req, res, next) => {
  next(new Error('This is a test error.'));
});

// Handle 404 errors
app.use((req, res) => {
  console.log('404 Error: Page not found -', req.url); // Debug log
  res.status(404).render('404', { 
    page: '', 
    message: 'The page you are looking for does not exist.' // Add this line
  });
});

// Handle 500 errors
app.use((err, req, res, next) => {
  console.error('500 Error:', err.message); // Debug log
  res.status(500).render('500', { 
    message: err.message || 'An unexpected error occurred.' // Ensure message is defined
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});