import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'src/base.service';
import { ProductRepository } from 'src/repositories/product.repository';
import { ValidationService } from 'src/validation/validation.service';
import { CreateProductRequest } from './dto/create-product.dto';
import { UpdateProductRequest } from './dto/update-product.dto';
import { ProductCodeRepository } from 'src/repositories/product-code.repository';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { CreateProductCodeDto } from './dto/create-productCode.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProductCodeDto } from './dto/update-productCode.dto';
import { QrService } from 'src/qr/qr.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ProductService extends BaseService {
  protected repository = this.productRepository;
  protected createSchema = CreateProductRequest.schema();
  protected updateSchema = UpdateProductRequest.schema();

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productCodeRepository: ProductCodeRepository,
    protected readonly validation: ValidationService,
    protected readonly prisma: PrismaService,
    protected readonly qrService: QrService,
    @Inject('TRANSACTION') private readonly transactionClient: ClientProxy,
  ) {
    super(validation);
  }

  protected transformCreateData(data: any) {
    return new CreateProductRequest(data);
  }

  protected transformUpdateData(data: any) {
    return new UpdateProductRequest(data);
  }

  async create(data: any): Promise<CustomResponse> {
    // Generate Code
    const TypeCode = await this.repository.getTypeCode(data.type_id);
    if (!TypeCode) {
      return CustomResponse.error('Type not Found!', null, 500);
    }
    // count
    const count = await this.repository.count();
    data.code = `${TypeCode.code}${(count + 1).toString().padStart(4, '0')}`;

    return super.create(data);
  }

  async getProductCodes(product_id: any) {
    const codes = await this.productCodeRepository.findAll({
      product_id: product_id,
      deleted_at: null,
    });
    return CustomResponse.success('Product codes retrieved!', codes, 200);
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
    data = { ...data, barcode: barcode, product_id: product_id };
    data = new CreateProductCodeDto(data);
    console.log(data);
    const validated = this.validation.validate(
      data,
      CreateProductCodeDto.schema(),
    );
    const code = await this.productCodeRepository.create(validated);
    return CustomResponse.success('Product code generated!', code, 201);
  }

  async getProductCodeOut(filter?: Record<string, any>, store_id?: string) {
    filter = filter || {};
    filter.status = 3;
    const store = await this.prisma.store.findUnique({
      where: {
        id: store_id,
        deleted_at: null,
        is_active: true,
      },
      select: {
        id: true,
        is_active: true,
        is_flex_price: true,
        is_float_price: true,
      },
    });
    if (!store) {
      throw new Error('Store not found');
    }
    const codes = await this.productCodeRepository.findAll(filter);
    const data = codes.map((code) => {
      return {
        id: code.id,
        barcode: code.barcode,
        name: `${code.barcode} - ${code.product.name}`,
        price: store.is_float_price
          ? code.product.type.prices[0].price
          : code.fixed_price,
        taken_out_at: code.taken_out_at,
        weight: code.weight,
        type: `${code.product.type.code} - ${code.product.type.category.name}`,
        status: code.status,
      };
    });
    console.log(data);
    return CustomResponse.success('Product codes retrieved!', data, 200);
  }

  async productCodeOut(data: Record<string, any>) {
    const { date, reason, codes, auth } = data;
    try {
      await this.prisma.$transaction(async (prisma) => {
        for (const item of codes) {
          const code = await this.productCodeRepository.findOne(item.id);
          if (!code) {
            throw new Error(`Product code ${item.id} is invalid`); // item.id, because code is undefined
          }
          if (code.status !== 0) {
            throw new Error(`Product code ${code.barcode} is not available`);
          }
          if (code.product.store_id !== auth.store_id) {
            throw new Error(
              `Product code ${code.barcode} is not in this store`,
            );
          }
          await this.productCodeRepository.update(item.id, {
            status: 3,
            taken_out_at: new Date(date),
          });
          // TODO: Add stock mutation (ELLA)
        }
      });
    } catch (e) {
      return CustomResponse.error(e.message, null, 400);
    }

    // FOR SYNC to other service
    for (const item of codes) {
      const code = await this.productCodeRepository.findOne(item.id);
      this.transactionClient.emit(
        { cmd: 'product_code_updated' },
        {
          id: item.id,
          barcode: code.barcode,
          product_id: code.product_id,
          status: code.status,
          weight: code.weight,
          fixed_price: code.fixed_price,
          taken_out_at: code.taken_out_at,
        },
      );
    }

    return CustomResponse.success('Product code out!', null, 200);
  }

  async unstockOut(id: string) {
    const code = await this.productCodeRepository.findOne(id);
    try {
      if (!code) {
        throw new Error('Product code not found');
      }
      if (code.status !== 3) {
        throw new Error('Product code not taken out');
      }
      await this.productCodeRepository.update(id, {
        status: 0,
        taken_out_at: null,
      });
    } catch (e) {
      return CustomResponse.error(e.message, null, 400);
    }
    // TODO: Add stock mutation (ELLA)

    // FOR SYNC to other service
    this.transactionClient.emit(
      { cmd: 'product_code_updated' },
      {
        id: code.id,
        barcode: code.barcode,
        product_id: code.product_id,
        status: 0,
        weight: code.weight,
        fixed_price: code.fixed_price,
        taken_out_at: null,
      },
    );
    return CustomResponse.success('Product code unstocked!', null, 200);
  }

  async generateQRCode(product_code_id: any) {
    const code = await this.productCodeRepository.findOne(product_code_id);
    if (!code) {
      throw new Error('Product code not found');
    }
    const qr_code_data = `${code.barcode};${code.id}`;
    const qr = await this.qrService.generateQRCode(qr_code_data);
    return CustomResponse.success('QR Product code generated!', qr, 200);
  }

  async updateProductCode(id: string, data: any): Promise<CustomResponse> {
    const code = await this.productCodeRepository.findOne(id);
    if (!code) {
      throw new Error('Product code not found');
    }
    const validated = new UpdateProductCodeDto(data);
    const updateData = this.validation.validate(
      validated,
      UpdateProductCodeDto.schema(),
    );
    await this.productCodeRepository.update(id, updateData);
    return CustomResponse.success('Product code updated!', null, 200);
  }

  async deleteProductCode(id: any) {
    const code = await this.productCodeRepository.findOne(id);
    if (!code) {
      throw new Error('Product code not found');
    }
    await this.productCodeRepository.delete(id);
    return CustomResponse.success('Product code deleted!', null, 200);
  }

  async getProductCode(barcode: string, store_id: string) {
    const code = await this.productCodeRepository.getProductCode(barcode);
    const store = await this.prisma.store.findUnique({
      where: {
        id: store_id,
        deleted_at: null,
        is_active: true,
      },
      select: {
        id: true,
        is_active: true,
        is_flex_price: true,
        is_float_price: true,
      },
    });
    if (!code) {
      throw new Error('Product code not found');
    }
    if (!store) {
      throw new Error('Store not found');
    }
    const data = {
      id: code.id,
      barcode: code.barcode,
      name: `${code.barcode} - ${code.product.name}`,
      price: store.is_float_price
        ? code.product.type.prices[0].price
        : code.fixed_price,
      weight: code.weight,
      type: `${code.product.type.code} - ${code.product.type.category.name}`,
      status: code.status,
    };
    return CustomResponse.success('Product code retrieved!', data, 200);
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
      },
    ];
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
    ];

    return CustomResponse.success('Stock mutation fetched!', data, 200);
  }
}
