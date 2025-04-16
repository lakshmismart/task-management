const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const projectController = require('../controllers/projectController');
const taskController = require('../controllers/taskController');
const categoryController = require('../controllers/categoryController');
const commentController = require('../controllers/commentController');
const statsController = require('../controllers/statsController');
const overdueController = require('../controllers/overdueController');

const multer = require('multer'); // Correct import of multer
const upload = multer({ dest: 'uploads/' }); // Define multer upload once

//validation
const { validateSignup } = require('../middleware/validate');
const { validateLogin } = require('../middleware/validate');
const auth = require('../middleware/authMiddleware'); // Import the authMiddleware

// User routes
router.post('/signup', upload.single('avatar'), validateSignup, userController.signup);
router.post('/login', upload.none(), validateLogin, userController.login);
router.post('/request-reset-password', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);

router.get('/get-profile', auth, userController.getProfile);

//project routes
router.post('/create-project', auth, upload.none(), projectController.createProject);
router.post('/share-project', auth, upload.none(), projectController.shareProject);


// Task module routes
router.post('/create-tasks', auth, upload.single('attachment'), taskController.createTask); // to create tasks
router.get('/get-task-by-id/:id', auth, taskController.getTaskById);//retrieving task by ID
router.get('/get-all-tasks', auth, taskController.getAllTasks);// Route for retrieving all tasks
router.post('/update-task/:id', upload.single('attachment'), taskController.updateTask);
router.delete('/delete-task/:id', auth, taskController.deleteTask);  // Auth middleware and delete task

//Organizations - create categories
router.post('/create-category', auth, upload.none(), categoryController.createCategory);
router.get('/get-categories', auth, categoryController.getCategories);

router.post('/filter-tasks', auth, upload.none(), taskController.filterTasks);
router.post('/search-tasks', auth, upload.none(), taskController.searchTasks);
router.post('/sort-tasks', auth, upload.none(), taskController.sortTasks);

//Collabrations
router.post('/assign-task', auth, upload.none(), taskController.assignTask);
router.post('/comment', auth, upload.none(), commentController.addComment); // add comments
router.post('/tasks/notify-overdue', auth, overdueController.notifyOverdueTasks);

// Analytics routes
router.get('/tasks/status-count', auth, statsController.getTaskStatusCount);
router.get('/tasks/by-category', auth, statsController.getTasksByCategory);
router.get('/user-productivity', auth, taskController.getUserProductivity); // User productivity metrics route
router.get('/project-progress/:projectId', auth, taskController.getProjectProgress);// Project progress tracking route








module.exports = router;
