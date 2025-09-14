import { describe, it, expect } from "vitest";
import { Entidad } from "../../src/modelo/entidad.ts";
import { coordenada } from "../../src/posicion.ts";
import {Modelador} from "../../src/servicios/modelador.ts";

describe("[MER] Modelador", () => {

    let modelador: Modelador;

    it("Dado un modelador, puede crear varias relaciones entre diferentes entidades", () => {
        modelador = new Modelador();

        const entidad1 = crearEntidadLlamada("Pirata");
        const entidad2 = crearEntidadLlamada("Marin");
        const entidad3 = crearEntidadLlamada("Tenryu");

        generarRelacionEnModeloEntre(entidad1, entidad2);
        generarRelacionEnModeloEntre(entidad1, entidad3);

        expect(modelador.relaciones.length).toEqual(2);


        const [relacionPirataMarin, relacionPirataTenryu] = modelador.relaciones;

        expect(relacionPirataMarin.entidadOrigen()).toEqual(entidad1);
        expect(relacionPirataMarin.entidadDestino()).toEqual(entidad2);

        expect(relacionPirataTenryu.entidadOrigen()).toEqual(entidad1);
        expect(relacionPirataTenryu.entidadDestino()).toEqual(entidad3);
    });

    function crearEntidadLlamada(nombreEntidad: string): Entidad {
        modelador.solicitudCrearEntidad();
        const nuevaEntidad = modelador.generarEntidadUbicadaEn(coordenada(200, 200));
        modelador.renombrarEntidad(nombreEntidad, nuevaEntidad!);
        return nuevaEntidad!;
    }

    function generarRelacionEnModeloEntre(entidadOrigen: Entidad, entidadDestino: Entidad) {
        modelador.solicitudCrearRelacion();
        modelador.emitirSeleccionDeEntidad(entidadOrigen, () => {});
        modelador.emitirSeleccionDeEntidad(entidadDestino, () => {});
    }
});
