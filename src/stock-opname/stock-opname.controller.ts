import { Controller } from '@nestjs/common';
import { StockOpnameService } from './stock-opname.service';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { RmqHelper } from 'src/helper/rmq.helper';
import { Exempt } from 'src/decorator/exempt.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('stock-opname')
export class StockOpnameController {
  constructor(
    private readonly service: StockOpnameService,
    private readonly prisma: PrismaService,
  ) {}

  @MessagePattern({ cmd: 'get:stock-opname' })
  @Describe({
    description: 'Get all Stock Opname',
    fe: ['inventory/stock-opname:open'],
  })
  async findAll(@Payload() data: any): Promise<CustomResponse> {
    var filter: any = {
      store_id: data.body.auth.store_id,
      category_id: data.body.category_id,
      date: {
        start: data.body.dateStart,
        end: data.body.dateEnd,
      },
    };
    const { page, limit, sort, search } = data.body;

    return this.service.findAll(filter, page, limit);
  }

  @MessagePattern({ cmd: 'get:stock-opname/*' })
  @Describe({
    description: 'Get Stock Opname By ID',
    fe: ['inventory/stock-opname:edit', 'inventory/stock-opname:detail'],
  })
  async findOne(@Payload() data: any): Promise<CustomResponse> {
    return this.service.findOne(data.params.id);
  }

  @MessagePattern({ cmd: 'post:stock-opname' })
  @Describe({
    description: 'Create Stock Opname',
    fe: ['inventory/stock-opname:add'],
  })
  async create(@Payload() data: any): Promise<CustomResponse> {
    const body = {
      ...data.body,
      store_id: data.body.auth.store_id,
      created_by: data.params.user.id,
    };
    const response = await this.service.create(body, data.params.user.id);
    if (response.success) {
      RmqHelper.publishEvent('stock.opname.created', {
        data: response.data,
        user: data.params.user.id,
      });
    }
    return response;
  }

  @EventPattern('stock.opname.created')
  @Exempt()
  async createReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Stock Opname Create Event', data);
        await this.service.createReplica(data.data, data.user);
      },
      {
        queueName: 'stock.opname.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.stock.opname.created',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'put:stock-opname/*' })
  @Describe({
    description: 'Create Stock Opname',
    fe: ['inventory/stock-opname:add'],
  })
  async update(@Payload() data: any): Promise<CustomResponse> {
    const body = {
      ...data.body,
      store_id: data.body.auth.store_id,
      created_by: data.params.user.id,
    };
    const response = await this.service.update(
      data.params.id,
      body,
      data.params.user.id,
    );
    if (response.success) {
      RmqHelper.publishEvent('stock.opname.updated', {
        data: response.data,
        user: data.params.user.id,
      });
    }
    return response;
  }

  @EventPattern('stock.opname.updated')
  @Exempt()
  async updateReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Stock Opname Update Event', data);
        await this.service.update(data.id, data.data, data.user);
      },
      {
        queueName: 'stock.opname.updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.stock.opname.updated',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'put:stock-opname-detail/*' })
  @Describe({
    description: 'Scan and modify Stock Opname Detail',
    fe: ['inventory/stock-opname:edit', 'inventory/stock-opname:detail'],
  })
  async changeStatus(@Payload() data: any): Promise<CustomResponse> {
    const response = await this.service.changeStatus(
      data.params.id,
      data.body.product_code_id,
      data.body.scanned,
      data.params.user.id,
    );
    if (response.success) {
      RmqHelper.publishEvent('stock.opname.detail.updated', {
        stock_opname_id: data.params.id,
        product_code_id: data.body.product_code_id,
        scnaned: data.body.scanned,
        user: data.params.user.id,
      });
    }
    return response;
  }

  @EventPattern('stock.opname.detail.updated')
  @Exempt()
  async changeStatusReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Stock Opname Detail Update Event', data);
        await this.service.changeStatus(
          data.stock_opname_id,
          data.product_code_id,
          data.scanned,
          data.user,
        );
      },
      {
        queueName: 'stock.opname.detail.updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.stock.opname.detail.updated',
        prisma: this.prisma,
      },
    )();
  }

  @EventPattern('stock.opname.detail.created')
  @Exempt()
  async createDetailReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Stock Opname Detail Create Event', data);
        await this.service.createDetail(data.data, data.user);
      },
      {
        queueName: 'stock.opname.detail.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.stock.opname.detail.created',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'delete:stock-opname/*' })
  @Describe({
    description: 'Delete Stock Opname',
    fe: ['inventory/stock-opname:delete'],
  })
  async delete(@Payload() data: any): Promise<CustomResponse> {
    const response = await this.service.delete(
      data.params.id,
      data.params.user.id,
    );
    if (response.success) {
      RmqHelper.publishEvent('stock.opname.deleted', {
        data: response.data,
        user: data.params.user.id,
      });
    }
    return response;
  }

  @EventPattern('stock.opname.deleted')
  @Exempt()
  async deleteReplica(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      async () => {
        console.log('Captured Stock Opname Delete Event', data);
        await this.service.delete(data.data.id, data.user);
      },
      {
        queueName: 'stock.opname.deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.stock.opname.deleted',
        prisma: this.prisma,
      },
    )();
  }

  @MessagePattern({ cmd: 'put:stock-opname-approve/*' })
  @Describe({
    description: 'Approve Stock Opname',
    fe: ['inventory/stock-opname:approve'],
  })
  async approve(@Payload() data: any): Promise<CustomResponse> {
    const response = await this.service.approve(
      data.params.id,
      data.params.user.id,
    );
    if (response.success) {
      RmqHelper.publishEvent('stock.opname.updated', {
        data: response.data,
        user: data.params.user.id,
      });
    }
    return response;
  }

  // @EventPattern('stock.opname.approved')
  // @Exempt()
  // async approveReplica(@Payload() data: any, @Ctx() context: RmqContext) {
  //   await RmqHelper.handleMessageProcessing(
  //     context,
  //     async () => {
  //       console.log('Captured Stock Opname Approve Event', data);
  //       await this.service.approve(data.data.id, data.user);
  //     },
  //     {
  //       queueName: 'stock.opname.approved',
  //       useDLQ: true,
  //       dlqRoutingKey: 'dlq.stock.opname.approved',
  //       prisma: this.prisma,
  //     },
  //   )();
  // }

  @MessagePattern({ cmd: 'put:stock-opname-disapprove/*' })
  @Describe({
    description: 'Disapprove Stock Opname',
    fe: ['inventory/stock-opname:disapprove'],
  })
  async disapprove(@Payload() data: any): Promise<CustomResponse> {
    const response = await this.service.disapprove(
      data.params.id,
      data.params.user.id,
    );
    if (response.success) {
      RmqHelper.publishEvent('stock.opname.updated', {
        data: response.data,
        user: data.params.user.id,
      });
    }
    return response;
  }

  // @EventPattern('stock.opname.disapproved')
  // @Exempt()
  // async disapproveReplica(@Payload() data: any, @Ctx() context: RmqContext) {
  //   await RmqHelper.handleMessageProcessing(
  //     context,
  //     async () => {
  //       console.log('Captured Stock Opname Disapprove Event', data);
  //       await this.service.disapprove(data.data.id, data.user);
  //     },
  //     {
  //       queueName: 'stock.opname.disapproved',
  //       useDLQ: true,
  //       dlqRoutingKey: 'dlq.stock.opname.disapproved',
  //       prisma: this.prisma,
  //     },
  //   )();
  // }
}
