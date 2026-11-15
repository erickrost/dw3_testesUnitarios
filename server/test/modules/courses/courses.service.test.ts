import { CoursesService } from "../../../src/modules/courses/courses.service";
import type { CourseRepository } from "../../../src/modules/courses/courses.repository";
import { HttpError } from "../../../src/errors";

describe("CoursesService", () => {
  let repository: jest.Mocked<CourseRepository>;
  let service: CoursesService;

  beforeEach(() => {
    repository = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
    service = new CoursesService(repository);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  test("create retorna o registro e encaminha os dados uma única vez", async () => {
    // Arrange
    const record = { id: 123, name: "Qualidade" };
    repository.create.mockResolvedValue(record);

    // Act
    const result = await service.create({ name: "Qualidade" });

    // Assert
    expect(result).toBe(record);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });

  test.each([null, {}, { name: "A" }])("create rejeita entrada inválida %p sem chamar o repositório", async (input) => {
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
    const operation = service.create({ name: "Qualidade" });

    // Assert
    await expect(operation).rejects.toMatchObject({ statusCode: 409 });
  });

  test("findAll retorna a lista e chama o repositório uma vez sem argumentos", async () => {
    // Arrange
    const rows = [{ id: 123, name: "Qualidade" }];
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
    const record = { id: 123, name: "Qualidade" };
    repository.findOne.mockResolvedValue(record);

    // Act
    const result = await service.findOne(123);

    // Assert
    expect(result).toBe(record);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test("findOne lança erro 404 quando o registro não existe", async () => {
    // Arrange
    repository.findOne.mockResolvedValue(undefined);

    // Act
    const operation = service.findOne(123);

    // Assert
    await expect(operation).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test.each(["create", "findAll", "findOne"] as const)("%s propaga a mesma instância de erro inesperado", async (method) => {
    // Arrange
    const error = new Error("Falha inesperada");
    repository[method].mockRejectedValue(error);

    // Act
    const operation = method === "create" ? service.create({ name: "Qualidade" })
      : method === "findAll" ? service.findAll() : service.findOne(123);

    // Assert
    await expect(operation).rejects.toBe(error);
  });

  test("findOne rejeita identificador zero sem consultar o repositório", async () => {
    // Act
    const operation = service.findOne(0);

    // Assert
    await expect(operation).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  test("create encaminha somente name quando existem campos extras", async () => {
    // Arrange
    repository.create.mockResolvedValue({ id: 1, name: "Qualidade" });

    // Act
    await service.create({ name: "Qualidade", extra: true });

    // Assert
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });

  test("stub fornece uma lista conhecida e spy confirma uma única chamada", async () => {
    // Arrange
    const rows = [{ id: 1, name: "Qualidade" }];
    const stub: CourseRepository = {
      async create(data) {
        return { id: 1, ...data };
      },
      async findAll() {
        return rows;
      },
      async findOne() {
        return rows[0];
      },
    };
    const spy = jest.spyOn(stub, "findAll");
    const serviceWithStub = new CoursesService(stub);

    // Act
    const result = await serviceWithStub.findAll();

    // Assert
    expect(result).toBe(rows);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith();
  });

  test("spy observa findOne de um stub sem substituir sua implementação", async () => {
    // Arrange
    const record = { id: 1, name: "Qualidade" };
    const stub: CourseRepository = {
      async create(data) {
        return { id: 1, ...data };
      },
      async findAll() {
        return [record];
      },
      async findOne() {
        return record;
      },
    };
    const spy = jest.spyOn(stub, "findOne");
    const serviceWithStub = new CoursesService(stub);

    // Act
    const result = await serviceWithStub.findOne(1);

    // Assert
    expect(result).toBe(record);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1);
  });
});
