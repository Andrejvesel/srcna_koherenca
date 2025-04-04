import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreathingPage } from './breathing.page';

describe('BreathingPage', () => {
  let component: BreathingPage;
  let fixture: ComponentFixture<BreathingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BreathingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
