import type { UsuarioAtualContexto } from "../../access-control/current-user";
import { getUsuarioAtualContexto } from "../../access-control/current-user";

type DelegateMethod = (...args: never[]) => Promise<unknown>;

type BaseDelegate = {
  findMany: DelegateMethod;
  findUnique: DelegateMethod;
  findFirst: DelegateMethod;
  findFirstOrThrow: DelegateMethod;
  create: DelegateMethod;
  update: DelegateMethod;
  delete: DelegateMethod;
  upsert: DelegateMethod;
};

type MethodArgs<T> = T extends (...args: infer A) => unknown ? A : never;

type MethodReturn<T> = T extends (...args: never[]) => Promise<infer R> ? R : never;

type WhereInput = Record<string, unknown>;
type ServiceArgs = {
  where?: WhereInput;
  [key: string]: unknown;
};
type ServiceScope = (
  contexto: UsuarioAtualContexto,
) => WhereInput | null | Promise<WhereInput | null>;

type BaseServiceOptions = {
  scope?: ServiceScope;
};

export abstract class BaseService<TDelegate extends BaseDelegate, TId = number | string> {
  constructor(
    protected readonly model: TDelegate,
    private readonly options: BaseServiceOptions = {},
  ) {}

  protected async contextoUsuarioAtual(): Promise<UsuarioAtualContexto> {
    return getUsuarioAtualContexto();
  }

  protected async whereDoUsuarioAtual(where: WhereInput = {}): Promise<WhereInput> {
    const scope = await this.getScopeWhere();

    if (!scope || Object.keys(scope).length === 0) {
      return where;
    }

    return {
      AND: [scope, where],
    };
  }

  protected async validarAcessoPorId(id: TId): Promise<void> {
    if (!this.options.scope) {
      return;
    }

    await this.model.findFirstOrThrow({
      where: await this.whereDoUsuarioAtual({ id }),
      select: { id: true },
    } as MethodArgs<TDelegate["findFirstOrThrow"]>[0]);
  }

  private async getScopeWhere(): Promise<WhereInput | null> {
    if (!this.options.scope) {
      return null;
    }

    return this.options.scope(await this.contextoUsuarioAtual());
  }

  private async escoparArgs(args?: ServiceArgs): Promise<ServiceArgs> {
    return {
      ...args,
      where: await this.whereDoUsuarioAtual(args?.where),
    };
  }

  recuperarTodos(
    ...args: MethodArgs<TDelegate["findMany"]>
  ): Promise<MethodReturn<TDelegate["findMany"]>> {
    return this.escoparArgs(args[0] as ServiceArgs | undefined).then((scopedArgs) =>
      this.model.findMany(scopedArgs as MethodArgs<TDelegate["findMany"]>[0]),
    ) as Promise<MethodReturn<TDelegate["findMany"]>>;
  }

  recuperar(
    ...args: MethodArgs<TDelegate["findUnique"]>
  ): Promise<MethodReturn<TDelegate["findUnique"]>> {
    if (this.options.scope) {
      return this.escoparArgs(args[0] as ServiceArgs | undefined).then((scopedArgs) =>
        this.model.findFirst(scopedArgs as MethodArgs<TDelegate["findFirst"]>[0]),
      ) as Promise<MethodReturn<TDelegate["findUnique"]>>;
    }

    return this.model.findUnique(...args) as Promise<MethodReturn<TDelegate["findUnique"]>>;
  }

  async recuperarPorId(id: TId): Promise<MethodReturn<TDelegate["findUnique"]>> {
    if (this.options.scope) {
      return this.model.findFirst({
        where: await this.whereDoUsuarioAtual({ id }),
      } as MethodArgs<TDelegate["findFirst"]>[0]) as Promise<MethodReturn<TDelegate["findUnique"]>>;
    }

    return this.model.findUnique({
      where: {
        id,
      },
    } as MethodArgs<TDelegate["findUnique"]>[0]) as Promise<MethodReturn<TDelegate["findUnique"]>>;
  }

  criar(...args: MethodArgs<TDelegate["create"]>): Promise<MethodReturn<TDelegate["create"]>> {
    return this.model.create(...args) as Promise<MethodReturn<TDelegate["create"]>>;
  }

  async atualizar(
    ...args: MethodArgs<TDelegate["update"]>
  ): Promise<MethodReturn<TDelegate["update"]>> {
    const updateArgs = args[0] as ServiceArgs | undefined;
    const id = updateArgs?.where?.id as TId | undefined;

    if (id !== undefined) {
      await this.validarAcessoPorId(id);
    }

    return this.model.update(...args) as Promise<MethodReturn<TDelegate["update"]>>;
  }

  async remover(
    ...args: MethodArgs<TDelegate["delete"]>
  ): Promise<MethodReturn<TDelegate["delete"]>> {
    const deleteArgs = args[0] as ServiceArgs | undefined;
    const id = deleteArgs?.where?.id as TId | undefined;

    if (id !== undefined) {
      await this.validarAcessoPorId(id);
    }

    return this.model.delete(...args) as Promise<MethodReturn<TDelegate["delete"]>>;
  }

  upsert(...args: MethodArgs<TDelegate["upsert"]>): Promise<MethodReturn<TDelegate["upsert"]>> {
    return this.model.upsert(...args) as Promise<MethodReturn<TDelegate["upsert"]>>;
  }
}
