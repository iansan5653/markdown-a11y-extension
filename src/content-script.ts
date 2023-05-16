import {LintedMarkdownEditor} from "./components/linted-markdown-editor";
import {observeSelector} from "./utilities/dom/observe-selector";

const rootPortal = document.createElement("div");
rootPortal.style.zIndex = "999";
rootPortal.style.position = "absolute";
rootPortal.style.top = "0";
rootPortal.style.left = "0";
document.body.appendChild(rootPortal);

const markdownEditorsSelector =
  "textarea.js-paste-markdown, textarea.CommentBox-input, textarea[aria-label='Markdown value']";

observeSelector(markdownEditorsSelector, (editor) => {
  if (!(editor instanceof HTMLTextAreaElement)) return () => {};

  const lintedEditor = new LintedMarkdownEditor(editor, rootPortal);

  return () => lintedEditor.disconnect();
});
