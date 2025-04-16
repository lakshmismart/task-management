const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const cache = require('../cache/memoryCache');

const crypto = require('crypto');
const sendEmail = require('../utils/mailer');

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




exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [token, expires, email]
    );

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await sendEmail(email, 'Password Reset', `Click to reset your password: ${resetLink}`);

    res.json({ message: 'Password reset link has been sent to your email.' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await pool.query(
      `UPDATE users 
       SET password = $1, reset_token = NULL, reset_token_expires = NULL 
       WHERE reset_token = $2`,
      [hashedPassword, token]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

