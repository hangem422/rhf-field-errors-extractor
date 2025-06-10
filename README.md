# rhf-field-errors-extractor

Extract a single representative error message from React Hook Form FieldErrors.

## About React Hook Form FieldErrors

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
