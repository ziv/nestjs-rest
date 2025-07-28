import { beforeEach, describe, it, mock } from "node:test";
import RestController from "./controller";
import { RestAdapter } from "./adapter";
import { strict as assert } from "node:assert";

function getTestAdapter(id: string): RestAdapter {
  return {
    id: () => id,
    single: mock.fn(() => Promise.resolve({ id: "test" })),
    multiple: mock.fn(() => Promise.resolve({ data: [], total: 0 })),
    create: mock.fn(() => Promise.resolve("created")),
    replace: mock.fn(() => Promise.resolve(true)),
    update: mock.fn(() => Promise.resolve(true)),
    remove: mock.fn(() => Promise.resolve(true)),
  } as RestAdapter;
}

const EMPTY_LIST = { data: [], total: 0, page: 0, size: 20 };

const methods = [
  ["searchRecords", EMPTY_LIST, [{}, {}]],
  ["getMultipleRecords", EMPTY_LIST, [{}]],
  ["createRecord", { data: "created" }, [{}]],
  ["getSingleRecord", { data: { id: "test" } }, ["id"]],
  ["updateRecord", { data: true }, ["id"]],
  ["patchRecord", { data: true }, ["id"]],
  ["removeRecord", { data: true }, ["id"]],
];

describe("constructor", () => {
  it("should throw exception for the same adapter id", () => {
    const adapters = [
      getTestAdapter("test"),
      getTestAdapter("test"),
    ];
    try {
      new RestController({ adapters });
      assert.fail("not should allow two adapters with the same id");
    } catch (_) {
      assert.ok("this is the right path");
    }
  });

  it("should allow different adapters with the same id", () => {
    const adapters = [
      getTestAdapter("test1"),
      getTestAdapter("test2"),
    ];
    new RestController({ adapters });
    assert.ok("this is the right path");
  });
});

describe("methods", () => {
  let adapter, ctr: RestController;

  beforeEach(() => {
    adapter = getTestAdapter("test");
    ctr = new RestController({ adapters: [adapter] });
  });

  for (const [method, , args] of methods) {
    it(`${method} should throw for wrong resource`, async () => {
      try {
        // @ts-ignore: for testing purposes
        await ctr[method as keyof RestController]("test1", ...args);
        assert.fail(`${method} should not allow to run with wrong resource`);
      } catch (_) {
        assert.ok(`this is the right path for ${method}`);
      }
    });
  }

  for (const [method, expected, args] of methods) {
    it(`${method} should return the right data structure`, async () => {
      // @ts-ignore: for testing purposes
      const res = await ctr[method as keyof RestController]("test", ...args);
      assert.deepEqual(expected, res);
    });
  }
});
