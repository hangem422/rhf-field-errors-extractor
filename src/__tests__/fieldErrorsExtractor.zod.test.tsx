import type { PropsWithChildren } from 'react';
import { FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

import { MessageExistExtractOrder } from '../extractOrders';
import { FieldErrorExtractor } from '../FieldErrorExtractor';

describe('FieldErrorExtractor', () => {
  const submitResultTestFn = jest.fn();
  const invlaidSubmitResultTestFn = jest.fn();

  beforeEach(() => {
    submitResultTestFn.mockClear();
    invlaidSubmitResultTestFn.mockClear();
  });

  interface TestFormComponentProps<Schema extends z.ZodTypeAny> {
    schema: Schema;
    defaultValues: z.input<Schema>;
  }

  function TestFormComponent<Schema extends z.ZodTypeAny>({
    schema,
    defaultValues,
    children,
  }: PropsWithChildren<TestFormComponentProps<Schema>>) {
    const formMethod = useForm({ resolver: zodResolver(schema), defaultValues });

    return (
      <FormProvider {...formMethod}>
        <form
          onSubmit={formMethod.handleSubmit(
            (data) => {
              submitResultTestFn(data);
            },
            (error) => {
              const extractor = new FieldErrorExtractor(error);
              invlaidSubmitResultTestFn(extractor.extractMessage([new MessageExistExtractOrder()]));
            },
          )}
        >
          {children}
          <button type="submit">Submit</button>
        </form>
      </FormProvider>
    );
  }

  test('Extracts a single error message from a simple type schema.', async () => {
    const formFiledValuesSchema = z.object({
      limitMinStringField: z.string().min(8, 'Please enter limitMinStringField at least 8 characters.'),
      fileds: z.object({
        limitMaxStringField: z.string().max(8, 'Please enter limitMaxStringField at most 8 characters.'),
      }),
    });

    const TestFields = () => {
      const { register } = useFormContext<z.input<typeof formFiledValuesSchema>>();

      return (
        <fieldset>
          <input placeholder="please enter limitMinStringField" {...register('limitMinStringField')} />
          <input placeholder="please enter limitMaxStringField" {...register('fileds.limitMaxStringField')} />
        </fieldset>
      );
    };

    const user = userEvent.setup();
    const { getByPlaceholderText, getByText } = render(
      <TestFormComponent
        schema={formFiledValuesSchema}
        defaultValues={{
          limitMinStringField: '',
          fileds: {
            limitMaxStringField: '',
          },
        }}
      >
        <TestFields />
      </TestFormComponent>,
    );

    // When the minimum input field rule is violated.
    await user.click(getByText('Submit'));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith(
      'Please enter limitMinStringField at least 8 characters.',
    );

    // When the maximum input field rule is violated.
    await user.type(getByPlaceholderText('please enter limitMinStringField'), 'hello world test');
    await user.type(getByPlaceholderText('please enter limitMaxStringField'), 'hello world test');
    await user.click(getByText('Submit'));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith(
      'Please enter limitMaxStringField at most 8 characters.',
    );

    // When all field rules are met.
    await user.clear(getByPlaceholderText('please enter limitMaxStringField'));
    await user.type(getByPlaceholderText('please enter limitMaxStringField'), 'hello');
    await user.click(getByText('Submit'));
    expect(submitResultTestFn).toHaveBeenCalled();
  });

  test('Extracts a single error message from a array type schema.', async () => {
    const formFiledValuesSchema = z.object({
      fieldSet: z.object({
        fieldList: z.array(
          z.object({
            field: z.string().min(8, 'Please enter at least 8 characters.'),
          }),
        ),
      }),
    });

    const TestFields = () => {
      const { control, register } = useFormContext<z.input<typeof formFiledValuesSchema>>();
      const { fields } = useFieldArray({
        control,
        name: 'fieldSet.fieldList',
      });

      return (
        <fieldset>
          {fields.map((field, index) => (
            <input key={field.id} {...register(`fieldSet.fieldList.${index}.field`)} placeholder={`field-${index}`} />
          ))}
        </fieldset>
      );
    };

    const user = userEvent.setup();
    const { getByPlaceholderText, getByText } = render(
      <TestFormComponent
        schema={formFiledValuesSchema}
        defaultValues={{ fieldSet: { fieldList: [{ field: '' }, { field: '' }, { field: '' }] } }}
      >
        <TestFields />
      </TestFormComponent>,
    );

    // When all field rules are violated.
    await user.click(getByText('Submit'));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith('Please enter at least 8 characters.');

    // When one field rule violated.
    await user.type(getByPlaceholderText('field-0'), 'hello world test');
    await user.type(getByPlaceholderText('field-1'), 'hello world test');
    await user.click(getByText('Submit'));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith('Please enter at least 8 characters.');

    // When all field rules are met.
    await user.type(getByPlaceholderText('field-2'), 'hello world test');
    await user.click(getByText('Submit'));
    expect(submitResultTestFn).toHaveBeenCalled();
  });

  test('Extracts a single error message from a union type schema.', async () => {
    const formFiledValuesSchema = z.object({
      fieldSet: z.object({
        field: z.union([
          z.string().refine((value) => value === 'hello', 'You must enter either hello or world.'),
          z.string().refine((value) => value === 'world', 'You must enter either hello or world.'),
        ]),
      }),
    });

    const TestFields = () => {
      const { register } = useFormContext<z.input<typeof formFiledValuesSchema>>();

      return (
        <fieldset>
          <input {...register(`fieldSet.field`)} placeholder="union-field" />
        </fieldset>
      );
    };

    const user = userEvent.setup();
    const { getByPlaceholderText, getByText } = render(
      <TestFormComponent
        schema={formFiledValuesSchema}
        defaultValues={{
          fieldSet: {
            field: 'hello',
          },
        }}
      >
        <TestFields />
      </TestFormComponent>,
    );

    // When field rule violated.
    await user.clear(getByPlaceholderText('union-field'));
    await user.type(getByPlaceholderText('union-field'), 'test');
    await user.click(getByText('Submit'));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith('You must enter either hello or world.');

    // When field rule is met.
    await user.clear(getByPlaceholderText('union-field'));
    await user.type(getByPlaceholderText('union-field'), 'world');
    await user.click(getByText('Submit'));
    expect(submitResultTestFn).toHaveBeenCalled();
  });
});
