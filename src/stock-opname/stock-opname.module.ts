import { Module } from '@nestjs/common';
import { StockOpnameController } from './stock-opname.controller';
import { StockOpnameService } from './stock-opname.service';
import { StockOpnameDetailRepository } from 'src/repositories/stock-opname-detail.repository';
import { StockOpnameRepository } from 'src/repositories/stock-opname.repository';
import { ProductCodeRepository } from 'src/repositories/product-code.repository';
import { ProductModule } from 'src/product/product.module';

@Module({
  imports: [ProductModule],
  controllers: [StockOpnameController],
  providers: [
    StockOpnameService,
    StockOpnameRepository,
    StockOpnameDetailRepository,
    ProductCodeRepository,
  ],
})
export class StockOpnameModule {}
