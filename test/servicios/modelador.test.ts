import { describe, it, expect } from "vitest";
import { Entidad } from "../../src/modelo/entidad.ts";
import { coordenada } from "../../src/posicion.ts";
import {Modelador} from "../../src/servicios/modelador.ts";
import {RelaciónExistenteError, RelaciónRecursivaError} from "../../src/servicios/errores.ts";

describe("[MER] Modelador", () => {

    let modelador: Modelador;

    it("Dado un modelador, puede crear varias relaciones entre diferentes entidades", () => {
        modelador = new Modelador();

        const entidad1 = crearEntidadLlamada("Pirata");
        const entidad2 = crearEntidadLlamada("Marin");
        const entidad3 = crearEntidadLlamada("Tenryu");

        modelador.crearRelacion(entidad1, entidad2);
        modelador.crearRelacion(entidad1, entidad3);

        expect(modelador.relaciones.length).toEqual(2);


        const [relacionPirataMarin, relacionPirataTenryu] = modelador.relaciones;

        expect(relacionPirataMarin.entidadOrigen()).toEqual(entidad1);
        expect(relacionPirataMarin.entidadDestino()).toEqual(entidad2);

        expect(relacionPirataTenryu.entidadOrigen()).toEqual(entidad1);
        expect(relacionPirataTenryu.entidadDestino()).toEqual(entidad3);
    });

    it("No se puede crear una relación recursiva", () => {
        modelador = new Modelador();

        const entidad = crearEntidadLlamada("Pirata");

        expect(() => {
            modelador.crearRelacion(entidad, entidad);
        }).toThrow(RelaciónRecursivaError);

        expect(modelador.relaciones.length).toEqual(0);
    });

    it("Aún no es posible crear una relación recursiva", () => {
        modelador = new Modelador();

        const entidad = crearEntidadLlamada("Pirata");

        expect(() => {
            modelador.crearRelacion(entidad, entidad);
        }).toThrow(RelaciónRecursivaError);

        expect(modelador.relaciones.length).toEqual(0);
    });


    it("Aún no es posible crear dos relaciones con las mismas entidades", () => {
        modelador = new Modelador();
        const entidad = crearEntidadLlamada("Pirata");
        const entidad2 = crearEntidadLlamada("Capitán");
        modelador.crearRelacion(entidad, entidad2);

        expect(() => {
            modelador.crearRelacion(entidad, entidad2);
        }).toThrow(RelaciónExistenteError);

        expect(modelador.relaciones.length).toEqual(1);
    });

    function crearEntidadLlamada(nombreEntidad: string): Entidad {
        const nuevaEntidad = modelador.generarEntidadUbicadaEn(coordenada(200, 200));
        modelador.renombrarEntidad(nombreEntidad, nuevaEntidad!);
        return nuevaEntidad!;
    }

});
