import { TestBed } from '@angular/core/testing';

import { ElementAService } from './element-a.service';

describe('ElementAService', () => {
  let service: ElementAService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ElementAService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
