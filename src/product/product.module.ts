import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from 'src/repositories/product.repository';
import { ProductCodeRepository } from 'src/repositories/product-code.repository';
import { QrModule } from 'src/qr/qr.module';

@Module({
  imports: [ QrModule],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, ProductCodeRepository],
  exports: [ProductService],
})
export class ProductModule {}
