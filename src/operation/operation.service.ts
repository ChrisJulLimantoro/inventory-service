import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/base.service';
import { OperationRepository } from 'src/repositories/operation.repository';
import { ValidationService } from 'src/validation/validation.service';
import { CreateOperationRequest } from './dto/create-operation.dto';
import { UpdateOperationRequest } from './dto/update-operation.dto';
import { StoreRepository } from 'src/repositories/store.repository';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';

@Injectable()
export class OperationService extends BaseService {
  protected repository = this.operationRepository;
  protected createSchema = CreateOperationRequest.schema();
  protected updateSchema = UpdateOperationRequest.schema();

  constructor(
    private readonly operationRepository: OperationRepository,
    private readonly storeRepository: StoreRepository,
    protected readonly validation: ValidationService,
  ) {
    super(validation);
  }

  protected transformCreateData(data: any) {
    return new CreateOperationRequest(data);
  }

  protected transformUpdateData(data: any) {
    return new UpdateOperationRequest(data);
  }

  async create(data: any, user_id?: string) {
    // Generate Code
    const store = await this.storeRepository.findOne(data.store_id);

    if (!store) {
      return CustomResponse.error('Store not Found!', null, 500);
    }

    const count = await this.repository.count({
      store_id: data.store_id,
    });
    data.code = `${store.code}OP${(count + 1).toString().padStart(3, '0')}`;

    return super.create(data, user_id);
  }
}
