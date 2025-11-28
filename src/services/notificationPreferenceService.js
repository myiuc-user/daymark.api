import prisma from '../config/prisma.js';

export const notificationPreferenceService = {
  getPreferences: async (userId) => {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId }
      });
    }

    return prefs;
  },

  updatePreferences: async (userId, data) => {
    return await prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data }
    });
  }
};
