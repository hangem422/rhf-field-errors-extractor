import type { FieldPath, FieldValues } from 'react-hook-form';

import type { FieldErrorData, FieldErrorDataOrder } from './logics/fieldErrorData';
import { CompareFieldErrorDataResult } from './logics/fieldErrorData';

export class MessageExistExtractOrder implements FieldErrorDataOrder {
  private readonly tirmOption: boolean;

  constructor(options?: { trim?: boolean }) {
    this.tirmOption = options?.trim ?? false;
  }

  public compare(data1: FieldErrorData, data2: FieldErrorData): CompareFieldErrorDataResult {
    const message1 = this.tirmOption ? data1.message?.trim() : data1.message;
    const message2 = this.tirmOption ? data2.message?.trim() : data2.message;

    if (typeof data1.message === data2.message) {
      return CompareFieldErrorDataResult.Equal;
    }

    // A message with an empty string takes precedence over an undefined string.
    // Since the differences between messages have been verified above, if one is undefined, it is not the other.
    if (message1 === undefined) {
      return CompareFieldErrorDataResult.Second;
    }
    if (message2 === undefined) {
      return CompareFieldErrorDataResult.First;
    }

    return message1 === '' ? CompareFieldErrorDataResult.Second : CompareFieldErrorDataResult.First;
  }
}

export class DomPlaceExtractOrder implements FieldErrorDataOrder {
  public compare(data1: FieldErrorData, data2: FieldErrorData): CompareFieldErrorDataResult {
    const { element: element1 } = data1;
    const { element: element2 } = data2;

    if (element1 === undefined && element2 === undefined) {
      return CompareFieldErrorDataResult.Equal;
    }
    if (element1 === undefined) {
      return CompareFieldErrorDataResult.Second;
    }
    if (element2 === undefined) {
      return CompareFieldErrorDataResult.First;
    }

    const documentPosition = element1.compareDocumentPosition(element2);
    if (documentPosition & Node.DOCUMENT_POSITION_FOLLOWING) {
      return CompareFieldErrorDataResult.First;
    }
    if (documentPosition & Node.DOCUMENT_POSITION_PRECEDING) {
      return CompareFieldErrorDataResult.Second;
    }
    if (documentPosition & Node.DOCUMENT_POSITION_CONTAINS) {
      return CompareFieldErrorDataResult.First;
    }
    if (documentPosition & Node.DOCUMENT_POSITION_CONTAINED_BY) {
      return CompareFieldErrorDataResult.Second;
    }

    return CompareFieldErrorDataResult.Equal;
  }
}

export class MatchedNameExtractOrder<
  TFieldValues extends FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> implements FieldErrorDataOrder
{
  private readonly nameList: Array<TFieldName>;
  private readonly exactOption: boolean;

  constructor(nameList: Array<TFieldName>, options?: { exact?: boolean }) {
    this.nameList = Array.from(new Set(nameList));
    this.exactOption = options?.exact ?? false;
  }

  public compare(data1: FieldErrorData, data2: FieldErrorData): CompareFieldErrorDataResult {
    const index1 = this.nameList.findIndex((name) => this.matchName(name, data1));
    const index2 = this.nameList.findIndex((name) => this.matchName(name, data2));

    if (index1 === index2) {
      return CompareFieldErrorDataResult.Equal;
    }

    if (index1 >= 0 && index2 >= 0) {
      return index1 < index2 ? CompareFieldErrorDataResult.First : CompareFieldErrorDataResult.Second;
    }

    return index1 < 0 ? CompareFieldErrorDataResult.Second : CompareFieldErrorDataResult.First;
  }

  private matchName(name: TFieldName, data: FieldErrorData) {
    return this.exactOption ? data.name === name : data.name.startsWith(name);
  }
}
