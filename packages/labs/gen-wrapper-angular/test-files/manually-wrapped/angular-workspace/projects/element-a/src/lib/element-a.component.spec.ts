import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElementAComponent } from './element-a.component';

describe('ElementAComponent', () => {
  let component: ElementAComponent;
  let fixture: ComponentFixture<ElementAComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ElementAComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ElementAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
