import { Injectable } from '@nestjs/common';
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
import { RmqHelper } from 'src/helper/rmq.helper';
import * as htmlPdf from 'html-pdf';
import { RpcException } from '@nestjs/microservices';

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
  ) {
    super(validation);
  }

  protected transformCreateData(data: any) {
    return new CreateProductRequest(data);
  }

  protected transformUpdateData(data: any) {
    return new UpdateProductRequest(data);
  }

  async create(data: any, user_id?: string): Promise<CustomResponse> {
    // Generate Code
    const TypeCode = await this.repository.getTypeCode(data.type_id);
    if (!TypeCode) {
      return CustomResponse.error('Type not Found!', null, 500);
    }
    // count
    const count = await this.repository.count();
    data.code = `${TypeCode.code}${(count + 1).toString().padStart(4, '0')}`;

    return super.create(data, user_id);
  }

  async delete(id: string, user_id?: string): Promise<CustomResponse> {
    const product = await this.productRepository.findOne(id);
    if (!product) {
      throw new RpcException('Product not found');
    }
    if (product.product_codes.some((code) => code.status > 0)) {
      throw new RpcException('There are some product codes still active!');
    }

    return super.delete(id, user_id);
  }

  async getProductCodes(product_id: any) {
    const codes = await this.productCodeRepository.findAll({
      product_id: product_id,
      deleted_at: null,
    });
    return CustomResponse.success('Product codes retrieved!', codes, 200);
  }

  async generateProductCode(product_id: any, data: any, user_id?: string) {
    const product = await this.productRepository.findOne(product_id);
    if (!product) {
      throw new RpcException('Product not found');
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
    const code = await this.productCodeRepository.create(validated, user_id);
    return CustomResponse.success('Product code generated!', code, 201);
  }

  async productCodeReplica(data: any, user_id?: string) {
    const createData = {
      id: data.id,
      barcode: data.barcode,
      product_id: data.product_id,
      status: data.status,
      weight: data.weight,
      fixed_price: data.fixed_price,
      buy_price: data.buy_price,
      taken_out_at: data.taken_out_at,
      taken_out_reason: data.taken_out_reason,
      taken_out_by: data.taken_out_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at,
    };
    const code = await this.productCodeRepository.create(createData, user_id);
    if (!code) {
      throw new RpcException('Failed to create product code');
    }
    return CustomResponse.success('Product code created!', code, 201);
  }

  async getProductCodeOut(
    filter?: Record<string, any>,
    store_id?: string,
    page?: number,
    limit?: number,
    sort?: Record<string, any>,
    search?: string,
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
      throw new RpcException('Store not found');
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
      sort,
      search,
    );
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
        buy_price: code.buy_price,
      };
    });
    return CustomResponse.success('Product codes retrieved!', data, 200);
  }

  private mergeDateWithCurrentTime(dateOnly: string | Date): Date {
    const now = new Date();
    const base = new Date(dateOnly); // tanggal dari user

    base.setHours(now.getHours());
    base.setMinutes(now.getMinutes());
    base.setSeconds(now.getSeconds());
    base.setMilliseconds(now.getMilliseconds());

    return base;
  }

  async productCodeOut(data: Record<string, any>, user_id?: string) {
    const { date, taken_out_reason, codes, auth, params } = data;
    try {
      await this.prisma.$transaction(async (prisma) => {
        for (const item of codes) {
          const code = await this.productCodeRepository.findOne(item.id);
          if (!code) {
            throw new RpcException(`Product code ${item.id} is invalid`); // item.id, because code is undefined
          }
          console.log(code.status);
          if (code.status !== 0) {
            throw new RpcException(
              `Product code ${code.barcode} is not available`,
            );
          }
          if (code.product.store_id !== auth.store_id) {
            throw new RpcException(
              `Product code ${code.barcode} is not in this store`,
            );
          }
          await this.productCodeRepository.update(
            item.id,
            {
              status: 3,
              taken_out_at: new Date(this.mergeDateWithCurrentTime(date)),
              taken_out_reason: Number(taken_out_reason),
              taken_out_by: params.user.id,
            },
            user_id,
          );
          // Add stock mutation (ELLA)
          RmqHelper.publishEvent('stock.out', {
            data: {
              productCode: code,
              reason: Number(taken_out_reason),
              trans_date: new Date(this.mergeDateWithCurrentTime(date)),
            },
          });
          // this.financeClient.emit(
          //   { cmd: 'stock_out' },
          //   {
          //     productCode: code,
          //     reason: Number(taken_out_reason),
          //     trans_date: new Date(date),
          //   },
          // );
        }
      });
    } catch (e) {
      console.error(e.message);
      return CustomResponse.error(e.message, null, 400);
    }

    // FOR SYNC to other service
    for (const item of codes) {
      const code = await this.productCodeRepository.findOne(item.id);
      // Product Code Out
      RmqHelper.publishEvent('product.code.out', {
        data: {
          id: item.id,
          barcode: code.barcode,
          product_id: code.product_id,
          status: code.status,
          weight: code.weight,
          fixed_price: code.fixed_price,
          taken_out_at: code.taken_out_at,
          buy_price: code.buy_price,
        },
        user: params.user.id,
      });
      RmqHelper.publishEvent('product.code.updated', {
        data: {
          id: item.id,
          barcode: code.barcode,
          product_id: code.product_id,
          status: code.status,
          weight: code.weight,
          fixed_price: code.fixed_price,
          taken_out_at: code.taken_out_at,
          buy_price: code.buy_price,
        },
        user: params.user.id,
      });
      // this.transactionClient.emit(
      //   { cmd: 'product_code_updated' },
      //   {
      //     id: item.id,
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
      //     id: item.id,
      //     barcode: code.barcode,
      //     product_id: code.product_id,
      //     status: code.status,
      //     weight: code.weight,
      //     fixed_price: code.fixed_price,
      //     taken_out_at: code.taken_out_at,
      //   },
      // );
    }

    return CustomResponse.success('Product code out!', null, 200);
  }

  async unstockOut(id: string, user_id?: string) {
    const code = await this.productCodeRepository.findOne(id);
    try {
      if (!code) {
        throw new RpcException('Product code not found');
      }
      if (code.status !== 3) {
        throw new RpcException('Product code not taken out');
      }
      await this.productCodeRepository.update(
        id,
        {
          status: 0,
          taken_out_at: null,
          taken_out_by: null,
          taken_out_reason: 0,
        },
        user_id,
      );
    } catch (e) {
      return CustomResponse.error(e.message, null, 400);
    }
    // Add stock mutation (ELLA)
    RmqHelper.publishEvent('stock.unstock.out', {
      data: code,
      user: user_id,
    });
    // this.financeClient.emit({ cmd: 'unstock_out' }, { productCode: code });

    // // FOR SYNC to other service
    RmqHelper.publishEvent('product.code.updated', {
      data: {
        id: code.id,
        barcode: code.barcode,
        product_id: code.product_id,
        status: 0,
        weight: code.weight,
        fixed_price: code.fixed_price,
        taken_out_at: null,
        buy_price: code.buy_price,
      },
      user: user_id,
    });
    // this.transactionClient.emit(
    //   { cmd: 'product_code_updated' },
    //   {
    //     id: code.id,
    //     barcode: code.barcode,
    //     product_id: code.product_id,
    //     status: 0,
    //     weight: code.weight,
    //     fixed_price: code.fixed_price,
    //     taken_out_at: null,
    //   },
    // );
    // this.marketplaceClient.emit(
    //   {
    //     module: 'product',
    //     action: 'updateProductCode',
    //   },
    //   {
    //     id: code.id,
    //     barcode: code.barcode,
    //     product_id: code.product_id,
    //     status: 0,
    //     weight: code.weight,
    //     fixed_price: code.fixed_price,
    //     taken_out_at: null,
    //   },
    // );
    return CustomResponse.success('Product code unstocked!', null, 200);
  }

  async generateQRCode(product_code_id: any) {
    const code = await this.productCodeRepository.findOne(product_code_id);
    if (!code) {
      throw new RpcException('Product code not found');
    }
    const qr_code_data = `${code.barcode};${code.id}`;
    const qr = await this.qrService.generateQRCode(qr_code_data);
    return CustomResponse.success('QR Product code generated!', qr, 200);
  }

  async printQRCode(product_id: any) {
    const product = await this.repository.findOne(product_id);
    if (!product) {
      throw new RpcException('Product not found');
    }

    await Promise.all(
      product.product_codes
        .filter((item) => item.deleted_at == null)
        .map(async (item) => {
          const qr_code_data = `${item.barcode};${item.id}`;
          const qr = await this.qrService.generateQRCode(qr_code_data);
          item.qr = qr;
        }),
    );

    // Ensure product has product codes
    if (product.product_codes.length === 0) {
      throw new RpcException('There are no product codes to print');
    }

    // Generate PDF
    const pdfBuffer = await this.generatePDF(
      product.product_codes,
      product.name,
      product.store.name,
    );

    return pdfBuffer; // Return the raw PDF buffer directly
  }

  async generatePDF(
    codes: any,
    product_name: string,
    store_name: string,
  ): Promise<Buffer> {
    const htmlContent = `
      <!doctype html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { width: 100%; }
            .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .table td { width: 20%; padding: 10px; text-align: center; border: 1px solid #000; }
            .qr-img { width: 60px; height: 60px; }
            .code-text { margin-top: 3px; font-size: 8px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            p { font-size: 12px; font-weight:bold; margin-bottom: 1px; }
          </style>
        </head>
        <body>
          <h2 class="title">Product Code QR</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Store: ${store_name}</p>
          <p>Product: ${product_name}</p>
          <div class="container">
            <table class="table">
              <tr>
                ${codes
                  .map((item, index) => {
                    const isNewRow = index % 5 === 0;
                    const isEndRow = (index + 1) % 5 === 0;
                    const qrCell = `
                      <td>
                        <img class="qr-img" src="${item.qr}" alt="QR Code" />
                        <div class="code-text">${item.barcode}</div>
                      </td>`;
                    return `${isNewRow ? '<tr>' : ''}${qrCell}${isEndRow ? '</tr>' : ''}`;
                  })
                  .join('')}
              </tr>
            </table>
          </div>
        </body>
      </html>`;

    const pdfOptions = {
      format: 'A4',
      orientation: 'portrait',
      border: '10mm',
    };

    return new Promise((resolve, reject) => {
      htmlPdf.create(htmlContent, pdfOptions).toBuffer((err, buffer) => {
        if (err) return reject(err);
        resolve(buffer);
      });
    });
  }

  async updateProductCode(
    id: string,
    data: any,
    user_id?: string,
  ): Promise<CustomResponse> {
    const code = await this.productCodeRepository.findOne(id);
    if (!code) {
      throw new RpcException('Product code not found');
    }
    const validated = new UpdateProductCodeDto(data);
    const updateData = this.validation.validate(
      validated,
      UpdateProductCodeDto.schema(),
    );
    const response = await this.productCodeRepository.update(
      id,
      updateData,
      user_id,
    );
    return CustomResponse.success('Product code updated!', response, 200);
  }

  async deleteProductCode(id: any, user_id?: string) {
    const code = await this.productCodeRepository.findOne(id);
    if (!code) {
      throw new RpcException('Product code not found');
    }
    if ([1, 2].includes(code.status)) {
      throw new RpcException('Product code still active in transaction!');
    } else if (code.status === 3) {
      throw new RpcException('Product code still taken out!');
    }
    await this.productCodeRepository.delete(id, user_id);
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
      throw new RpcException('Product code not found');
    }
    if (!store) {
      throw new RpcException('Store not found');
    }
    if (store.id !== code.product.store_id) {
      throw new RpcException('Product code not found in this store');
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
      buy_price: code.buy_price,
    };
    return CustomResponse.success('Product code retrieved!', data, 200);
  }

  async productCodeRepaired(data: Record<string, any>, user_id?: string) {
    const { auth, owner_id, weight, expense, id, params, account_id } = data;
    try {
      await this.prisma.$transaction(async (prisma) => {
        const code = await this.productCodeRepository.findOne(id);
        if (!code) {
          throw new RpcException(`Product code ${id} is invalid`); // item.id, because code is undefined
        }
        if (code.product.store_id !== auth.store_id) {
          throw new RpcException(
            `Product code ${code.barcode} is not in this store`,
          );
        }
        // TODOCEJE UPDATE STATUS
        await this.productCodeRepository.update(
          id,
          {
            status: 0,
            weight: weight,
          },
          user_id,
        );
        // To Transaction
        RmqHelper.publishEvent('product.code.updated', {
          data: {
            ...code,
            status: 0,
            weight: weight,
          },
          user: user_id,
        });
        // Add stock mutation (ELLA)
        RmqHelper.publishEvent('stock.repaired', {
          data: {
            productCode: code,
            trans_date: new Date(),
            account_id,
            weight,
            expense,
          },
          user: user_id,
        });
      });
    } catch (e) {
      console.error(e.message);
      return CustomResponse.error(e.message, null, 400);
    }

    return CustomResponse.success('Product code out!', null, 200);
  }

  async checkProduct(barcode: string) {
    const code = await this.productCodeRepository.getProductCode(barcode);
    if (!code) {
      throw new RpcException('Product code not found');
    }
    // Get price information
    const store = await this.prisma.store.findUnique({
      where: {
        id: code.product.store_id,
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
      throw new RpcException('Store not found');
    }

    const data = {
      ...code,
      price: store.is_float_price
        ? code.product.type.prices[0].price
        : code.fixed_price,
    };

    // Only public information [i Think ???]
    return CustomResponse.success('Product code retrieved!', data, 200);
  }

  async getProductCodeById(id: string) {
    const code = await this.productCodeRepository.findOne(id);
    if (!code) {
      throw new RpcException('Product code not found');
    }
    // Get price information
    const store = await this.prisma.store.findUnique({
      where: {
        id: code.product.store_id,
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
      throw new RpcException('Store not found');
    }

    const data = {
      ...code,
      price: store.is_float_price
        ? code.product.type.prices[0].price
        : code.fixed_price,
    };

    // Only public information [i Think ???]
    return CustomResponse.success('Product code retrieved!', data, 200);
  }
}
