import { Controller } from '@nestjs/common';
import { StockOpnameService } from './stock-opname.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';

@Controller('stock-opname')
export class StockOpnameController {
  constructor(private readonly service: StockOpnameService) {}

  @MessagePattern({ cmd: 'get:stock-opname' })
  @Describe({
    description: 'Get all Stock Opname',
    fe: ['inventory/stock-opname:open'],
  })
  async findAll(@Payload() data: any): Promise<CustomResponse> {
    var filter: any = {
      store_id: data.body.auth.store_id,
    };

    return this.service.findAll(filter);
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
    return this.service.create(body);
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
    return this.service.update(data.params.id, body);
  }

  @MessagePattern({ cmd: 'post:stock-opname-detail/*' })
  @Describe({
    description: 'Scan and modify Stock Opname Detail',
    fe: ['inventory/stock-opname:edit', 'inventory/stock-opname:detail'],
  })
  async createDetail(@Payload() data: any): Promise<CustomResponse> {
    return this.service.createDetail(data.params.id, data.body);
  }

  @MessagePattern({ cmd: 'delete:stock-opname/*' })
  @Describe({
    description: 'Delete Stock Opname',
    fe: ['inventory/stock-opname:delete'],
  })
  async delete(@Payload() data: any): Promise<CustomResponse> {
    return this.service.delete(data.params.id);
  }
}
