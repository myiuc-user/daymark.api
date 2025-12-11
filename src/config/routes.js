import authRoutes from '../routes/authRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import workspaceRoutes from '../routes/workspaceRoutes.js';
import invitationRoutes from '../routes/invitationRoutes.js';
import projectRoutes from '../routes/projectRoutes.js';
import taskRoutes from '../routes/taskRoutes.js';
import commentRoutes from '../routes/commentRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import fileRoutes from '../routes/fileRoutes.js';
import notificationRoutes from '../routes/notificationRoutes.js';
import analyticsRoutes from '../routes/analyticsRoutes.js';
import githubRoutes from '../routes/githubRoutes.js';
import milestoneRoutes from '../routes/milestoneRoutes.js';
import sprintRoutes from '../routes/sprintRoutes.js';
import timeTrackingRoutes from '../routes/timeTrackingRoutes.js';
import templateRoutes from '../routes/templateRoutes.js';
import workflowRoutes from '../routes/workflowRoutes.js';
import collaborationRoutes from '../routes/collaborationRoutes.js';
import teamRoutes from '../routes/teamRoutes.js';
import searchRoutes from '../routes/searchRoutes.js';
import delegationRoutes from '../routes/delegationRoutes.js';
import auditRoutes from '../routes/auditRoutes.js';

export const routes = [
  { path: '/auth', router: authRoutes },
  { path: '/users', router: userRoutes },
  { path: '/workspaces', router: workspaceRoutes },
  { path: '/invitations', router: invitationRoutes },
  { path: '/projects', router: projectRoutes },
  { path: '/tasks', router: taskRoutes },
  { path: '/comments', router: commentRoutes },
  { path: '/admin', router: adminRoutes },
  { path: '/files', router: fileRoutes },
  { path: '/notifications', router: notificationRoutes },
  { path: '/analytics', router: analyticsRoutes },
  { path: '/github', router: githubRoutes },
  { path: '/milestones', router: milestoneRoutes },
  { path: '/sprints', router: sprintRoutes },
  { path: '/time-entries', router: timeTrackingRoutes },
  { path: '/templates', router: templateRoutes },
  { path: '/workflows', router: workflowRoutes },
  { path: '/collaboration', router: collaborationRoutes },
  { path: '/teams', router: teamRoutes },
  { path: '/search', router: searchRoutes },
  { path: '/delegations', router: delegationRoutes },
  { path: '/audit', router: auditRoutes },
];
