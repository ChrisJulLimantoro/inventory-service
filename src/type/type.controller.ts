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
import { TypeService } from './type.service';
import { RmqHelper } from 'src/helper/rmq.helper';
import { Exempt } from 'src/decorator/exempt.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('type')
export class TypeController {
  constructor(
    private readonly service: TypeService,
    private readonly prisma: PrismaService,
    @Inject('MARKETPLACE') private readonly marketplaceClient: ClientProxy,
    @Inject('TRANSACTION') private readonly transactionClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: 'get:type' })
  @Describe({
    description: 'Get all type',
    fe: [
      'inventory/product:add',
      'inventory/product:edit',
      'inventory/product:detail',
    ],
  })
  async findAll(@Payload() data: any): Promise<CustomResponse> {
    var filter: any = {
      category: {
        company: {
          id: data.body.company_id ?? data.body.auth.company_id,
          owner_id: data.body.owner_id,
        },
      },
    };
    if (data.body.category_id && data.body.category_id != '') {
      filter.category_id = data.body.category_id;
    }

    return this.service.findAll(filter);
  }

  @MessagePattern({ cmd: 'post:type' })
  @Describe({
    description: 'Create a new type',
    fe: ['master/category:edit', 'master/category:detail'],
  })
  async create(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body;

    const response = await this.service.create(createData, data.params.user.id);
    if (response.success) {
      RmqHelper.publishEvent('type.created', {
        data: response.data,
        user: data.params.user.id,
      });
      // this.marketplaceClient.emit(
      //   { service: 'marketplace', module: 'type', action: 'create' },
      //   response.data,
      // );
      // this.transactionClient.emit({ cmd: 'type_created' }, response.data);
    }
    return response;
  }

  @EventPattern('type.created')
  @Exempt()
  async createReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      () => {
        console.log('Captured Type Create Event', data);
        return this.service.createReplica(data.data, data.user);
      },
      {
        queueName: 'type.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.type.created',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'put:type/*' })
  @Describe({
    description: 'Modify type',
    fe: ['master/category:edit', 'master/category:detail'],
  })
  async update(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.update(param.id, body, param.user.id);
    if (response.success) {
      RmqHelper.publishEvent('type.updated', {
        data: response.data,
        user: param.user.id,
      });
      // this.marketplaceClient.emit(
      //   { service: 'marketplace', module: 'type', action: 'update' },
      //   response.data,
      // );
      // this.transactionClient.emit({ cmd: 'type_updated' }, response.data);
    }
    return response;
  }

  @EventPattern('type.updated')
  @Exempt()
  async updateReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Captured Type Update Event', data);
    await RmqHelper.handleMessageProcessing(
      context,
      () => {
        return this.service.update(data.data.id, data.data, data.user);
      },
      {
        queueName: 'type.updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.type.updated',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'delete:type/*' })
  @Describe({
    description: 'Delete type',
    fe: ['master/category:edit', 'master/category:detail'],
  })
  async delete(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.delete(param.id, param.user.id);
    if (response.success) {
      RmqHelper.publishEvent('type.deleted', {
        data: response.data.id,
        user: param.user.id,
      });
      // this.marketplaceClient.emit(
      //   { service: 'marketplace', module: 'type', action: 'softdelete' },
      //   { id: response.data.id },
      // );
      // this.transactionClient.emit({ cmd: 'type_deleted' }, response.data.id);
    }
    return response;
  }

  @EventPattern('type.deleted')
  @Exempt()
  async deleteReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    console.log('Captured Type Delete Event', data);
    await RmqHelper.handleMessageProcessing(
      context,
      () => {
        return this.service.delete(data.data, data.user);
      },
      {
        queueName: 'type.deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.type.deleted',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'post:bulk-type' })
  @Describe({ description: 'Create bulk type', fe: ['master/category:add'] })
  async createBulk(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body.types;

    const response = await this.service.bulkCreate(
      createData,
      data.params.user.id,
    );
    if (response.success) {
      response.data.forEach((item) => {
        RmqHelper.publishEvent('type.created', {
          data: item,
          user: data.params.user.id,
        });
        // this.marketplaceClient.emit(
        //   { service: 'marketplace', module: 'type', action: 'create' },
        //   item,
        // );
        // this.transactionClient.emit({ cmd: 'type_created' }, item);
      });
    }
    return response;
  }

  @MessagePattern({ cmd: 'put:bulk-type' })
  @Describe({ description: 'Update bulk type', fe: ['master/category:edit'] })
  async updateBulk(@Payload() data: any): Promise<CustomResponse> {
    const newData = data.body.types;

    // Check if updateData doesn't have id that it needed to be created first the rest will be updated
    const createData = await newData.filter((item) => item.id == null);
    if (createData.length > 0) {
      const responseCreate = await this.service.bulkCreate(
        createData,
        data.params.user.id,
      );
      if (!responseCreate.success) {
        responseCreate.data.forEach((item) => {
          RmqHelper.publishEvent('type.created', {
            data: item,
            user: data.params.user.id,
          });
          // this.marketplaceClient.emit(
          //   { service: 'marketplace', module: 'type', action: 'create' },
          //   item,
          // );
          // this.transactionClient.emit({ cmd: 'type_created' }, item);
        });
        return responseCreate;
      }
    }

    const updateData = await newData.filter((item) => item.id != null);
    if (updateData.length > 0) {
      const response = await this.service.bulkUpdate(
        updateData,
        data.params.user.id,
      );
      if (response.success) {
        response.data.forEach((item) => {
          RmqHelper.publishEvent('type.updated', {
            data: item,
            user: data.params.user.id,
          });
          // this.marketplaceClient.emit(
          //   { service: 'marketplace', module: 'type', action: 'update' },
          //   item,
          // );
          // this.transactionClient.emit({ cmd: 'type_updated' }, item);
        });
      }
      return response;
    }
  }
}
