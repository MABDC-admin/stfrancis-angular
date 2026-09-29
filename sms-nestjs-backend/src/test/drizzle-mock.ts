export type DrizzleMockQueueKind = 'select' | 'insert' | 'update' | 'delete';

type QueueMap = Record<DrizzleMockQueueKind, unknown[]>;

type QueryTable = {
  [method: string]: jest.Mock;
};

interface QueryShape {
  [table: string]: QueryTable;
}

interface DrizzleDbLike {
  query: QueryShape;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  __queue: {
    push: (kind: DrizzleMockQueueKind, value: unknown) => void;
    pushMany: (kind: DrizzleMockQueueKind, values: unknown[]) => void;
    drain: (kind: DrizzleMockQueueKind) => unknown[];
  };
}

const asRows = (value: unknown) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined) {
    return [];
  }
  return [value];
};

const createThenable = (value: unknown) => ({
  then: (resolve: (value: unknown) => void, reject: (reason?: unknown) => void = () => {}) =>
    Promise.resolve(value).then(resolve, reject),
});

export function createDrizzleMock(overrides: { query?: QueryShape } = {}) {
  const queue: QueueMap = {
    select: [],
    insert: [],
    update: [],
    delete: [],
  };

  const pop = (kind: DrizzleMockQueueKind) => {
    const value = queue[kind].length ? queue[kind].shift() : undefined;
    return asRows(value);
  };

  const createSelectChain = () => {
    const chain = {
      where: jest.fn(() => chain),
      orderBy: jest.fn(() => chain),
      limit: jest.fn(() => chain),
      then: async (resolve: (value: unknown) => void, reject: (reason?: unknown) => void = () => {}) =>
        Promise.resolve(pop('select')).then(resolve, reject),
    };
    return chain;
  };

  const buildSelect = () => {
    const fromNode = createSelectChain();
    const selectNode = createSelectChain();
    return {
      ...selectNode,
      from: jest.fn(() => fromNode),
    };
  };

  const buildInsert = () => ({
    values: jest.fn(() => {
      const rows = pop('insert');
      return {
        returning: jest.fn(async () => rows),
      };
    }),
  });

  const buildUpdate = () => ({
    set: jest.fn(() => {
      const rows = pop('update');
      const chain = {
        where: jest.fn(() => {
          const thenable = createThenable(rows);
          return {
            ...thenable,
            returning: jest.fn(async () => rows),
          };
        }),
      };
      return chain;
    }),
  });

  const buildDelete = () => {
    const rows = pop('delete');
    const chain = {
      where: jest.fn(() => {
        const thenable = createThenable(rows);
        return {
          ...thenable,
          returning: jest.fn(async () => rows),
        };
      }),
    };
    return chain;
  };

  const db: DrizzleDbLike = {
    query: {
      ...overrides.query,
    },
    select: jest.fn(buildSelect),
    insert: jest.fn(buildInsert),
    update: jest.fn(buildUpdate),
    delete: jest.fn(buildDelete),
    __queue: {
      push: (kind, value) => queue[kind].push(value),
      pushMany: (kind, values) => queue[kind].push(...values),
      drain: (kind) => queue[kind].splice(0),
    },
  };

  return db;
}
