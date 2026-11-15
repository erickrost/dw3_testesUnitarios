import { isForeignKeyViolation } from "../../src/database/foreign-key-violation";

describe("isForeignKeyViolation", () => {
  test("reconhece o código 23503 na propriedade code", () => {
    // Act
    const result = isForeignKeyViolation({ code: "23503" });

    // Assert
    expect(result).toBe(true);
  });

  test.each([null, undefined, "23505", 23503, {}, { code: "outro" }])("retorna false para %p", error => {
    // Act
    const result = isForeignKeyViolation(error);

    // Assert
    expect(result).toBe(false);
  });
});
