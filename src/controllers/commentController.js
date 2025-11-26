import { commentService } from '../services/commentService.js';

export const commentController = {
  getComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const comment = await commentService.getCommentById(commentId);
      
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      res.json({ comment });
    } catch (error) {
      console.error('Get comment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      const comment = await commentService.getCommentById(commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedComment = await commentService.updateComment(commentId, content);
      res.json({ comment: updatedComment });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const { commentId } = req.params;

      const comment = await commentService.getCommentById(commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await commentService.deleteComment(commentId);
      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
