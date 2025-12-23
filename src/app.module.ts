import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TwoFactorModule } from './two-factor/two-factor.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { AdminModule } from './admin/admin.module';
import { FilesModule } from './files/files.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GithubModule } from './github/github.module';
import { MilestonesModule } from './milestones/milestones.module';
import { SprintsModule } from './sprints/sprints.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { TemplatesModule } from './templates/templates.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { TeamsModule } from './teams/teams.module';
import { SearchModule } from './search/search.module';
import { DelegationsModule } from './delegations/delegations.module';
import { AuditModule } from './audit/audit.module';
import { InvitationsModule } from './invitations/invitations.module';
import { WebSocketModule } from './websocket/websocket.module';
import { ReportsModule } from './reports/reports.module';
import { CronService } from './services/cron.service';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' }
    }),
    PassportModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads'
    }),
    PrismaModule,
    AuthModule,
    TwoFactorModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    AdminModule,
    FilesModule,
    NotificationsModule,
    AnalyticsModule,
    GithubModule,
    MilestonesModule,
    SprintsModule,
    TimeTrackingModule,
    TemplatesModule,
    WorkflowsModule,
    CollaborationModule,
    TeamsModule,
    SearchModule,
    DelegationsModule,
    AuditModule,
    InvitationsModule,
    WebSocketModule,
    ReportsModule
  ],
  providers: [
    CronService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor
    }
  ]
})
export class AppModule {}
