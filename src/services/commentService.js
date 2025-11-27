import prisma from '../config/prisma.js';

export const commentService = {
  getCommentById: async (commentId) => {
    return await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  updateComment: async (commentId, content) => {
    return await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  deleteComment: async (commentId) => {
    return await prisma.comment.delete({
      where: { id: commentId }
    });
  }
};
