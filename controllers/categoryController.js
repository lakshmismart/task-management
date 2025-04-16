const { pool } = require('../config/db');

// POST /create-category
exports.createCategory = async (req, res, next) => {
 try {
   const { name } = req.body;
   if (!name) return res.status(400).json({ message: 'Category name is required' });

   const result = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
   res.status(201).json(result.rows[0]);
 } catch (err) {
   next(err);
 }
};

// GET /get-categories
exports.getCategories = async (req, res, next) => {
 try {
   const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
   res.json(result.rows);
 } catch (err) {
   next(err);
 }
};




