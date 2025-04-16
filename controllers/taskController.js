const { pool } = require('../config/db');
const sendEmail = require('../utils/mailer');

exports.createTask = async (req, res, next) => {
 try {
   const data = req.body;  // Get the data from the body
   const category_id = parseInt(data.category_id, 10);
   const estimated_time = parseInt(data.estimated_time, 10);
   const priority = data.priority || 'medium';
   const status = data.status || 'not started';
   const recurrence = data.recurrence || 'none';

   // Handle file upload
   let attachment = '';
   if (req.file) {
     attachment = req.file.path || req.file.originalname;  // Path to file in case of form-data
   } else {
     attachment = data.attachment || '';  // Use attachment passed in JSON body
   }

   // Validate category exists
   const categoryCheck = await pool.query('SELECT * FROM categories WHERE id = $1', [category_id]);
   if (categoryCheck.rows.length === 0) {
     return res.status(400).json({ message: 'Invalid category_id' });
   }

   const user_id = req.userId;  // Get user_id from token

   // Check if the user has any incomplete tasks (tasks not marked as completed)
   const incompleteTaskCheck = await pool.query(
     'SELECT * FROM tasks WHERE user_id = $1 AND status != $2 ORDER BY due_date ASC LIMIT 1',
     [user_id, 'completed']
   );

   // If there is an incomplete task, warn the user
   if (incompleteTaskCheck.rows.length > 0) {
     return res.status(400).json({
       message: 'You cannot create a new task until you complete your previous task.'
     });
   }

   // Proceed to create the new task if no incomplete task is found
   const result = await pool.query(
     `INSERT INTO tasks 
     (name, description, category_id, due_date, priority, estimated_time, status, attachment, recurrence, user_id) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
     RETURNING *`,
     [
       data.name,
       data.description,
       category_id,
       data.due_date,
       priority,
       estimated_time,
       status,
       attachment,
       recurrence,
       user_id
     ]
   );

   res.status(201).json(result.rows[0]);
 } catch (err) {
   next(err);
 }
};


exports.getTaskById = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Get all tasks
exports.getAllTasks = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Update a task
exports.updateTask = async (req, res, next) => {
 const { name, description, category_id, due_date, priority, estimated_time, status, attachment, recurrence } = req.body;
 try {
   const result = await pool.query(
     `UPDATE tasks 
      SET name = $1,
          description = $2,
          category_id = $3,
          due_date = $4,
          priority = $5,
          estimated_time = $6,
          status = $7,
          attachment = $8,
          recurrence = $9,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *`,
     [name, description, category_id, due_date, priority, estimated_time, status, attachment, recurrence, req.params.id]
   );

   if (result.rows.length === 0) {
     return res.status(404).json({ message: 'Task not found' });
   }

   res.json(result.rows[0]);
 } catch (err) {
   next(err);
 }
};

// Delete a task
exports.deleteTask = async (req, res, next) => {
 const { id } = req.params;  // Get task ID from route params
 try {
   // Check if the task exists
   const taskCheck = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
   if (taskCheck.rows.length === 0) {
     // Return warning message if no task is found with the given ID
     return res.status(404).json({ message: `No task found with ID ${id}.` });
   }

   // Delete the task
   const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

   // If the task is successfully deleted, send a success message
   res.status(200).json({ message: 'Task deleted successfully', task: result.rows[0] });
 } catch (err) {
   next(err);  // Pass the error to the error handler middleware
 }
};


// POST /filter-tasks
exports.filterTasks = async (req, res, next) => {
 try {
   const { name, status, priority, due_date, category_id } = req.body;
   const conditions = [];
   const values = [];

   if (name) {
     values.push(`%${name}%`); // Use ILIKE for case-insensitive search
     conditions.push(`name ILIKE $${values.length}`);
   }

   if (status) {
     values.push(status);
     conditions.push(`status = $${values.length}`);
   }

   if (priority) {
     values.push(priority);
     conditions.push(`priority = $${values.length}`);
   }

   if (due_date) {
     values.push(due_date);
     conditions.push(`due_date = $${values.length}`);
   }

   if (category_id) {
     values.push(parseInt(category_id));
     conditions.push(`category_id = $${values.length}`);
   }

   const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
   const query = `SELECT * FROM tasks ${whereClause}`;

   const result = await pool.query(query, values);

   if (result.rows.length === 0) {
     return res.status(404).json({
       success: false,
       message: 'No tasks found for the given filters.'
     });
   }

   res.json({
     success: true,
     data: result.rows
   });

 } catch (err) {
   next(err);
 }
};



exports.searchTasks = async (req, res, next) => {
 try {
   const { name, description, status, priority } = req.body;
   const conditions = [];
   const values = [];

   if (name) {
     values.push(`%${name}%`);
     conditions.push(`name ILIKE $${values.length}`);
   }

   if (description) {
     values.push(`%${description}%`);
     conditions.push(`description ILIKE $${values.length}`);
   }

   if (status) {
     values.push(status);
     conditions.push(`status = $${values.length}`);
   }

   if (priority) {
     values.push(priority);
     conditions.push(`priority = $${values.length}`);
   }

   const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
   const query = `SELECT * FROM tasks ${where}`;
   const result = await pool.query(query, values);

   if (result.rows.length === 0) {
     return res.status(404).json({ message: 'No tasks found' });
   }

   res.json(result.rows);
 } catch (err) {
   next(err);
 }
};


