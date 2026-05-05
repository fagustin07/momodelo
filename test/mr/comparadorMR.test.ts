import {describe, expect, it} from "vitest";
import {ComparadorMR} from "../../src/mr/comparadorMR.ts";
import {ModeloER} from "../../src/servicios/modeloER.ts";
import {AtributoPK, AtributoSimple, DefiniciónRelación, ProgramaMR, RelacionMR} from "../../src/mr/modeloSintacticoMR";
import {Entidad} from "../../src/modelo/entidad.ts";
import {coordenada} from "../../src/posicion.ts";
import {ErroresValidaciónMR} from "../../src/servicios/errores.ts";

function entidad(nombre: string, pks: string[] = [], simples: string[] = [], multivaluados: string[] = []): Entidad {
    const nuevaEntidad = new Entidad(nombre);
    
    pks.forEach(pk => {
        const atr = nuevaEntidad.agregarAtributo(pk, coordenada(0, 0));
        nuevaEntidad.cambiarTipoDeAtributo(atr, 'pk');
    });

    simples.forEach(s => {
        const a = nuevaEntidad.agregarAtributo(s, coordenada(0, 0));
        nuevaEntidad.cambiarTipoDeAtributo(a, 'simple');
    });

    multivaluados.forEach(m => {
        const a = nuevaEntidad.agregarAtributo(m, coordenada(0, 0));
        nuevaEntidad.cambiarTipoDeAtributo(a, 'multivaluado');
    });

    return nuevaEntidad;
}

function programa(...relaciones: RelacionMR[]): ProgramaMR {
    return new ProgramaMR(relaciones.map(r => new DefiniciónRelación(r)));
}

describe("[Modelo Relacional] Comparador MR", () => {
    const comparador = new ComparadorMR();

    it("el comparador no lanza excepciones si las entidades del MER coinciden con las relaciones y PKs del MR", () => {
        const modeloER = new ModeloER([entidad("CLIENTE", ["id"])]);

        const modeloMR = programa(
            new RelacionMR("cliente", [new AtributoPK("id")])
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("el comparador levanta una excepción si falta al menos una relación correspondiente a una entidad del MER", () => {
        const modeloER = new ModeloER([entidad("PIRATA")]);
        const modeloMR = programa();

        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidaciónMR);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("Falta la relación 'PIRATA' en el modelo relacional.");
    });

    it("el comparador levanta una excepción si las clave primaria de alguna relación no coinciden con las de la entidad", () => {
        const modeloER = new ModeloER([entidad("FRUTA", ["codigo"])]);

        const modeloMR = programa(
            new RelacionMR("FRUTA", [new AtributoPK("id")])
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidaciónMR);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("La relación 'FRUTA' tiene una clave primaria incorrecta.");
    });

    it("el comparador ignora los atributos multivaluados del MER en el esquema MR", () => {
        const modeloER = new ModeloER([
            entidad("BARCO", ["id"], ["nombre"], ["tripulantes"])
        ]);

        const modeloMR = programa(
            new RelacionMR("BARCO", [
                new AtributoPK("id"),
                new AtributoSimple("nombre")
            ])
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("el comparador levanta una excepción si faltan atributos simples de la entidad en el MR", () => {
        const modeloER = new ModeloER([
            entidad("BARCO", ["id"], ["nombre"])
        ]);

        const modeloMR = programa(
            new RelacionMR("BARCO", [new AtributoPK("id")])
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidaciónMR);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("La relación 'BARCO' no contiene los mismos atributos simples que la entidad.");
    });

    it("el comparador no sabe analizar más de una entidad del MER para que coincidan con sus esquemas relacionales", () => {
        const modeloER = new ModeloER([
            entidad("CLIENTE", ["id"]),
            entidad("VENTA", ["nro"])
        ]);

        const modeloMR = programa(
            new RelacionMR("CLIENTE", [new AtributoPK("id")]),
            new RelacionMR("VENTA", [new AtributoPK("nro")])
        );

        expect(() => comparador.esConsistente(modeloER, modeloMR)).not.toThrow();
    });

    it("el comparador acumula errores de múltiples entidades inconsistentes en una única excepción", () => {
        const modeloER = new ModeloER([
            entidad("CLIENTE", ["id"]),
            entidad("VENTA", ["nro"])
        ]);

        const modeloMR = programa();

        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow(ErroresValidaciónMR);
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("Falta la relación 'CLIENTE' en el modelo relacional.");
        expect(() => comparador.esConsistente(modeloER, modeloMR)).toThrow("Falta la relación 'VENTA' en el modelo relacional.");
    });
});