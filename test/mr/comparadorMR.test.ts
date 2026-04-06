import {describe, expect, it} from "vitest";
import {ComparadorMR} from "../../src/mr/comparadorMR.ts";
import {ModeloER} from "../../src/servicios/modeloER.ts";
import {AtributoPK, AtributoSimple, ModeloRelacional, RelacionMR} from "../../src/mr/modeloSintacticoMR";
import {Entidad} from "../../src/modelo/entidad.ts";
import {coordenada} from "../../src/posicion.ts";

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

describe("[Modelo Relacional] Comparador MR", () => {
    const comparador = new ComparadorMR();

    it("el comparador no devuelve errores si las entidades del MER coinciden con las relaciones y PKs del MR", () => {
        const modeloER = new ModeloER([entidad("CLIENTE", ["id"])]);

        const modeloMR = new ModeloRelacional([
            new RelacionMR("cliente", [new AtributoPK("id")])
        ]);

        const errores = comparador.comparar(modeloER, modeloMR);
        expect(errores).toHaveLength(0);
    });

    it("el comparador informa si falta una relación correspondiente a una entidad del MER", () => {
        const modeloER = new ModeloER([entidad("PIRATA")]);
        const modeloMR = new ModeloRelacional([]);

        const errores = comparador.comparar(modeloER, modeloMR);
        
        expect(errores).toHaveLength(1);
        expect(errores).toContain("Falta la relación 'PIRATA' en el modelo relacional.");
    });

    it("el comparador informa si las claves primarias de la relación no coinciden con las de la entidad", () => {
        const modeloER = new ModeloER([entidad("FRUTA", ["codigo"])]);

        const modeloMR = new ModeloRelacional([
            new RelacionMR("FRUTA", [new AtributoPK("id")])
        ]);

        const errores = comparador.comparar(modeloER, modeloMR);

        expect(errores).toHaveLength(1);
        expect(errores).toContain("La relación 'FRUTA' tiene una clave primaria incorrecta.");
    });

    it("el comparador ignora los atributos multivaluados del MER y valida correctamente la presencia de atributos simples", () => {
        const modeloER = new ModeloER([
            entidad("BARCO", ["id"], ["nombre"], ["tripulantes"])
        ]);

        const modeloMR = new ModeloRelacional([
            new RelacionMR("BARCO", [
                new AtributoPK("id"),
                new AtributoSimple("nombre")
            ])
        ]);

        const errores = comparador.comparar(modeloER, modeloMR);
        expect(errores).toHaveLength(0);
    });

    it("el comparador informa si faltan atributos simples de la entidad en el MR", () => {
        const modeloER = new ModeloER([
            entidad("BARCO", ["id"], ["nombre"])
        ]);

        const modeloMR = new ModeloRelacional([
            new RelacionMR("BARCO", [new AtributoPK("id")])
        ]);

        const errores = comparador.comparar(modeloER, modeloMR);

        expect(errores).toHaveLength(1);
        expect(errores).toContain("La relación 'BARCO' no contiene los mismos atributos simples que la entidad.");
    });

    it("el comparador no devuelve errores si múltiples entidades MER coinciden con sus relaciones MR", () => {
        const modeloER = new ModeloER([
            entidad("CLIENTE", ["id"]),
            entidad("VENTA", ["nro"])
        ]);

        const modeloMR = new ModeloRelacional([
            new RelacionMR("CLIENTE", [new AtributoPK("id")]),
            new RelacionMR("VENTA", [new AtributoPK("nro")])
        ]);

        const errores = comparador.comparar(modeloER, modeloMR);
        expect(errores).toHaveLength(0);
    });
});