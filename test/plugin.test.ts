import { describe, it, expect, vi } from "vitest";
import { defineCommand, runCommand, defineCittyPlugin } from "../src/index.ts";
import { resolvePlugins } from "../src/plugin.ts";

describe("defineCittyPlugin", () => {
  it("accepts an object definition", async () => {
    const plugin = defineCittyPlugin({
      name: "test",
      setup() {},
      cleanup() {},
    });

    const [resolved] = await resolvePlugins([plugin]);
    expect(resolved!.name).toBe("test");
    expect(resolved!.setup).toBeInstanceOf(Function);
    expect(resolved!.cleanup).toBeInstanceOf(Function);
  });

  it("accepts a factory function", async () => {
    const plugin = defineCittyPlugin(() => ({
      name: "test",
      setup() {},
      cleanup() {},
    }));

    const [resolved] = await resolvePlugins([plugin]);
    expect(resolved!.name).toBe("test");
  });

  it("accepts an async factory function", async () => {
    const plugin = defineCittyPlugin(async () => ({
      name: "async-test",
    }));

    const [resolved] = await resolvePlugins([plugin]);
    expect(resolved!.name).toBe("async-test");
  });

  it("works with minimal definition (name only)", async () => {
    const plugin = defineCittyPlugin({ name: "minimal" });
    const [resolved] = await resolvePlugins([plugin]);
    expect(resolved!.name).toBe("minimal");
    expect(resolved!.setup).toBeUndefined();
    expect(resolved!.cleanup).toBeUndefined();
  });
});

describe("resolvePlugins", () => {
  it("resolves empty array", async () => {
    expect(await resolvePlugins([])).toEqual([]);
  });

  it("resolves mixed object and function plugins", async () => {
    const plugins = [defineCittyPlugin({ name: "obj" }), defineCittyPlugin(() => ({ name: "fn" }))];

    const resolved = await resolvePlugins(plugins);
    expect(resolved).toHaveLength(2);
    expect(resolved[0]!.name).toBe("obj");
    expect(resolved[1]!.name).toBe("fn");
  });
});

