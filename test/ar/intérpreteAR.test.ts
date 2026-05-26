import {describe, expect, it} from "vitest";
import {IntérpreteAR} from "../../src/ar/intérpreteAR.ts";
import {NombreDeRelación} from "../../src/ar/modeloSintácticoAR.ts";
import {ModeloRelacionalMaterializado, RelacionMaterializada} from "../../src/mr/modeloRelacionalMaterializado.ts";
import {MomodeloLogicaError} from "../../src/servicios/errores.ts";
import {definición, fila, inserción, pk, relación, simple} from "../mr/helpers.ts";
import {IntérpreteMR} from "../../src/mr/interpretadorMR.ts";
import {ValidadorSemánticoMR} from "../../src/mr/validadorSemanticoMR.ts";
import {programa} from "../mr/helpers.ts";
import {SentenciaMR} from "../../src/mr/sentenciaMR.ts";

describe("[Álgebra Relacional] Intérprete AR", () => {
    function modeloConRelaciones(...sentencias: SentenciaMR[]): ModeloRelacionalMaterializado {
        return new IntérpreteMR().ejecutar(
            new ValidadorSemánticoMR().ejecutarsePara(programa(...sentencias), null)
        );
    }

    const intérprete = new IntérpreteAR();

    it("un NombreDeRelación retorna la RelacionMaterializada correspondiente", () => {
        const modelo = modeloConRelaciones(
            definición(relación("PERSONA", pk("id"), simple("nombre"))),
            inserción("PERSONA", fila(1, "Ana")),
        );
        const resultado = intérprete.ejecutar(new NombreDeRelación("PERSONA"), modelo);
        expect(resultado).toBeInstanceOf(RelacionMaterializada);
        expect(resultado.nombre).toBe("PERSONA");
        expect(resultado.tuplas).toHaveLength(1);
    });

    it("la búsqueda por nombre es insensible a mayúsculas y minúsculas", () => {
        const modelo = modeloConRelaciones(
            definición(relación("CLIENTE", pk("id"))),
        );
        const resultado = intérprete.ejecutar(new NombreDeRelación("cliente"), modelo);
        expect(resultado.nombre).toBe("CLIENTE");
    });

    it("un nombre de relación inexistente lanza una excepción", () => {
        const modelo = new ModeloRelacionalMaterializado();
        expect(() =>
            intérprete.ejecutar(new NombreDeRelación("INEXISTENTE"), modelo)
        ).toThrow(MomodeloLogicaError);
    });
});
