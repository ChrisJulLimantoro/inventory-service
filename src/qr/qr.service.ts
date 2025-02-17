import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  async generateQRCode(data: string) {
    return await QRCode.toDataURL(data);
  }
}
