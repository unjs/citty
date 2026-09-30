// Colors support for terminal output
function noColor() {
  const { env = {}, stdout } = globalThis.process ?? {};
  return env.FORCE_COLOR
    ? env.FORCE_COLOR === "0"
    : !!env.NO_COLOR || env.TERM === "dumb" || !!env.TEST || !!env.CI || !stdout?.isTTY;
}

const _c =
  (c: number, r: number = 39) =>
  (t: string) =>
    noColor() ? t : `\u001B[${c}m${t}\u001B[${r}m`;

type ColorType = (text: string) => string;

export const bold: ColorType = /* @__PURE__ */ _c(1, 22);
export const red: ColorType = /* @__PURE__ */ _c(31);
export const green: ColorType = /* @__PURE__ */ _c(32);
export const yellow: ColorType = /* @__PURE__ */ _c(33);
export const blue: ColorType = /* @__PURE__ */ _c(34);
export const magenta: ColorType = /* @__PURE__ */ _c(35);
export const cyan: ColorType = /* @__PURE__ */ _c(36);
export const gray: ColorType = /* @__PURE__ */ _c(90);
export const underline: ColorType = /* @__PURE__ */ _c(4, 24);
