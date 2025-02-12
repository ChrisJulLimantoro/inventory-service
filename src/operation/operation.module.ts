import { Module } from '@nestjs/common';
import { OperationController } from './operation.controller';
import { OperationService } from './operation.service';
import { OperationRepository } from 'src/repositories/operation.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { SharedModule } from 'src/shared.module';
import { StoreRepository } from 'src/repositories/store.repository';

@Module({
  imports: [SharedModule],
  controllers: [OperationController],
  providers: [
    OperationService,
    OperationRepository,
    PrismaService,
    StoreRepository,
  ],
})
export class OperationModule {}
