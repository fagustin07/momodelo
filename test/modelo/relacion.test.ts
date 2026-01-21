import {beforeEach, describe, expect, it} from "vitest";
import {Entidad} from "../../src/modelo/entidad.ts";
import {Relacion} from "../../src/modelo/relacion.ts";

describe("[MER] Relación", () => {
    let entidadPirata: Entidad;
    let entidadBicho: Entidad;
    let relacionCombate: Relacion;

    beforeEach(() => {
        entidadPirata = new Entidad("Pirata");
        entidadBicho = new Entidad("Bicho Poderoso");
        relacionCombate = new Relacion(entidadPirata, entidadBicho, "Combate");
    });

    it("Dado dos entidades, cuando se crea una relación, entonces debe conocer su nombre y las entidades asociadas", () => {
        expect(relacionCombate.nombre()).toEqual("Combate");
        expect(relacionCombate.entidades()).toEqual([entidadPirata, entidadBicho]);
    });

    it("Dada una relacion, cuando se modifica su nombre, entonces se refleja correctamente", () => {
        relacionCombate.cambiarNombre("Come")

        expect(relacionCombate.nombre()).toEqual("Come");
    });

    it("Una relación conoce la cardinalidad con la que participa la entidad de origen", () => {
        relacionCombate.cambiarCardinalidadOrigenA(['1','1']);

        expect(relacionCombate.cardinalidadOrigen()).toEqual(['1','1']);
    });

    it("Una relación la cardinalidad con la que participa la entidad de destino", () => {
        relacionCombate.cambiarCardinalidadDestinoA(['1','1']);

        expect(relacionCombate.cardinalidadDestino()).toEqual(['1','1']);
    });

    it("Una relación puede ser débil", () => {
        const relacionDebil = new Relacion(entidadPirata, entidadBicho, "Protege", ['1','1'], ['0','N'], undefined, 'débil');

        expect(relacionDebil.esDebil()).toBe(true);
    });

    it("Una relación fuerte puede cambiarse a débil", () => {
        expect(relacionCombate.esDebil()).toBe(false);
        
        relacionCombate.cambiarTipoRelacionA('débil');

        expect(relacionCombate.esDebil()).toBe(true);
    });

    it("Una relación débil puede cambiarse a fuerte", () => {
        const relacionDebil = new Relacion(entidadPirata, entidadBicho, "Protege", ['1','1'], ['0','N'], undefined, 'débil');
        expect(relacionDebil.esDebil()).toBe(true);
        
        relacionDebil.cambiarTipoRelacionA('fuerte');

        expect(relacionDebil.esDebil()).toBe(false);
    });
});
