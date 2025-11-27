import { EditorView, basicSetup } from "codemirror";
import { autocierre } from "./regla.autocierre.ts";

export function initMR(elementoRaiz: HTMLElement) {
    elementoRaiz.innerHTML = "";

    new EditorView({
        doc: ``,
        extensions: [
            basicSetup,
            autocierre,
        ],
        parent: elementoRaiz
    });
}
