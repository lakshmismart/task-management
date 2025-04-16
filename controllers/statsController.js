const { pool } = require('../config/db');

exports.getTaskStatusCount = async (req, res, next) => {
 try {
   // First, try grouped count by status along with task details
   const result = await pool.query(`
     SELECT
       status,
       COUNT(*) AS count,
       ARRAY_AGG(
         JSON_BUILD_OBJECT(
           'id', t.id,
           'name', t.name,
           'description', t.description,
           'due_date', t.due_date,
           'priority', t.priority,
           'estimated_time', t.estimated_time,
           'recurrence', t.recurrence
         )
       ) AS tasks
     FROM tasks t
     GROUP BY status
   `);

   // If no counts found, fallback to all tasks
   if (result.rows.length === 0) {
     const allTasks = await pool.query(`SELECT * FROM tasks`);

     if (allTasks.rows.length === 0) {
       return res.status(404).json({ message: 'No tasks found', data: [] });
     }

     return res.json({
       message: 'No grouped count found, showing all tasks',
       data: allTasks.rows
     });
   }

   // Return count by status with task details
   res.json({
     message: 'Task status counts',
     data: result.rows
   });

 } catch (err) {
   next(err);
 }
};


exports.getTasksByCategory = async (req, res, next) => {
 try {
   const result = await pool.query(`
     SELECT
       c.id AS category_id,
       c.name AS category,
       c.description AS category_description,
       COUNT(t.id) AS task_count,
       COALESCE(
         JSON_AGG(
           JSON_BUILD_OBJECT(
             'id', t.id,
             'name', t.name,
             'description', t.description,
             'due_date', t.due_date,
             'priority', t.priority,
             'status', t.status,
             'estimated_time', t.estimated_time,
             'recurrence', t.recurrence
           )
         ) FILTER (WHERE t.id IS NOT NULL),
         '[]'
       ) AS tasks
     FROM categories c
     LEFT JOIN tasks t ON t.category_id = c.id
     GROUP BY c.id, c.name, c.description
     ORDER BY c.name;
   `);

   if (result.rows.length === 0) {
     return res.status(404).json({ message: 'No categories or tasks found', data: [] });
   }

   res.json({
     message: 'Tasks grouped by category',
     data: result.rows
   });
 } catch (err) {
   next(err);
 }
};


