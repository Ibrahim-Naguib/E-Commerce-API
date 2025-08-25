const express = require('express');
const {
  signupValidator,
  signinValidator,
} = require('../utils/validators/authValidator');

const {
  signup,
  signin,
  signout,
  refresh,
  forgotPassword,
  verifyPassResetCode,
  resetPassword,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signupValidator, signup);
router.post('/signin', signinValidator, signin);
router.post('/signout', signout);
router.post('/refresh', refresh);
router.post('/forgotPassword', forgotPassword);
router.post('/verifyResetCode', verifyPassResetCode);
router.put('/resetPassword', resetPassword);

module.exports = router;
