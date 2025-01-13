import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DiscoveryModule } from '@nestjs/core';
import { ValidationModule } from './validation/validation.module';
import { PrismaModule } from './prisma/prisma.module';
import { MessagePatternDiscoveryService } from './discovery/message-pattern-discovery.service';
import { CategoryModule } from './category/category.module';
import { TypeModule } from './type/type.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [DiscoveryModule, ValidationModule.forRoot(), PrismaModule, CategoryModule, TypeModule, ProductModule],
  controllers: [AppController],
  providers: [MessagePatternDiscoveryService],
})
export class AppModule {}
