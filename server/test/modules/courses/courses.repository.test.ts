import type { Database } from "../../../src/database/connection";
import { PgCourseRepository, type Course } from "../../../src/modules/courses/courses.repository";

const normalizeSql = (sql: string) => sql.replace(/\s+/g, " ").trim();
describe("PgCourseRepository", () => {
  let query: jest.MockedFunction<Database["query"]>;
  let repository: PgCourseRepository;
  let record: Course;

  beforeEach(() => {
    query = jest.fn() as jest.MockedFunction<Database["query"]>;
    repository = new PgCourseRepository({ query });
    record = { id: 7, name: "Qualidade" };
  });

  afterEach(() => jest.resetAllMocks());

  function expectQuery(sql: string, values?: unknown[]) {
    expect(query).toHaveBeenCalledTimes(1);
    const call = query.mock.calls[0];
    expect(normalizeSql(call[0])).toBe(sql);
    if (values === undefined) {
      expect(call).toHaveLength(1);
    } else {
      expect(call).toHaveLength(2);
      expect(call[1]).toEqual(values);
    }
  }
  test("create insere com parâmetros e retorna a linha recebida", async () => {
    // Arrange
    query.mockResolvedValue({ rows: [record] });

    // Act
    const result = await repository.create({ name: "Qualidade" });

    // Assert
    expect(result).toBe(record);
    expectQuery("INSERT INTO courses (name) VALUES ($1) RETURNING id, name", ["Qualidade"]);
  });

  test("findAll seleciona as colunas e ordenação esperadas sem parâmetros", async () => {
    // Arrange
    const rows = [record];
    query.mockResolvedValue({ rows });

    // Act
    const result = await repository.findAll();

    // Assert
    expect(result).toBe(rows);
    expectQuery("SELECT id, name FROM courses ORDER BY id");
  });

  test("findAll retorna lista vazia quando não há registros", async () => {
    // Arrange
    query.mockResolvedValue({ rows: [] });

    // Act
    const result = await repository.findAll();

    // Assert
    expect(result).toEqual([]);
  });

  test("findOne usa o filtro e parâmetros corretos e retorna a primeira linha", async () => {
    // Arrange
    query.mockResolvedValue({ rows: [record, { ...record }] });

    // Act
    const result = await repository.findOne(7);

    // Assert
    expect(result).toBe(record);
    expectQuery("SELECT id, name FROM courses WHERE id = $1", [7]);
  });

  test("findOne retorna undefined quando não encontra registro", async () => {
    // Arrange
    query.mockResolvedValue({ rows: [] });

    // Act
    const result = await repository.findOne(7);

    // Assert
    expect(result).toBeUndefined();
  });

  test.each(["create", "findAll", "findOne"] as const)("%s propaga a mesma instância da falha do banco", async (method) => {
    // Arrange
    const error = new Error("Banco indisponível");
    query.mockRejectedValue(error);

    // Act
    const operation = method === "create" ? repository.create({ name: "Qualidade" })
      : method === "findAll" ? repository.findAll() : repository.findOne(7);

    // Assert
    await expect(operation).rejects.toBe(error);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
