import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'src/base.service';
import { StockOpnameRepository } from 'src/repositories/stock-opname.repository';
import { ValidationService } from 'src/validation/validation.service';
import { StockOpnameDTO } from './dto/stock-opname.dto';
import { StockOpnameDetailDTO } from './dto/stock-opname-detail.dto';
import { StockOpnameDetailRepository } from 'src/repositories/stock-opname-detail.repository';
import { CustomResponse } from 'src/exception/dto/custom-response.dto';
import { ProductCodeRepository } from 'src/repositories/product-code.repository';
import { ClientProxy } from '@nestjs/microservices';

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
    @Inject('FINANCE') private readonly financeClient: ClientProxy,
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

  async approve(id: string, approve_by: string): Promise<CustomResponse> {
    const stockOpname = await this.stockOpnameRepository.findOne(id);
    if (!stockOpname) {
      throw new Error('Stock Opname not found');
    }

    // Add logic to check the approve by if needed!

    const updateStockOpname = await this.stockOpnameRepository.update(id, {
      status: 1,
      approve: true,
      approve_by: approve_by,
      approve_at: new Date(),
    });

    const stockNotScanned = await this.stockOpnameRepository.findNotScanned(id)
    // console.log('this is stock not scanned',stockNotScanned);
    // this is stock not scanned [
    //   {
    //     id: 'c9172e6c-be97-4e3e-a4ac-c1d25fc7b62f',
    //     barcode: 'AA0020100040001',
    //     product_id: '38043fba-3b36-43d7-a7c9-0e6317916868',
    //     weight: 12,
    //     fixed_price: 5000,
    //     status: 0,
    //     taken_out_at: null,
    //     taken_out_reason: 0,
    //     taken_out_by: null,
    //     buy_price: 400000,
    //     tax_purchase: 44000,
    //     image: 'uploads\\product\\88813eb4-bfd2-4b7b-b555-d461a986b13b.png',
    //     account_id: 'f609be50-160a-4edd-b3ac-755ab5c5739a',
    //     created_at: 2025-03-18T06:49:50.612Z,
    //     updated_at: 2025-03-18T06:49:50.612Z,
    //     deleted_at: null,
    //     product: {
    //       id: '38043fba-3b36-43d7-a7c9-0e6317916868',
    //       code: 'AA002010004',
    //       name: 'Putih',
    //       description: 'asdf',
    //       images: [Array],
    //       status: 1,
    //       tags: [],
    //       type_id: '19d5aba0-b8ff-4091-b0a8-a34d837a653a',
    //       store_id: '8dedffbb-f267-490a-9feb-e1547b01fcda',
    //       created_at: 2025-03-18T06:49:01.709Z,
    //       updated_at: 2025-03-18T06:49:01.709Z,
    //       deleted_at: null,
    //       type: [Object]
    //     }
    //   }
    // ]
    

    if (stockNotScanned.length > 0) {
      this.financeClient.emit({ cmd: 'stock_opname_approved' }, {stockNotScanned, trans_date: new Date()});
    }

    return CustomResponse.success(
      'Successfully update stock opname',
      updateStockOpname,
      200,
    );
  }

  async disapprove(id: string, disapprove_by: string): Promise<CustomResponse> {
    const stockOpname = await this.stockOpnameRepository.findOne(id);
    if (!stockOpname) {
      throw new Error('Stock Opname not found');
    }

    // Add logic to check the disapprove by if needed!

    const updateStockOpname = await this.stockOpnameRepository.update(id, {
      status: 0,
      approve: false,
      approve_by: disapprove_by,
      approve_at: new Date(),
    });

    return CustomResponse.success(
      'Successfully dissaprove stock opname',
      updateStockOpname,
      200,
    );
  }
}
