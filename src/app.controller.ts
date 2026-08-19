import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // Used by Render's health check and the external keep-alive pinger.
  @Get('health')
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
