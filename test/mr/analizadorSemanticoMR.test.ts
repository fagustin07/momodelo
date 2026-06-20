import {describe, expect, it} from "vitest";
import {AnalizadorSemánticoMR} from "../../src/mr/analizadorSemanticoMR";
import {ProgramaMRValidado} from "../../src/mr/modeloSintacticoMR";
import {ErroresValidación} from "../../src/servicios/errores";
import {definición, fila, fk, inserción, multivaluado, pk, pkfk, programa, relación, simple} from "./helpers";

describe("[Modelo Relacional] Analizador Semántico", () => {
    const analizador = new AnalizadorSemánticoMR();

    it("el analizador semántico no levanta excepciones si todas las relaciones tienen PK", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("VENTA", pk("nro"), simple("fecha")))
        );

        expect(() => analizador.validar(modelo)).not.toThrow();
    });

    it("al leer un modelo sin errores semáticos, se retorna un objeto que representa que el programa es válido", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id")))
        );

        expect(analizador.validar(modelo)).toBeInstanceOf(ProgramaMRValidado);
    });

    it("el analizador levanta una excepción cuando alguna relación no tiene clave primaria", () => {
        const modelo = programa(
            definición(relación("pirata", simple("attr"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'pirata'.");
    });

    it("el analizador acumula todos los errores de relaciones sin clave primaria en una única excepción", () => {
        const modelo = programa(
            definición(relación("pirata", simple("attr"))),
            definición(relación("fruta", pk("id"))),
            definición(relación("MARINERO", simple("attr"), simple("attr2"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'pirata'.");
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'MARINERO'.");
    });

    it("se puede declarar una inserción luego de la definición de la relación", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id"))),
            inserción("CLIENTE", fila(1)),
        );

        expect(() => analizador.validar(modelo)).not.toThrow();
    });

    it("al insertar en una relación no definida se levanta una excepción", () => {
        const modelo = programa(
            inserción("INEXISTENTE", fila(1)),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("Relación 'INEXISTENTE' no definida.");
    });

    it("al insertar en una relación antes de su definición se levanta una excepción", () => {
        const modelo = programa(
            inserción("CLIENTE", fila(1)),
            definición(relación("CLIENTE", pk("id"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("Relación 'CLIENTE' no definida.");
    });

    it("al insertar filas con cantidades incorrectas acumula un error por fila", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id"))),
            inserción("CLIENTE", fila(1, 2), fila(3, 4, 'padre')),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("La 1ª inserción en 'CLIENTE' tiene 2 atributos pero la relación espera 1.");
        expect(() => analizador.validar(modelo)).toThrow("La 2ª inserción en 'CLIENTE' tiene 3 atributos pero la relación espera 1.");
    });

    it("los errores de definición e inserción semánticos se acumulan en una única excepción", () => {
        const modelo = programa(
            definición(relación("pirata", simple("attr"))),
            inserción("INEXISTENTE", fila(1)),
            inserción("pirATA", fila(1, 2)),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'pirata'.");
        expect(() => analizador.validar(modelo)).toThrow("Relación 'INEXISTENTE' no definida.");
        expect(() => analizador.validar(modelo)).toThrow("La 1ª inserción en 'pirATA' tiene 2 atributos pero la relación espera 1.");
    });

    it("una relación con un atributo duplicado levanta una excepción semántica", () => {
        const modelo = programa(
            definición(relación("EMPLEADO", pk("id"), simple("nombre"), simple("nombre"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("La relación 'EMPLEADO' tiene atributos duplicados: 'nombre'.");
    });

    it("la detección de atributos duplicados es insensible a mayúsculas y minúsculas", () => {
        const modelo = programa(
            definición(relación("EMPLEADO", pk("id"), simple("nombre"), simple("NOMBRE"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("La relación 'EMPLEADO' tiene atributos duplicados: 'NOMBRE'.");
    });

    it("una relación con múltiples atributos duplicados acumula todos en el mismo error", () => {
        const modelo = programa(
            definición(relación("VENTA", pk("id"), simple("fecha"), simple("fecha"), simple("monto"), simple("monto"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("La relación 'VENTA' tiene atributos duplicados: 'fecha', 'monto'.");
    });

    it("los errores de atributos duplicados y falta de PK se acumulan en una única excepción", () => {
        const modelo = programa(
            definición(relación("PIEZA", simple("tipo"), simple("tipo"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("Falta clave primaria en 'PIEZA'.");
        expect(() => analizador.validar(modelo)).toThrow("La relación 'PIEZA' tiene atributos duplicados: 'tipo'.");
    });

    it("un FK que referencia una PK por nombre directo es válido", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("COMPRA", pk("nro"), fk("id"))),
        );

        expect(() => analizador.validar(modelo)).not.toThrow();
    });

    it("un FK que referencia una PK por sufijo de entidad es válido", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("COMPRA", pk("nro"), fk("id_cliente"))),
        );

        expect(() => analizador.validar(modelo)).not.toThrow();
    });

    it("un FK que no referencia ninguna PK existente lanza error", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("COMPRA", pk("nro"), fk("id_vendedor"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("El atributo FK 'id_vendedor' en 'COMPRA' no referencia ninguna clave primaria existente al momento de definir la relación.");
    });

    it("se reconocen FKs que referencian a las claves de otras relaciones", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("PRODUCTO", pk("codigo"))),
            definición(relación("COMPRA", pk("nro"), fk("id"), fk("codigo"))),
        );

        expect(() => analizador.validar(modelo)).not.toThrow();
    });

    it("múltiples FKs inválidas en distintas relaciones acumulan errores", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("COMPRA", pk("nro"), fk("fantasma1"))),
            definición(relación("PEDIDO", pk("codigo"), fk("fantasma2"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("El atributo FK 'fantasma1' en 'COMPRA' no referencia ninguna clave primaria existente al momento de definir la relación.");
        expect(() => analizador.validar(modelo)).toThrow("El atributo FK 'fantasma2' en 'PEDIDO' no referencia ninguna clave primaria existente al momento de definir la relación.");
    });

    it("un FK en una relación que referencia una PK definida después es válido si la definición se declara luego", () => {
        const modelo = programa(
            definición(relación("COMPRA", pk("nro"), fk("id_cliente"))),
            definición(relación("CLIENTE", pk("id"))),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("El atributo FK 'id_cliente' en 'COMPRA' no referencia ninguna clave primaria existente al momento de definir la relación.");
    });

    it("un PKFK se valida como PK y también como FK", () => {
        const modelo = programa(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("COMPRA", pkfk("id"))),
        );

        expect(() => analizador.validar(modelo)).not.toThrow();
    });

    it("insertar en una relación con atributo multivaluado levanta una excepción", () => {
        const modelo = programa(
            definición(relación("EMPLEADO", pk("id"), multivaluado("telefono"))),
            inserción("EMPLEADO", fila(1, "123456789")),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("No se puede insertar en 'EMPLEADO' porque tiene atributos multivaluados.");
    });

    it("el error de inserción en relación multivaluada se acumula con otros errores", () => {
        const modelo = programa(
            definición(relación("EMPLEADO", pk("id"), multivaluado("telefono"))),
            inserción("EMPLEADO", fila(1, "123456789")),
            inserción("INEXISTENTE", fila(1)),
        );

        expect(() => analizador.validar(modelo)).toThrow(ErroresValidación);
        expect(() => analizador.validar(modelo)).toThrow("No se puede insertar en 'EMPLEADO' porque tiene atributos multivaluados.");
        expect(() => analizador.validar(modelo)).toThrow("Relación 'INEXISTENTE' no definida.");
    });
});