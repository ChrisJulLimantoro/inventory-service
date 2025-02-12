import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/base.service';
import { ProductRepository } from 'src/repositories/product.repository';
import { ValidationService } from 'src/validation/validation.service';
import { CreateProductRequest } from './dto/create-product.dto';
import { UpdateProductRequest } from './dto/update-product.dto';
import { ProductCodeRepository } from 'src/repositories/product-code.repository';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';

@Injectable()
export class ProductService extends BaseService {
  protected repository = this.productRepository;
  protected createSchema = CreateProductRequest.schema();
  protected updateSchema = UpdateProductRequest.schema();

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productCodeRepository: ProductCodeRepository,
    protected readonly validation: ValidationService,
  ) {
    super(validation);
  }

  protected transformCreateData(data: any) {
    return new CreateProductRequest(data);
  }

  protected transformUpdateData(data: any) {
    return new UpdateProductRequest(data);
  }

  async generateProductCode(product_id: any, data: any) {
    const product = await this.productRepository.findOne(product_id);
    if (!product) {
      throw new Error('Product not found');
    }
    const count_codes = await this.productCodeRepository.count({
      product_id: product_id,
    });
    const barcode = `${product.code}${(count_codes + 1).toString().padStart(4, '0')}`; // logic for barcode
    const code = await this.productCodeRepository.create({
      product_id: product_id,
      barcode: barcode,
      weight: data.weight,
    });
    return CustomResponse.success('Product code generated!', code, 201);
  }

  async getStockCard(filters: any) {
    const data = [
      {
        code: 'P001',
        name: 'Product 1',
        category_id: 'Category',
        initial_stock: 10,
        initial_stock_gram: 100,
        incoming_basic_goods: 5,
        incoming_basic_goods_gram: 50,
        sales: 2,
        sales_gram: 20,
        outgoing_basic_goods: 1,
        outgoing_basic_goods_gram: 10,
        purchase: 2,
        purchase_gram: 20,
        tukar_tambah_tukar_kurang: 0,
        final_stock: 12,
        final_stock_gram: 120,
        unit_price_per_gram: 1000,
        total_price_rp: 120000,
      }
    ]
    return CustomResponse.success('Stock card fetched!', data, 200);
  }

  async getStockMutation(filters: any) {
    const data = [
      {
        date: '2021-01-01',
        code: 'P001',
        name: 'Product 1',
        description: 'Initial stock',
        in: 10,
        out: 0,
        balance: 10,
      },
      {
        date: '2021-01-01',
        code: 'P001',
        name: 'Product 1',
        description: 'Incoming basic goods',
        in: 5,
        out: 0,
        balance: 15,
      },
      {
        date: '2021-01-01',
        code: 'P001',
        name: 'Product 1',
        description: 'Sales',
        in: 0,
        out: 2,
        balance: 13,
      },
      {
        date: '2021-01-01',
        code: 'P001',
        name: 'Product 1',
        description: 'Outgoing basic goods',
        in: 0,
        out: 1,
        balance: 12,
      },
      {
        date: '2021-01-01',
        code: 'P001',
        name: 'Product 1',
        description: 'Purchase',
        in: 2,
        out: 0,
        balance: 14,
      },
    ]

    return CustomResponse.success('Stock mutation fetched!', data, 200);
  }
}
