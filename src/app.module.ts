import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DiscoveryModule } from '@nestjs/core';
import { ValidationModule } from './validation/validation.module';
import { PrismaModule } from './prisma/prisma.module';
import { MessagePatternDiscoveryService } from './discovery/message-pattern-discovery.service';
import { CategoryModule } from './category/category.module';
import { TypeModule } from './type/type.module';
import { ProductModule } from './product/product.module';
import { PriceModule } from './price/price.module';
import { CompanyModule } from './company/company.module';
import { StoreModule } from './store/store.module';
import { OperationModule } from './operation/operation.module';
import { AccountModule } from './account/account.module';
import { QrModule } from './qr/qr.module';
import { StockOpnameModule } from './stock-opname/stock-opname.module';

@Module({
  imports: [
    DiscoveryModule,
    ValidationModule.forRoot(),
    PrismaModule,
    CategoryModule,
    TypeModule,
    ProductModule,
    PriceModule,
    CompanyModule,
    StoreModule,
    OperationModule,
    AccountModule,
    QrModule,
    StockOpnameModule,
  ],
  controllers: [AppController],
  providers: [MessagePatternDiscoveryService],
})
export class AppModule {}
