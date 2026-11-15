import { isUniqueViolation } from "../../src/database/unique-violation";

describe("isUniqueViolation", () => {
  test("reconhece o código 23505 na propriedade code", () => {
    // Act
    const result = isUniqueViolation({ code: "23505" });

    // Assert
    expect(result).toBe(true);
  });

  test.each([null, undefined, "23505", 23503, {}, { code: "outro" }])("retorna false para %p", error => {
    // Act
    const result = isUniqueViolation(error);

    // Assert
    expect(result).toBe(false);
  });
});
