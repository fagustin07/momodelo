import {describe, expect, it} from "vitest";
import {ComparadorMR} from "../../src/mr/comparadorMR.ts";
import {ErroresValidación} from "../../src/servicios/errores.ts";
import {definición, entidad, fila, inserción, mer, multivaluado, pk, pkfk, programa, relación, relacionMER, simple} from "./helpers.ts";

describe("[Modelo Relacional] Comparador MR", () => {
    const comparador = new ComparadorMR();

    it("el comparador no lanza excepciones si las entidades del MER coinciden con las relaciones y PKs del MR", () => {
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        const modeloMR = programa(definición(relación("cliente", pk("id"))));
        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("el comparador levanta una excepción si falta al menos una relación correspondiente a una entidad del MER", () => {
        const modeloER = mer(entidad("PIRATA"));
        const modeloMR = programa();
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("Falta la relación 'PIRATA' en el modelo relacional.");
    });

    it("el comparador levanta una excepción si las claves primarias de alguna relación no coinciden con las de la entidad", () => {
        const modeloER = mer(entidad("FRUTA", ["codigo"]));
        const modeloMR = programa(definición(relación("FRUTA", pk("id"))));
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("La relación 'FRUTA' tiene una clave primaria incorrecta.");
    });

    it("el comparador valida que los atributos multivaluados del MER estén presentes entre llaves en el MR", () => {
        const modeloER = mer(entidad("BARCO", ["id"], ["nombre"], ["tripulantes"]));
        const modeloMR = programa(definición(relación("BARCO", pk("id"), simple("nombre"), multivaluado("tripulantes"))));
        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("el comparador levanta una excepción si faltan atributos simples de la entidad en el MR", () => {
        const modeloER = mer(entidad("BARCO", ["id"], ["nombre"]));
        const modeloMR = programa(definición(relación("BARCO", pk("id"))));
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("La relación 'BARCO' no contiene los mismos atributos simples que la entidad.");
    });

    it("el comparador valida múltiples entidades del MER contra sus esquemas relacionales", () => {
        const modeloER = mer(entidad("CLIENTE", ["id"]), entidad("VENTA", ["nro"]));
        const modeloMR = programa(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("VENTA", pk("nro")))
        );
        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("el comparador acumula errores de múltiples entidades inconsistentes en una única excepción", () => {
        const modeloER = mer(entidad("CLIENTE", ["id"]), entidad("VENTA", ["nro"]));
        const modeloMR = programa();
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("Falta la relación 'CLIENTE' en el modelo relacional.");
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("Falta la relación 'VENTA' en el modelo relacional.");
    });

    it("se levanta una excepción cuando se define una relación en el MR que no tiene correspondencia en el MER", () => {
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        const modeloMR = programa(
            definición(relación("CLIENTE", pk("id"))),
            definición(relación("FANTASMA", pk("id"))),
        );
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("La relación 'FANTASMA' no tiene correspondencia en el MER.");
    });

    it("se levanta una excepción cuando se describe una inserción en una relación sin correspondencia en el MER", () => {
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        const modeloMR = programa(
            definición(relación("CLIENTE", pk("id"))),
            inserción("FANTASMA", fila(1)),
        );
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("No se puede insertar en 'FANTASMA': no tiene correspondencia en el MER.");
    });

    it("el comparador acumula los errores del MER y del MR para levantar una única excepción", () => {
        const modeloER = mer(entidad("CLIENTE", ["id"]));
        const modeloMR = programa(inserción("FANTASMA", fila(1)));
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("Falta la relación 'CLIENTE' en el modelo relacional.");
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("No se puede insertar en 'FANTASMA': no tiene correspondencia en el MER.");
    });

    it("el comparador levanta una excepción si los nombres de los multivaluados no coinciden", () => {
        const modeloER = mer(entidad("BARCO", ["id"], ["nombre"], ["telefonos"]));
        const modeloMR = programa(definición(relación("BARCO", pk("id"), simple("nombre"), multivaluado("emails"))));
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("La relación 'BARCO' no contiene los mismos atributos multivaluados que la entidad.");
    });

    it("el comparador sabe si una entidad débil absorbe correctamente la clave con un atributo de la fuerte", () => {
        const pedido = entidad("PEDIDO", ["nro"]);
        const lineaPedido = entidad("LINEA_PEDIDO", ["nro_linea"]);
        const relDebil = relacionMER(lineaPedido, pedido, "PEDIDO_TIENE_LINEA", ['1', '1'], ['0', 'N'], 'débil');
        const modeloER = mer(pedido, lineaPedido, [relDebil]);
        const modeloMR = programa(
            definición(relación("PEDIDO", pk("nro"))),
            definición(relación("LINEA_PEDIDO", pk("nro_linea"), pkfk("nro"))),
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("el comparador sabe si una entidad débil absorbe correctamente la clave compuesta de la fuerte", () => {
        const expediente = entidad("EXPEDIENTE", ["año", "numero"]);
        const foja = entidad("FOJA", ["nro_foja"]);
        const relDebil = relacionMER(foja, expediente, "EXPEDIENTE_TIENE_FOJA", ['1', '1'], ['0', 'N'], 'débil');
        const modeloER = mer(expediente, foja, [relDebil]);
        const modeloMR = programa(
            definición(relación("EXPEDIENTE", pk("año"), pk("numero"))),
            definición(relación("FOJA", pk("nro_foja"), pkfk("año"), pkfk("numero"))),
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("el comparador sabe si una entidad débil absorbe correctamente la clave de su entidad fuerte que a la vez era débil de otra", () => {
        const pais = entidad("PAIS", ["codigo_pais"]);
        const provincia = entidad("PROVINCIA", ["codigo_provincia"]);
        const ciudad = entidad("CIUDAD", ["codigo_ciudad"]);
        const provinciaDePais = relacionMER(provincia, pais, "PERTENECE_PAIS", ['1', '1'], ['0', 'N'], 'débil');
        const ciudadDeProvincia = relacionMER(ciudad, provincia, "PERTENECE_PROVINCIA", ['1', '1'], ['0', 'N'], 'débil');
        const modeloER = mer(pais, provincia, ciudad, [provinciaDePais, ciudadDeProvincia]);
        const modeloMR = programa(
            definición(relación("PAIS", pk("codigo_pais"))),
            definición(relación("PROVINCIA", pk("codigo_provincia"), pkfk("codigo_pais"))),
            definición(relación("CIUDAD", pk("codigo_ciudad"), pkfk("codigo_provincia"), pkfk("codigo_pais"))),
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("si una entidad débil no absorbe la PK de la fuerte levanta una excepción", () => {
        const pedido = entidad("PEDIDO", ["nro"]);
        const lineaPedido = entidad("LINEA_PEDIDO", ["nro_linea"]);
        const relDebil = relacionMER(lineaPedido, pedido, "PEDIDO_TIENE_LINEA", ['1', '1'], ['0', 'N'], 'débil');
        const modeloER = mer(pedido, lineaPedido, [relDebil]);
        const modeloMR = programa(
            definición(relación("PEDIDO", pk("nro"))),
            definición(relación("LINEA_PEDIDO", pk("nro_linea"))),
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR))
            .toThrow("La entidad débil 'LINEA_PEDIDO' no absorbe el atributo 'nro' de 'PEDIDO' como PK y FK.");
    });

    it("si una entidad débil no tiene su clave parcial propia levanta una excepción", () => {
        const pedido = entidad("PEDIDO", ["nro"]);
        const lineaPedido = entidad("LINEA_PEDIDO", ["nro_linea"]);
        const relDebil = relacionMER(lineaPedido, pedido, "PEDIDO_TIENE_LINEA", ['1', '1'], ['0', 'N'], 'débil');
        const modeloER = mer(pedido, lineaPedido, [relDebil]);
        const modeloMR = programa(
            definición(relación("PEDIDO", pk("nro"))),
            definición(relación("LINEA_PEDIDO", pkfk("nro"))),
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR))
            .toThrow("La entidad débil 'LINEA_PEDIDO' no tiene su clave parcial 'nro_linea' como PK.");
    });

    it("el comparador reconoce que una relación N:M genera una tabla intermedia con las claves de ambas entidades como PK y FK", () => {
        const estudiante = entidad("ESTUDIANTE", ["legajo"]);
        const materia = entidad("MATERIA", ["codigo"]);
        const cursa = relacionMER(estudiante, materia, "CURSA", ['0', 'N'], ['0', 'N']);
        const modeloER = mer(estudiante, materia, [cursa]);
        const modeloMR = programa(
            definición(relación("ESTUDIANTE", pk("legajo"))),
            definición(relación("MATERIA", pk("codigo"))),
            definición(relación("CURSA", pkfk("legajo"), pkfk("codigo"))),
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("el comparador levanta una excepción si una relación N:M no está mapeada a una tabla intermedia", () => {
        const estudiante = entidad("ESTUDIANTE", ["legajo"]);
        const materia = entidad("MATERIA", ["codigo"]);
        const cursa = relacionMER(estudiante, materia, "CURSA", ['0', 'N'], ['0', 'N']);
        const modeloER = mer(estudiante, materia, [cursa]);
        const modeloMR = programa(
            definición(relación("ESTUDIANTE", pk("legajo"))),
            definición(relación("MATERIA", pk("codigo"))),
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR))
            .toThrow("La relación N:M 'CURSA' no tiene tabla intermedia en el MR.");
    });

    it("una relación N:M con tabla intermedia a la que le falta parte de la clave levanta una excepción", () => {
        const estudiante = entidad("ESTUDIANTE", ["legajo"]);
        const materia = entidad("MATERIA", ["codigo"]);
        const cursa = relacionMER(estudiante, materia, "CURSA", ['0', 'N'], ['0', 'N']);
        const modeloER = mer(estudiante, materia, [cursa]);
        const modeloMR = programa(
            definición(relación("ESTUDIANTE", pk("legajo"))),
            definición(relación("MATERIA", pk("codigo"))),
            definición(relación("CURSA", pkfk("legajo"))),
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidación);
        expect(() => comparador.esConsistente(modeloER, modeloMR))
            .toThrow("La tabla 'CURSA' no tiene la clave 'codigo' de 'MATERIA' como PK y FK.");
    });

    it("el comparador reconoce la referencia a entidades en tablas intermedias con sufijo en los FKs", () => {
        const estudiante = entidad("ESTUDIANTE", ["legajo"]);
        const materia = entidad("MATERIA", ["codigo"]);
        const cursa = relacionMER(estudiante, materia, "CURSA", ['0', 'N'], ['0', 'N']);
        const modeloER = mer(estudiante, materia, [cursa]);
        const modeloMR = programa(
            definición(relación("ESTUDIANTE", pk("legajo"))),
            definición(relación("MATERIA", pk("codigo"))),
            definición(relación("CURSA", pkfk("legajo_estudiante"), pkfk("codigo_materia"))),
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });
});