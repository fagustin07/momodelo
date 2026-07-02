import {HighlightStyle, StreamLanguage, syntaxHighlighting} from "@codemirror/language";
import {tags} from "@lezer/highlight";

type Regla = { match: RegExp; tag: string | null };

const IDENTIFICADOR = /[A-Za-záéíóúÁÉÍÓÚñÑüÜ_][A-Za-záéíóúÁÉÍÓÚñÑüÜ0-9_]*/;
const NO_IDENTIFICADOR = /(?![A-Za-záéíóúÁÉÍÓÚñÑüÜ0-9_])/;

const reglas: Regla[] = [
    {match: /<=|>=|!=|[=<>]/, tag: "comparador"},
    {match: /[∧∨]/, tag: "lógico"},
    {match: /[σπρ∪∩÷×⋈*←\-]/, tag: "palabraClave"},
    {match: /'[^']*'/, tag: "cadena"},
    {match: /\d+(?:\.\d+)?/, tag: "número"},
    {match: new RegExp(`(?:VERDADERO|FALSO|TRUE|FALSE)${NO_IDENTIFICADOR.source}`, "i"), tag: "booleano"},
    {match: IDENTIFICADOR, tag: null},
];

const lenguajeAR = StreamLanguage.define({
    tokenTable: {
        "palabraClave": tags.keyword,
        "lógico": tags.logicOperator,
        "comparador": tags.compareOperator,
        "cadena": tags.string,
        "número": tags.number,
        "booleano": tags.bool,
    },
    token(stream) {
        if (stream.eatSpace()) return null;
        const encontrada = reglas
            .find(({match}) =>
                stream.match(match)
            );

        if (encontrada)
            return encontrada.tag;
        else {
            stream.next();
            return null;
        }
    }
});

export const resaltarAR = HighlightStyle.define([
    {tag: tags.keyword, class: "palabra-clave"},
    {tag: tags.logicOperator, class: "lógico"},
    {tag: tags.compareOperator, class: "comparador"},
    {tag: tags.string, class: "cadena"},
    {tag: tags.number, class: "número"},
    {tag: tags.bool, class: "booleano"},
]);

export const extensionLenguajeAR = [lenguajeAR, syntaxHighlighting(resaltarAR)];