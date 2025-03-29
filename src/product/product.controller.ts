import { Controller, Inject } from '@nestjs/common';
import {
  ClientProxy,
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { ProductService } from './product.service';
import { Exempt } from 'src/decorator/exempt.decorator';
import { RmqAckHelper } from 'src/helper/rmq-ack.helper';

@Controller('product')
export class ProductController {
  constructor(
    private readonly service: ProductService,
    @Inject('MARKETPLACE') private readonly marketplaceClient: ClientProxy,
    @Inject('TRANSACTION') private readonly transactionClient: ClientProxy,
    @Inject('FINANCE') private readonly financeClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: 'get:product' })
  @Describe({ description: 'Get all product', fe: ['inventory/product:open'] })
  async findAll(@Payload() data: any): Promise<CustomResponse> {
    const { page, limit, sort, search } = data.body;
    var filter: any = {
      store: {
        company: {
          id: data.body.company_id ?? data.body.auth.company_id,
          owner_id: data.body.owner_id,
        },
      },
    };

    if (data.body.type_id && data.body.type_id !== '') {
      filter.type = filter.type || {}; // Ensure `type` exists
      filter.type.id = data.body.type_id;
    }

    if (data.body.category_id && data.body.category_id !== '') {
      filter.type = filter.type || {}; // Ensure `type` exists
      filter.type.category = { id: data.body.category_id };
    }

    // store params
    if (data.body.store_id && data.body.store_id !== '') {
      filter.store = { id: data.body.store_id };
    }

    console.log('filterProduct', filter);
    return this.service.findAll(filter, page, limit, sort);
  }

  @MessagePattern({ cmd: 'get:product/*' })
  @Describe({
    description: 'Get a product by id',
    fe: ['inventory/product:edit', 'inventory/product:detail'],
  })
  async findOne(@Payload() data: any): Promise<CustomResponse | null> {
    const param = data.params;
    return this.service.findOne(param.id);
  }

  @MessagePattern({ cmd: 'post:product' })
  @Describe({
    description: 'Create a new product',
    fe: ['inventory/product:add'],
  })
  async create(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body;
    console.log(data.params);
    createData.owner_id = 'data.params.user.id';
    const response = await this.service.create(createData);
    if (response.success) {
      this.marketplaceClient.emit(
        { module: 'product', action: 'createProduct' },
        response.data,
      );
      this.transactionClient.emit({ cmd: 'product_created' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'put:product/*' })
  @Describe({ description: 'Modify product', fe: ['inventory/product:edit'] })
  async update(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.update(param.id, body);
    if (response.success) {
      this.marketplaceClient.emit(
        { module: 'product', action: 'updateProduct' },
        response.data,
      );
      this.transactionClient.emit({ cmd: 'product_updated' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'delete:product/*' })
  @Describe({ description: 'Delete product', fe: ['inventory/product:delete'] })
  async delete(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.delete(param.id);
    if (response.success) {
      this.marketplaceClient.emit(
        { module: 'product', action: 'deleteProduct' },
        { id: response.data.id },
      );
      this.transactionClient.emit({ cmd: 'product_deleted' }, response.data.id);
    }
    return response;
  }

  @MessagePattern({ cmd: 'get:product-code' })
  @Describe({
    description: 'Get all product code',
    fe: ['inventory/product:edit', 'inventory/product:detail'],
  })
  async getAllProductCode(@Payload() data: any): Promise<CustomResponse> {
    var filter: any = {
      product: {
        status: data.body.status,
        store_id: data.body.auth.store_id,
        type: {
          category_id: data.body.category_id,
        },
      },
    };
    return this.service.getAllProductCode(filter);
  }

  @MessagePattern({ cmd: 'get:product-codes/*' })
  @Describe({
    description: 'Get product code by product_id',
    fe: [
      'inventory/product:edit',
      'inventory/product:add',
      'inventory/product:detail',
    ],
  })
  async getProductCodes(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    return this.service.getProductCodes(param.id);
  }

  @MessagePattern({ cmd: 'post:generate-product-code/*' })
  @Describe({
    description: 'Generate product code',
    fe: [
      'inventory/product:add',
      'inventory/product:detail',
      'inventory/product:edit',
    ],
  })
  async generateProductCode(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.generateProductCode(param.id, body);
    if (response.success) {
      this.marketplaceClient.emit(
        { module: 'product', action: 'generateProductCode' },
        response.data,
      );
      response.data.transref_id = body.transref_id;
      console.log('generate product inventory', response.data);
      this.transactionClient.emit(
        { cmd: 'product_code_generated' },
        response.data,
      );
      response.data.store_id = body.store_id;
      this.financeClient.emit({ cmd: 'product_code_generated' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'get:check-product/*' })
  @Describe({
    description: 'Check product code',
    fe: ['inventory/check-product:all'],
  })
  async checkProductCode(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const filter = {
      product: {
        store_id: body.store_id,
      },
    };
    const response = await this.service.checkProduct(param.id);
    return response;
  }

  @MessagePattern({ cmd: 'delete:product-code/*' })
  @Describe({
    description: 'Delete product code',
    fe: [
      'inventory/product:add',
      'inventory/product:detail',
      'inventory/product:edit',
    ],
  })
  async deleteProductCode(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.deleteProductCode(param.id);
    if (response) {
      this.marketplaceClient.emit(
        { module: 'product', action: 'deleteProductCode' },
        { id: param.id },
      );
      this.transactionClient.emit({ cmd: 'product_code_deleted' }, {id: param.id});
      this.financeClient.emit({ cmd: 'product_code_deleted' }, response);
    }
    return response;
  }

  @MessagePattern({ cmd: 'get:product-barcode/*' })
  @Describe({
    description: 'Get product code by barcode',
    fe: ['transaction/sales:add', 'transaction/sales:edit'],
  })
  async getProductCode(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    return this.service.getProductCode(param.id, body.store);
  }

  @MessagePattern({ cmd: 'get:stock-out' })
  @Describe({
    description: 'Get stock out',
    fe: ['inventory/stock-out:open'],
  })
  async getStockOut(@Payload() data: any): Promise<CustomResponse> {
    const filter = {
      status: 3,
      product: {
        store_id: data.body.auth.store_id,
      },
    };
    const store_id = data.body.auth.store_id;
    const { page, limit, sort } = data.body;
    return this.service.getProductCodeOut(filter, store_id, page, limit);
  }

  @MessagePattern({ cmd: 'post:stock-out' })
  @Describe({
    description: 'stocks out',
    fe: ['inventory/stock-out:add'],
  })
  async productCodeOut(@Payload() data: any): Promise<CustomResponse> {
    data.body = { ...data.body, params: data.params };
    const res = await this.service.productCodeOut(data.body);
    console.log(res);
    return res;
  }

  @MessagePattern({ cmd: 'post:stock-repaired' })
  @Describe({
    description: 'stocks repaired',
    fe: ['inventory/stock-out:open'],
  })
  async productCodeRepaired(@Payload() data: any): Promise<CustomResponse> {
    data.body = { ...data.body, params: data.params };
    const res = await this.service.productCodeRepaired(data.body);
    console.log(res);
    return res;
  }

  @MessagePattern({ cmd: 'delete:unstock-out/*' })
  @Describe({
    description: 'Unstock out',
    fe: ['inventory/stock-out:delete'],
  })
  async unstockOut(@Payload() data: any): Promise<CustomResponse> {
    const id = data.params.id;
    return this.service.unstockOut(id);
  }

  @MessagePattern({ cmd: 'post:generate-product-code-qr/*' })
  @Describe({
    description: 'Generate QR code',
    fe: ['inventory/product:edit', 'inventory/product:detail'],
  })
  async generateQRCode(@Payload() data: any): Promise<CustomResponse> {
    try {
      const param = data.params;
      const response = await this.service.generateQRCode(param.id);

      return response;
    } catch (e) {
      return CustomResponse.error(e.message, null, 400);
    }
  }

  @EventPattern({ cmd: 'product_code_updated' })
  @Exempt()
  async productStatusUpdated(@Payload() data: any, @Ctx() context: any) {
    console.log('Product Code Status Updated', data);
    const sanitizedData = { status: data.status, weight: data.weight };

    await RmqAckHelper.handleMessageProcessing(context, async () => {
      const response = await this.service.updateProductCode(
        data.id,
        sanitizedData,
      );
      if (!response.success) throw new Error('Company update failed');
      if (response.success) {
        this.financeClient.emit({ cmd: 'product_code_updated' }, response.data);
      }
    })();
  }
}
