import type { Database } from "../../../src/database/connection";
import { PgEnrollmentRepository, type Enrollment } from "../../../src/modules/enrollments/enrollments.repository";

const normalizeSql = (sql: string) => sql.replace(/\s+/g, " ").trim();
describe("PgEnrollmentRepository", () => {
  let query: jest.MockedFunction<Database["query"]>;
  let repository: PgEnrollmentRepository;
  let record: Enrollment;

  beforeEach(() => {
    query = jest.fn() as jest.MockedFunction<Database["query"]>;
    repository = new PgEnrollmentRepository({ query });
    record = { studentRa: 123, courseId: 7, enrolledAt: new Date("2026-01-01T00:00:00Z") };
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
    const result = await repository.create(123, 7);

    // Assert
    expect(result).toBe(record);
    expectQuery("INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2) RETURNING student_ra AS \"studentRa\", course_id AS \"courseId\", enrolled_at AS \"enrolledAt\"", [123, 7]);
  });

  test("findAll seleciona as colunas e ordenação esperadas sem parâmetros", async () => {
    // Arrange
    const rows = [record];
    query.mockResolvedValue({ rows });

    // Act
    const result = await repository.findAll();

    // Assert
    expect(result).toBe(rows);
    expectQuery("SELECT student_ra AS \"studentRa\", course_id AS \"courseId\", enrolled_at AS \"enrolledAt\" FROM enrollments ORDER BY student_ra, course_id");
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
    const result = await repository.findOne(123, 7);

    // Assert
    expect(result).toBe(record);
    expectQuery("SELECT student_ra AS \"studentRa\", course_id AS \"courseId\", enrolled_at AS \"enrolledAt\" FROM enrollments WHERE student_ra = $1 AND course_id = $2", [123, 7]);
  });

  test("findOne retorna undefined quando não encontra registro", async () => {
    // Arrange
    query.mockResolvedValue({ rows: [] });

    // Act
    const result = await repository.findOne(123, 7);

    // Assert
    expect(result).toBeUndefined();
  });

  test.each(["create", "findAll", "findOne"] as const)("%s propaga a mesma instância da falha do banco", async (method) => {
    // Arrange
    const error = new Error("Banco indisponível");
    query.mockRejectedValue(error);

    // Act
    const operation = method === "create" ? repository.create(123, 7)
      : method === "findAll" ? repository.findAll() : repository.findOne(123, 7);

    // Assert
    await expect(operation).rejects.toBe(error);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
