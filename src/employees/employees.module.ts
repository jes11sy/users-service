import { Module, forwardRef } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MastersModule } from '../masters/masters.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => MastersModule), // ✅ Импортируем MastersModule для использования MastersService
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
