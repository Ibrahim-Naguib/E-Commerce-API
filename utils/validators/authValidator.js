const slugify = require('slugify');
const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const User = require('../../models/userModel');
const bcrypt = require('bcryptjs');

const signupValidator = [
  check('name')
    .notEmpty()
    .withMessage('User is required')
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error('E-mail already exists'));
        }
      })
    ),

  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  check('passwordConfirm')
    .notEmpty()
    .withMessage('Password confirmation required')
    .custom((passwordConfirm, { req }) => {
      if (passwordConfirm !== req.body.password) {
        throw new Error('Password Confirmation incorrect');
      }
      return true;
    }),

  validatorMiddleware,
];

const loginValidator = [
  check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid email address')
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (!user) {
          return Promise.reject(new Error(`E-mail doesn't exists, please signup`));
        }
      })
    ),
  
  check('password')
    .notEmpty()
    .withMessage('Password required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .custom(async (val, { req }) => {
      const user = await User.findOne({ email: req.body.email });
        if (user && !(await bcrypt.compare(val, user.password))) {
          throw new Error('Password is incorrect');
        }
      }
    ),


  validatorMiddleware,
];

module.exports = { signupValidator, loginValidator };
