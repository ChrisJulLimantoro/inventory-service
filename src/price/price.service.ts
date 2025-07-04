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

  async bulkCreate(data: any, user_id?: string) {
    console.log(data);
    const priceDataArray = Object.values(data).filter(
      (item): item is { type_id: string; price: string; date: string } =>
        !!(
          item &&
          typeof item === 'object' &&
          'type_id' in item &&
          'price' in item &&
          'date' in item
        ),
    );

    // Check for duplicate time and date in bulkCreate of price
    for (const d of priceDataArray) {
      const check = await this.priceRepository.findAll({
        type_id: d.type_id,
        date: d.date,
      });
      if (check.data.length > 0) {
        return CustomResponse.error(
          `Data already Exist for this date and type!`,
          null,
          400,
        );
      }
    }

    return super.bulkCreate(data, user_id);
  }

  async bulkDelete(
    category_id: string,
    date: string,
    user_id?: string,
  ): Promise<CustomResponse> {
    const data = await this.priceRepository.bulkDelete(
      category_id,
      date,
      user_id,
    );
    console.log(data);
    if (!data) {
      return CustomResponse.error('Failed to delete data', null, 500);
    }
    return CustomResponse.success(data.message, data.deleted);
  }
}
