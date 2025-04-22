import { Controller, Inject } from '@nestjs/common';
import {
  ClientProxy,
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { CategoryService } from './category.service';
import { RmqHelper } from 'src/helper/rmq.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { Exempt } from 'src/decorator/exempt.decorator';

@Controller('category')
export class CategoryController {
  constructor(
    private readonly service: CategoryService,
    private readonly prisma: PrismaService,
  ) {}

  @MessagePattern({ cmd: 'get:category' })
  @Describe({
    description: 'Get all category',
    fe: [
      'master/category:open',
      'master/price:add',
      'master/price:detail',
      'inventory/product:add',
      'inventory/product:edit',
      'inventory/product:detail',
    ],
  })
  async findAll(@Payload() data: any): Promise<CustomResponse> {
    // Filter by owner id because it is an master data determined by the owner
    var filter: any = {
      company: {
        owner_id: data.body.owner_id,
      },
      // company_id: data.body.auth.company_id,
    };
    filter.company.stores = {
      some: {
        id:
          data.body.store_id != null
            ? data.body.store_id
            : data.body.auth.store_id,
      },
    };
    const { page, limit, sort, search } = data.body;

    return this.service.findAll(filter, page, limit, sort, search);
  }

  @MessagePattern({ cmd: 'get:category/*' })
  @Describe({
    description: 'Get a category by id',
    fe: [
      'master/category:detail',
      'master/category:edit',
      'master/price:add',
      'master/price:detail',
    ],
  })
  async findOne(@Payload() data: any): Promise<CustomResponse | null> {
    const param = data.params;
    return this.service.findOne(param.id);
  }

  @MessagePattern({ cmd: 'post:category' })
  @Describe({
    description: 'Create a new category',
    fe: ['master/category:add'],
  })
  async create(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body;

    const response = await this.service.create(createData, data.params.user.id);
    if (response.success) {
      RmqHelper.publishEvent('category.created', {
        data: response.data,
        user: data.params.user.id,
      });
    }
    return response;
  }

  @EventPattern('category.created')
  @Exempt()
  async createReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Category Create Event', data);
        await this.service.createReplica(data.data, data.user);
      },
      {
        queueName: 'category.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.category.created',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'put:category/*' })
  @Describe({ description: 'Modify category', fe: ['master/category:edit'] })
  async update(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.update(
      param.id,
      body,
      data.params.user.id,
    );
    if (response.success) {
      RmqHelper.publishEvent('category.updated', {
        data: response.data,
        user: data.params.user.id,
      });
    }
    return response;
  }

  @EventPattern('category.updated')
  @Exempt()
  async updateReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Captured Category Update Event', data);
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        return await this.service.update(data.data.id, data.data, data.user);
      },
      {
        queueName: 'category.updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.category.updated',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'delete:category/*' })
  @Describe({ description: 'Delete category', fe: ['master/category:delete'] })
  async delete(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.delete(param.id, param.user.id);
    if (response.success) {
      RmqHelper.publishEvent('category.deleted', {
        data: response.data.id,
        user: data.params.user.id,
      });
    }
    return response;
  }

  @EventPattern('category.deleted')
  @Exempt()
  async deleteReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Captured Category Delete Event', data);
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        return await this.service.delete(data.data.id, data.user);
      },
      {
        queueName: 'category.deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.category.deleted',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'get:price-category' })
  @Describe({
    description: 'Get all category price',
    fe: ['master/price:open'],
  })
  async findAllPriceCategory(@Payload() data: any): Promise<CustomResponse> {
    // Filters
    const store_id = data.body.auth.store_id;
    const category_id = data.body.category_id;
    const date = {
      start: data.body.dateStart,
      end: data.body.dateEnd,
    };
    return this.service.findAllPriceCategory(store_id, category_id, date);
  }

  @MessagePattern({ cmd: 'get:price-category-detail' })
  @Describe({
    description: 'Get price detail by category',
    fe: ['master/price:detail'],
  })
  async findPriceCategoryDetail(@Payload() data: any): Promise<CustomResponse> {
    const body = data.body;
    return this.service.findPriceCategoryDetail(body);
  }
}
