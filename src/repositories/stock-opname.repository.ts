import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/repositories/base.repository';
import { ProductService } from 'src/product/product.service';

@Injectable()
export class StockOpnameRepository extends BaseRepository<any> {
  constructor(
    prisma: PrismaService,
    private readonly productService: ProductService
  ) {
    const relations = {
      details: {
        include: {
          productCode: true,
        },
      },
      store: true,
      category: true,
    };
    super(prisma, 'stockOpname', relations, true);
  }

  async findNotScanned(id: any, scanned: any) {
      const stockOpname = await this.findOne(id);
      const reformatScanned = scanned.map((scan) => scan.product_code_id);
      const AllProductCode = await this.productService.getAllProductCode({
        product: {
          store_id: stockOpname.store_id,
          type: {
            category_id: stockOpname.category_id,
          },
        },
        status: {
          in: [0, 2],
        },
      }).then((res) => res.data.data);
      const result = AllProductCode.filter(
        (productCode) => !reformatScanned.includes(productCode.id)
      );

      return result;
  }
}
