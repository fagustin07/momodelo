import {basicSetup} from "codemirror";
import {EditorView, keymap} from "@codemirror/view";
import {Extension, Prec} from "@codemirror/state";
import {autocompletion, CompletionContext, CompletionResult} from "@codemirror/autocomplete";
import {linterAR, linterMR} from "./linter.ts";
import {extensionLenguajeMR} from "./lenguajeMR.ts";
import {extensionLenguajeAR} from "./lenguajeAR.ts";

function extensionesCompartidas(
    completar: (ctx: CompletionContext) => CompletionResult | null,
    ejecutar: () => void
) {
    return [
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
    ];
}

export function generarExtensionesMR(
    completar: (ctx: CompletionContext) => CompletionResult | null,
    ejecutar: () => void
) {
    const extensions = [
        ...extensionesCompartidas(completar, ejecutar),
        ...extensionLenguajeMR,
    ];

    if (!import.meta.env.TEST) {
        extensions.push(linterMR);
    }

    return extensions;
}

export function generarExtensionesAR(
    completar: (ctx: CompletionContext) => CompletionResult | null,
    ejecutar: () => void,
    atajos: Extension,
) {
    const extensions = [
        ...extensionesCompartidas(completar, ejecutar),
        atajos,
        ...extensionLenguajeAR,
    ];

    if (!import.meta.env.TEST) {
        extensions.push(linterAR);
    }

    return extensions;
}