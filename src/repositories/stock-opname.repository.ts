import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/repositories/base.repository';

@Injectable()
export class StockOpnameRepository extends BaseRepository<any> {
  constructor(prisma: PrismaService) {
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

  async findNotScanned(stockOpnameId: string) {
    const stockOpname = await this.findOne(stockOpnameId);
    console.log(stockOpname);
    const result = await this.prisma.productCode.findMany({
      where: {
        StockOpnameDetails: {
          none: {} // Menggunakan `none` agar hanya mengambil yang tidak ada di stock_opname_details
        },
        product: {
          type: {
            category_id: stockOpname.category_id
          }
        }
      },
      include: {
        product: {
          include: {
            type: {
              include: {
                category: true
              }
            }, // Mengambil informasi tipe produk,
            store: true, // Mengambil informasi toko
          }
        }
      }
    });

    return result;
  }
}
