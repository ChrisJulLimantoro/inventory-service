import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/base.service';
import { ProductRepository } from 'src/repositories/product.repository';
import { ValidationService } from 'src/validation/validation.service';
import { CreateProductRequest } from './dto/create-product.dto';
import { UpdateProductRequest } from './dto/update-product.dto';
import { ProductCodeRepository } from 'src/repositories/product-code.repository';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { CreateProductCodeDto } from './dto/create-productCode.dto';

@Injectable()
export class ProductService extends BaseService {
  protected repository = this.productRepository;
  protected createSchema = CreateProductRequest.schema();
  protected updateSchema = UpdateProductRequest.schema();

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productCodeRepository: ProductCodeRepository,
    protected readonly validation: ValidationService,
  ) {
    super(validation);
  }

  protected transformCreateData(data: any) {
    return new CreateProductRequest(data);
  }

  protected transformUpdateData(data: any) {
    return new UpdateProductRequest(data);
  }

  async create(data: any): Promise<CustomResponse> {
    // Generate Code
    const TypeCode = await this.repository.getTypeCode(data.type_id);
    if (!TypeCode) {
      return CustomResponse.error('Type not Found!', null, 500);
    }
    // count
    const count = await this.repository.count();
    data.code = `${TypeCode.code}${(count + 1).toString().padStart(4, '0')}`;

    return super.create(data);
  }

  async getProductCodes(product_id: any) {
    const codes = await this.productCodeRepository.findAll({
      product_id: product_id,
      deleted_at: null,
    });
    return CustomResponse.success('Product codes retrieved!', codes, 200);
  }

  async generateProductCode(product_id: any, data: any) {
    const product = await this.productRepository.findOne(product_id);
    if (!product) {
      throw new Error('Product not found');
    }
    const count_codes = await this.productCodeRepository.count({
      product_id: product_id,
    });
    const barcode = `${product.code}${(count_codes + 1).toString().padStart(4, '0')}`; // logic for barcode
    data = { ...data, barcode: barcode, product_id: product_id };
    data = new CreateProductCodeDto(data);
    console.log(data);
    const validated = this.validation.validate(
      data,
      CreateProductCodeDto.schema(),
    );
    const code = await this.productCodeRepository.create(validated);
    return CustomResponse.success('Product code generated!', code, 201);
  }

  async deleteProductCode(id: any) {
    const code = await this.productCodeRepository.findOne(id);
    if (!code) {
      throw new Error('Product code not found');
    }
    await this.productCodeRepository.delete(id);
    return CustomResponse.success('Product code deleted!', null, 200);
  }
}
