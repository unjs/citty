import { describe, it, expect, vi } from "vitest";
import { CommandDef, defineCommand, runCommand } from "../src";
import {
  defineCittyPlugin,
  resolvePlugin,
  resolvePlugins,
} from "../src/plugin";

const _resolve = async (plugin: any) => {
  return typeof plugin === "function" ? await plugin() : plugin;
};

const pluginFactory = (name: string) => {
  return {
    name,
    setup() {},
    cleanup() {},
  };
};

const mockedPluginFactory = (name: string) => {
  return defineCittyPlugin({
    name,
    setup: vi.fn(() => {}),
    cleanup: vi.fn(() => {}),
  });
};

describe("plugin", () => {
  it("can be defined using an object", async () => {
    const pluginObject = {
      name: "my-plugin",
      setup() {},
      cleanup() {},
    };

    const plugin = defineCittyPlugin(pluginObject);

    const resolvedPlugin = await _resolve(plugin);

    expect(resolvedPlugin.name).toBe("my-plugin");
    expect(resolvedPlugin.setup).toBeInstanceOf(Function);
    expect(resolvedPlugin.cleanup).toBeInstanceOf(Function);
  });

  it("can be defined using a function", async () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const pluginFunction = () => ({
      name: "my-plugin",
      setup() {},
      cleanup() {},
    });

    const plugin = defineCittyPlugin(pluginFunction);

    const resolvedPlugin = await _resolve(plugin);

    expect(resolvedPlugin.name).toBe("my-plugin");
    expect(resolvedPlugin.setup).toBeInstanceOf(Function);
    expect(resolvedPlugin.cleanup).toBeInstanceOf(Function);
  });

  describe("resolvePlugin", () => {
    it("should be resolved similarly for both object and function definition", async () => {
      const pluginObject = {
        name: "my-plugin",
        setup() {},
        cleanup() {},
      };

      const objectPlugin = defineCittyPlugin(pluginObject);
      const functionPlugin = defineCittyPlugin(() => pluginObject);

      const resolvedObjectPlugin = await resolvePlugin(objectPlugin);
      const resolvedFunctionPlugin = await resolvePlugin(functionPlugin);

      expect(resolvedObjectPlugin).toEqual(resolvedFunctionPlugin);
    });
  });

  describe("resolvePlugins", () => {
    it("can resolve an empty array of plugins", async () => {
      const resolvedPlugins = await resolvePlugins([]);

      expect(resolvedPlugins).toHaveLength(0);
    });

    it("can resolve an array of plugins", async () => {
      const plugin1 = pluginFactory("plugin1");
      const plugin2 = pluginFactory("plugin2");

      const resolvedPlugins = await resolvePlugins([plugin1, plugin2]);

      expect(resolvedPlugins).toHaveLength(2);
      expect(resolvedPlugins[0].name).toBe("plugin1");
      expect(resolvedPlugins[1].name).toBe("plugin2");
    });

    it("can resolve an array of mixed plugins", async () => {
      const plugin1 = defineCittyPlugin({ name: "plugin1" });
      const plugin2 = defineCittyPlugin(() => ({ name: "plugin2" }));

      const resolvedPlugins = await resolvePlugins([plugin1, plugin2]);

      expect(resolvedPlugins).toHaveLength(2);
      expect(resolvedPlugins[0].name).toBe("plugin1");
      expect(resolvedPlugins[1].name).toBe("plugin2");
    });
  });
});

describe("command", () => {
  it("should run setup hooks from plugins", async () => {
    const plugin = mockedPluginFactory("my-plugin");

    const command = defineCommand({
      plugins: [plugin],
    });

    await runCommand(command, { rawArgs: [] });

    const resolvedPlugin = await resolvePlugin(plugin);

    expect(resolvedPlugin.setup).toHaveBeenCalledOnce();
  });

  it("should run cleanup hooks from plugins", async () => {
    const plugin = mockedPluginFactory("my-plugin");

    const command = defineCommand({
      plugins: [plugin],
    });

    await runCommand(command, { rawArgs: [] });

    const resolvedPlugin = await resolvePlugin(plugin);

    expect(resolvedPlugin.cleanup).toHaveBeenCalledOnce();
  });

  it.todo("should run setup, run, and cleanup hooks from command in order");

  it("should run hooks for each plugin", async () => {
    const plugin1 = mockedPluginFactory("plugin1");
    const plugin2 = mockedPluginFactory("plugin2");

    const command = defineCommand({
      plugins: [plugin1, plugin2],
    });

    await runCommand(command, { rawArgs: [] });

    const resolvedPlugin1 = await resolvePlugin(plugin1);
    const resolvedPlugin2 = await resolvePlugin(plugin2);

    expect(resolvedPlugin1.setup).toHaveBeenCalledOnce();
    expect(resolvedPlugin1.cleanup).toHaveBeenCalledOnce();
    expect(resolvedPlugin2.setup).toHaveBeenCalledOnce();
    expect(resolvedPlugin2.cleanup).toHaveBeenCalledOnce();
  });

  it.todo("should run hooks for each plugin in order");

  it("should run plugin hooks from parent command in sub command", async () => {
    const plugin = mockedPluginFactory("my-plugin");

    const command = defineCommand({
      plugins: [plugin],
      subCommands: {
        sub: defineCommand({
          run: vi.fn(() => {}),
        }),
      },
    });

    await runCommand(command, { rawArgs: ["sub"] });

    const resolvedPlugin = await resolvePlugin(plugin);

    // TODO: move to separate test
    expect((command as any).subCommands.sub.run).toHaveBeenCalledOnce();

    expect(resolvedPlugin.setup).toHaveBeenCalledOnce();
    expect(resolvedPlugin.cleanup).toHaveBeenCalledOnce();
  });

  it("should run plugin hooks from sub command", async () => {
    const plugin = mockedPluginFactory("my-plugin");

    const command = defineCommand({
      subCommands: {
        sub: defineCommand({
          plugins: [plugin],
          run: vi.fn(() => {}),
        }),
      },
    });

    await runCommand(command, { rawArgs: ["sub"] });

    const resolvedPlugin = await resolvePlugin(plugin);

    expect((command as any).subCommands.sub.run).toHaveBeenCalledOnce();

    expect(resolvedPlugin.setup).toHaveBeenCalledOnce();
    expect(resolvedPlugin.cleanup).toHaveBeenCalledOnce();
  });

  it("should run plugins hooks from parent and sub command", async () => {
    const plugin1 = mockedPluginFactory("plugin1");

    const plugin2 = mockedPluginFactory("plugin2");

    const command = defineCommand({
      plugins: [plugin1],
      subCommands: {
        sub: defineCommand({
          plugins: [plugin2],
          run: vi.fn(() => {}),
        }),
      },
    });

    await runCommand(command, { rawArgs: ["sub"] });

    const resolvedPlugin1 = await resolvePlugin(plugin1);
    const resolvedPlugin2 = await resolvePlugin(plugin2);

    expect((command as any).subCommands.sub.run).toHaveBeenCalledOnce();

    expect(resolvedPlugin1.setup).toHaveBeenCalledOnce();
    expect(resolvedPlugin1.cleanup).toHaveBeenCalledOnce();
    expect(resolvedPlugin2.setup).toHaveBeenCalledOnce();
    expect(resolvedPlugin2.cleanup).toHaveBeenCalledOnce();
  });
});
