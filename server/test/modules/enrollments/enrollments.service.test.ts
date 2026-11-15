import { EnrollmentsService } from "../../../src/modules/enrollments/enrollments.service";
import type { EnrollmentRepository } from "../../../src/modules/enrollments/enrollments.repository";
import { HttpError } from "../../../src/errors";

describe("EnrollmentsService", () => {
  let repository: jest.Mocked<EnrollmentRepository>;
  let service: EnrollmentsService;

  beforeEach(() => {
    repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
    service = new EnrollmentsService(repository);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  test("create retorna o registro e encaminha os dados uma única vez", async () => {
    // Arrange
    const record = { studentRa: 123, courseId: 1, enrolledAt: new Date("2026-01-01T00:00:00Z") };
    repository.create.mockResolvedValue(record);

    // Act
    const result = await service.create({ studentRa: 123, courseId: 1 });

    // Assert
    expect(result).toBe(record);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test.each([{ studentRa: 0, courseId: 1 }, { studentRa: 123, courseId: 0 }])("create rejeita entrada inválida %p sem chamar o repositório", async (input) => {
    // Act
    const operation = service.create(input);

    // Assert
    await expect(operation).rejects.toBeInstanceOf(HttpError);
    await expect(operation).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  test("create traduz duplicidade em erro 409", async () => {
    // Arrange
    repository.create.mockRejectedValue({ code: "23505" });

    // Act
    const operation = service.create({ studentRa: 123, courseId: 1 });

    // Assert
    await expect(operation).rejects.toMatchObject({ statusCode: 409 });
  });

  test("findAll retorna a lista e chama o repositório uma vez sem argumentos", async () => {
    // Arrange
    const rows = [{ studentRa: 123, courseId: 1, enrolledAt: new Date("2026-01-01T00:00:00Z") }];
    repository.findAll.mockResolvedValue(rows);

    // Act
    const result = await service.findAll();

    // Assert
    expect(result).toBe(rows);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test("findOne retorna o registro e encaminha os identificadores na ordem correta", async () => {
    // Arrange
    const record = { studentRa: 123, courseId: 1, enrolledAt: new Date("2026-01-01T00:00:00Z") };
    repository.findOne.mockResolvedValue(record);

    // Act
    const result = await service.findOne(123, 1);

    // Assert
    expect(result).toBe(record);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });

  test("findOne lança erro 404 quando o registro não existe", async () => {
    // Arrange
    repository.findOne.mockResolvedValue(undefined);

    // Act
    const operation = service.findOne(123, 1);

    // Assert
    await expect(operation).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });

  test.each(["create", "findAll", "findOne"] as const)("%s propaga a mesma instância de erro inesperado", async (method) => {
    // Arrange
    const error = new Error("Falha inesperada");
    repository[method].mockRejectedValue(error);

    // Act
    const operation = method === "create" ? service.create({ studentRa: 123, courseId: 1 })
      : method === "findAll" ? service.findAll() : service.findOne(123, 1);

    // Assert
    await expect(operation).rejects.toBe(error);
  });

  test("create traduz referência inexistente em erro 404", async () => {
    // Arrange
    repository.create.mockRejectedValue({ code: "23503" });

    // Act
    const operation = service.create({ studentRa: 123, courseId: 1 });

    // Assert
    await expect(operation).rejects.toMatchObject({ statusCode: 404 });
  });
});
