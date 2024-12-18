import { describe, it, expect } from "vitest";
import { Entidad } from "../../src/entidad.ts";
import { Maxima, Minima, Relacion, Rol } from "../../src/relacion.ts";
import { coordenada } from "../../src/posicion.ts";

describe("[MER] Relación", () => {
    it("Dado dos entidades, cuando se crea una relación, entonces debe conocer su nombre y las entidades asociadas", () => {
        const entidad1 = new Entidad("Pirata", [], coordenada(0, 0));
        const entidad2 = new Entidad("Marin", [], coordenada(100, 100));

        const relacion = new Relacion("Combate", entidad1, entidad2);

        expect(relacion.nombre()).toEqual("Combate");
        expect(relacion.entidades()).toEqual([entidad1, entidad2]);
    });

    it("Dada una relacion, cuando se modifica su nombre, entonces se refleja correctamente", () => {
        const entidad1 = new Entidad("Persona", [], coordenada(0, 0));
        const entidad2 = new Entidad("Fruta", [], coordenada(100, 100));
        const relacion = new Relacion("Consume", entidad1, entidad2);

        relacion.setNombre("Come")

        expect(relacion.nombre()).toEqual("Come");
    });

    it("Dada una relación, cuando se eligen las cardinalidades, entonces quedan bien representadas", () => {
        const entidad1 = new Entidad("Luffy", [], coordenada(0, 0));
        const entidad2 = new Entidad("Zoro", [], coordenada(100, 100));

        const relacion = new Relacion("Tripulación", entidad1, entidad2);
        relacion.setCardinalidad(Rol.ORIGEN, [Minima.UNO, Maxima.N]);
        relacion.setCardinalidad(Rol.DESTINO, [Minima.CERO, Maxima.UNO]);

        expect(relacion.getCardinalidad(Rol.ORIGEN)).toEqual([Minima.UNO, Maxima.N]);
        expect(relacion.getCardinalidad(Rol.DESTINO)).toEqual([Minima.CERO, Maxima.UNO]);
    });
});
