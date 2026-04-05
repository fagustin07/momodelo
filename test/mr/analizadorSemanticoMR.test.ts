import {describe, expect, it} from "vitest";
import {AnalizadorSemánticoMR} from "../../src/mr/analizadorSemanticoMR";
import {AtributoPK, AtributoSimple, ModeloRelacional, RelacionMR} from "../../src/mr/modeloSintacticoMR";

describe("[Modelo Relacional] Analizador Semántico", () => {
    const analizador = new AnalizadorSemánticoMR();

    it("el analizador semántico no devuelve errores si todas las relaciones tienen PK", () => {
        const modelo = new ModeloRelacional([
            new RelacionMR("CLIENTE", [new AtributoPK("id")]),
            new RelacionMR("VENTA", [new AtributoPK("nro"), new AtributoSimple("fecha")])
        ]);

        const errores = analizador.validar(modelo);
        expect(errores).toHaveLength(0);
    });

    it("el analizador recolecta todas las relaciones que no tienen clave primaria", () => {
        const modelo = new ModeloRelacional([
            new RelacionMR("pirata", [new AtributoSimple("attr")]),
            new RelacionMR("fruta", [new AtributoPK("id")]),
            new RelacionMR("MARINERO", [new AtributoSimple("attr"), new AtributoSimple("attr2")]),
        ]);

        const errores = analizador.validar(modelo);

        expect(errores).toHaveLength(2);
        expect(errores).toContain("Falta clave primaria en 'pirata'.");
        expect(errores).toContain("Falta clave primaria en 'MARINERO'.");
    });
});