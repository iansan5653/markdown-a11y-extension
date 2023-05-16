import {Vector} from "../utilities/geometry/vector";
import {LintError} from "../utilities/lint-markdown";
import {Component} from "./component";

const WIDTH = 350;
const MARGIN = 8;

export class LintErrorTooltip extends Component {
  #tooltip = LintErrorTooltip.#createTooltipElement();

  constructor(portal: HTMLElement) {
    super();
    this.addEventListener(document, "keydown", (e) => this.#onGlobalKeydown(e));
    this.addEventListener(this.#tooltip, "mouseout", () => this.hide());
    portal.appendChild(this.#tooltip);
  }

  disconnect() {
    super.disconnect();
    this.#tooltip.remove();
  }

  show(errors: LintError[], {x, y}: Vector) {
    const prefix = LintErrorTooltip.#createPrefixElement(errors.length);

    // even though typed as required string, sometimes these properties are missing
    const errorNodes = errors.map((error, i) => [
      i !== 0 ? LintErrorTooltip.#createSeparatorElement() : "",
      LintErrorTooltip.#createDescriptionElement(error.ruleDescription),
      error.errorDetail
        ? LintErrorTooltip.#createDetailsElement(error.errorDetail)
        : "",
      error.justification
        ? LintErrorTooltip.#createJustificationElement(error.justification)
        : "",
      error.ruleNames?.length
        ? LintErrorTooltip.#createNameElement(
            error.ruleNames?.slice(0, 2).join(": ")
          )
        : "",
    ]);

    this.#tooltip.replaceChildren(prefix, ...errorNodes.flat());

    this.#tooltip.style.top = `${y}px`;

    const wouldOverflow = x + WIDTH + 2 * MARGIN > document.body.clientWidth;
    this.#tooltip.style.left = wouldOverflow ? "0" : `${MARGIN}px`;

    this.#tooltip.removeAttribute("hidden");
  }

  hide(force = false) {
    // Don't hide if the mouse enters the tooltip (allowing users to copy text)
    setTimeout(() => {
      if (force || !this.#tooltip.matches(":hover"))
        this.#tooltip.setAttribute("hidden", "true");
    }, 10);
  }

  #onGlobalKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && !event.defaultPrevented) this.hide(true);
  }

  static #createTooltipElement() {
    const element = document.createElement("div");

    element.setAttribute("aria-live", "polite");
    element.setAttribute("hidden", "true");

    element.style.backgroundColor = "var(--color-canvas-default)";
    element.style.padding = "8px";
    element.style.border = "1px solid var(--color-border-default)";
    element.style.borderRadius = "6px";
    element.style.boxShadow = "var(--color-shadow-medium)";
    element.style.boxSizing = "border-box";
    element.style.position = "absolute";
    element.style.width = `${WIDTH}px`;
    element.style.margin = `${MARGIN}px`;
    element.style.maxWidth = `calc(100vw - ${MARGIN * 2}px)`;
    element.style.display = "flex";
    element.style.flexDirection = "column";
    element.style.gap = "8px";

    return element;
  }

  static #createPrefixElement(errorCount: number) {
    const element = document.createElement("span");
    element.textContent =
      errorCount === 1
        ? "Markdown problem: "
        : `${errorCount} Markdown problems: `;
    element.style.clipPath = "circle(0)";
    element.style.position = "absolute";
    return element;
  }

  static #createDescriptionElement(description: string) {
    const element = document.createElement("div");
    element.style.fontWeight = "bold";
    element.style.color = "var(--color-danger-fg)";
    element.append(description);
    return element;
  }

  static #createDetailsElement(details: string) {
    const element = document.createElement("p");
    element.style.fontWeight = "bold";
    element.style.margin = "0";
    element.append(details);
    return element;
  }

  static #createJustificationElement(justification: string) {
    const element = document.createElement("p");
    element.style.margin = "0";
    element.append(justification);
    return element;
  }

  static #createNameElement(name: string) {
    const element = document.createElement("code");
    element.style.fontSize = "12px";
    element.style.color = "var(--color-fg-muted)";
    element.style.backgroundColor = "transparent";
    element.append(name);
    return element;
  }

  static #createSeparatorElement() {
    const element = document.createElement("hr");
    element.style.borderTop = "1px dashed var(--color-border-default)";
    element.style.borderBottom = "none";
    element.style.margin = "0";
    return element;
  }
}
