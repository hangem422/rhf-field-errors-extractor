export enum CompareFieldErrorDataResult {
  First,
  Second,
  Equal,
}

export interface FieldErrorDataOrder {
  compare(data1: FieldErrorData, data2: FieldErrorData): CompareFieldErrorDataResult;
}

export class FieldErrorData {
  public static fromError(error: object): FieldErrorData {
    const message = 'message' in error && typeof error.message === 'string' ? error.message : undefined;
    const element = 'ref' in error && error.ref instanceof HTMLElement ? error.ref : undefined;

    return new FieldErrorData(message, element);
  }

  constructor(
    public readonly message: string | undefined,
    public readonly element: HTMLElement | undefined,
  ) {}

  public isEmpty() {
    return this.message === undefined && this.element === undefined;
  }

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

    if (this.isEmpty() && data.isEmpty()) {
      return this;
    }
    if (this.isEmpty()) {
      return data;
    }

    return this;
  }
}
