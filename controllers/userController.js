const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const cache = require('../cache/memoryCache');

const JWT_SECRET = process.env.JWT_SECRET;

// Signup Controller
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    let avatar;

    // Check if the email already exists in the database
    const emailCheckResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheckResult.rows.length > 0) {
      return res.status(400).json({ message: 'Email is already registered', status:400 });
    }

    // Check if avatar is uploaded as a file (in case of form-data)
    if (req.file) {
      // If avatar is an image file, store it as a base64 string (or store it in a folder and save the path)
      avatar = req.file.buffer.toString('base64'); // Store as base64 or save as a file path (e.g., '/uploads/avatar.jpg')
    } else {
      // If avatar is sent as a string (URL or base64), take it from the body
      avatar = req.body.avatar || ''; // If no avatar provided, set empty string as fallback
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user data into the database
    const result = await pool.query(
      'INSERT INTO users (name, email, password, avatar) VALUES ($1, $2, $3, $4) RETURNING id, name, email, avatar',
      [name, email, hashedPassword, avatar]
    );

    // Create JWT token
    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Send response with user data and token
    res.status(201).json({ user: result.rows[0], token });

  } catch (err) {
    next(err);
  }
};


exports.login = async (req, res, next) => {
  try {
    // Works for both form-data and raw JSON
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    delete user.password;
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
};


exports.getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar FROM users WHERE id = $1',
      [req.userId] // This comes from the decoded token
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]); // Return user details
  } catch (err) {
    next(err);
  }
};
