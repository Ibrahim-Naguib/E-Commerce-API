const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const dbConnection = require('./config/database');
const ApiError = require('./utils/apiError');
const globalError = require('./middlewares/errorMiddleware');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const categoryRoute = require('./routes/categoryRoute');
const subCategoryRoute = require('./routes/subCategoryRoute');
const brandRoute = require('./routes/brandRoute');
const productRoute = require('./routes/productRoute');
const userRoute = require('./routes/userRoute');
const authRoute = require('./routes/authRoute');
const couponRoute = require('./routes/couponRoute');
const cartRoute = require('./routes/cartRoute');

dotenv.config({
  path: 'config.env',
});

dbConnection();

const corsOptions = {
  origin: 'http://localhost:3000', // Specify your frontend's origin
  credentials: true,               // Allow credentials (cookies) to be sent
};

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(cookieParser());
app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log('Mode:', process.env.NODE_ENV);
}

app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/subcategories', subCategoryRoute);
app.use('/api/v1/brands', brandRoute);
app.use('/api/v1/products', productRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/cart', cartRoute);
app.use('/api/v1/coupons', couponRoute);

app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server`, 400));
});

// Global error handler
app.use(globalError);

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandledRejection outside of express
process.on('unhandledRejection', (err) => {
  console.error(`UnhandledRejection Error: ${err.name} | ${err.message}`);
  server.close(() => {
    console.log('Shutting down...');
    process.exit(1);
  });
});
