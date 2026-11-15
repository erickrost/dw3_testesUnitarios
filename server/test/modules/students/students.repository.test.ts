import type { Database } from "../../../src/database/connection";
import { PgStudentRepository, type Student } from "../../../src/modules/students/students.repository";

const normalizeSql = (sql: string) => sql.replace(/\s+/g, " ").trim();
describe("PgStudentRepository", () => {
  let query: jest.MockedFunction<Database["query"]>;
  let repository: PgStudentRepository;
  let record: Student;

  beforeEach(() => {
    query = jest.fn() as jest.MockedFunction<Database["query"]>;
    repository = new PgStudentRepository({ query });
    record = { ra: 123, name: "Ana" };
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
    const result = await repository.create({ ra: 123, name: "Ana" });

    // Assert
    expect(result).toBe(record);
    expectQuery("INSERT INTO students (ra, name) VALUES ($1, $2) RETURNING ra, name", [123, "Ana"]);
  });

  test("findAll seleciona as colunas e ordenação esperadas sem parâmetros", async () => {
    // Arrange
    const rows = [record];
    query.mockResolvedValue({ rows });

    // Act
    const result = await repository.findAll();

    // Assert
    expect(result).toBe(rows);
    expectQuery("SELECT ra, name FROM students ORDER BY name");
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
    const result = await repository.findOne(123);

    // Assert
    expect(result).toBe(record);
    expectQuery("SELECT ra, name FROM students WHERE ra = $1", [123]);
  });

  test("findOne retorna undefined quando não encontra registro", async () => {
    // Arrange
    query.mockResolvedValue({ rows: [] });

    // Act
    const result = await repository.findOne(123);

    // Assert
    expect(result).toBeUndefined();
  });

  test.each(["create", "findAll", "findOne"] as const)("%s propaga a mesma instância da falha do banco", async (method) => {
    // Arrange
    const error = new Error("Banco indisponível");
    query.mockRejectedValue(error);

    // Act
    const operation = method === "create" ? repository.create({ ra: 123, name: "Ana" })
      : method === "findAll" ? repository.findAll() : repository.findOne(123);

    // Assert
    await expect(operation).rejects.toBe(error);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
