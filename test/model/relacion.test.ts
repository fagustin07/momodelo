import { describe, it, expect } from "vitest";
import { Entidad } from "../../src/modelo/entidad.ts";
import { coordenada } from "../../src/posicion.ts";
import {Relacion} from "../../src/modelo/relacion.ts";

describe("[MER] Relación", () => {
    it("Dado dos entidades, cuando se crea una relación, entonces debe conocer su nombre y las entidades asociadas", () => {
        const entidad1 = new Entidad("Pirata", [], coordenada(0, 0));
        const entidad2 = new Entidad("Marin", [], coordenada(100, 100));

        const relacion = new Relacion("Combate", entidad1, entidad2, coordenada(50, 50));

        expect(relacion.nombre()).toEqual("Combate");
        expect(relacion.entidades()).toEqual([entidad1, entidad2]);
    });

    it("Dada una relacion, cuando se modifica su nombre, entonces se refleja correctamente", () => {
        const entidad1 = new Entidad("Persona", [], coordenada(0, 0));
        const entidad2 = new Entidad("Fruta", [], coordenada(100, 100));
        const relacion = new Relacion("Consume", entidad1, entidad2, coordenada(50, 50));

        const nuevaRelacion = relacion.cambiarNombre("Come")

        expect(nuevaRelacion.nombre()).toEqual("Come");
    });
});
