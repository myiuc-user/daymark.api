import { 
  authenticateUser, 
  generateTokens, 
  getCurrentUser, 
  verifyRefreshToken 
} from '../services/authService.js';
import { validateRequest, loginSchema } from '../utils/validation.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000
});

export const authController = {
  login: asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await authenticateUser(email, password);
    if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    
    const { accessToken, refreshToken } = generateTokens(user.id);
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  }),

  getMe: asyncHandler(async (req, res, next) => {
    const user = await getCurrentUser(req.user.id);
    res.json({ user });
  }),

  refresh: asyncHandler(async (req, res, next) => {
    let refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) throw new AppError('No refresh token', 401, 'NO_REFRESH_TOKEN');

    const decoded = verifyRefreshToken(refreshToken);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
    res.cookie('refreshToken', newRefreshToken, getCookieOptions());

    res.json({ accessToken, refreshToken: newRefreshToken });
  }),

  logout: asyncHandler(async (req, res, next) => {
    res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ message: 'Logged out successfully' });
  })
};
