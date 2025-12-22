import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private readonly taskInclude = {
    assignee: {
      select: { id: true, name: true, email: true, image: true }
    },
    createdBy: {
      select: { id: true, name: true, email: true }
    }
  };

  async findAll(projectId: string) {
    const tasks = await this.prisma.task.findMany({ 
      where: { projectId },
      include: this.taskInclude
    });
    return { tasks: tasks || [] };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ 
      where: { id },
      include: this.taskInclude
    });
    if (!task) {
      throw new Error('Task not found');
    }
    return { task };
  }

  async create(createTaskDto: CreateTaskDto, createdById: string) {
    const taskData = this.prepareTaskData(createTaskDto, createdById);
    
    const task = await this.prisma.task.create({ 
      data: taskData,
      include: this.taskInclude
    });
    
    // Create history entry for task creation
    await this.createHistoryEntry(task.id, 'CREATED', 'Task created', createdById, null, task);
    
    return { task };
  }

  private prepareTaskData(data: CreateTaskDto, createdById: string) {
    const taskData: any = {
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      projectId: data.projectId,
      createdById,
      status: !data.due_date ? 'TODO' : (data.status || 'IN_PROGRESS'),
      due_date: data.due_date ? new Date(data.due_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    
    if (data.assigneeId) {
      taskData.assigneeId = data.assigneeId;
    }
    
    if (data.storyPoints !== undefined) {
      taskData.storyPoints = data.storyPoints;
    }
    
    return taskData;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    // Get current task for comparison
    const currentTask = await this.prisma.task.findUnique({ where: { id } });
    if (!currentTask) throw new Error('Task not found');
    
    const task = await this.prisma.task.update({ 
      where: { id }, 
      data: updateTaskDto,
      include: this.taskInclude
    });
    
    // Create history entries for changes
    await this.createUpdateHistoryEntries(id, currentTask, updateTaskDto, task.updatedAt);
    
    return { task };
  }

  async delete(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  async executeRecurringTasks() {
    // Implement recurring tasks logic
    return { message: 'Recurring tasks executed' };
  }

  async findAllByWorkspace(workspaceId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { project: { workspaceId } },
      include: this.taskInclude
    });
    return { tasks: tasks || [] };
  }

  async getComments(taskId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    return { comments };
  }

  async createComment(taskId: string, data: any, userId: string) {
    const comment = await this.prisma.comment.create({
      data: {
        content: data.content,
        taskId,
        userId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });
    return { comment };
  }

  async getSubtasks(taskId: string) {
    const subtasks = await this.prisma.task.findMany({
      where: { parentTaskId: taskId },
      include: this.taskInclude
    });
    return { subtasks };
  }

  async createSubtask(parentTaskId: string, data: any, createdById: string) {
    const subtask = await this.prisma.task.create({
      data: {
        ...data,
        parentTaskId,
        createdById,
        status: 'TODO'
      },
      include: this.taskInclude
    });
    
    // Create history entry for subtask creation
    await this.createHistoryEntry(parentTaskId, 'SUBTASK_ADDED', `Subtask "${data.title}" added`, createdById);
    
    return { subtask };
  }

  async toggleArchive(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { isArchived: !task.isArchived }
    });
    
    // Create history entry
    await this.createHistoryEntry(
      taskId,
      updatedTask.isArchived ? 'ARCHIVED' : 'UNARCHIVED',
      updatedTask.isArchived ? 'Task archived' : 'Task unarchived'
    );
    
    return { success: true, isArchived: updatedTask.isArchived };
  }

  async toggleFavorite(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { isFavorite: !task.isFavorite }
    });
    
    // Create history entry
    await this.createHistoryEntry(
      taskId,
      updatedTask.isFavorite ? 'FAVORITED' : 'UNFAVORITED',
      updatedTask.isFavorite ? 'Task marked as favorite' : 'Task removed from favorites'
    );
    
    return { success: true, isFavorite: updatedTask.isFavorite };
  }

  async getTimeEntries(taskId: string) {
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { timeEntries };
  }

  async addTimeEntry(taskId: string, data: any, userId: string) {
    const timeEntry = await this.prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        hours: data.hours,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    return { timeEntry };
  }

  async getWatchers(taskId: string) {
    const watchers = await this.prisma.taskWatcher.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });
    return { watchers };
  }

  async addWatcher(taskId: string, userId: string) {
    const watcher = await this.prisma.taskWatcher.create({
      data: { taskId, userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });
    return { success: true, watcher };
  }

  async removeWatcher(taskId: string, userId: string) {
    await this.prisma.taskWatcher.deleteMany({
      where: {
        taskId,
        userId
      }
    });
    return { success: true };
  }

  private async createHistoryEntry(taskId: string, action: string, description: string, userId?: string, oldValue?: any, newValue?: any) {
    await this.prisma.taskHistory.create({
      data: {
        taskId,
        action,
        description,
        userId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        createdAt: new Date()
      }
    });
  }

  private async createUpdateHistoryEntries(taskId: string, oldTask: any, updates: any, userId?: string) {
    const changes = [];
    
    if (updates.title && updates.title !== oldTask.title) {
      changes.push({ field: 'title', old: oldTask.title, new: updates.title });
    }
    if (updates.status && updates.status !== oldTask.status) {
      changes.push({ field: 'status', old: oldTask.status, new: updates.status });
    }
    if (updates.priority && updates.priority !== oldTask.priority) {
      changes.push({ field: 'priority', old: oldTask.priority, new: updates.priority });
    }
    if (updates.assigneeId !== undefined && updates.assigneeId !== oldTask.assigneeId) {
      changes.push({ field: 'assignee', old: oldTask.assigneeId, new: updates.assigneeId });
    }
    
    for (const change of changes) {
      await this.createHistoryEntry(
        taskId,
        'UPDATED',
        `${change.field} changed from "${change.old || 'None'}" to "${change.new || 'None'}"`,
        userId,
        change.old,
        change.new
      );
    }
  }

  async getHistory(taskId: string) {
    const history = await this.prisma.taskHistory.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { history };
  }
}
