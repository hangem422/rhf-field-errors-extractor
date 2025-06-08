import type { FieldErrors, FieldValues } from 'react-hook-form';

export class SingleErrorMessageExtractor {
  public extract<TFieldValues extends FieldValues>(fieldErrors: FieldErrors<TFieldValues>): string | undefined {
    return Object.values(fieldErrors)
      .map((error) => error?.message)
      .find((message) => typeof message === 'string');
  }
}
