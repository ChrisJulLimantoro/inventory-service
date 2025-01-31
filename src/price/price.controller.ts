import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { PriceService } from './price.service';

@Controller('price')
export class PriceController {
  constructor(
    private readonly service: PriceService,
    @Inject('MARKETPLACE') private readonly marketplaceClient: ClientProxy,
    @Inject('TRANSACTION') private readonly transactionClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: 'get:price' })
  @Describe('Get all price')
  async findAll(): Promise<CustomResponse> {
    return this.service.findAll();
  }

  @MessagePattern({ cmd: 'get:price/*' })
  @Describe('Get a price by id')
  async findOne(@Payload() data: any): Promise<CustomResponse | null> {
    const param = data.params;
    return this.service.findOne(param.id);
  }

  @MessagePattern({ cmd: 'post:price' })
  @Describe('Create a new price')
  async create(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body;
    console.log(data.params);
    createData.owner_id = data.params.user.id;

    const response = await this.service.create(createData);
    if (response.success) {
      this.marketplaceClient.emit(
        { service: 'marketplace', module: 'price', action: 'create' },
        response.data,
      );
      this.transactionClient.emit({ cmd: 'price_created' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'put:price/*' })
  @Describe('Modify price')
  async update(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.update(param.id, body);
    if (response.success) {
      this.marketplaceClient.emit(
        { service: 'marketplace', module: 'price', action: 'update' },
        response.data,
      );
      this.transactionClient.emit({ cmd: 'price_updated' }, response.data);
    }
    return response;
  }

  @MessagePattern({ cmd: 'delete:price/*' })
  @Describe('Delete price')
  async delete(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.delete(param.id);
    if (response.success) {
      this.marketplaceClient.emit(
        { service: 'marketplace', module: 'price', action: 'softdelete' },
        { id: response.data.id },
      );
      this.transactionClient.emit({ cmd: 'price_deleted' }, response.data.id);
    }
    return response;
  }

  @MessagePattern({ cmd: 'post:bulk-price' })
  @Describe('Create bulk price')
  async createBulk(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body;
    createData.owner_id = data.params.user.id;

    const response = await this.service.bulkCreate(createData);
    if (response.success) {
      response.data.forEach((item) => {
        this.marketplaceClient.emit(
          { service: 'marketplace', module: 'price', action: 'create' },
          item,
        );
        this.transactionClient.emit({ cmd: 'price_created' }, item);
      });
    }
    return response;
  }

  @MessagePattern({ cmd: 'delete:bulk-price/*' })
  @Describe('Delete bulk price')
  async deleteBulk(@Payload() data: any): Promise<CustomResponse> {
    const id = data.params.id.split(';');
    const response = await this.service.bulkDelete(id[0], id[1]);
    if (response.success) {
      response.data.forEach((data) => {
        this.marketplaceClient.emit(
          { service: 'marketplace', module: 'price', action: 'softdelete' },
          data.id,
        );
        this.transactionClient.emit({ cmd: 'price_deleted' }, data.id);
      });
    }
    return response;
  }
}
