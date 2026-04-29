import { describe, expect, it } from "vitest";
import { TokenizadorMR } from "../../src/mr/tokenizadorMR";
import { TipoTokenMR, TokenMR } from "../../src/tipos/tipos.ts";

describe("Tokenizador MR", () => {
    const tokenizador = new TokenizadorMR();

    function tokenizar(texto: string): TokenMR[] {
        return tokenizador.ejecutarseCon(texto);
    }

    function tiposEn(texto: string): TipoTokenMR[] {
        return tokenizar(texto).map((t) => t.tipo);
    }

    function valores(texto: string): string[] {
        return tokenizar(texto).map((t) => t.valor);
    }

    it("todos los símbolos del lenguaje producen su token correspondiente", () => {
        expect(tiposEn("< > { } ( ) ,")).toEqual<TipoTokenMR[]>([
            "LANGLE", "RANGLE", "LBRACE", "RBRACE", "LPAREN", "RPAREN", "COMA"
        ]);
    });

    it("PK y FK son palabras reservadas de restricción de clave", () => {
        expect(tiposEn("PK FK")).toEqual<TipoTokenMR[]>(["PK", "FK"]);
    });

    it("un identificador simple se tokeniza como NOMBRE con su lexema como valor", () => {
        expect(tiposEn("legajo")).toEqual<TipoTokenMR[]>(["NOMBRE"]);
        expect(valores("legajo")).toEqual(["legajo"]);
    });

    it("las palabras reservadas y los identificadores se distinguen correctamente en secuencia", () => {
        expect(tiposEn("PK legajo FK")).toEqual<TipoTokenMR[]>(["PK", "NOMBRE", "FK"]);
    });

    it("los identificadores admiten caracteres acentuados y la eñe", () => {
        expect(valores("añoIngreso")).toEqual(["añoIngreso"]);
    });

    it("el símbolo ? solo es parte del identificador cuando aparece al final", () => {
        expect(valores("act?ivo")).toEqual(["act?", "ivo"]);
    });

    it("los espacios en blanco y saltos de línea no producen tokens", () => {
        expect(tiposEn("  legajo  <  nyAp  >\n")).toEqual<TipoTokenMR[]>(["NOMBRE", "LANGLE", "NOMBRE", "RANGLE"]);
    });

    it("una entrada compuesta solo de espacios produce una secuencia vacía", () => {
        expect(tokenizar("   \n\t  ")).toHaveLength(0);
    });

    it("un carácter fuera del lenguaje produce un token DESCONOCIDO", () => {
        expect(tiposEn("@")).toEqual<TipoTokenMR[]>(["DESCONOCIDO"]);
    });

    it("cada token registra su posición de inicio en la cadena original", () => {
        const tokens = tokenizar("Estudiante<legajo");
        expect(tokens[0]).toMatchObject({ tipo: "NOMBRE", valor: "Estudiante", posicion: 0  });
        expect(tokens[1]).toMatchObject({ tipo: "LANGLE", valor: "<",          posicion: 10 });
        expect(tokens[2]).toMatchObject({ tipo: "NOMBRE", valor: "legajo",     posicion: 11 });
    });

    it("una relación válida produce la secuencia completa de tokens", () => {
        expect(tiposEn("Estudiante<legajo(PK), nyAp>")).toEqual<TipoTokenMR[]>([
            "NOMBRE", "LANGLE", "NOMBRE", "LPAREN", "PK", "RPAREN", "COMA", "NOMBRE", "RANGLE"
        ]);
    });

    it("una relación con múltiples atributos PK y FK produce la secuencia correcta", () => {
        expect(tiposEn("Cursa<legajo(PK, FK), codigo(PK, FK)>")).toEqual<TipoTokenMR[]>([
            "NOMBRE", "LANGLE", "NOMBRE", "LPAREN", "PK", "COMA", "FK", "RPAREN",
            "COMA", "NOMBRE", "LPAREN", "PK", "COMA", "FK", "RPAREN", "RANGLE"
        ]);
    });

    it("los atributos multivaluados entre llaves producen LBRACE, NOMBRE y RBRACE", () => {
        expect(tiposEn("{emails}")).toEqual<TipoTokenMR[]>(["LBRACE", "NOMBRE", "RBRACE"]);
        expect(tiposEn("{emails}(PK)")).toEqual<TipoTokenMR[]>(["LBRACE", "NOMBRE", "RBRACE", "LPAREN", "PK", "RPAREN"]);
    });

    it("el tokenizador es idempotente ante la misma entrada", () => {
        const entrada = "Comision<nro(PK), codigo(PK,FK), {horario}>";
        expect(tokenizar(entrada)).toEqual(tokenizar(entrada));
    });

    it("INSERTAR y EN son palabras reservadas de inserción de datos", () => {
        expect(tiposEn("INSERTAR EN")).toEqual<TipoTokenMR[]>(["INSERTAR", "EN"]);
    });

    it("INSERTAR y EN se reconocen independientemente de la capitalización", () => {
        expect(tiposEn("insertar en")).toEqual<TipoTokenMR[]>(["INSERTAR", "EN"]);
        expect(tiposEn("Insertar En")).toEqual<TipoTokenMR[]>(["INSERTAR", "EN"]);
    });

    it("VERDADERO y FALSO son las dos palabras reservadas para literales booleanos", () => {
        expect(tiposEn("verdadero falso")).toEqual<TipoTokenMR[]>(["VERDADERO", "FALSO"]);
    });

    it("TRUE y FALSE son alias en inglés equivalentes a VERDADERO y FALSO", () => {
        expect(tiposEn("true false")).toEqual<TipoTokenMR[]>(["VERDADERO", "FALSO"]);
    });

    it("los literales booleanos se reconocen sin importar la capitalización", () => {
        expect(tiposEn("True FALSE Verdadero FALSO")).toEqual<TipoTokenMR[]>([
            "VERDADERO", "FALSO", "VERDADERO", "FALSO"
        ]);
    });

    it("un identificador que contiene una palabra reservada como subcadena sigue siendo un NOMBRE", () => {
        expect(tiposEn("insertarDatos")).toEqual<TipoTokenMR[]>(["NOMBRE"]);
        expect(tiposEn("enfermedad")).toEqual<TipoTokenMR[]>(["NOMBRE"]);
        expect(tiposEn("verdaderamente")).toEqual<TipoTokenMR[]>(["NOMBRE"]);
    });

    it("el valor del token preserva el texto original sin normalizar la capitalización", () => {
        expect(valores("insertar")).toEqual(["insertar"]);
        expect(valores("Verdadero")).toEqual(["Verdadero"]);
        expect(valores("TRUE")).toEqual(["TRUE"]);
    });

    it("los literales enteros se reconocen como NUMERO con su valor intacto", () => {
        expect(tiposEn("42")).toEqual<TipoTokenMR[]>(["NUMERO"]);
        expect(valores("42")).toEqual(["42"]);
    });

    it("los literales decimales se reconocen como NUMERO con su valor intacto", () => {
        expect(tiposEn("3.14")).toEqual<TipoTokenMR[]>(["NUMERO"]);
        expect(valores("3.14")).toEqual(["3.14"]);
    });

    it("un literal numérico en medio de una secuencia produce el token NUMERO en su posición", () => {
        expect(tiposEn("Persona 42")).toEqual<TipoTokenMR[]>(["NOMBRE", "NUMERO"]);
    });

    it("el token NUMERO registra correctamente su posición dentro de la cadena", () => {
        const tokens = tokenizar("(42)");
        expect(tokens[1]).toMatchObject({ tipo: "NUMERO", valor: "42", posicion: 1 });
    });

    it("una cadena entre comillas simples se reconoce como CADENA y su valor excluye los delimitadores", () => {
        expect(tiposEn("'hola mundo'")).toEqual<TipoTokenMR[]>(["CADENA"]);
        expect(valores("'hola mundo'")).toEqual(["hola mundo"]);
    });

    it("una cadena vacía entre comillas simples produce un token CADENA con valor vacío", () => {
        expect(tiposEn("''")).toEqual<TipoTokenMR[]>(["CADENA"]);
        expect(valores("''")).toEqual([""]);
    });

    it("el valor de una CADENA preserva tildes y espacios sin modificación", () => {
        expect(valores("'Juan Pérez'")).toEqual(["Juan Pérez"]);
    });

    it("una comilla de apertura sin su cierre no produce un token CADENA", () => {
        expect(tiposEn("'hola")).toEqual<TipoTokenMR[]>(["DESCONOCIDO", "NOMBRE"]);
    });

    it("una sentencia INSERTAR EN completa produce la secuencia de tokens esperada", () => {
        expect(tiposEn("INSERTAR EN Persona<('Juan', 25)>")).toEqual<TipoTokenMR[]>([
            "INSERTAR", "EN", "NOMBRE", "LANGLE",
            "LPAREN", "CADENA", "COMA", "NUMERO", "RPAREN",
            "RANGLE"
        ]);
    });

    it("una inserción con múltiples filas produce los tokens de cada fila correctamente separados", () => {
        expect(tiposEn("INSERTAR EN Empleado <('Ana', verdadero), ('Luis', false)>")).toEqual<TipoTokenMR[]>([
            "INSERTAR", "EN", "NOMBRE", "LANGLE",
            "LPAREN", "CADENA", "COMA", "VERDADERO", "RPAREN",
            "COMA",
            "LPAREN", "CADENA", "COMA", "FALSO", "RPAREN",
            "RANGLE"
        ]);
    });
});
