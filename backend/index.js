const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authMiddleware = require('./middleware/auth.js'); // adjust path if needed
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const app = express();
const port = process.env.PORT || 3001;

// ✅ FIX: Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5137', 'https://resumepivot7.onrender.com' ], // Your Vite frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ✅ FIX: Enhanced error logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.headers.authorization) {
    console.log('Auth header present:', req.headers.authorization.substring(0, 20) + '...');
  } else {
    console.log('No auth header');
  }
  next();
});



// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const resumeRoutes = require('./routes/resume');
app.use('/api/resume', authMiddleware, resumeRoutes);

const jobRoutes = require('./routes/jobs');
app.use('/api/jobs', authMiddleware, jobRoutes);

const applicationRoutes = require('./routes/applications');
app.use('/api/applications', authMiddleware, applicationRoutes);

app.get('/', (req, res) => {
  res.send('ResumePivot API is running!');
});

// ✅ FIX: Global error handler
app.use((err, req, res, next) => {
  console.error('--- UNHANDLED ERROR ---');
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.error('Request Body:', JSON.stringify(req.body, null, 2));
  console.error('Error Stack:', err.stack);
  console.error('--- END UNHANDLED ERROR ---');
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});