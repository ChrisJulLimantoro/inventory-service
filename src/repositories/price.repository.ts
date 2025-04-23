import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/repositories/base.repository';

@Injectable()
export class PriceRepository extends BaseRepository<any> {
  constructor(prisma: PrismaService) {
    const relations = {
      type: true,
    };
    super(prisma, 'price', relations, true); // 'role' is the Prisma model name
  }

  async bulkDelete(category_id: string, date: string, user_id?: string) {
    const recordsToDelete = await this.prisma.price.findMany({
      where: {
        type: {
          category_id: category_id,
        },
        date: new Date(date), // Ensure correct format
      },
    });

    if (recordsToDelete.length === 0) {
      return { message: 'No records found to delete', deleted: [] };
    }

    await this.prisma.price.updateMany({
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
      where: {
        type: {
          category_id: category_id,
        },
        date: new Date(date),
      },
    });

    // log the deletion action
    for (const record of recordsToDelete) {
      await this.actionLog('price', record.id, 'DELETE', null, user_id);
    }

    return {
      message: `${recordsToDelete.length} Records deleted successfully`,
      deleted: recordsToDelete,
    };
  }
}
