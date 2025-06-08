import type { PropsWithChildren } from 'react';
import type { SubmitErrorHandler, SubmitHandler } from 'react-hook-form';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

import { SingleErrorMessageExtractor } from '../SingleErrorMessageExtractor';

describe('SingleErrorMessageExtractor', () => {
  interface TestFormComponentProps<Schema extends z.ZodTypeAny> {
    schema: Schema;
    defaultValues: z.input<Schema>;
    onSubmit: SubmitHandler<z.output<Schema>>;
    onInvalidSubmit: SubmitErrorHandler<z.output<Schema>>;
  }

  function TestFormComponent<Schema extends z.ZodTypeAny>({
    schema,
    defaultValues,
    onSubmit,
    onInvalidSubmit,
    children,
  }: PropsWithChildren<TestFormComponentProps<Schema>>) {
    const formMethod = useForm({ resolver: zodResolver(schema), defaultValues });

    return (
      <FormProvider {...formMethod}>
        <form onSubmit={formMethod.handleSubmit(onSubmit, onInvalidSubmit)}>
          {children}
          <button type="submit">Submit</button>
        </form>
      </FormProvider>
    );
  }

  test('단순한 형태의 Form에서 단일 에러 메시지를 추출합니다.', async () => {
    const submitResultTestFn = jest.fn();
    const invlaidSubmitResultTestFn = jest.fn();

    const formFiledValuesSchema = z.object({
      limitMinStringField: z.string().min(8, 'Please enter limitMinStringField at least 8 characters.'),
      limitMaxStringField: z.string().max(8, 'Please enter limitMaxStringField at most 8 characters.'),
    });

    const TestFields = () => {
      const { register } = useFormContext<z.input<typeof formFiledValuesSchema>>();

      return (
        <fieldset>
          <input placeholder="please enter limitMinStringField" {...register('limitMinStringField')} />
          <input placeholder="please enter limitMaxStringField" {...register('limitMaxStringField')} />
        </fieldset>
      );
    };

    const user = userEvent.setup();
    const { getByPlaceholderText, getByText } = render(
      <TestFormComponent
        schema={formFiledValuesSchema}
        defaultValues={{
          limitMinStringField: '',
          limitMaxStringField: '',
        }}
        onSubmit={(data) => {
          submitResultTestFn(data);
        }}
        onInvalidSubmit={(error) => {
          const extractor = new SingleErrorMessageExtractor();
          invlaidSubmitResultTestFn(extractor.extract(error));
        }}
      >
        <TestFields />
      </TestFormComponent>,
    );

    // 최소 입력 필드 룰을 위반했을 때
    await user.click(getByText('Submit'));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith(
      'Please enter limitMinStringField at least 8 characters.',
    );

    // 최대 입력 필드 룰을 위반했을 때
    await user.type(getByPlaceholderText('please enter limitMinStringField'), 'hello world test');
    await user.type(getByPlaceholderText('please enter limitMaxStringField'), 'hello world test');
    await user.click(getByText('Submit'));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith(
      'Please enter limitMaxStringField at most 8 characters.',
    );

    // 모든 룰을 충족했을 때
    await user.clear(getByPlaceholderText('please enter limitMaxStringField'));
    await user.type(getByPlaceholderText('please enter limitMaxStringField'), 'hello');
    await user.click(getByText('Submit'));
    expect(submitResultTestFn).toHaveBeenCalled();
  });
});
