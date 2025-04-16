const { pool } = require('../config/db');
const sendEmail = require('../utils/mailer'); // optional if you want email notifications



exports.createProject = async (req, res, next) => {
  try {
    const name = req.body.name || req.body['name'];
    const description = req.body.description || req.body['description'];
    const userId = req.userId; // assuming you're using `auth` middleware to get logged-in user

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const result = await pool.query(
      'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', userId]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};


exports.shareProject = async (req, res, next) => {
  try {
    const { project_id } = req.body;
    let user_ids = req.body.user_ids;

    if (!project_id || !user_ids) {
      return res.status(400).json({ message: 'project_id and user_ids are required' });
    }

    // Support form-data stringified array
    if (typeof user_ids === 'string') {
      user_ids = JSON.parse(user_ids);
    }

    const project = await pool.query('SELECT * FROM projects WHERE id = $1', [project_id]);
    if (project.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const sharedUsers = [];

    for (let user_id of user_ids) {
      const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [user_id]);
      if (userCheck.rows.length === 0) continue;

      // Avoid duplicate entries
      const exists = await pool.query(
        'SELECT * FROM project_shares WHERE project_id = $1 AND user_id = $2',
        [project_id, user_id]
      );
      if (exists.rows.length === 0) {
        await pool.query(
          'INSERT INTO project_shares (project_id, user_id) VALUES ($1, $2)',
          [project_id, user_id]
        );
      }

      // Optional email notification
      await sendEmail(
        userCheck.rows[0].email,
        `Project Shared: ${project.rows[0].name}`,
        `You have been added to the project "${project.rows[0].name}".`
      );

      sharedUsers.push({ id: user_id, email: userCheck.rows[0].email });
    }

    return res.json({
      success: true,
      message: 'Project shared successfully',
      shared_with: sharedUsers
    });

  } catch (error) {
    next(error);
  }
};
