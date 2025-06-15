import { useFieldArray, useFormContext } from 'react-hook-form';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

import { FieldErrorExtractor } from '../fieldErrorExtractor';

import { SubmitButtonTextContent, TestZodFormComponent } from './components/TestZodFormComponent';

describe('Does the FieldErrorExtractor extract data well for various field types', () => {
  const submitResultTestFn = jest.fn();
  const invlaidSubmitResultTestFn = jest.fn();

  beforeEach(() => {
    submitResultTestFn.mockClear();
    invlaidSubmitResultTestFn.mockClear();
  });

  test('Extract data from object type schema.', async () => {
    const formFiledValuesSchema = z.object({
      limitMinStringField: z.string().min(8, 'Please enter limitMinStringField at least 8 characters.'),
      fieldSet: z.object({
        limitMaxStringField: z.string().max(8, 'Please enter limitMaxStringField at most 8 characters.'),
      }),
    });

    const TestFields = () => {
      const { register } = useFormContext<
        z.input<typeof formFiledValuesSchema>,
        unknown,
        z.output<typeof formFiledValuesSchema>
      >();

      return (
        <fieldset>
          <input placeholder="please enter limitMinStringField" {...register('limitMinStringField')} />
          <input placeholder="please enter limitMaxStringField" {...register('fieldSet.limitMaxStringField')} />
        </fieldset>
      );
    };

    const user = userEvent.setup();
    const { getByPlaceholderText, getByText } = render(
      <TestZodFormComponent
        schema={formFiledValuesSchema}
        defaultValues={{
          limitMinStringField: '',
          fieldSet: {
            limitMaxStringField: '',
          },
        }}
        onSubmitValid={(data) => {
          submitResultTestFn(data);
        }}
        onSubmitInvalid={(fieldErrors) => {
          const extractor = new FieldErrorExtractor(fieldErrors);
          invlaidSubmitResultTestFn(extractor.extract().message);
        }}
      >
        <TestFields />
      </TestZodFormComponent>,
    );

    // When the minimum input field rule is violated.
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith(
      'Please enter limitMinStringField at least 8 characters.',
    );

    // When the maximum input field rule is violated.
    await user.type(getByPlaceholderText('please enter limitMinStringField'), 'hello world test');
    await user.type(getByPlaceholderText('please enter limitMaxStringField'), 'hello world test');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith(
      'Please enter limitMaxStringField at most 8 characters.',
    );

    // When all field rules are met.
    await user.clear(getByPlaceholderText('please enter limitMaxStringField'));
    await user.type(getByPlaceholderText('please enter limitMaxStringField'), 'hello');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).toHaveBeenCalled();
  });

  test('Extract data from array type schema.', async () => {
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
      const { control, register } = useFormContext<
        z.input<typeof formFiledValuesSchema>,
        unknown,
        z.output<typeof formFiledValuesSchema>
      >();
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
      <TestZodFormComponent
        schema={formFiledValuesSchema}
        defaultValues={{ fieldSet: { fieldList: [{ field: '' }, { field: '' }, { field: '' }] } }}
        onSubmitValid={(data) => {
          submitResultTestFn(data);
        }}
        onSubmitInvalid={(fieldErrors) => {
          const extractor = new FieldErrorExtractor(fieldErrors);
          invlaidSubmitResultTestFn(extractor.extract().message);
        }}
      >
        <TestFields />
      </TestZodFormComponent>,
    );

    // When all field rules are violated.
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith('Please enter at least 8 characters.');

    // When one field rule violated.
    await user.type(getByPlaceholderText('field-0'), 'hello world test');
    await user.type(getByPlaceholderText('field-1'), 'hello world test');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith('Please enter at least 8 characters.');

    // When all field rules are met.
    await user.type(getByPlaceholderText('field-2'), 'hello world test');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).toHaveBeenCalled();
  });

  test('Extract data from union type schema.', async () => {
    const formFiledValuesSchema = z.object({
      fieldSet: z.object({
        field: z.union([
          z.string().refine((value) => value === 'hello', 'You must enter either hello or world.'),
          z.string().refine((value) => value === 'world', 'You must enter either hello or world.'),
        ]),
      }),
    });

    const TestFields = () => {
      const { register } = useFormContext<
        z.input<typeof formFiledValuesSchema>,
        unknown,
        z.output<typeof formFiledValuesSchema>
      >();

      return (
        <fieldset>
          <input {...register(`fieldSet.field`)} placeholder="union-field" />
        </fieldset>
      );
    };

    const user = userEvent.setup();
    const { getByPlaceholderText, getByText } = render(
      <TestZodFormComponent
        schema={formFiledValuesSchema}
        defaultValues={{
          fieldSet: {
            field: 'hello',
          },
        }}
        onSubmitValid={(data) => {
          submitResultTestFn(data);
        }}
        onSubmitInvalid={(fieldErrors) => {
          const extractor = new FieldErrorExtractor(fieldErrors);
          invlaidSubmitResultTestFn(extractor.extract().message);
        }}
      >
        <TestFields />
      </TestZodFormComponent>,
    );

    // When field rule violated.
    await user.clear(getByPlaceholderText('union-field'));
    await user.type(getByPlaceholderText('union-field'), 'test');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith('You must enter either hello or world.');

    // When field rule is met.
    await user.clear(getByPlaceholderText('union-field'));
    await user.type(getByPlaceholderText('union-field'), 'world');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).toHaveBeenCalled();
  });
});
