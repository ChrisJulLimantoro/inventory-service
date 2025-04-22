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
import { PriceService } from './price.service';
import { RmqHelper } from 'src/helper/rmq.helper';
import { Exempt } from 'src/decorator/exempt.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('price')
export class PriceController {
  constructor(
    private readonly service: PriceService,
    private readonly prisma: PrismaService,
  ) {}

  // USED
  @MessagePattern({ cmd: 'get:price' })
  @Describe({
    description: 'Get all price',
    fe: [
      'master/price:open',
      'inventory/product:add',
      'inventory/product:edit',
      'inventory/product:detail',
    ],
  })
  async findAll(@Payload() data: any): Promise<CustomResponse> {
    const { filter, order_by } = data.body;
    filter.is_active = Boolean(filter.is_active);
    return this.service.findAll(filter, order_by);
  }

  @MessagePattern({ cmd: 'put:price/*' })
  @Describe({
    description: 'Modify price',
    fe: ['master/price:detail'],
  })
  async update(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.update(param.id, body, param.user.id);
    if (response.success) {
      RmqHelper.publishEvent('price.updated', {
        data: response.data,
        user: param.user.id,
      });
    }
    return response;
  }

  @EventPattern('price.updated')
  @Exempt()
  async updateReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Operation Update Event', data);
        await this.service.update(data.data.id, data.data, data.user);
      },
      {
        queueName: 'operation.updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.operation.updated',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'post:bulk-price' })
  @Describe({ description: 'Create bulk price', fe: ['master/price:add'] })
  async createBulk(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body;

    const response = await this.service.bulkCreate(
      createData,
      data.param.user.id,
    );
    if (response.success) {
      response.data.forEach((item) => {
        RmqHelper.publishEvent('price.created', {
          data: item,
          user: data.param.user.id,
        });
      });
    }
    return response;
  }

  @EventPattern('price.created')
  @Exempt()
  async createReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Price Create Event', data);
        await this.service.createReplica(data.data, data.user);
      },
      {
        queueName: 'price.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.price.created',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'delete:bulk-price/*' })
  @Describe({ description: 'Delete bulk price', fe: ['master/price:delete'] })
  async deleteBulk(@Payload() data: any): Promise<CustomResponse> {
    const id = data.params.id.split(';');
    const response = await this.service.bulkDelete(
      id[0],
      id[1],
      data.params.user.id,
    );
    if (response.success) {
      response.data.forEach((data) => {
        RmqHelper.publishEvent('price.deleted', {
          data: data,
          user: data.params.user.id,
        });
      });
    }
    return response;
  }

  @EventPattern('price.deleted')
  @Exempt()
  async deleteReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Price Delete Event', data);
        return await this.service.delete(data.data, data.user);
      },
      {
        queueName: 'price.deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.price.deleted',
        prisma: this.prisma,
      },
    )();
  }
}
