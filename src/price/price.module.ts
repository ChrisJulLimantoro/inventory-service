import { Module } from '@nestjs/common';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';
import { PriceRepository } from 'src/repositories/price.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { SharedModule } from 'src/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [PriceController],
  providers: [PriceService, PriceRepository, PrismaService],
})
export class PriceModule {}
