import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/base.service';
import { PriceRepository } from 'src/repositories/price.repository';
import { ValidationService } from 'src/validation/validation.service';
import { CreatePriceRequest } from './dto/create-price.dto';
import { UpdatePriceRequest } from './dto/update-price.dto';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';

@Injectable()
export class PriceService extends BaseService {
  protected repository = this.priceRepository;
  protected createSchema = CreatePriceRequest.schema();
  protected updateSchema = UpdatePriceRequest.schema();

  constructor(
    private readonly priceRepository: PriceRepository,
    protected readonly validation: ValidationService,
  ) {
    super(validation);
  }

  protected transformCreateData(data: any) {
    return new CreatePriceRequest(data);
  }

  protected transformUpdateData(data: any) {
    return new UpdatePriceRequest(data);
  }

  async bulkDelete(category_id: string, date: string): Promise<CustomResponse> {
    const data = await this.priceRepository.bulkDelete(category_id, date);
    console.log(data);
    if (!data) {
      return CustomResponse.error('Failed to delete data', null, 500);
    }
    return CustomResponse.success(data.message, data.deleted);
  }
}
