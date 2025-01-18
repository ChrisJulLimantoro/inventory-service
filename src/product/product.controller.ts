import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { Describe } from 'src/decorator/describe.decorator';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(
    private readonly service: ProductService,
    @Inject('MARKETPLACE') private readonly marketplaceClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: 'get:product' })
  @Describe('Get all product')
  async findAll(): Promise<CustomResponse> {
    return this.service.findAll();
  }

  @MessagePattern({ cmd: 'get:product/*' })
  @Describe('Get a product by id')
  async findOne(@Payload() data: any): Promise<CustomResponse | null> {
    const param = data.params;
    return this.service.findOne(param.id);
  }

  @MessagePattern({ cmd: 'post:product' })
  @Describe('Create a new product')
  async create(@Payload() data: any): Promise<CustomResponse> {
    const createData = data.body;
    console.log(data.params);
    createData.owner_id = 'data.params.user.id';
    const response = await this.service.create(createData);
    if (response.success) {
      this.marketplaceClient.emit(
        { module: 'product', action: 'createProduct' },
        response.data,
      );
    }
    return response;
  }

  @MessagePattern({ cmd: 'put:product/*' })
  @Describe('Modify product')
  async update(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const body = data.body;
    const response = await this.service.update(param.id, body);
    if (response.success) {
      this.marketplaceClient.emit(
        { module: 'product', action: 'updateProduct' },
        response.data,
      );
    }
    return response;
  }

  @MessagePattern({ cmd: 'delete:product/*' })
  @Describe('Delete product')
  async delete(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.delete(param.id);
    if (response.success) {
      this.marketplaceClient.emit(
        { module: 'product', action: 'deleteProduct' },
        { id: response.data.id },
      );
    }
    return response;
  }

  @MessagePattern({ cmd: 'post:generate-product-code/*' })
  @Describe('Generate product code')
  async generateProductCode(@Payload() data: any): Promise<CustomResponse> {
    const param = data.params;
    const response = await this.service.generateProductCode(param.id);
    if (response.success) {
      this.marketplaceClient.emit(
        { module: 'product', action: 'generateProductCode' },
        response.data,
      );
    }
    return response;
  }
}
