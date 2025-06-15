import type { FC } from 'react';
import { useFormContext } from 'react-hook-form';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

import { DomPlaceExtractOrder, MatchedNameExtractOrder, MessageExistExtractOrder } from '../extractOrders';
import { FieldErrorExtractor } from '../fieldErrorExtractor';

import { SubmitButtonTextContent, TestZodFormComponent } from './components/TestZodFormComponent';

const submitResultTestFn = jest.fn();
const invlaidSubmitResultTestFn = jest.fn();

beforeEach(() => {
  submitResultTestFn.mockClear();
  invlaidSubmitResultTestFn.mockClear();
});

describe('MessageExistExtractOrder prioritizes data with error messages.', () => {
  const ERROR_MESSAGE = 'error message';

  test('test case 1', async () => {
    const formFiledValuesSchema = z.object({
      foo: z.string().min(8, ERROR_MESSAGE),
      bar: z.string().min(8, '   '),
      baz: z.string().min(8, '   '),
    });

    await runMessageExistExtractOrderTest(formFiledValuesSchema);
  });

  test('test case 2', async () => {
    const formFiledValuesSchema = z.object({
      foo: z.string().min(8, '   '),
      bar: z.string().min(8, ERROR_MESSAGE),
      baz: z.string().min(8, '   '),
    });

    await runMessageExistExtractOrderTest(formFiledValuesSchema);
  });

  test('test case 3', async () => {
    const formFiledValuesSchema = z.object({
      foo: z.string().min(8, '   '),
      bar: z.string().min(8, '   '),
      baz: z.string().min(8, ERROR_MESSAGE),
    });

    await runMessageExistExtractOrderTest(formFiledValuesSchema);
  });

  async function runMessageExistExtractOrderTest(
    schema: z.ZodObject<{ foo: z.ZodString; bar: z.ZodString; baz: z.ZodString }>,
  ) {
    const TestFields = () => {
      const { register } = useFormContext<z.infer<typeof schema>>();

      return (
        <fieldset>
          <input placeholder="foo" {...register('foo')} />
          <input placeholder="bar" {...register('bar')} />
          <input placeholder="baz" {...register('baz')} />
        </fieldset>
      );
    };

    const user = userEvent.setup();
    const { getByPlaceholderText, getByText } = render(
      <TestZodFormComponent
        schema={schema}
        defaultValues={{ foo: '', bar: '', baz: '' }}
        onSubmitValid={(data) => {
          submitResultTestFn(data);
        }}
        onSubmitInvalid={(fieldErrors) => {
          const extractor = new FieldErrorExtractor(fieldErrors);
          const errorData = extractor.extract([new MessageExistExtractOrder({ trim: true })]);
          invlaidSubmitResultTestFn(errorData?.message);
        }}
      >
        <TestFields />
      </TestZodFormComponent>,
    );

    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith(ERROR_MESSAGE);

    await user.type(getByPlaceholderText('foo'), 'hello world test');
    await user.type(getByPlaceholderText('bar'), 'hello world test');
    await user.type(getByPlaceholderText('baz'), 'hello world test');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).toHaveBeenCalled();
  }
});

describe('DomPlaceExtractOrder prioritizes data where the element is located further ahead.', () => {
  const formFiledValuesSchema = z.object({
    foo: z.string().min(8, 'foo error message'),
    bar: z.string().min(8, 'bar error message'),
  });

  test('case 1', async () => {
    const TestFields = () => {
      const { register } = useFormContext<z.infer<typeof formFiledValuesSchema>>();

      return (
        <fieldset>
          <input placeholder="foo" {...register('foo')} />
          <input placeholder="bar" {...register('bar')} />
        </fieldset>
      );
    };

    await runDomPlaceExtractOrderTest(TestFields, 'foo error message');
  });

  test('case 2', async () => {
    const TestFields = () => {
      const { register } = useFormContext<z.infer<typeof formFiledValuesSchema>>();

      return (
        <fieldset>
          <input placeholder="bar" {...register('bar')} />
          <input placeholder="foo" {...register('foo')} />
        </fieldset>
      );
    };

    await runDomPlaceExtractOrderTest(TestFields, 'bar error message');
  });

  async function runDomPlaceExtractOrderTest(TestFields: FC, errorMessage: string) {
    const user = userEvent.setup();
    const { getByPlaceholderText, getByText } = render(
      <TestZodFormComponent
        schema={formFiledValuesSchema}
        defaultValues={{ foo: '', bar: '' }}
        onSubmitValid={(data) => {
          submitResultTestFn(data);
        }}
        onSubmitInvalid={(fieldErrors) => {
          const extractor = new FieldErrorExtractor(fieldErrors);
          const errorData = extractor.extract([new DomPlaceExtractOrder()]);
          invlaidSubmitResultTestFn(errorData?.message);
        }}
      >
        <TestFields />
      </TestZodFormComponent>,
    );

    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith(errorMessage);

    await user.type(getByPlaceholderText('foo'), 'hello world test');
    await user.type(getByPlaceholderText('bar'), 'hello world test');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).toHaveBeenCalled();
  }
});

