const jwt = require('jsonwebtoken');

const generateTokens = (payload) => {
  const accessToken = jwt.sign(
    { userId: payload },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_EXPIRE_TIME,
    }
  );

  const refreshToken = jwt.sign(
    { userId: payload },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.REFRESH_EXPIRE_TIME,
    }
  );

  return { accessToken, refreshToken };
};

const setTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearTokenCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  };

  res.clearCookie('refreshToken', cookieOptions);
};

module.exports = {
  generateTokens,
  setTokenCookie,
  clearTokenCookies,
};
