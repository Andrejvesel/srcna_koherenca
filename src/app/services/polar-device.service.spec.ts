import { TestBed } from '@angular/core/testing';

import { PolarDeviceService } from './polar-device.service';

describe('PolarDeviceService', () => {
  let service: PolarDeviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PolarDeviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
