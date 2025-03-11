import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/base.service';
import { StockOpnameRepository } from 'src/repositories/stock-opname.repository';
import { ValidationService } from 'src/validation/validation.service';
import { StockOpnameDTO } from './dto/stock-opname.dto';
import { StockOpnameDetailDTO } from './dto/stock-opname-detail.dto';
import { StockOpnameDetailRepository } from 'src/repositories/stock-opname-detail.repository';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { ProductCodeRepository } from 'src/repositories/product-code.repository';

@Injectable()
export class StockOpnameService extends BaseService {
  protected repository = this.stockOpnameRepository;
  protected createSchema = StockOpnameDTO.createSchema();
  protected updateSchema = StockOpnameDTO.updateSchema();

  constructor(
    private readonly stockOpnameRepository: StockOpnameRepository,
    private readonly stockOpnameDetailRepository: StockOpnameDetailRepository,
    private readonly productCodeRepository: ProductCodeRepository,
    protected readonly validation: ValidationService,
  ) {
    super(validation);
  }

  protected transformCreateData(data: any) {
    return new StockOpnameDTO(data);
  }

  protected transformUpdateData(data: any) {
    return new StockOpnameDTO(data);
  }

  async createDetail(id: string, data: any) {
    const stockOpname = await this.stockOpnameRepository.findOne(id);
    if (!stockOpname) {
      throw new Error('Stock Opname not found');
    }

    const productCode = await this.productCodeRepository.getProductCode(
      data.product_code,
    );
    if (!productCode) {
      throw new Error('Product Code not found');
    }

    // Check if already created or not
    const check = await this.stockOpnameDetailRepository.findAll({
      stock_opname_id: id,
      product_code_id: productCode.id,
    });
    if (check.data.length > 0) {
      throw new Error('Data already exist');
    }

    data.stock_opname_id = id;
    data.product_code_id = productCode.id;

    data = new StockOpnameDetailDTO(data);

    const validate = await this.validation.validate(
      data,
      StockOpnameDetailDTO.createSchema(),
    );
    const stockOpnameDetail =
      await this.stockOpnameDetailRepository.create(validate);
    if (!validate) {
      throw new Error('Failed to create new data');
    }
    return CustomResponse.success(stockOpnameDetail, 200);
  }

  async delete(id: string) {
    const stockOpname = await this.stockOpnameRepository.findOne(id);
    if (!stockOpname) {
      throw new Error('Stock Opname not found');
    }

    await this.stockOpnameDetailRepository.deleteWhere({
      stock_opname_id: id,
    });
    const deleteStockOpname = await this.stockOpnameRepository.delete(id);

    return CustomResponse.success(deleteStockOpname, 200);
  }
}