// POST /sort-tasks
exports.sortTasks = async (req, res, next) => {
 try {
   // Ensure req.body exists
   if (!req.body) {
     return res.status(400).json({ message: 'No filter or sorting parameters provided.' });
   }

   const { sort_by = 'created_at', order = 'asc' } = req.body;

   // Valid fields for sorting
   const validSortFields = ['name', 'priority', 'due_date', 'created_at'];

   // Validate sort_by field
   if (!validSortFields.includes(sort_by)) {
     return res.status(400).json({ message: 'Invalid sort field' });
   }

   // Validate order field (asc or desc)
   const validOrders = ['asc', 'desc'];
   if (!validOrders.includes(order.toLowerCase())) {
     return res.status(400).json({ message: 'Invalid order. Use "asc" or "desc".' });
   }

   // Build the query with sorting
   const query = `SELECT * FROM tasks ORDER BY ${sort_by} ${order.toUpperCase()}`;
   const result = await pool.query(query);

   // Check if no records are found
   if (result.rows.length === 0) {
     return res.status(404).json({
       success: false,
       message: 'No tasks found.'
     });
   }

   // Respond with the sorted tasks
   res.json({
     success: true,
     data: result.rows
   });

 } catch (err) {
   next(err);
 }
};




exports.assignTask = async (req, res, next) => {
  try {
    const taskId = req.body.task_id;
    const userIds = req.body.user_ids;

    if (!taskId || !Array.isArray(userIds)) {
      return res.status(400).json({ message: 'task_id and user_ids (as array) are required' });
    }

    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = taskResult.rows[0];
    const notifiedUsers = [];

    for (let userId of userIds) {
      const userCheck = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) continue;

      const user = userCheck.rows[0];

      // Insert notification
      await pool.query(
        'INSERT INTO notifications (user_id, task_id, message) VALUES ($1, $2, $3)',
        [user.id, taskId, `You have been assigned a new task: ${task.name}`]
      );

      // Send email
      const subject = `New Task Assigned: ${task.name}`;
      const message = `Hi ${user.name},\n\nYou have been assigned a new task: "${task.name}".\n\nPlease check your dashboard.\n\nThanks,\nTask Manager Team`;
      await sendEmail(user.email, subject, message);

      notifiedUsers.push({ id: user.id, email: user.email });
    }

    res.status(200).json({
      success: true,
      message: 'Task assigned and email notifications sent',
      users_notified: notifiedUsers
    });

  } catch (err) {
    console.error(err);
    next(err);
  }
};


// Get user productivity (tasks completed per day/week/month)
exports.getUserProductivity = async (req, res, next) => {
  try {
    const userId = req.userId; // assuming userId comes from auth middleware
    const { period = 'daily' } = req.query; // 'day', 'week', or 'month'
    const dateNow = new Date();

    // Determine date range based on period
    let startDate;
    if (period === 'weekly') {
      const currentDayOfWeek = dateNow.getDay();
      startDate = new Date(dateNow.setDate(dateNow.getDate() - currentDayOfWeek)); // Start of the current week (Sunday)
    } else if (period === 'monthly') {
      startDate = new Date(dateNow.setDate(1)); // Start of the current month
    } else {
      startDate = new Date(dateNow.setHours(0, 0, 0, 0)); // Start of the current day
    }

    const endDate = new Date(); // End of the current period

    // Query to get the number of tasks completed by the user in the given period
    const result = await pool.query(
      'SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = $2 AND recurrence = $3 AND created_at BETWEEN $4 AND $5',
      [userId, 'completed', period, startDate, endDate]
    );

    const completedTasks = result.rows[0].count;

    // If no tasks are completed, send a warning message
    if (completedTasks == 0) {
      return res.status(200).json({
        success: true,
        message: `No tasks completed ${period === 'weekly' ? 'this week' : period === 'monthly' ? 'this month' : 'today'}`,
        completedTasks,
      });
    }

    res.status(200).json({
      success: true,
      message: `Tasks completed ${period === 'weekly' ? 'this week' : period === 'monthly' ? 'this month' : 'today'}`,
      completedTasks,
    });
  } catch (err) {
    next(err);
  }
};




// Get project progress (completed tasks vs total tasks)
exports.getProjectProgress = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;

    // Query to get the total number of tasks in the project
    const totalTasksResult = await pool.query(
      'SELECT COUNT(*) FROM tasks WHERE project_id = $1',
      [projectId]
    );

    // Query to get the number of completed tasks in the project
    const completedTasksResult = await pool.query(
      'SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = $2',
      [projectId, 'completed']
    );

    const totalTasks = totalTasksResult.rows[0].count;
    const completedTasks = completedTasksResult.rows[0].count;

    res.status(200).json({
      success: true,
      message: 'Project progress',
      projectProgress: {
        totalTasks,
        completedTasks,
        progressPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};







