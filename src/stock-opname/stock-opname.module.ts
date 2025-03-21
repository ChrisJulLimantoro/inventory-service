import { Module } from '@nestjs/common';
import { StockOpnameController } from './stock-opname.controller';
import { StockOpnameService } from './stock-opname.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StockOpnameDetailRepository } from 'src/repositories/stock-opname-detail.repository';
import { StockOpnameRepository } from 'src/repositories/stock-opname.repository';
import { ProductCodeRepository } from 'src/repositories/product-code.repository';
import { SharedModule } from 'src/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [StockOpnameController],
  providers: [
    StockOpnameService,
    StockOpnameRepository,
    StockOpnameDetailRepository,
    ProductCodeRepository,
    PrismaService,
  ],
})
export class StockOpnameModule {}
