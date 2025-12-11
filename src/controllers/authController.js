import { 
  authenticateUser, 
  generateTokens, 
  getCurrentUser
} from '../services/authService.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

export const authController = {
  login: asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await authenticateUser(email, password);
    if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    
    const { accessToken } = generateTokens(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken
    });
  }),

  getMe: asyncHandler(async (req, res, next) => {
    const user = await getCurrentUser(req.user.id);
    res.json({ user });
  }),

  logout: asyncHandler(async (req, res, next) => {
    res.json({ message: 'Logged out successfully' });
  })
};
