import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.workflowState.findMany({ where: { projectId } });
  }

  async create(data: any) {
    return this.prisma.workflowState.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.workflowState.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.workflowState.delete({ where: { id } });
  }

  async initProjectWorkflow(projectId: string) {
    const defaultStates = ['TODO', 'IN_PROGRESS', 'DONE'];
    const states = await Promise.all(
      defaultStates.map(state =>
        this.prisma.workflowState.create({
          data: { projectId, name: state, order: defaultStates.indexOf(state) }
        })
      )
    );
    return states;
  }
}
