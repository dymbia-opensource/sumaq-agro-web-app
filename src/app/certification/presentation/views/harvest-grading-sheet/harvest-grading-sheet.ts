import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { HarvestCropType } from '../../../domain/model/entities/crop-type';
import { HarvestEvaluationForm } from '../harvest-batch-registration/harvest-batch-registration';

@Component({
  selector: 'app-harvest-grading-sheet',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './harvest-grading-sheet.html',
  styleUrl: './harvest-grading-sheet.css',
})
/** Muestra los campos de calificación según el cultivo de la parcela. */
export class HarvestGradingSheet {
  @Input({ required: true }) form!: HarvestEvaluationForm;
  @Input({ required: true }) cropType!: HarvestCropType;

  /** La suma de calibres se usa para avisar si la calificación de papa es válida. */
  get gradingTotal(): number {
    return this.form.firstPercentage + this.form.secondPercentage + this.form.thirdPercentage;
  }
}
