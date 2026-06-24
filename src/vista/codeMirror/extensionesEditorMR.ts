import {basicSetup} from "codemirror";
import {EditorView, keymap} from "@codemirror/view";
import {Prec} from "@codemirror/state";
import {autocompletion, CompletionContext, CompletionResult} from "@codemirror/autocomplete";
import {linterMR} from "./linterMR.ts";
import {extensionLenguajeMR} from "./lenguajeMR.ts";

export function crearExtensionesMR(
    completar: (ctx: CompletionContext) => CompletionResult | null,
    ejecutar: () => void
) {
    const extensions = [
        Prec.highest(keymap.of([{
            key: "Tab",
            run: (view) => {
                view.dispatch(view.state.replaceSelection("   "));
                return true;
            }
        }])),
        basicSetup,
        autocompletion({override: [completar]}),
        Prec.highest(keymap.of([{
            key: "Ctrl-Enter",
            run: () => { ejecutar(); return true; }
        }])),
        EditorView.lineWrapping,
        ...extensionLenguajeMR,
    ];

    if (!import.meta.env.TEST) {
        extensions.push(linterMR);
    }

    return extensions;
}