describe('MatchedNameExtractOrder prioritizes data based on name matching.', () => {
  const formFiledValuesSchema = z.object({
    fruit: z.object({
      apple: z.string().min(8, 'apple error message'),
    }),
    animal: z.object({
      cat: z.string().min(8, 'cat error message'),
      dog: z.string().min(8, 'dog error message'),
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
        <input placeholder="apple" {...register('fruit.apple')} />
        <input placeholder="cat" {...register('animal.cat')} />
        <input placeholder="dog" {...register('animal.dog')} />
      </fieldset>
    );
  };

  test('If the exit option is turned off', async () => {
    const user = userEvent.setup();
    const { getByPlaceholderText, getByText } = render(
      <TestZodFormComponent
        schema={formFiledValuesSchema}
        defaultValues={{
          fruit: { apple: '' },
          animal: { cat: '', dog: '' },
        }}
        onSubmitValid={(data) => {
          submitResultTestFn(data);
        }}
        onSubmitInvalid={(fieldErrors) => {
          const extractor = new FieldErrorExtractor(fieldErrors);
          const errorData = extractor.extract([
            new MatchedNameExtractOrder<z.input<typeof formFiledValuesSchema>>(['fruit', 'animal.dog', 'animal.cat'], {
              exact: false,
            }),
          ]);

          invlaidSubmitResultTestFn(errorData?.message);
        }}
      >
        <TestFields />
      </TestZodFormComponent>,
    );

    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith('apple error message');

    await user.type(getByPlaceholderText('apple'), 'hello world test');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith('dog error message');

    await user.type(getByPlaceholderText('dog'), 'hello world test');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith('cat error message');

    await user.type(getByPlaceholderText('cat'), 'hello world test');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).toHaveBeenCalled();
  });

  test('If the exit option is turned on', async () => {
    const user = userEvent.setup();
    const { getByPlaceholderText, getByText } = render(
      <TestZodFormComponent
        schema={formFiledValuesSchema}
        defaultValues={{
          fruit: { apple: '' },
          animal: { cat: '', dog: '' },
        }}
        onSubmitValid={(data) => {
          submitResultTestFn(data);
        }}
        onSubmitInvalid={(fieldErrors) => {
          const extractor = new FieldErrorExtractor(fieldErrors);
          const errorData = extractor.extract([
            new MatchedNameExtractOrder<z.input<typeof formFiledValuesSchema>>(['fruit', 'animal.dog', 'animal.cat'], {
              exact: true,
            }),
          ]);

          invlaidSubmitResultTestFn(errorData?.message);
        }}
      >
        <TestFields />
      </TestZodFormComponent>,
    );

    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith('dog error message');

    await user.type(getByPlaceholderText('dog'), 'hello world test');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith('cat error message');

    await user.type(getByPlaceholderText('cat'), 'hello world test');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).not.toHaveBeenCalled();
    expect(invlaidSubmitResultTestFn).toHaveBeenLastCalledWith('apple error message');

    await user.type(getByPlaceholderText('apple'), 'hello world test');
    await user.click(getByText(SubmitButtonTextContent));
    expect(submitResultTestFn).toHaveBeenCalled();
  });
});
