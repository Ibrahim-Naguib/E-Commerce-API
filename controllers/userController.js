const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');

const { deletehandler } = require('./handlers');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const { generateTokens, setTokenCookie } = require('../utils/tokens');
const User = require('../models/userModel');

// Upload single image
const uploadUserImage = uploadSingleImage('profileImg');

// Image processing
const resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(`uploads/users/${filename}`);

    // Save image into our db
    req.body.profileImg = filename;
  }

  next();
});

// @desc    Get list of users
// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.filterObject) {
    filter = req.filterObject;
  }
  const documentsCount = await User.countDocuments();
  const apiFeatures = new ApiFeatures(
    User.find(filter).select('-password'),
    req.query
  )
    .filter()
    .search('User')
    .sort()
    .limitFields()
    .paginate(documentsCount);

  const { mongooseQuery, paginationData } = apiFeatures;
  const documents = await mongooseQuery;

  res
    .status(200)
    .json({ results: documents.length, paginationData, data: documents });
});

// @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const document = await User.findById(id).select('-password');
  if (!document) {
    return next(new ApiError(`No user found for this id ${id}`, 404));
  }
  res.status(200).json({ data: document });
});

// @desc    Create user
// @route   POST  /api/v1/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const newDocument = await User.create(req.body);

  // Delete password from response
  delete newDocument._doc.password;

  res.status(201).json({ data: newDocument });
});

// @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res, next) => {
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      slug: req.body.slug,
      phone: req.body.phone,
      email: req.body.email,
      profileImg: req.body.profileImg,
      role: req.body.role,
    },
    {
      new: true,
    }
  );

  if (!document) {
    return next(
      new ApiError(`No ${document} for this id ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ data: document });
});

const changeUserPassword = asyncHandler(async (req, res, next) => {
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );

  if (!document) {
    return next(
      new ApiError(`No ${document} for this id ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ data: document });
});

// @desc    Delete specific user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
const deleteUser = deletehandler(User);

// @desc    Get Logged user data
// @route   GET /api/v1/users/getMe
// @access  Private/Protect
const getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

// @desc    Update logged user password
// @route   PUT /api/v1/users/updateMyPassword
// @access  Private/Protect
const updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  // Update user password based on user payload (req.user._id)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );

  // Generate token
  const { accessToken, refreshToken } = generateTokens(user._id);
  setTokenCookie(res, refreshToken);

  // Delete password from response
  delete user._doc.password;

  res.status(200).json({ data: user, accessToken });
});

// @desc    Update logged user data (without password, role)
// @route   PUT /api/v1/users/updateMe
// @access  Private/Protect
const updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
    },
    { new: true }
  );

  res.status(200).json({ data: updatedUser });
});

// @desc    Deactivate logged user
// @route   DELETE /api/v1/users/deleteMe
// @access  Private/Protect
const deleteLoggedUserData = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({ status: 'Success' });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getLoggedUserData,
  updateLoggedUserPassword,
  updateLoggedUserData,
  deleteLoggedUserData,
  changeUserPassword,
  uploadUserImage,
  resizeImage,
};
