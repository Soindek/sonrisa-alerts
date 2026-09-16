import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DeliveryLogTable } from './delivery-log-table';
import { InjectEventForm } from './inject-event-form';

@Component({
  imports: [InjectEventForm, DeliveryLogTable],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
