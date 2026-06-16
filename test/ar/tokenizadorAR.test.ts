import {describe, expect, it} from "vitest";
import {tiposEn, tokenizar} from "./helpers.ts";
import {TipoTokenAR} from "../../src/tipos/tipos.ts";

describe("[Álgebra Relacional] Tokenizador AR", () => {
    it("un identificador simple se tokeniza como NOMBRE con su lexema como valor", () => {
        const tokens = tokenizar("PERSONA");
        expect(tokens[0].tipo).toBe<TipoTokenAR>("NOMBRE");
        expect(tokens[0].valor).toBe("PERSONA");
    });

    it("varios identificadores separados por espacios producen un NOMBRE por cada uno", () => {
        expect(tiposEn("PERSONA PEDIDO")).toEqual<TipoTokenAR[]>(["NOMBRE", "NOMBRE", "EOF"]);
    });

    it("los espacios en blanco son ignorados", () => {
        expect(tiposEn("  CLIENTE  ")).toEqual<TipoTokenAR[]>(["NOMBRE", "EOF"]);
    });

    it("la secuencia siempre termina con un token EOF", () => {
        const ultimo = (texto: string) => tokenizar(texto).slice(-1)[0].tipo;
        expect(ultimo("PERSONA")).toBe<TipoTokenAR>("EOF");
        expect(ultimo("")).toBe<TipoTokenAR>("EOF");
    });

    it("un carácter desconocido produce un token DESCONOCIDO con ese carácter como valor", () => {
        const tokens = tokenizar("@");
        expect(tokens[0].tipo).toBe<TipoTokenAR>("DESCONOCIDO");
        expect(tokens[0].valor).toBe("@");
    });

    it("nombres con tildes y ñ se reconocen como NOMBRE", () => {
        expect(tiposEn("Dirección Ñoño")).toEqual<TipoTokenAR[]>(["NOMBRE", "NOMBRE", "EOF"]);
    });

    it("la posición de cada token refleja su índice de original en la cadena de texto", () => {
        const tokens = tokenizar("PERSONA PEDIDO");
        expect(tokens[0].posicion).toBe(0);
        expect(tokens[1].posicion).toBe(8);
    });

    it("el símbolo de selección se reconoce como sigma", () => {
        expect(tiposEn("σ")).toEqual<TipoTokenAR[]>(["SIGMA", "EOF"]);
    });

    it("el símbolo de proyección se reconoce como pi", () => {
        expect(tiposEn("π")).toEqual<TipoTokenAR[]>(["PI", "EOF"]);
    });

    it("los paréntesis se tokenizan correctamente", () => {
        expect(tiposEn("(PERSONA)")).toEqual<TipoTokenAR[]>(["LPAREN", "NOMBRE", "RPAREN", "EOF"]);
    });

    it("la coma se tokeniza correctamente", () => {
        expect(tiposEn(",")).toEqual<TipoTokenAR[]>(["COMA", "EOF"]);
    });

    it("Se tokenizan correctamente los mayor que y menor que", () => {
        expect(tiposEn("<>")).toEqual<TipoTokenAR[]>(["LANGLE", "RANGLE", "EOF"]);
    });

    it("La igualdad se tokeniza correctamente", () => {
        const tokens = tokenizar("=");
        expect(tokens[0].tipo).toBe<TipoTokenAR>("OP_COMP");
        expect(tokens[0].valor).toBe("=");
    });

    it("Los operadores compuestos se tokenizan como un solo token correctamente", () => {
        const t = (s: string) => { const tok = tokenizar(s); return {tipo: tok[0].tipo, valor: tok[0].valor}; };
        expect(t("!=")).toEqual({tipo: "OP_COMP", valor: "!="});
        expect(t("<=")).toEqual({tipo: "OP_COMP", valor: "<="});
        expect(t(">=")).toEqual({tipo: "OP_COMP", valor: ">="});
    });

    it("El tokenizador reconoce comparación de mayor que o igual y de menor que o igual", () => {
        expect(tiposEn("<=")).toEqual<TipoTokenAR[]>(["OP_COMP", "EOF"]);
        expect(tiposEn(">=")).toEqual<TipoTokenAR[]>(["OP_COMP", "EOF"]);
    });

    it("Se tokeniza correctamente la conjunción y disyunción", () => {
        expect(tiposEn("∧")).toEqual<TipoTokenAR[]>(["AND", "EOF"]);
        expect(tiposEn("∨")).toEqual<TipoTokenAR[]>(["OR", "EOF"]);
    });

    it("un número entero se tokeniza como NUMERO con su valor", () => {
        const tokens = tokenizar("42");
        expect(tokens[0].tipo).toBe<TipoTokenAR>("NUMERO");
        expect(tokens[0].valor).toBe("42");
    });

    it("un número decimal se tokeniza como NUMERO con su valor", () => {
        const tokens = tokenizar("4.6");
        expect(tokens[0].tipo).toBe<TipoTokenAR>("NUMERO");
        expect(tokens[0].valor).toBe("4.6");
    });

    it("una cadena entre comillas simples se tokeniza como CADENA con el contenido sin comillas", () => {
        const tokens = tokenizar("'Quilmes'");
        expect(tokens[0].tipo).toBe<TipoTokenAR>("CADENA");
        expect(tokens[0].valor).toBe("Quilmes");
    });

    it("Los booleanos que representan la verdad se tokenizan como VERDADERO", () => {
        expect(tiposEn("VERDADERO")).toEqual<TipoTokenAR[]>(["VERDADERO", "EOF"]);
        expect(tiposEn("TRUE")).toEqual<TipoTokenAR[]>(["VERDADERO", "EOF"]);
        expect(tiposEn("true")).toEqual<TipoTokenAR[]>(["VERDADERO", "EOF"]);
    });

    it("Los booleanos que representan la falsedad se tokenizan como FALSO", () => {
        expect(tiposEn("FALSO")).toEqual<TipoTokenAR[]>(["FALSO", "EOF"]);
        expect(tiposEn("FALSE")).toEqual<TipoTokenAR[]>(["FALSO", "EOF"]);
        expect(tiposEn("false")).toEqual<TipoTokenAR[]>(["FALSO", "EOF"]);
    });

    it("una expresión de selección completa se tokeniza en la secuencia correcta", () => {
        expect(tiposEn("σ<marca='Quilmes'>Cerveza")).toEqual<TipoTokenAR[]>(
            ["SIGMA", "LANGLE", "NOMBRE", "OP_COMP", "CADENA", "RANGLE", "NOMBRE", "EOF"]
        );
    });

    it("una expresión de selección con comparación numérica se tokeniza en la secuencia correcta", () => {
        expect(tiposEn("σ<grad>4.6>Cerveza")).toEqual<TipoTokenAR[]>(
            ["SIGMA", "LANGLE", "NOMBRE", "RANGLE", "NUMERO", "RANGLE", "NOMBRE", "EOF"]
        );
    });

    it("una expresión de proyección se tokeniza en la secuencia correcta", () => {
        expect(tiposEn("π<variedad, origen>Vino")).toEqual<TipoTokenAR[]>(
            ["PI", "LANGLE", "NOMBRE", "COMA", "NOMBRE", "RANGLE", "NOMBRE", "EOF"]
        );
    });

    it("el símbolo de producto cartesiano se tokeniza correctamente", () => {
        const tokens = tokenizar("×");
        expect(tokens[0].tipo).toBe<TipoTokenAR>("PRODUCT");
        expect(tokens[0].valor).toBe("×");
    });

    it("una expresión de producto cartesiano se tokeniza correctamente", () => {
        expect(tiposEn("PERSONA × PEDIDO")).toEqual<TipoTokenAR[]>(
            ["NOMBRE", "PRODUCT", "NOMBRE", "EOF"]
        );
    });
});
