import type { PropsWithChildren } from 'react';
import type { SubmitErrorHandler, SubmitHandler } from 'react-hook-form';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

export const SubmitButtonTextContent = 'Submit';

type Props<Schema extends z.ZodTypeAny> = {
  schema: Schema;
  defaultValues: z.input<Schema>;
  onSubmitValid: SubmitHandler<z.output<Schema>>;
  onSubmitInvalid?: SubmitErrorHandler<z.input<Schema>>;
};

export function TestZodFormComponent<Schema extends z.ZodTypeAny>({
  schema,
  defaultValues,
  onSubmitValid,
  onSubmitInvalid,
  children,
}: PropsWithChildren<Props<Schema>>) {
  const formMethod = useForm({ resolver: zodResolver(schema), defaultValues });

  return (
    <FormProvider {...formMethod}>
      <form onSubmit={formMethod.handleSubmit(onSubmitValid, onSubmitInvalid)}>
        {children}
        <button type="submit">{SubmitButtonTextContent}</button>
      </form>
    </FormProvider>
  );
}
