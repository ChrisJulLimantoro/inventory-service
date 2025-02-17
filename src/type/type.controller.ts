import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { TypeService } from './type.service';

@Controller('type')
export class TypeController {
  constructor(
    private readonly service: TypeService,
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
    const filter = { category_id: data.body.category_id };
    return this.service.findAll(filter);
  }
  // UNUSED
  // @MessagePattern({ cmd: 'get:type/*' })
  // @Describe({ description: 'Get a type by id' })
  // async findOne(@Payload() data: any): Promise<CustomResponse | null> {
  //   const param = data.params;
  //   return this.service.findOne(param.id);
  // }

  @MessagePattern({ cmd: 'post:type' })
  @Describe({
    description: 'Create a new type',
    fe: ['master/category:edit', 'master/category:detail'],
  })
  async create(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body;

    const response = await this.service.create(createData);
    if (response.success) {
      this.marketplaceClient.emit(
        { service: 'marketplace', module: 'type', action: 'create' },
        response.data,
      );
      this.transactionClient.emit({ cmd: 'type_created' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'put:type/*' })
  @Describe({
    description: 'Modify type',
    fe: ['master/category:edit', 'master/category:detail'],
  })
  async update(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.update(param.id, body);
    if (response.success) {
      this.marketplaceClient.emit(
        { service: 'marketplace', module: 'type', action: 'update' },
        response.data,
      );
      this.transactionClient.emit({ cmd: 'type_updated' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'delete:type/*' })
  @Describe({
    description: 'Delete type',
    fe: ['master/category:edit', 'master/category:detail'],
  })
  async delete(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.delete(param.id);
    if (response.success) {
      this.marketplaceClient.emit(
        { service: 'marketplace', module: 'type', action: 'softdelete' },
        { id: response.data.id },
      );
      this.transactionClient.emit({ cmd: 'type_deleted' }, response.data.id);
    }
    return response;
  }

  @MessagePattern({ cmd: 'post:bulk-type' })
  @Describe({ description: 'Create bulk type', fe: ['master/category:add'] })
  async createBulk(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body.types;

    const response = await this.service.bulkCreate(createData);
    if (response.success) {
      response.data.forEach((item) => {
        this.marketplaceClient.emit(
          { service: 'marketplace', module: 'type', action: 'create' },
          item,
        );
        this.transactionClient.emit({ cmd: 'type_created' }, item);
      });
    }
    return response;
  }
}
