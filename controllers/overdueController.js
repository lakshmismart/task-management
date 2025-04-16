const { pool } = require('../config/db');
const sendEmail = require('../utils/mailer');

exports.notifyOverdueTasks = async (req, res, next) => {
 try {
   const today = new Date().toISOString().split('T')[0];

   // Fetch overdue tasks that are not done
   const taskResult = await pool.query(`
     SELECT 
       t.id AS task_id,
       t.name AS task_name,
       t.status,
       t.due_date,
       u.id AS user_id,
       u.name AS user_name,
       u.email
     FROM tasks t
     JOIN users u ON t.user_id = u.id
     WHERE t.due_date < $1 AND t.status != 'done'
   `, [today]);

   if (taskResult.rows.length === 0) {
     return res.status(200).json({ message: 'No overdue tasks found', notified: [] });
   }

   const notifiedUsers = [];

   for (let row of taskResult.rows) {
     const { task_id, task_name, status, user_id, user_name, email } = row;

     // Optional: Check if notification already sent to avoid duplicates
     const existing = await pool.query(
       'SELECT * FROM notifications WHERE task_id = $1 AND user_id = $2 AND message LIKE $3',
       [task_id, user_id, `%overdue%`]
     );
     if (existing.rows.length > 0) continue;

     const message = `Hi ${user_name}, your task "${task_name}" is overdue. Please take action.`;

     // Save the notification
     await pool.query(
       'INSERT INTO notifications (user_id, task_id, message) VALUES ($1, $2, $3)',
       [user_id, task_id, message]
     );

     // Send email to user
     await sendEmail(email, `Overdue Task: ${task_name}`, message);

     // Add to response list
     notifiedUsers.push({
       user_id,
       email,
       task: task_name,
       status
     });
   }

   res.status(200).json({
     message: 'Overdue task notifications sent',
     notified: notifiedUsers
   });

 } catch (err) {
   console.error('Error in notifyOverdueTasks:', err);
   next(err);
 }
};



