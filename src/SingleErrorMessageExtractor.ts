import type { FieldError, FieldErrors, FieldValues, GlobalError, MultipleFieldErrors } from 'react-hook-form';

export class SingleErrorMessageExtractor {
  public extract<TFieldValues extends FieldValues>(fieldErrors: FieldErrors<TFieldValues>): string | undefined {
    return Object.values(fieldErrors)
      .map((error) => this.extractFromErorr(error))
      .find((message) => message !== undefined);
  }

  private extractFromErorr(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null || error instanceof HTMLElement) {
      return undefined;
    }

    if (this.isGlobalError(error) || this.isFieldError(error)) {
      return error.message;
    }

    // - The properties of FieldErrorsImpl merged with FieldError are difficult to type explicitly.
    // - A property could belong to FieldError, or it could be a FieldError of a sub FieldValue, or a merged type of both.
    // - Therefore, in extractFromError, the error parameter is typed as unknown.
    // - If the parameter is neither a GlobalError nor a FieldError, the function iterates through all properties to extract messages.
    return Object.values(error)
      .map((error) => this.extractFromErorr(error))
      .find((message) => message !== undefined);
  }

  private isGlobalError(error: unknown): error is GlobalError {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const isNotGlobalError = Object.entries(error).some(([key, value]) => {
      switch (key) {
        case 'type':
          return value !== undefined && typeof value !== 'string' && typeof value !== 'number';
        case 'message':
          return value !== undefined && typeof value !== 'string';
        default:
          return true;
      }
    });

    return isNotGlobalError === false;
  }

  private isFieldError(error: unknown): error is FieldError {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const isNotFieldError = Object.entries(error).some(([key, value]) => {
      switch (key) {
        case 'type':
          return typeof value !== 'string';
        case 'root':
          return value !== undefined && this.isFieldError(value) === false;
        case 'ref':
          return value !== undefined && value instanceof HTMLElement === false;
        case 'types':
          return value !== undefined && this.isMultipleFieldErrors(value) === false;
        case 'message':
          return value !== undefined && typeof value !== 'string';
        default:
          return true;
      }
    });

    return 'type' in error && isNotFieldError === false;
  }

  private isMultipleFieldErrors(error: object): error is MultipleFieldErrors {
    return Object.values(error).every((result) => {
      if (Array.isArray(result)) {
        return result.every((message) => typeof message === 'string');
      }

      return typeof result === 'string' || typeof result === 'boolean' || result === undefined;
    });
  }
}
