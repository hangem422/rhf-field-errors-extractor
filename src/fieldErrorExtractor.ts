import type { FieldErrors, FieldValues } from 'react-hook-form';

import type { FieldErrorDataOrder } from './logics/fieldErrorData';
import { FieldErrorData } from './logics/fieldErrorData';

export class FieldErrorExtractor<TFieldValues extends FieldValues> {
  constructor(private readonly fieldErrors: FieldErrors<TFieldValues>) {}

  public extract(orders: Array<FieldErrorDataOrder> = []): FieldErrorData | undefined {
    return this.extractRecursively('', this.fieldErrors, orders);
  }

  private extractRecursively(
    name: string,
    error: unknown,
    orders: Array<FieldErrorDataOrder> = [],
  ): FieldErrorData | undefined {
    if (typeof error !== 'object' || error === null || error instanceof HTMLElement) {
      return undefined;
    }

    // - The properties of FieldErrorsImpl merged with FieldError are difficult to type explicitly.
    // - A property could belong to FieldError, or it could be a FieldError of a sub FieldValue, or a merged type of both.
    // - Therefore, in extractFromError, the error parameter is typed as unknown.
    // - If the parameter is neither a GlobalError nor a FieldError, the function iterates through all properties to extract messages.
    return Object.entries(error).reduce<FieldErrorData | undefined>(
      (fieldErrorData, [key, childError]) => {
        const childName = name === '' ? key : `${name}.${key}`;
        const childFieldErrorData = this.extractRecursively(childName, childError, orders);

        if (fieldErrorData && childFieldErrorData) {
          return fieldErrorData.compare(childFieldErrorData, orders);
        }

        return fieldErrorData ?? childFieldErrorData;
      },
      FieldErrorData.fromError(name, error),
    );
  }
}
