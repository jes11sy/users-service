import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MastersModule } from './masters/masters.module';
import { DirectorsModule } from './directors/directors.module';
import { OperatorsModule } from './operators/operators.module';
import { EmployeesModule } from './employees/employees.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    MastersModule,
    DirectorsModule,
    OperatorsModule,
    EmployeesModule,
  ],
})
export class AppModule {}


