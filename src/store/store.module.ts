import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { StoreRepository } from 'src/repositories/store.repository';

@Module({
  controllers: [StoreController],
  providers: [StoreService, StoreRepository],
})
export class StoreModule {}
