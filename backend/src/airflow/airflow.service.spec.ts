import { Test, TestingModule } from '@nestjs/testing';
import { AirflowService } from './airflow.service';

describe('AirflowService', () => {
  let service: AirflowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AirflowService],
    }).compile();

    service = module.get<AirflowService>(AirflowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
