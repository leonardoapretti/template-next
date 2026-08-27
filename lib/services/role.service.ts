import { db } from "../db";
import { BaseService } from "./config/base-service";
import { DataBaseResponse } from "./config/database-response";

class RoleService extends BaseService<typeof db.role> {
  constructor() {
    super(db.role);
  }

  recuperarComPermissoes(id: string) {
    return DataBaseResponse.fromPromise(() =>
      db.role.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          nome: true,
          permissoes: true,
        },
      }),
    );
  }

  listarTodos() {
    return DataBaseResponse.fromPromise(() =>
      db.role.findMany({
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          permissoes: true,
        },
      }),
    );
  }
}

export const roleService = new RoleService();
