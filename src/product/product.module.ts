import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from 'src/repositories/product.repository';
import { SharedModule } from 'src/shared.module';
import { ProductCodeRepository } from 'src/repositories/product-code.repository';
import { QrModule } from 'src/qr/qr.module';

@Module({
  imports: [SharedModule, QrModule],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, ProductCodeRepository],
  exports: [ProductService],
})
export class ProductModule {}
