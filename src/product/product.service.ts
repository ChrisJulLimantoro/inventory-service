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
    @Inject('MARKETPLACE') private readonly marketplaceClient: ClientProxy,
    @Inject('FINANCE') private readonly financeClient: ClientProxy,
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

  async getProductCodeOut(
    filter?: Record<string, any>,
    store_id?: string,
    page?: number,
    limit?: number,
  ) {
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
    try {
      page = Number(page) ?? 0;
      limit = Number(limit) ?? 0;
    } catch (e) {
      page = 0;
      limit = 0;
    }
    const { data: codes } = await this.productCodeRepository.findAll(
      filter,
      page,
      limit,
    );
    console.log(codes);
    const data = codes.map((code) => {
      return {
        id: code.id,
        barcode: code.barcode,
        name: `${code.barcode} - ${code.product.name}`,
        price: store.is_float_price
          ? code.product.type.prices[0].price
          : code.fixed_price,
        taken_out_at: code.taken_out_at,
        taken_out_reason: code.taken_out_reason,
        weight: code.weight,
        type: `${code.product.type.code} - ${code.product.type.category.name}`,
        status: code.status,
      };
    });
    console.log(data);
    return CustomResponse.success('Product codes retrieved!', data, 200);
  }

  async productCodeOut(data: Record<string, any>) {
    const { date, taken_out_reason, codes, auth, params } = data;
    try {
      await this.prisma.$transaction(async (prisma) => {
        for (const item of codes) {
          const code = await this.productCodeRepository.findOne(item.id);
          if (!code) {
            throw new Error(`Product code ${item.id} is invalid`); // item.id, because code is undefined
          }
          console.log(code.status);
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
            taken_out_reason: Number(taken_out_reason),
            taken_out_by: params.user.id,
          });
          // Add stock mutation (ELLA)
          this.financeClient.emit({ cmd: 'stock_out' }, { productCode: code, reason: Number(taken_out_reason), trans_date: new Date(date) });
        }
      });
    } catch (e) {
      console.error(e.message);
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
      this.marketplaceClient.emit(
        {
          module: 'product',
          action: 'updateProductCode',
        },
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
        taken_out_by: null,
        taken_out_reason: 0,
      });
    } catch (e) {
      return CustomResponse.error(e.message, null, 400);
    }
    // Add stock mutation (ELLA)
    this.financeClient.emit({ cmd: 'unstock_out' }, { productCode: code });

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
    this.marketplaceClient.emit(
      {
        module: 'product',
        action: 'updateProductCode',
      },
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
    return CustomResponse.success('Product code deleted!', code, 200);
  }

  async getAllProductCode(filter: Record<string, any>) {
    const codes = await this.productCodeRepository.findAll(filter);
    return CustomResponse.success('Product codes retrieved!', codes, 200);
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

  async productCodeRepaired(data: Record<string, any>) {
    const { auth, owner_id, weight, expense, id , params, account_id } = data;
    try {
      await this.prisma.$transaction(async (prisma) => {
        const code = await this.productCodeRepository.findOne(id);
        if (!code) {
          throw new Error(`Product code ${id} is invalid`); // item.id, because code is undefined
        }
        if (code.product.store_id !== auth.store_id) {
          throw new Error(
            `Product code ${code.barcode} is not in this store`,
          );
        }
        // TODOCEJE UPDATE STATUS
        // await this.productCodeRepository.update(id, {
        //   status: 0,
        // });
        // Add stock mutation (ELLA)
        this.financeClient.emit({ cmd: 'stock_repaired' }, { productCode: code, trans_date: new Date(), account_id, weight, expense });
      });
    } catch (e) {
      console.error(e.message);
      return CustomResponse.error(e.message, null, 400);
    }

    // FOR SYNC to other service TODOCEJE product code updated
    // const code = await this.productCodeRepository.findOne(id);
    // this.transactionClient.emit(
    //   { cmd: 'product_code_updated' },
    //   {
    //     id: id,
    //     barcode: code.barcode,
    //     product_id: code.product_id,
    //     status: code.status,
    //     weight: code.weight,
    //     fixed_price: code.fixed_price,
    //     taken_out_at: code.taken_out_at,
    //   },
    // );
    // this.marketplaceClient.emit(
    //   {
    //     module: 'product',
    //     action: 'updateProductCode',
    //   },
    //   {
    //     id: id,
    //     barcode: code.barcode,
    //     product_id: code.product_id,
    //     status: code.status,
    //     weight: code.weight,
    //     fixed_price: code.fixed_price,
    //     taken_out_at: code.taken_out_at,
    //   },
    // );

    return CustomResponse.success('Product code out!', null, 200);
  }
}
