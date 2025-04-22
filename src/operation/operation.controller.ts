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
import { OperationService } from './operation.service';
import { Exempt } from 'src/decorator/exempt.decorator';
import { RmqHelper } from 'src/helper/rmq.helper';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('operation')
export class OperationController {
  constructor(
    private readonly service: OperationService,
    private readonly prisma: PrismaService,
    // @Inject('TRANSACTION') private readonly transactionClient: ClientProxy,
    // @Inject('MARKETPLACE') private readonly marketplaceClient: ClientProxy,
    // @Inject('FINANCE') private readonly financeClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: 'get:operation' })
  @Describe({
    description: 'Get all operation',
    fe: [
      'inventory/operation:open',
      'transaction/sales:add',
      'transaction/sales:edit',
      'transaction/sales:detail',
    ],
  })
  async findAll(@Payload() data: any): Promise<CustomResponse> {
    const filter = { store_id: data.body.auth.store_id };
    const { page, limit, sort, search } = data.body;
    return this.service.findAll(filter, page, limit, sort, search);
  }

  @MessagePattern({ cmd: 'get:operation/*' })
  @Describe({
    description: 'Get a operation by id',
    fe: ['inventory/operation:edit', 'inventory/operation:detail'],
  })
  async findOne(@Payload() data: any): Promise<CustomResponse | null> {
    const param = data.params;
    return this.service.findOne(param.id);
  }

  @MessagePattern({ cmd: 'post:operation' })
  @Describe({
    description: 'Create a new operation',
    fe: ['inventory/operation:add'],
  })
  async create(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body;

    const response = await this.service.create(createData, data.params.user.id);
    if (response.success) {
      RmqHelper.publishEvent('operation.created', {
        data: response.data,
        user: data.params.user.id,
      });
    }
    return response;
  }

  @EventPattern('operation.created')
  @Exempt()
  async createReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Operation Create Event', data);
        await this.service.createReplica(data.data, data.user);
      },
      {
        queueName: 'operation.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.operation.created',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'put:operation/*' })
  @Describe({
    description: 'Modify operation',
    fe: ['inventory/operation:edit'],
  })
  async update(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.update(param.id, body, param.user.id);
    if (response.success) {
      RmqHelper.publishEvent('operation.updated', {
        data: response.data,
        user: param.user.id,
      });
    }
    return response;
  }

  @EventPattern('operation.updated')
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

  @MessagePattern({ cmd: 'delete:operation/*' })
  @Describe({
    description: 'Delete operation',
    fe: ['inventory/operation:delete'],
  })
  async delete(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.delete(param.id, param.user.id);
    if (response.success) {
      RmqHelper.publishEvent('operation.deleted', {
        data: response.data.id,
        user: param.user.id,
      });
    }
    return response;
  }

  @EventPattern('operation.deleted')
  @Exempt()
  async deleteReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Operation Delete Event', data);
        return await this.service.delete(data.data, data.user);
      },
      {
        queueName: 'operation.deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.operation.deleted',
        prisma: this.prisma,
      },
    )();
  }
}
