const { body } = require('express-validator');

exports.signupValidator = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Min 6 chars password'),
];

// exports.loginValidator = [
//   body('email').isEmail().withMessage('Valid email required'),
//   body('password').notEmpty().withMessage('Password is required'),
// ];
