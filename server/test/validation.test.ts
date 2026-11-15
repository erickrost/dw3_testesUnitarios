import { positiveInteger, parseId, validateName, validateBody } from "../src/validation";
import { HttpError } from "../src/errors";

function expectBadRequest(action: () => unknown) {
  let caughtError: unknown;

  // Act
  try {
    action();
  } catch (error) {
    caughtError = error;
  }

  // Assert
  expect(caughtError).toBeInstanceOf(HttpError);
  expect(caughtError).toMatchObject({ statusCode: 400 });
}
describe("Validações", () => {
  test.each([1, 2147483647])("positiveInteger aceita o limite válido %p", value => {
    // Act
    const result = positiveInteger(value, "RA");

    // Assert
    expect(result).toBe(value);
  });

  test.each([0, -1, 1.5, NaN, Infinity, 2147483648, "123", null, undefined])("positiveInteger rejeita %p com erro 400", value => {
    // Act e Assert
    expectBadRequest(() => positiveInteger(value, "RA"));
  });

  test.each([["1", 1], ["2147483647", 2147483647]])("parseId converte %p para %p", (value, expected) => {
    // Act
    const result = parseId(value, "RA");

    // Assert
    expect(result).toBe(expected);
  });

  test.each(["1abc", "1.2", "1e2", "", "-1", "0", "2147483648", 123])("parseId rejeita %p com erro 400", value => {
    // Act e Assert
    expectBadRequest(() => parseId(value, "RA"));
  });

  test.each(["Ana", "a".repeat(100)])("validateName aceita %p", value => {
    // Act
    const result = validateName(value);

    // Assert
    expect(result).toBe(value);
  });

  test.each(["", "ab", "   ", " a ", "a".repeat(101), 123, null, undefined])("validateName rejeita %p com erro 400", value => {
    // Act e Assert
    expectBadRequest(() => validateName(value));
  });

  test("validateBody preserva a referência e o conteúdo de um objeto congelado", () => {
    // Arrange
    const body = Object.freeze({ name: "Ana" });

    // Act
    const result = validateBody(body);

    // Assert
    expect(result).toBe(body);
    expect(body).toEqual({ name: "Ana" });
    expect(Object.isFrozen(body)).toBe(true);
  });

  test.each([null, undefined, [], "Ana", 12])("validateBody rejeita %p com erro 400", value => {
    // Act e Assert
    expectBadRequest(() => validateBody(value));
  });

  test("validateBody aceita campos extras sem modificar o objeto", () => {
    // Arrange
    const body = { name: "Ana", extra: true };

    // Act
    const result = validateBody(body);

    // Assert
    expect(result).toBe(body);
    expect(body).toEqual({ name: "Ana", extra: true });
  });
});
