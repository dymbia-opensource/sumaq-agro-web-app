import { HarvestBatchProps } from '../entities/harvest-batch.entity';

/** Datos enviados al registrar un lote calificado en la API de prueba. */
export type RegisterHarvestBatchCommand = Omit<HarvestBatchProps, 'id'>;
