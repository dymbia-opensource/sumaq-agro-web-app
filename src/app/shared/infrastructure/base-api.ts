import { ErrorHandlingEnabledBaseType } from './error-handling-enabled-base-type';

/**
 * Base class for the API classes of the infrastructure layer.
 *
 * @remarks
 * Each bounded context has one facade (for example, `FarmingApi`)
 * that groups its endpoints.
 */
export abstract class BaseApi extends ErrorHandlingEnabledBaseType {}
