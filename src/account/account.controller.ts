import { Controller } from '@nestjs/common';
import { AccountService } from './account.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Exempt } from 'src/decorator/exempt.decorator';
import { RmqHelper } from '../helper/rmq.helper';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller()
export class AccountController {
  constructor(
    private readonly service: AccountService,
    private readonly prisma: PrismaService,
  ) {}

  @EventPattern('account.created')
  @Exempt()
  async accountCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      () => this.service.create(data),
      {
        queueName: 'account.created',
        useDLQ: true,
        dlqRoutingKey: 'dlq.account.created',
        prisma: this.prisma,
      },
    )();
  }

  @EventPattern('account.updated')
  @Exempt()
  async accountUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      () => this.service.update(data.id, data),
      {
        queueName: 'account.updated',
        useDLQ: true,
        dlqRoutingKey: 'dlq.account.updated',
        prisma: this.prisma,
      },
    )();
  }

  @EventPattern('account.deleted')
  @Exempt()
  async accountDeleted(@Payload() data: any, @Ctx() context: RmqContext) {
    await RmqHelper.handleMessageProcessing(
      context,
      () => this.service.delete(data),
      {
        queueName: 'account.deleted',
        useDLQ: true,
        dlqRoutingKey: 'dlq.account.deleted',
        prisma: this.prisma,
      },
    )();
  }
}
