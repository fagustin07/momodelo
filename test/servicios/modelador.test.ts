import {describe, expect, it} from "vitest";
import {Entidad} from "../../src/modelo/entidad.ts";
import {coordenada} from "../../src/posicion.ts";
import {Modelador} from "../../src/servicios/modelador.ts";
import {
    CicloDeRelacionesDébilesError,
    EntidadDébilConMúltiplesRelacionesIdentificadorasError,
    RelaciónExistenteError,
    RelaciónRecursivaError
} from "../../src/servicios/errores.ts";
import {Relacion} from "../../src/modelo/relacion.ts";

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

    it("Un modelo sabe inicializarse con las participaciones de las entidades en una relación", () => {
        const entidad = crearEntidadLlamada("Pirata");
        const entidad2 = crearEntidadLlamada("Capitán");
        const relacion = new Relacion(entidad, entidad2, "PELEA", ['0', '1'], ['1', 'N']);

        modelador = new Modelador([entidad, entidad2], [relacion]);

        expect(modelador.relaciones[0]).toEqual(relacion);
    });

    it("Se puede cambiar una relación fuerte a débil", () => {
        modelador = new Modelador();
        const entidadFuerte = crearEntidadLlamada("Cliente");
        const entidadDebil = crearEntidadLlamada("Pedido");
        const relacion = modelador.crearRelacion(entidadDebil, entidadFuerte, "REALIZA");

        modelador.cambiarTipoDeRelacionA(relacion, 'débil');

        expect(relacion.esDebil()).toBeTruthy();
        expect(entidadDebil.esDebil()).toBeTruthy();
        expect(entidadFuerte.esDebil()).toBeFalsy();
    });

    it("Una entidad débil no puede tener más de una relación débil si ninguna se puede auto-invertir", () => {
        modelador = new Modelador();
        const entidadFuerte1 = crearEntidadLlamada("Cliente");
        const entidadFuerte2 = crearEntidadLlamada("Producto");
        const entidadDebil = crearEntidadLlamada("Pedido");
        const entidadDebil2 = crearEntidadLlamada("Item");
        
        const relacion1 = modelador.crearRelacion(entidadDebil, entidadFuerte1, "REALIZA");
        modelador.cambiarTipoDeRelacionA(relacion1, 'débil');
        
        const relacion3 = modelador.crearRelacion(entidadDebil2, entidadFuerte2, "COMPONE");
        modelador.cambiarTipoDeRelacionA(relacion3, 'débil');
        
        const relacion2 = modelador.crearRelacion(entidadDebil, entidadDebil2, "CONTIENE");

        expect(() => {
            modelador.cambiarTipoDeRelacionA(relacion2, 'débil');
        }).toThrow(EntidadDébilConMúltiplesRelacionesIdentificadorasError);

        expect(relacion2.esDebil()).toBeFalsy();
    });

    it("No se puede crear un ciclo de relaciones débiles", () => {
        modelador = new Modelador();
        const entidad1 = crearEntidadLlamada("A");
        const entidad2 = crearEntidadLlamada("B");
        const entidad3 = crearEntidadLlamada("C");
        
        const relacion1 = modelador.crearRelacion(entidad2, entidad1, "R1");
        modelador.cambiarTipoDeRelacionA(relacion1, 'débil');
        
        const relacion2 = modelador.crearRelacion(entidad3, entidad2, "R2");
        modelador.cambiarTipoDeRelacionA(relacion2, 'débil');
        
        const relacion3 = modelador.crearRelacion(entidad1, entidad3, "R3");

        expect(() => {
            modelador.cambiarTipoDeRelacionA(relacion3, 'débil');
        }).toThrow(CicloDeRelacionesDébilesError);

        expect(relacion3.esDebil()).toBeFalsy();
    });

    it("Al cambiar una relación débil a fuerte, la entidad débil se vuelve fuerte si no tiene otras relaciones identificadoras", () => {
        modelador = new Modelador();
        const entidadFuerte = crearEntidadLlamada("Cliente");
        const entidadDebil = crearEntidadLlamada("Pedido");
        const relacion = modelador.crearRelacion(entidadDebil, entidadFuerte, "REALIZA");
        
        modelador.cambiarTipoDeRelacionA(relacion, 'débil');
        modelador.cambiarTipoDeRelacionA(relacion, 'fuerte');

        expect(relacion.esDebil()).toBeFalsy();
        expect(entidadDebil.esDebil()).toBeFalsy();
    });

    it("Si una entidad tiene múltiples relaciones débiles y se cambia una a fuerte, la entidad sigue siendo débil", () => {
        modelador = new Modelador();
        const fuerte = crearEntidadLlamada("Cliente");
        const debil1 = crearEntidadLlamada("Pedido");
        const debil2 = crearEntidadLlamada("Item");
        
        const rel1 = modelador.crearRelacion(debil1, fuerte, "REALIZA");
        modelador.cambiarTipoDeRelacionA(rel1, 'débil');
        
        const rel2 = modelador.crearRelacion(debil2, debil1, "CONTIENE");
        modelador.cambiarTipoDeRelacionA(rel2, 'débil');
        
        modelador.cambiarTipoDeRelacionA(rel2, 'fuerte');

        expect(debil1.esDebil()).toBeTruthy();
        expect(debil2.esDebil()).toBeFalsy();
    });

    it("Si la entidad origen no puede ser débil, pero el destino sí, se invierten el origen y destino para convertir la relación en débil", () => {
        modelador = new Modelador();
        const cliente = crearEntidadLlamada("Cliente");
        const pedido = crearEntidadLlamada("Pedido");
        const producto = crearEntidadLlamada("Producto");
        
        const rel1 = modelador.crearRelacion(pedido, cliente, "REALIZA");
        modelador.cambiarTipoDeRelacionA(rel1, 'débil');
        
        const rel2 = modelador.crearRelacion(pedido, producto, "CONTIENE");
        modelador.cambiarTipoDeRelacionA(rel2, 'débil');
        
        const relacionInvertida = modelador.relaciones.find(r => r.esDebil() && r !== rel1);

        expect(relacionInvertida!.entidadOrigen()).toBe(rel2.entidadDestino());
        expect(relacionInvertida!.entidadDestino()).toBe(rel2.entidadOrigen());
        expect(producto.esDebil()).toBeTruthy();
    });

    it("Se puede invertir manualmente una relación débil", () => {
        modelador = new Modelador();
        const cliente = crearEntidadLlamada("Cliente");
        const pedido = crearEntidadLlamada("Pedido");
        
        const relacion = modelador.crearRelacion(pedido, cliente, "REALIZA");
        modelador.cambiarTipoDeRelacionA(relacion, 'débil');
        
        const relacionInvertida = modelador.invertirRelacionDebil(relacion);

        expect(relacionInvertida.entidadOrigen()).toBe(cliente);
        expect(relacionInvertida.entidadDestino()).toBe(pedido);
        expect(cliente.esDebil()).toBeTruthy();
        expect(pedido.esDebil()).toBeFalsy();
    });

    function crearEntidadLlamada(nombreEntidad: string): Entidad {
        const nuevaEntidad = modelador.generarEntidadUbicadaEn(coordenada(200, 200));
        modelador.renombrarEntidad(nombreEntidad, nuevaEntidad!);
        return nuevaEntidad!;
    }

});
