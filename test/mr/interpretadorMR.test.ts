import {describe, expect, it} from "vitest";
import {IntérpreteMR} from "../../src/mr/interpretadorMR.ts";
import {ValidadorSemánticoMR} from "../../src/mr/validadorSemanticoMR.ts";
import {ErrorPKDuplicada, MomodeloLogicaError} from "../../src/servicios/errores.ts";
import {definición, fila, inserción, pk, programa, relación, simple} from "./helpers.ts";
import {SentenciaMR} from "../../src/mr/sentenciaMR.ts";

describe("[Modelo Relacional] Intérprete MR", () => {
    function ejecutar(...sentencias: SentenciaMR[]) {
        const intérprete = new IntérpreteMR();
        return intérprete.ejecutar(new ValidadorSemánticoMR().ejecutarsePara(programa(...sentencias), null));
    }

    it("una relación definida queda registrada con tuplas vacías", () => {
        const modelo = ejecutar(
            definición(relación("CLIENTE", pk("id"), simple("nombre"))),
        );
        const rel = modelo.obtenerRelacion("CLIENTE");
        expect(rel.nombre).toBe("CLIENTE");
        expect(rel.tuplas).toHaveLength(0);
    });

    it("múltiples relaciones quedan registradas independientemente", () => {
        const modelo = ejecutar(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("PEDIDO", pk("nro"))),
        );
        expect(modelo.relaciones()).toHaveLength(2);
        expect(modelo.obtenerRelacion("CLIENTE").tuplas).toHaveLength(0);
        expect(modelo.obtenerRelacion("PEDIDO").tuplas).toHaveLength(0);
    });

    it("una fila insertada expone sus valores por nombre de atributo", () => {
        const modelo = ejecutar(
            definición(relación("CLIENTE", pk("id"), simple("nombre"))),
            inserción("CLIENTE", fila(1, "Ana")),
        );
        const tupla = modelo.obtenerRelacion("CLIENTE").tuplas[0];
        expect(tupla.valor("id")).toBe(1);
        expect(tupla.valor("nombre")).toBe("Ana");
    });

    it("múltiples filas insertadas quedan registradas en la relación correspondiente", () => {
        const modelo = ejecutar(
            definición(relación("CLIENTE", pk("id"), simple("nombre"))),
            inserción("CLIENTE", fila(1, "Ana"), fila(2, "Bob")),
        );
        expect(modelo.obtenerRelacion("CLIENTE").tuplas).toHaveLength(2);
    });

    it("las tuplas insertadas en distintas relaciones no se mezclan", () => {
        const modelo = ejecutar(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("PEDIDO", pk("nro"))),
            inserción("CLIENTE", fila(1)),
            inserción("PEDIDO", fila(100), fila(101)),
        );
        expect(modelo.obtenerRelacion("CLIENTE").tuplas).toHaveLength(1);
        expect(modelo.obtenerRelacion("PEDIDO").tuplas).toHaveLength(2);
    });

    it("una tupla idéntica ya existente no se vuelve a agregar (semántica de conjunto)", () => {
        const modelo = ejecutar(
            definición(relación("CLIENTE", pk("id"), simple("nombre"))),
            inserción("CLIENTE", fila(1, "Ana"), fila(1, "Ana")),
        );
        expect(modelo.obtenerRelacion("CLIENTE").tuplas).toHaveLength(1);
    });

    it("la misma tupla presente en dos sentencias de inserción distintas no se duplica", () => {
        const modelo = ejecutar(
            definición(relación("CLIENTE", pk("id"), simple("nombre"))),
            inserción("CLIENTE", fila(1, "Ana")),
            inserción("CLIENTE", fila(1, "Ana")),
        );
        expect(modelo.obtenerRelacion("CLIENTE").tuplas).toHaveLength(1);
    });

    it("al insertar una fila con PK ya existente y atributos simples distintos, se lanza ErrorPKDuplicada", () => {
        expect(() => ejecutar(
            definición(relación("CLIENTE", pk("id"), simple("nombre"))),
            inserción("CLIENTE", fila(1, "Ana"), fila(1, "Bob")),
        )).toThrow(ErrorPKDuplicada);
    });

    it("el error por PK duplicada incluye el nombre de la relación y los valores de PK", () => {
        expect(() => ejecutar(
            definición(relación("CLIENTE", pk("id"), simple("nombre"))),
            inserción("CLIENTE", fila(42, "Ana"), fila(42, "Bob")),
        )).toThrow("Clave primaria duplicada en 'CLIENTE': (42).");
    });

    it("una PK compuesta no genera conflicto si las filas difieren en algún atributo PK", () => {
        expect(() => ejecutar(
            definición(relación("MATRICULA", pk("id_alumno"), pk("id_materia"))),
            inserción("MATRICULA", fila(1, 10), fila(1, 20)),
        )).not.toThrow();
    });

    it("una tupla con PK compuesta idéntica a otra existente se ignora silenciosamente", () => {
        expect(() => ejecutar(
            definición(relación("MATRICULA", pk("id_alumno"), pk("id_materia"))),
            inserción("MATRICULA", fila(1, 10), fila(1, 10)),
        )).not.toThrow();
    });

    it("al insertar una fila con PK compuesta completa ya existente y atributos simples distintos, se lanza ErrorPKDuplicada", () => {
        expect(() => ejecutar(
            definición(relación("MATRICULA", pk("id_alumno"), pk("id_materia"), simple("nota"))),
            inserción("MATRICULA", fila(1, 10, 8), fila(1, 10, 9)),
        )).toThrow(ErrorPKDuplicada);
    });

    it("la búsqueda de una relación es case-insensitive", () => {
        const modelo = ejecutar(
            definición(relación("CLIENTE", pk("id"))),
        );
        expect(modelo.obtenerRelacion("cliente").nombre).toBe("CLIENTE");
        expect(modelo.obtenerRelacion("Cliente").nombre).toBe("CLIENTE");
    });

    it("al buscar una relación inexistente, se lanza un error", () => {
        const modelo = ejecutar(
            definición(relación("CLIENTE", pk("id"))),
        );
        expect(() => modelo.obtenerRelacion("INEXISTENTE")).toThrow(MomodeloLogicaError);
    });

    it("el error al buscar una relación inexistente incluye el nombre buscado", () => {
        const modelo = ejecutar(
            definición(relación("CLIENTE", pk("id"))),
        );
        expect(() => modelo.obtenerRelacion("INEXISTENTE")).toThrow("La relación 'INEXISTENTE' no existe en el modelo.");
    });
});
