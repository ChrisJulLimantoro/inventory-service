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

    const scanned = updateStockOpname.details;
    // console.log('updateStockOpname', updateStockOpname)
    // updateStockOpname {
    //   id: 'c973fa13-9008-4d29-9016-8e5daf8feb20',
    //   store_id: '8dedffbb-f267-490a-9feb-e1547b01fcda',
    //   category_id: '5d8b6bbc-a105-4165-8cb1-a835ee07ae03',
    //   date: 2025-03-26T00:00:00.000Z,
    //   status: 1,
    //   description: '',
    //   approve: true,
    //   approve_by: 'd643abb7-2944-4412-8bb5-5475679f5ade',
    //   approve_at: 2025-03-25T06:24:05.842Z,
    //   created_by: 'd643abb7-2944-4412-8bb5-5475679f5ade',
    //   created_at: 2025-03-25T04:46:15.167Z,
    //   updated_at: 2025-03-25T06:24:05.842Z,
    //   deleted_at: null,
    //   details: [],
    //   store: {
    //     id: '8dedffbb-f267-490a-9feb-e1547b01fcda',
    //     code: 'AAA',
    //     name: 'Cabang A',
    //     is_active: true,
    //     is_flex_price: false,
    //     is_float_price: false,
    //     tax_percentage: 11,
    //     company_id: 'f2a8a1d7-3c4b-4e27-9b4e-6fbd3f87d92c',
    //     created_at: 2025-03-16T13:51:40.444Z,
    //     updated_at: 2025-03-18T04:51:09.785Z,
    //     deleted_at: null
    //   },
    //   category: {
    //     id: '5d8b6bbc-a105-4165-8cb1-a835ee07ae03',
    //     code: 'AA001',
    //     name: 'Cincin',
    //     purity: '10',
    //     metal_type: 1,
    //     weight_tray: 12,
    //     weight_paper: 14,
    //     description: 'asdf',
    //     company_id: 'f2a8a1d7-3c4b-4e27-9b4e-6fbd3f87d92c',
    //     created_at: 2025-03-17T03:34:39.149Z,
    //     updated_at: 2025-03-17T03:34:39.149Z,
    //     deleted_at: null
    //   }
    // }
    // {
    //   id: 'c973fa13-9008-4d29-9016-8e5daf8feb20',
    //   store_id: '8dedffbb-f267-490a-9feb-e1547b01fcda',
    //   category_id: '5d8b6bbc-a105-4165-8cb1-a835ee07ae03',
    //   date: 2025-03-26T00:00:00.000Z,
    //   status: 1,
    //   description: '',
    //   approve: true,
    //   approve_by: 'd643abb7-2944-4412-8bb5-5475679f5ade',
    //   approve_at: 2025-03-25T06:24:05.842Z,
    //   created_by: 'd643abb7-2944-4412-8bb5-5475679f5ade',
    //   created_at: 2025-03-25T04:46:15.167Z,
    //   updated_at: 2025-03-25T06:24:05.842Z,
    //   deleted_at: null,
    //   details: [],
    //   store: {
    //     id: '8dedffbb-f267-490a-9feb-e1547b01fcda',
    //     code: 'AAA',
    //     name: 'Cabang A',
    //     is_active: true,
    //     is_flex_price: false,
    //     is_float_price: false,
    //     tax_percentage: 11,
    //     company_id: 'f2a8a1d7-3c4b-4e27-9b4e-6fbd3f87d92c',
    //     created_at: 2025-03-16T13:51:40.444Z,
    //     updated_at: 2025-03-18T04:51:09.785Z,
    //     deleted_at: null
    //   },
    //   category: {
    //     id: '5d8b6bbc-a105-4165-8cb1-a835ee07ae03',
    //     code: 'AA001',
    //     name: 'Cincin',
    //     purity: '10',
    //     metal_type: 1,
    //     weight_tray: 12,
    //     weight_paper: 14,
    //     description: 'asdf',
    //     company_id: 'f2a8a1d7-3c4b-4e27-9b4e-6fbd3f87d92c',
    //     created_at: 2025-03-17T03:34:39.149Z,
    //     updated_at: 2025-03-17T03:34:39.149Z,
    //     deleted_at: null
    //   }
    // }
    
    console.log('scanned', scanned);
    const stockNotScanned = await this.stockOpnameRepository.findNotScanned(id, scanned); // and status is in stock or bought back
    // console.log('this is stock not scanned',stockNotScanned);
    // this is stock not scanned [
    //   {
    //   id: '311d1827-5ff4-447c-9a9e-dd689471fc27',
    //   barcode: 'AA0010100030001',
    //   product_id: '436446a4-be6d-406b-bb15-50a7a09eff47',
    //   weight: 0.6,
    //   fixed_price: 100000,
    //   status: 0,
    //   taken_out_at: 2025-03-25T00:00:00.000Z,
    //   taken_out_reason: 1,
    //   taken_out_by: 'd643abb7-2944-4412-8bb5-5475679f5ade',
    //   buy_price: 120000,
    //   tax_purchase: 13200,
    //   image: 'uploads\\product\\7af0061b-6928-4b22-9fa1-c33362d55a49.png',
    //   account_id: 'f609be50-160a-4edd-b3ac-755ab5c5739a',
    //   created_at: 2025-03-18T06:43:46.930Z,
    //   updated_at: 2025-03-25T01:52:16.603Z,
    //   deleted_at: null,
    //   product: {
    //     id: '436446a4-be6d-406b-bb15-50a7a09eff47',
    //     code: 'AA001010003',
    //     name: 'BUBU',
    //     description: 'asdf',
    //     status: 1,
    //     tags: [],
    //     type_id: '81b1af2f-9a6a-41c0-806c-012fd002310f',
    //     store_id: '8dedffbb-f267-490a-9feb-e1547b01fcda',
    //     created_at: 2025-03-18T06:42:33.941Z,
    //     updated_at: 2025-03-18T06:42:33.941Z,
    //     deleted_at: null,
    //     type: [Object],
    //     store: [Object]
    //   }
    // }
    // ]
    

    if (stockNotScanned.length > 0) {
      this.financeClient.emit({ cmd: 'stock_opname_approved' }, {stockNotScanned, id: updateStockOpname.id, trans_date: new Date()});
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
    const scanned = updateStockOpname.details;
    const stockNotScanned = await this.stockOpnameRepository.findNotScanned(id, scanned);
    this.financeClient.emit({ cmd: 'stock_opname_disapproved' },{stockNotScanned, id})

    return CustomResponse.success(
      'Successfully dissaprove stock opname',
      updateStockOpname,
      200,
    );
  }
}
