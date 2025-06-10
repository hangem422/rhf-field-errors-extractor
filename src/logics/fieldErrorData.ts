import type { FieldElement } from 'react-hook-form';

export enum CompareFieldErrorDataResult {
  First,
  Second,
  Equal,
}

export interface FieldErrorDataOrder {
  compare(error: FieldErrorData, error2: FieldErrorData): CompareFieldErrorDataResult;
}

export class FieldErrorData {
  constructor(
    public readonly message: string | undefined,
    public readonly element: FieldElement | undefined,
  ) {}

  public compare(data: FieldErrorData, orders: Array<FieldErrorDataOrder> = []): FieldErrorData {
    for (const order of orders) {
      const result = order.compare(this, data);

      if (result === CompareFieldErrorDataResult.First) {
        return this;
      }
      if (result === CompareFieldErrorDataResult.Second) {
        return data;
      }
    }

    return this;
  }
}
