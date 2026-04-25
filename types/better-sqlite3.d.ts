declare module "better-sqlite3" {
  type StatementResult = {
    lastInsertRowid: number | bigint;
    changes: number;
  };

  type Statement = {
    all: (...params: unknown[]) => unknown[];
    run: (...params: unknown[]) => StatementResult;
  };

  class Database {
    constructor(filename: string);
    prepare(sql: string): Statement;
  }

  export default Database;
}
