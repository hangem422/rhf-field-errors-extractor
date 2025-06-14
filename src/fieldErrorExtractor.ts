import type { FieldErrors, FieldValues } from 'react-hook-form';

import type { FieldErrorDataOrder } from './logics/fieldErrorData';
import { FieldErrorData } from './logics/fieldErrorData';

export class FieldErrorExtractor<TFieldValues extends FieldValues> {
  constructor(private readonly fieldErrors: FieldErrors<TFieldValues>) {}

  public extractMessage(orders: Array<FieldErrorDataOrder> = []): string | undefined {
    const error = this.extractData(this.fieldErrors, orders);
    return error?.message;
  }

  private extractData(error: unknown, orders: Array<FieldErrorDataOrder> = []): FieldErrorData {
    if (typeof error !== 'object' || error === null || error instanceof HTMLElement) {
      return new FieldErrorData(undefined, undefined);
    }

    // - The properties of FieldErrorsImpl merged with FieldError are difficult to type explicitly.
    // - A property could belong to FieldError, or it could be a FieldError of a sub FieldValue, or a merged type of both.
    // - Therefore, in extractFromError, the error parameter is typed as unknown.
    // - If the parameter is neither a GlobalError nor a FieldError, the function iterates through all properties to extract messages.
    return Object.values(error).reduce<FieldErrorData>((acc, cur) => {
      const extractedFieldError = this.extractData(cur, orders);
      return acc.compare(extractedFieldError, orders);
    }, FieldErrorData.fromError(error));
  }
}
