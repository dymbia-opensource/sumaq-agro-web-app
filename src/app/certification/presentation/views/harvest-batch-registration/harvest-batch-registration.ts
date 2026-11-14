import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CooperativeMemberOption } from '../../../infrastructure/certification-api';

/** Valores que comparten el formulario de acopio y la ficha de calificación. */
export interface HarvestEvaluationForm {
  memberId: number;
  plotId: number;
  grossKg: number;
  tareKg: number;
  sampleKg: number;
  firstPercentage: number;
  secondPercentage: number;
  thirdPercentage: number;
  weevilDamagePercentage: number;
  scaScore: number;
}

@Component({
  selector: 'app-harvest-batch-registration',
  imports: [FormsModule, DecimalPipe, TranslatePipe],
  templateUrl: './harvest-batch-registration.html',
  styleUrl: './harvest-batch-registration.css',
})
/** Captura socio, parcela, pesaje y peso de la muestra. */
export class HarvestBatchRegistration {
  @Input({ required: true }) form!: HarvestEvaluationForm;
  @Input({ required: true }) members: CooperativeMemberOption[] = [];
  @Input({ required: true }) plots: CooperativeMemberOption['plots'] = [];
  @Output() memberChanged = new EventEmitter<void>();

  /** Calcula el peso recibido sin contar la tara. */
  get netKg(): number {
    return Math.max(0, this.form.grossKg - this.form.tareKg);
  }
}
