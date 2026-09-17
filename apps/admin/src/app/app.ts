import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { DeliveryLogTable } from './delivery-log-table';
import { InjectEventForm } from './inject-event-form';
import { RulesPanel } from './rules-panel';

@Component({
  imports: [MatTabsModule, InjectEventForm, RulesPanel, DeliveryLogTable],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
