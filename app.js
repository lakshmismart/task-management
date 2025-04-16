const express = require('express');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db'); // Destructuring the named export

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Connect to PostgreSQL
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for parsing x-www-form-urlencoded
// Set up multer for handling file uploads (if you are uploading files)


// Import and use your central routes file
app.use('/', require('./routes/routes')); // ✅ updated here

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});



