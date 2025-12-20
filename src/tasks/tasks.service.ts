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
    return { task };
  }

  async create(createTaskDto: CreateTaskDto, createdById: string) {
    const taskData = this.prepareTaskData(createTaskDto, createdById);
    
    const task = await this.prisma.task.create({ 
      data: taskData,
      include: this.taskInclude
    });
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
    const task = await this.prisma.task.update({ 
      where: { id }, 
      data: updateTaskDto,
      include: this.taskInclude
    });
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
}
