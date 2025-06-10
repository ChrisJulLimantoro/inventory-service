import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/repositories/base.repository';
import { ProductService } from 'src/product/product.service';

@Injectable()
export class StockOpnameRepository extends BaseRepository<any> {
  constructor(
    prisma: PrismaService,
    private readonly productService: ProductService,
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


  async getProductCodes(category_id: any) {
    return this.prisma.productCode.findMany({
      where: {
        product: {
          type: {
            category_id: category_id,
          },
        },
      },
    });
  }
}
