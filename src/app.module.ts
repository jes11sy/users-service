import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MastersModule } from './masters/masters.module';
import { DirectorsModule } from './directors/directors.module';
import { OperatorsModule } from './operators/operators.module';
import { EmployeesModule } from './employees/employees.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      path: '/metrics',
    }),
    PrismaModule,
    AuthModule,
    MastersModule,
    DirectorsModule,
    OperatorsModule,
    EmployeesModule,
    UsersModule,
  ],
})
export class AppModule {}


