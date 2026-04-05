import {describe, expect, it} from "vitest";
import {Entidad} from "../../src/modelo/entidad.ts";
import {coordenada} from "../../src/posicion.ts";
import {ModeloER} from "../../src/servicios/modeloER.ts";
import {
    CicloDeRelacionesDébilesError,
    EliminarRelacionIdentificadoraError,
    EntidadDébilConMúltiplesRelacionesIdentificadorasError,
    RelaciónExistenteError,
    RelaciónRecursivaError
} from "../../src/servicios/errores.ts";
import {Relacion} from "../../src/modelo/relacion.ts";

describe("[MER] Modelo Entidad Relación", () => {

    let modeloER: ModeloER;

    it("Dado un modelador, puede crear varias relaciones entre diferentes entidades", () => {
        modeloER = new ModeloER();

        const entidad1 = crearEntidadLlamada("Pirata");
        const entidad2 = crearEntidadLlamada("Marin");
        const entidad3 = crearEntidadLlamada("Tenryu");

        modeloER.crearRelacion(entidad1, entidad2);
        modeloER.crearRelacion(entidad1, entidad3);

        expect(modeloER.relaciones.length).toEqual(2);


        const [relacionPirataMarin, relacionPirataTenryu] = modeloER.relaciones;

        expect(relacionPirataMarin.entidadOrigen()).toEqual(entidad1);
        expect(relacionPirataMarin.entidadDestino()).toEqual(entidad2);

        expect(relacionPirataTenryu.entidadOrigen()).toEqual(entidad1);
        expect(relacionPirataTenryu.entidadDestino()).toEqual(entidad3);
    });

    it("No se puede crear una relación recursiva", () => {
        modeloER = new ModeloER();

        const entidad = crearEntidadLlamada("Pirata");

        expect(() => {
            modeloER.crearRelacion(entidad, entidad);
        }).toThrow(RelaciónRecursivaError);

        expect(modeloER.relaciones.length).toEqual(0);
    });

    it("Aún no es posible crear una relación recursiva", () => {
        modeloER = new ModeloER();

        const entidad = crearEntidadLlamada("Pirata");

        expect(() => {
            modeloER.crearRelacion(entidad, entidad);
        }).toThrow(RelaciónRecursivaError);

        expect(modeloER.relaciones.length).toEqual(0);
    });


    it("Aún no es posible crear dos relaciones con las mismas entidades", () => {
        modeloER = new ModeloER();
        const entidad = crearEntidadLlamada("Pirata");
        const entidad2 = crearEntidadLlamada("Capitán");
        modeloER.crearRelacion(entidad, entidad2);

        expect(() => {
            modeloER.crearRelacion(entidad, entidad2);
        }).toThrow(RelaciónExistenteError);

        expect(modeloER.relaciones.length).toEqual(1);
    });

    it("Un modelo sabe inicializarse con las participaciones de las entidades en una relación", () => {
        const entidad = crearEntidadLlamada("Pirata");
        const entidad2 = crearEntidadLlamada("Capitán");
        const relacion = new Relacion(entidad, entidad2, "PELEA", ['0', '1'], ['1', 'N']);

        modeloER = new ModeloER([entidad, entidad2], [relacion]);

        expect(modeloER.relaciones[0]).toEqual(relacion);
    });

    it("Se puede cambiar una relación fuerte a débil", () => {
        modeloER = new ModeloER();
        const entidadFuerte = crearEntidadLlamada("Cliente");
        const entidadDebil = crearEntidadLlamada("Pedido");
        const relacion = modeloER.crearRelacion(entidadDebil, entidadFuerte, "REALIZA");

        modeloER.cambiarTipoDeRelacionA(relacion, 'débil');

        expect(relacion.esDebil()).toBeTruthy();
        expect(entidadDebil.esDebil()).toBeTruthy();
        expect(entidadFuerte.esDebil()).toBeFalsy();
    });

    it("Una entidad débil no puede tener más de una relación débil si ninguna se puede auto-invertir", () => {
        modeloER = new ModeloER();
        const entidadFuerte1 = crearEntidadLlamada("Cliente");
        const entidadFuerte2 = crearEntidadLlamada("Producto");
        const entidadDebil = crearEntidadLlamada("Pedido");
        const entidadDebil2 = crearEntidadLlamada("Item");

        const relacion1 = modeloER.crearRelacion(entidadDebil, entidadFuerte1, "REALIZA");
        modeloER.cambiarTipoDeRelacionA(relacion1, 'débil');

        const relacion3 = modeloER.crearRelacion(entidadDebil2, entidadFuerte2, "COMPONE");
        modeloER.cambiarTipoDeRelacionA(relacion3, 'débil');

        const relacion2 = modeloER.crearRelacion(entidadDebil, entidadDebil2, "CONTIENE");

        expect(() => {
            modeloER.cambiarTipoDeRelacionA(relacion2, 'débil');
        }).toThrow(EntidadDébilConMúltiplesRelacionesIdentificadorasError);

        expect(relacion2.esDebil()).toBeFalsy();
    });

    it("No se puede crear un ciclo de relaciones débiles", () => {
        modeloER = new ModeloER();
        const entidad1 = crearEntidadLlamada("A");
        const entidad2 = crearEntidadLlamada("B");
        const entidad3 = crearEntidadLlamada("C");

        const relacion1 = modeloER.crearRelacion(entidad2, entidad1, "R1");
        modeloER.cambiarTipoDeRelacionA(relacion1, 'débil');

        const relacion2 = modeloER.crearRelacion(entidad3, entidad2, "R2");
        modeloER.cambiarTipoDeRelacionA(relacion2, 'débil');

        const relacion3 = modeloER.crearRelacion(entidad1, entidad3, "R3");

        expect(() => {
            modeloER.cambiarTipoDeRelacionA(relacion3, 'débil');
        }).toThrow(CicloDeRelacionesDébilesError);

        expect(relacion3.esDebil()).toBeFalsy();
    });

    it("Al cambiar una relación débil a fuerte, la entidad débil se vuelve fuerte si no tiene otras relaciones identificadoras", () => {
        modeloER = new ModeloER();
        const entidadFuerte = crearEntidadLlamada("Cliente");
        const entidadDebil = crearEntidadLlamada("Pedido");
        const relacion = modeloER.crearRelacion(entidadDebil, entidadFuerte, "REALIZA");

        modeloER.cambiarTipoDeRelacionA(relacion, 'débil');
        modeloER.cambiarTipoDeRelacionA(relacion, 'fuerte');

        expect(relacion.esDebil()).toBeFalsy();
        expect(entidadDebil.esDebil()).toBeFalsy();
    });

    it("Si una entidad tiene múltiples relaciones débiles y se cambia una a fuerte, la entidad sigue siendo débil", () => {
        modeloER = new ModeloER();
        const fuerte = crearEntidadLlamada("Cliente");
        const debil1 = crearEntidadLlamada("Pedido");
        const debil2 = crearEntidadLlamada("Item");

        const rel1 = modeloER.crearRelacion(debil1, fuerte, "REALIZA");
        modeloER.cambiarTipoDeRelacionA(rel1, 'débil');

        const rel2 = modeloER.crearRelacion(debil2, debil1, "CONTIENE");
        modeloER.cambiarTipoDeRelacionA(rel2, 'débil');

        modeloER.cambiarTipoDeRelacionA(rel2, 'fuerte');

        expect(debil1.esDebil()).toBeTruthy();
        expect(debil2.esDebil()).toBeFalsy();
    });

    it("Si la entidad origen no puede ser débil, pero el destino sí, se invierten el origen y destino para convertir la relación en débil", () => {
        modeloER = new ModeloER();
        const cliente = crearEntidadLlamada("Cliente");
        const pedido = crearEntidadLlamada("Pedido");
        const producto = crearEntidadLlamada("Producto");

        const rel1 = modeloER.crearRelacion(pedido, cliente, "REALIZA");
        modeloER.cambiarTipoDeRelacionA(rel1, 'débil');

        const rel2 = modeloER.crearRelacion(pedido, producto, "CONTIENE");
        modeloER.cambiarTipoDeRelacionA(rel2, 'débil');

        const relacionInvertida = modeloER.relaciones.find(r => r.esDebil() && r !== rel1);

        expect(relacionInvertida!.entidadOrigen()).toBe(rel2.entidadDestino());
        expect(relacionInvertida!.entidadDestino()).toBe(rel2.entidadOrigen());
        expect(producto.esDebil()).toBeTruthy();
    });

    it("Se puede invertir manualmente una relación débil", () => {
        modeloER = new ModeloER();
        const cliente = crearEntidadLlamada("Cliente");
        const pedido = crearEntidadLlamada("Pedido");

        const relacion = modeloER.crearRelacion(pedido, cliente, "REALIZA");
        modeloER.cambiarTipoDeRelacionA(relacion, 'débil');

        const relacionInvertida = modeloER.invertirRelacionDebil(relacion);

        expect(relacionInvertida.entidadOrigen()).toBe(cliente);
        expect(relacionInvertida.entidadDestino()).toBe(pedido);
        expect(cliente.esDebil()).toBeTruthy();
        expect(pedido.esDebil()).toBeFalsy();
    });

    it("Al intentar eliminar directamente una relación débil, se levanta una excepción", () => {
        modeloER = new ModeloER();
        const entidadFuerte = crearEntidadLlamada("Cliente");
        const entidadDebil = crearEntidadLlamada("Pedido");
        const relacion = modeloER.crearRelacion(entidadDebil, entidadFuerte, "REALIZA");
        modeloER.cambiarTipoDeRelacionA(relacion, 'débil');

        expect(() => modeloER.eliminarRelación(relacion)).toThrow(EliminarRelacionIdentificadoraError);
        expect(modeloER.relaciones).toHaveLength(1);
        expect(relacion.esDebil()).toBeTruthy();
    });

    it("En el MER, se puede eliminar una relación fuerte", () => {
        modeloER = new ModeloER();
        const entidad1 = crearEntidadLlamada("Cliente");
        const entidad2 = crearEntidadLlamada("Pedido");
        const relacion = modeloER.crearRelacion(entidad1, entidad2, "REALIZA");

        modeloER.eliminarRelación(relacion);

        expect(modeloER.relaciones).toHaveLength(0);
    });

    it("Al eliminar una entidad fuerte, las entidades débiles dependientes pasa a ser fuertes al perder su dependencia", () => {
        modeloER = new ModeloER();
        const entidadFuerte = crearEntidadLlamada("PIRATA");
        const entidadDebil = crearEntidadLlamada("ISLA");
        const relacion = modeloER.crearRelacion(entidadDebil, entidadFuerte, "CONQUISTA");
        modeloER.cambiarTipoDeRelacionA(relacion, 'débil');

        modeloER.eliminarEntidad(entidadFuerte);

        expect(entidadDebil.esDebil()).toBeFalsy();
    });

    it("Al eliminar una entidad débil, la entidad fuerte asociada no se ve afectada", () => {
        modeloER = new ModeloER();
        const entidadFuerte = crearEntidadLlamada("CLIENTE");
        const entidadDebil = crearEntidadLlamada("PEDIDO");
        const relacion = modeloER.crearRelacion(entidadDebil, entidadFuerte, "REALIZA");
        modeloER.cambiarTipoDeRelacionA(relacion, 'débil');

        modeloER.eliminarEntidad(entidadDebil);

        expect(entidadFuerte.esDebil()).toBeFalsy();
        expect(modeloER.relaciones).toHaveLength(0);
    });

    function crearEntidadLlamada(nombreEntidad: string): Entidad {
        const nuevaEntidad = modeloER.generarEntidadUbicadaEn(coordenada(200, 200));
        modeloER.renombrarEntidad(nombreEntidad, nuevaEntidad!);
        return nuevaEntidad!;
    }

});
