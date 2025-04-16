const { pool } = require('../config/db');

exports.addComment = async (req, res, next) => {
  try {
    const { task_id, content } = req.body;

    if (!task_id || !content) {
      return res.status(400).json({ message: 'Task ID and content are required' });
    }

    // Check if the task exists
    const taskCheck = await pool.query('SELECT id FROM tasks WHERE id = $1', [task_id]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: `Task with ID ${task_id} does not exist`, warning: true });
    }

    // Add the comment
    const result = await pool.query(
      'INSERT INTO comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [task_id, req.userId, content]
    );

    res.status(201).json({ message: 'Comment added', comment: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
