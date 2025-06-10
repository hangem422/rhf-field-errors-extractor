import type { FieldErrorData, FieldErrorDataOrder } from './logics/fieldErrorData';
import { CompareFieldErrorDataResult } from './logics/fieldErrorData';

export class MessageExistExtractOrder implements FieldErrorDataOrder {
  public compare(data1: FieldErrorData, data2: FieldErrorData): CompareFieldErrorDataResult {
    if (typeof data1.message === data2.message) {
      return CompareFieldErrorDataResult.Equal;
    }

    return typeof data1.message === 'string' ? CompareFieldErrorDataResult.First : CompareFieldErrorDataResult.Second;
  }
}
