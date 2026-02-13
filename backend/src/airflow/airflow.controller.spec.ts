import { Test, TestingModule } from '@nestjs/testing';
import { AirflowController } from './airflow.controller';

describe('AirflowController', () => {
  let controller: AirflowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AirflowController],
    }).compile();

    controller = module.get<AirflowController>(AirflowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
