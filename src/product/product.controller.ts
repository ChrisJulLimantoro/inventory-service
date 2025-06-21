import { Controller } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { ProductService } from './product.service';
import { Exempt } from 'src/decorator/exempt.decorator';
import { RmqHelper } from 'src/helper/rmq.helper';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('product')
export class ProductController {
  constructor(
    private readonly service: ProductService,
    private readonly prisma: PrismaService,
  ) {}

  @MessagePattern({ cmd: 'get:product' })
  @Describe({ description: 'Get all product', fe: ['inventory/product:open'] })
  async findAll(@Payload() data: any): Promise<CustomResponse> {
    const { page, limit, sort, search } = data.body;
    var filter: any = {
      store: {
        // company: {
        //   id: data.body.company_id ?? data.body.auth.company_id,
        //   owner_id: data.body.owner_id,
        // },
        id: data.body.auth.store_id,
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

    return this.service.findAll(filter, page, limit, sort, search);
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
    const response = await this.service.create(createData, data.params.user.id);
    if (response.success) {
      RmqHelper.publishEvent('product.created', {
        data: response.data,
        user: data.params.user.id,
      });
    }
    return response;
  }

  @MessagePattern({ cmd: 'get:print-product-qr/*' })
  @Describe({
    description: 'Get product QR code',
    fe: ['inventory/product:edit', 'inventory/product:detail'],
  })
  async getProductQRCode(@Payload() data: any) {
    const param = data.params;
    const response = await this.service.printQRCode(param.id);

    return response;
  }

  @EventPattern('product.created')
  @Exempt()
  async createReplica(@Payload() data: any, @Ctx() context: any) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Product Create Event', data);
        const response = await this.service.createReplica(data.data, data.user);
        if (!response.success) throw new RpcException('Product create failed');
      },
      {
        queueName: 'product.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.product.created',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'put:product/*' })
  @Describe({ description: 'Modify product', fe: ['inventory/product:edit'] })
  async update(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.update(param.id, body, param.user.id);
    if (response.success) {
      RmqHelper.publishEvent('product.updated', {
        data: response.data,
        user: data.params.user.id,
      });
    }
    return response;
  }

  @EventPattern('product.updated')
  @Exempt()
  async updateReplica(@Payload() data: any, @Ctx() context: any) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Product Update Event', data);
        const response = await this.service.update(
          data.data.id,
          data.data,
          data.user,
        );
        if (!response.success) throw new RpcException('Product update failed');
      },
      {
        queueName: 'product.updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.product.updated',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'delete:product/*' })
  @Describe({ description: 'Delete product', fe: ['inventory/product:delete'] })
  async delete(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.delete(param.id, param.user.id);
    if (response.success) {
      RmqHelper.publishEvent('product.deleted', {
        data: response.data,
        user: param.user.id,
      });
      for (const i of response.data.product_codes) {
        const resp = await this.service.deleteProductCode(i.id, param.user.id);
        if (resp) {
          RmqHelper.publishEvent('product.code.deleted', {
            data: resp.data,
            user: param.user.id,
          });
        }
      }
    }
    return response;
  }

  @EventPattern('product.deleted')
  @Exempt()
  async deleteReplica(@Payload() data: any, @Ctx() context: any) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Product Delete Event', data);
        const response = await this.service.delete(data.data.id, data.user);
        if (!response.success) throw new RpcException('Product delete failed');
      },
      {
        queueName: 'product.deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.product.deleted',
        prisma: this.prisma,
      },
    )();
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
    const response = await this.service.generateProductCode(
      param.id,
      body,
      param.user.id,
    );
    console.log('Response generate product code ' + response.success);
    if (response.success) {
      response.data.transref_id = body.transref_id;
      response.data.store_id = body.store_id;
      RmqHelper.publishEvent('product.code.created', {
        data: response.data,
        user: param.user.id,
      });
      console.log('published');
    }
    return response;
  }

  @EventPattern('product.code.created')
  @Exempt()
  async generateProductCodeReplica(@Payload() data: any, @Ctx() context: any) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Product Code Create Event', data);
        const response = await this.service.productCodeReplica(
          data.data,
          data.user,
        );
        if (!response.success)
          throw new RpcException('Product code create failed');
      },
      {
        queueName: 'product.code.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.product.code.created',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'get:product-code/*' })
  @Describe({
    description: 'Get product code by id',
    fe: [
      'inventory/product-code:edit',
      'inventory/product-code:add',
      'inventory/product-code:detail',
    ],
  })
  async getProductCodeById(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.getProductCodeById(param.id);
    return response;
  }

  @MessagePattern({ cmd: 'get:check-product/*' })
  @Describe({
    description: 'Check product code',
    fe: ['inventory/check-product:all'],
  })
  async checkProductCode(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
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
    const response = await this.service.deleteProductCode(
      param.id,
      param.user.id,
    );
    if (response) {
      RmqHelper.publishEvent('product.code.deleted', {
        data: response.data,
        user: param.user.id,
      });
    }
    return response;
  }

  @EventPattern('product.code.deleted')
  @Exempt()
  async deleteProductCodeReplica(@Payload() data: any, @Ctx() context: any) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Product Code Delete Event', data);
        const response = await this.service.deleteProductCode(
          data.data.id,
          data.user,
        );
        if (!response.success)
          throw new RpcException('Product code delete failed');
      },
      {
        queueName: 'product.code.deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.product.code.deleted',
        prisma: this.prisma,
      },
    )();
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
      OR: [
        {
          status: 3,
        },
        {
          taken_out_reason: 1
        },
      ],
      product: {
        store_id: data.body.auth.store_id,
        type: {
          category_id: data.body.category_id,
        },
      },
      date: {
        start: data.body.dateStart,
        end: data.body.dateEnd,
        field: 'taken_out_at',
      },
    };
    const store_id = data.body.auth.store_id;
    const { page, limit, sort, search } = data.body;
    return this.service.getProductCodeOut(
      filter,
      store_id,
      page,
      limit,
      sort,
      search,
    );
  }

  @MessagePattern({ cmd: 'post:stock-out' })
  @Describe({
    description: 'stocks out',
    fe: ['inventory/stock-out:add'],
  })
  async productCodeOut(@Payload() data: any): Promise<CustomResponse> {
    data.body = { ...data.body, params: data.params };
    const res = await this.service.productCodeOut(
      data.body,
      data.params.user.id,
    );
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
    const res = await this.service.productCodeRepaired(
      data.body,
      data.params.user.id,
    );
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

  @MessagePattern({ cmd: 'put:product-code/*' })
  @Describe({
    description: 'Update product code',
    fe: ['inventory/product-code:edit'],
  })
  async updateProductCode(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.updateProductCode(
      param.id,
      body,
      param.user.id,
    );
    if (response.success) {
      RmqHelper.publishEvent('product.code.updated', {
        data: response.data,
        user: param.user.id,
      });
      RmqHelper.publishEvent('finance.code.updated', {
        data: response.data,
        user: param.user.id,
      });
    }
    return response;
  }

  @EventPattern('product.code.updated')
  @Exempt()
  async productStatusUpdated(@Payload() data: any, @Ctx() context: any) {
    console.log('Product Code Status Updated', data);

    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        const response = await this.service.updateProductCode(
          data.data.id,
          data.data,
        );
        if (!response.success) throw new RpcException('Company update failed');
      },
      {
        queueName: 'product.code.updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.product.code.updated',
        prisma: this.prisma,
      },
    )();
  }
}