describe("plugin hooks in commands", () => {
  it("calls setup before command run", async () => {
    const order: string[] = [];

    const plugin = defineCittyPlugin({
      name: "test",
      setup() {
        order.push("plugin:setup");
      },
    });

    const cmd = defineCommand({
      plugins: [plugin],
      run() {
        order.push("cmd:run");
      },
    });

    await runCommand(cmd, { rawArgs: [] });
    expect(order).toEqual(["plugin:setup", "cmd:run"]);
  });

  it("calls cleanup after command run", async () => {
    const order: string[] = [];

    const plugin = defineCittyPlugin({
      name: "test",
      cleanup() {
        order.push("plugin:cleanup");
      },
    });

    const cmd = defineCommand({
      plugins: [plugin],
      run() {
        order.push("cmd:run");
      },
    });

    await runCommand(cmd, { rawArgs: [] });
    expect(order).toEqual(["cmd:run", "plugin:cleanup"]);
  });

  it("runs full lifecycle in correct order", async () => {
    const order: string[] = [];

    const plugin = defineCittyPlugin({
      name: "test",
      setup() {
        order.push("plugin:setup");
      },
      cleanup() {
        order.push("plugin:cleanup");
      },
    });

    const cmd = defineCommand({
      plugins: [plugin],
      setup() {
        order.push("cmd:setup");
      },
      run() {
        order.push("cmd:run");
      },
      cleanup() {
        order.push("cmd:cleanup");
      },
    });

    await runCommand(cmd, { rawArgs: [] });
    expect(order).toEqual([
      "plugin:setup",
      "cmd:setup",
      "cmd:run",
      "cmd:cleanup",
      "plugin:cleanup",
    ]);
  });

  it("calls cleanup even when run throws", async () => {
    const cleanupFn = vi.fn();

    const plugin = defineCittyPlugin({
      name: "test",
      cleanup: cleanupFn,
    });

    const cmd = defineCommand({
      plugins: [plugin],
      run() {
        throw new Error("boom");
      },
    });

    await expect(runCommand(cmd, { rawArgs: [] })).rejects.toThrow("boom");
    expect(cleanupFn).toHaveBeenCalledOnce();
  });

  it("calls cleanup even when plugin setup throws", async () => {
    const order: string[] = [];

    const plugin1 = defineCittyPlugin({
      name: "first",
      setup() {
        order.push("first:setup");
      },
      cleanup() {
        order.push("first:cleanup");
      },
    });

    const plugin2 = defineCittyPlugin({
      name: "second",
      setup() {
        throw new Error("setup-boom");
      },
      cleanup() {
        order.push("second:cleanup");
      },
    });

    const cmd = defineCommand({
      plugins: [plugin1, plugin2],
      cleanup() {
        order.push("cmd:cleanup");
      },
      run() {
        order.push("cmd:run");
      },
    });

    await expect(runCommand(cmd, { rawArgs: [] })).rejects.toThrow("setup-boom");
    expect(order).toEqual(["first:setup", "cmd:cleanup", "second:cleanup", "first:cleanup"]);
    expect(order).not.toContain("cmd:run");
  });

  it("runs all plugin cleanups even when one throws", async () => {
    const order: string[] = [];

    const plugin1 = defineCittyPlugin({
      name: "first",
      cleanup() {
        order.push("first:cleanup");
      },
    });

    const plugin2 = defineCittyPlugin({
      name: "second",
      cleanup() {
        order.push("second:cleanup");
        throw new Error("cleanup-boom");
      },
    });

    const cmd = defineCommand({
      plugins: [plugin1, plugin2],
      run() {
        order.push("cmd:run");
      },
    });

    await expect(runCommand(cmd, { rawArgs: [] })).rejects.toThrow("cleanup-boom");
    // second runs first (reverse order), throws, but first still runs
    expect(order).toEqual(["cmd:run", "second:cleanup", "first:cleanup"]);
  });

  it("aggregates multiple cleanup errors", async () => {
    const plugin1 = defineCittyPlugin({
      name: "first",
      cleanup() {
        throw new Error("error-1");
      },
    });

    const plugin2 = defineCittyPlugin({
      name: "second",
      cleanup() {
        throw new Error("error-2");
      },
    });

    const cmd = defineCommand({
      plugins: [plugin1, plugin2],
      run() {},
    });

    const err: Error = await runCommand(cmd, { rawArgs: [] }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Multiple cleanup errors");
    expect(err.cause).toEqual([expect.any(Error), expect.any(Error)]);
    expect((err.cause as Error[])[0]!.message).toBe("error-2");
    expect((err.cause as Error[])[1]!.message).toBe("error-1");
  });

  it("runs multiple plugins in order, cleanup in reverse", async () => {
    const order: string[] = [];

    const plugin1 = defineCittyPlugin({
      name: "first",
      setup() {
        order.push("first:setup");
      },
      cleanup() {
        order.push("first:cleanup");
      },
    });

    const plugin2 = defineCittyPlugin({
      name: "second",
      setup() {
        order.push("second:setup");
      },
      cleanup() {
        order.push("second:cleanup");
      },
    });

    const cmd = defineCommand({
      plugins: [plugin1, plugin2],
      run() {
        order.push("cmd:run");
      },
    });

    await runCommand(cmd, { rawArgs: [] });
    expect(order).toEqual([
      "first:setup",
      "second:setup",
      "cmd:run",
      "second:cleanup",
      "first:cleanup",
    ]);
  });

  it("passes command context to plugin hooks", async () => {
    const setupCtx = vi.fn();
    const cleanupCtx = vi.fn();

    const plugin = defineCittyPlugin({
      name: "test",
      setup: setupCtx,
      cleanup: cleanupCtx,
    });

    const cmd = defineCommand({
      meta: { name: "hello" },
      args: {
        name: { type: "string", default: "world" },
      },
      plugins: [plugin],
      run() {},
    });

    await runCommand(cmd, { rawArgs: ["--name", "foo"] });

    expect(setupCtx).toHaveBeenCalledOnce();
    expect(setupCtx.mock.calls[0]![0].args.name).toBe("foo");
    expect(setupCtx.mock.calls[0]![0].cmd).toBe(cmd);

    expect(cleanupCtx).toHaveBeenCalledOnce();
    expect(cleanupCtx.mock.calls[0]![0].args.name).toBe("foo");
  });

  it("supports factory function plugins with shared state", async () => {
    const events: string[] = [];

    const plugin = defineCittyPlugin(() => {
      const state = { initialized: false };

      return {
        name: "stateful",
        setup() {
          state.initialized = true;
          events.push("setup:" + state.initialized);
        },
        cleanup() {
          events.push("cleanup:" + state.initialized);
        },
      };
    });

    const cmd = defineCommand({
      plugins: [plugin],
      run() {},
    });

    await runCommand(cmd, { rawArgs: [] });
    expect(events).toEqual(["setup:true", "cleanup:true"]);
  });

  it("runs parent command plugins for subcommands", async () => {
    const order: string[] = [];

    const parentPlugin = defineCittyPlugin({
      name: "parent-plugin",
      setup() {
        order.push("parent-plugin:setup");
      },
      cleanup() {
        order.push("parent-plugin:cleanup");
      },
    });

    const cmd = defineCommand({
      plugins: [parentPlugin],
      subCommands: {
        sub: defineCommand({
          run() {
            order.push("sub:run");
          },
        }),
      },
    });

    await runCommand(cmd, { rawArgs: ["sub"] });
    expect(order).toEqual(["parent-plugin:setup", "sub:run", "parent-plugin:cleanup"]);
  });

  it("runs both parent and subcommand plugins", async () => {
    const order: string[] = [];

    const parentPlugin = defineCittyPlugin({
      name: "parent",
      setup() {
        order.push("parent:setup");
      },
      cleanup() {
        order.push("parent:cleanup");
      },
    });

    const childPlugin = defineCittyPlugin({
      name: "child",
      setup() {
        order.push("child:setup");
      },
      cleanup() {
        order.push("child:cleanup");
      },
    });

    const cmd = defineCommand({
      plugins: [parentPlugin],
      subCommands: {
        sub: defineCommand({
          plugins: [childPlugin],
          run() {
            order.push("sub:run");
          },
        }),
      },
    });

    await runCommand(cmd, { rawArgs: ["sub"] });
    expect(order).toEqual([
      "parent:setup",
      "child:setup",
      "sub:run",
      "child:cleanup",
      "parent:cleanup",
    ]);
  });
});
