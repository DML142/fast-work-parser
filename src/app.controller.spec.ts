import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  it('responds to GET /health with ok status', async () => {
    const module = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    const controller = module.get(AppController);

    expect(controller.health()).toEqual({ status: 'ok' });
  });
});
