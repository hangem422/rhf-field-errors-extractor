export enum CompareFieldErrorDataResult {
  First,
  Second,
  Equal,
}

export interface FieldErrorDataOrder {
  compare(data1: FieldErrorData, data2: FieldErrorData): CompareFieldErrorDataResult;
}

export class FieldErrorData {
  public static fromError(name: string, error: object): FieldErrorData | undefined {
    const message = 'message' in error && typeof error.message === 'string' ? error.message : undefined;
    const element = 'ref' in error && error.ref instanceof HTMLElement ? error.ref : undefined;

    if (message === undefined && element === undefined) {
      return undefined;
    }

    return new FieldErrorData(name, message, element);
  }

  private constructor(
    public readonly name: string,
    public readonly message: string | undefined,
    public readonly element: HTMLElement | undefined,
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
