import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/repositories/base.repository';

@Injectable()
export class ProductRepository extends BaseRepository<any> {
  constructor(prisma: PrismaService) {
    const relations = {
      stores: true,
      type: true,
      product_codes: true,
    };
    super(prisma, 'product', relations, true); // 'role' is the Prisma model name
  }
}
