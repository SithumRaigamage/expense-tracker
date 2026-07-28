import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { faWallet } from '@fortawesome/free-solid-svg-icons';
import { EmptyStateComponent } from './empty-state.component';

/** Host that projects an action, to exercise the <ng-content> path. */
@Component({
  standalone: true,
  imports: [EmptyStateComponent],
  template: `
    <app-empty-state title="Nothing here" message="Add something first">
      <button type="button">Create one</button>
    </app-empty-state>
  `
})
class HostWithActionComponent {}

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  let component: EmptyStateComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent, HostWithActionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('falls back to a generic title so a widget never renders an unlabelled box', () => {
    fixture.detectChanges();
    expect(element.querySelector('h3')?.textContent?.trim()).toBe('No data available');
  });

  it('shows the supplied title and message', () => {
    component.title = 'No wallets yet';
    component.message = 'Create a wallet to start tracking';
    fixture.detectChanges();

    expect(element.textContent).toContain('No wallets yet');
    expect(element.textContent).toContain('Create a wallet to start tracking');
  });

  it('omits the message paragraph entirely when there is nothing to say', () => {
    component.message = '';
    fixture.detectChanges();

    expect(element.querySelector('p')).toBeNull();
  });

  it('renders the icon it was given', () => {
    component.icon = faWallet;
    fixture.detectChanges();

    expect(element.querySelector('fa-icon')).toBeTruthy();
  });

  it('grows its padding with size, so a chart-sized panel does not collapse', () => {
    const paddings = (['sm', 'md', 'lg'] as const).map(size => {
      component.size = size;
      fixture.detectChanges();
      return component.paddingClass;
    });

    expect(new Set(paddings).size).toBe(3);
    expect(paddings[2]).toBe('py-20');
  });

  it('projects an action when one is supplied', () => {
    const host = TestBed.createComponent(HostWithActionComponent);
    host.detectChanges();

    const button = host.nativeElement.querySelector('button');
    expect(button?.textContent).toContain('Create one');
  });
});
