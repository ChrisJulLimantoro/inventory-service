import { Module } from '@nestjs/common';
import { OperationController } from './operation.controller';
import { OperationService } from './operation.service';
import { OperationRepository } from 'src/repositories/operation.repository';
import { StoreRepository } from 'src/repositories/store.repository';

@Module({
  imports: [],
  controllers: [OperationController],
  providers: [OperationService, OperationRepository, StoreRepository],
})
export class OperationModule {}
