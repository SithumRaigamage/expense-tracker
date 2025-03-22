import { TestBed } from '@angular/core/testing';

import { ToastmsgService } from './toastmsg.service';

describe('ToastmsgService', () => {
  let service: ToastmsgService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastmsgService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
