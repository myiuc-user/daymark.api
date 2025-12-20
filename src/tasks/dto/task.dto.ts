export interface CreateTaskDto {
  title: string;
  description?: string;
  type: 'BUG' | 'FEATURE' | 'TASK' | 'IMPROVEMENT' | 'OTHER';
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'VALIDATED' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  projectId: string;
  assigneeId?: string;
  due_date?: string;
  storyPoints?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  type?: 'BUG' | 'FEATURE' | 'TASK' | 'IMPROVEMENT' | 'OTHER';
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'VALIDATED' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeId?: string;
  due_date?: string;
  storyPoints?: number;
}