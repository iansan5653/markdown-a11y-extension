import {LintedMarkdownEditor} from "./linted-markdown-editor";
import {Rect} from "../utilities/geometry/rect";
import {Vector} from "../utilities/geometry/vector";
import {getWindowScrollVector} from "../utilities/dom";
import {NumberRange} from "../utilities/geometry/number-range";
import {Component} from "./component";
import {LintError} from "../utilities/lint-markdown";

export class LintErrorAnnotation extends Component {
  readonly name: string;
  readonly description: string;
  readonly details: string;
  readonly justification: string;
  readonly lineNumber: number;

  readonly #container: HTMLElement = document.createElement("div");

  readonly #editor: LintedMarkdownEditor;
  #elements: readonly HTMLElement[] = [];

  readonly #indexRange: NumberRange;

  constructor(
    error: LintError,
    editor: LintedMarkdownEditor,
    portal: HTMLElement
  ) {
    super();

    this.#editor = editor;

    this.name = error.ruleNames?.slice(0, 2).join(": ") ?? "";
    this.description = error.ruleDescription ?? "";
    this.details = error.errorDetail ?? "";
    this.justification = error.justification ?? "";
    this.lineNumber = error.lineNumber;

    portal.appendChild(this.#container);

    const markdown = editor.value;
    const [line = "", ...prevLines] = markdown
      .split("\n")
      .slice(0, this.lineNumber)
      .reverse();

    const startCol = (error.errorRange?.[0] ?? 1) - 1;
    const length = error.errorRange?.[1] ?? line.length - startCol;

    const startIndex = prevLines.reduce(
      (t, l) => t + l.length + 1 /* +1 for newline char */,
      startCol
    );
    const endIndex = startIndex + length;
    this.#indexRange = new NumberRange(startIndex, endIndex);

    this.recalculatePosition();
  }

  disconnect() {
    super.disconnect();
    this.#container.remove();
  }

  getTooltipPosition() {
    const domRect = this.#elements.at(-1)?.getBoundingClientRect();
    if (domRect)
      return new Rect(domRect)
        .asVector("bottom-left")
        .plus(getWindowScrollVector());
  }

  containsPoint(point: Vector) {
    return this.#elements.some((el) =>
      new Rect(el.getBoundingClientRect()).contains(point)
    );
  }

  containsIndex(index: number) {
    return this.#indexRange.contains(index, "start-inclusive-end-exclusive");
  }

  recalculatePosition() {
    const editorRect = new Rect(this.#editor.getBoundingClientRect());
    const scrollVector = getWindowScrollVector();

    // The range rectangles are tight around the characters; we'd rather fill the line height if possible
    const cssLineHeight = this.#editor.getLineHeight();

    const elements: HTMLElement[] = [];
    // render an annotation element for each line separately
    for (const rect of this.#editor.getRangeRects(this.#indexRange)) {
      // suppress when out of bounds
      if (!rect.isContainedBy(editorRect)) continue;

      // The rects are viewport-relative, but the annotations are absolute positioned
      // (document-relative) so we have to add the window scroll position
      const absoluteRect = rect.translate(scrollVector);

      // We want ranges spanning multiple lines to look like one annotation, so we need to
      // expand them to fill the gap around the lines
      const lineHeight = cssLineHeight ?? rect.height * 1.2;
      const scaledRect = absoluteRect.scaleY(lineHeight / absoluteRect.height);

      elements.push(LintErrorAnnotation.#createAnnotationElement(scaledRect));
    }
    this.#container.replaceChildren(...elements);
    this.#elements = elements;
  }

  static #createAnnotationElement(rect: Rect) {
    const annotation = document.createElement("span");
    annotation.style.position = "absolute";
    annotation.style.backgroundColor = "var(--color-danger-emphasis)";
    annotation.style.opacity = "0.2";
    annotation.style.pointerEvents = "none";
    annotation.style.top = `${rect.top}px`;
    annotation.style.left = `${rect.left}px`;
    annotation.style.width = `${rect.width}px`;
    annotation.style.height = `${rect.height}px`;
    return annotation;
  }
}
