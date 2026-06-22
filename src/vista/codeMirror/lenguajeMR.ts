import {HighlightStyle, StreamLanguage, syntaxHighlighting} from "@codemirror/language";
import {tags} from "@lezer/highlight";

type Regla = { match: RegExp; tag: string | null };

const IDENTIFICADOR = /[A-Za-záéíóúÁÉÍÓÚñÑüÜ_][A-Za-záéíóúÁÉÍÓÚñÑüÜ0-9_]*/;
const NO_IDENTIFICADOR = /(?![A-Za-záéíóúÁÉÍÓÚñÑüÜ0-9_])/;

const reglas: Regla[] = [
    {match: new RegExp(`(?:INSERTAR|EN|PK|FK)${NO_IDENTIFICADOR.source}`, "i"), tag: "palabraClave"},
    {match: new RegExp(`(?:VERDADERO|FALSO|TRUE|FALSE)${NO_IDENTIFICADOR.source}`, "i"), tag: "booleano"},
    {match: /'[^']*'/, tag: "cadena"},
    {match: /\d+(?:\.\d+)?/, tag: "número"},
    {match: /[<>]/, tag: "comparador"},
    {match: /[{}]/, tag: "llave"},
    {match: IDENTIFICADOR, tag: null},
];

const lenguajeMR = StreamLanguage.define({
    tokenTable: {
        "palabraClave": tags.keyword,
        "booleano": tags.bool,
        "cadena": tags.string,
        "número": tags.number,
        "comparador": tags.angleBracket,
        "llave": tags.brace,
    },

    token(stream) {
        if (stream.eatSpace()) return null;
        const encontrada = reglas
            .find(({match}) =>
                stream.match(match)
            );

        if (encontrada) return encontrada.tag;
        else { stream.next(); return null; }
    }
});

export const resaltarMR = HighlightStyle.define([
    {tag: tags.keyword, class: "palabra-clave"},
    {tag: tags.bool, class: "booleano"},
    {tag: tags.string, class: "cadena"},
    {tag: tags.number, class: "número"},
    {tag: tags.angleBracket, class: "comparador"},
    {tag: tags.brace, class: "llave"},
]);

export const extensionLenguajeMR = [lenguajeMR, syntaxHighlighting(resaltarMR)];