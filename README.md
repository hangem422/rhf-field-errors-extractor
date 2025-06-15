# rhf-field-errors-extractor

Extract a single representative error message from React Hook Form FieldErrors.

## How To Use

### Extract Error Data

```tsx
const formMethod = useForm();

const handleSubmit = formMethod.handleSubmit(
  (data) => {
    // ...
  },
  (fieldErrors) => {
    const extractor = new FieldErrorExtractor(fieldErrors);
    const errorData = extractor.extract();

    window.alert(errorData.message);
    errorData.element?.focus();
  },
);
```

- message: Field error messages registered with React Hook Form
- element: It can be used if the ref of the field is assigned to the component.

### Setting Error Priority

```tsx
const extractor = new FieldErrorExtractor(fieldErrors);
const errorData = extractor.extract([new MessageExistExtractOrder({ trim: true }), new DomPlaceExtractOrder()]);

window.alert(errorData.message);
errorData.element?.focus();
```

When you pass the `FieldErrorDataOrder` array as a parameter to the extract method, it finds the most appropriate error data from `FieldErrors`. The `FieldErrorDataOrder` is applied in order, and in the example above, it extracts the error data from the `FieldError` that has a message and appears first in DOM order.

- `MessageExistExtractOrder({ trim: boolean })`: `FieldError` that contain a message are prioritized. When comparing `undefined` and an empty string, the empty string takes precedence. The `trim` option determines whether to trim the message of a `FieldError` before comparison.
- `DomPlaceExtractOrder()`: `FieldError` that appear earlier in the DOM are given higher priority. `FieldError` without an assigned ref have the lowest priority.

## Custom Extract Order

```tsx
class CustomExtractOrder implements FieldErrorDataOrder {
  public compare(data1: FieldErrorData, data2: FieldErrorData): CompareFieldErrorDataResult {
    if (this.isFirstDataSelected()) {
      return CompareFieldErrorDataResult.First;
    }

    if (this.isSecondDataSelected()) {
      return CompareFieldErrorDataResult.Second;
    }

    return CompareFieldErrorDataResult.Equal;
  }
}

const extractor = new FieldErrorExtractor(fieldErrors);
const errorData = extractor.extract([new CustomExtractOrder()]);
```

You can customize the priority logic by implementing the `compare` method in a class that extends the `FieldErrorDataOrder` interface, and passing it to the `extract` method of `FieldErrorExtractor`.

## Background Knowledge

### About React Hook Form FieldErrors

```ts
type FieldErrors<T extends FieldValues = FieldValues> = Partial<
  FieldValues extends IsAny<FieldValues> ? any : FieldErrorsImpl<DeepRequired<T>>
> & {
  root?: Record<string, GlobalError> & GlobalError;
};

type FieldErrorsImpl<T extends FieldValues = FieldValues> = {
  [K in keyof T]?: T[K] extends BrowserNativeObject | Blob
    ? FieldError
    : K extends 'root' | `root.${string}`
      ? GlobalError
      : T[K] extends object
        ? Merge<FieldError, FieldErrorsImpl<T[K]>>
        : FieldError;
};
```

`FieldErrors` is an object that maps the keys of `FieldValues` where errors have occurred to their corresponding error data. Depending on the situation, various types of error data may exist.

- When the value is of type `BrowserNativeObject` or `Blob`: `FieldError`
- When the key is `"root"` or a string starting with `"root."`: `GlobalError`
- When the value is an object: `Merge<FieldError, FieldErrorsImpl<T[K]>>`
- Other cases: `FieldError`

If we abstract this from a different perspective, `FieldErrorsImpl` can be viewed as a tree structure where `GlobalError` and `FieldError` act as leaf nodes.

```ts
type FieldErrorsImpl = {
  ['root' | `root.${string}`]: GlobalError;
  [Key_Of_No_Chil_FiledValue]: FieldError;
  [Key_Of_Has_Child_FieldValue]: Merge<FieldError, FieldErrorsImpl<Has_Child_FieldValue>>;
};
```

One important point to note is that, except for the root node (`FieldErrors`), the parent nodes (`Merge<FieldError, FieldErrorsImpl<T[K]>>`) inherently possess the properties of leaf nodes (`FieldError`) due to the sepc of `Merge`.

```ts
type Merge<A, B> = {
  [K in keyof A | keyof B]?: K extends keyof A & keyof B
    ? [A[K], B[K]] extends [object, object]
      ? Merge<A[K], B[K]>
      : A[K] | B[K]
    : K extends keyof A
      ? A[K]
      : K extends keyof B
        ? B[K]
        : never;
};
```
