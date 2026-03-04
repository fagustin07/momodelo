import {describe, expect, it} from "vitest";
import {Almacenamiento, AlmacenamientoLocal} from "../../src/servicios/almacenamientoLocal.ts";
import {JsonModelo} from "../../src/servicios/exportador.ts";

class AlmacenamientoEnMemoria implements Almacenamiento {
    private readonly _datos = new Map<string, string>();

    getItem(clave: string): string | null {
        return this._datos.get(clave) ?? null;
    }

    setItem(clave: string, valor: string): void {
        this._datos.set(clave, valor);
    }
}

const modeloVacio = (): JsonModelo => ({
    entidades: [],
    relaciones: [],
    atributos: [],
});

const modeloConNombre = (nombre: string): JsonModelo => ({
    entidades: [{id: 1, nombre, posicion: {x: 0, y: 0}, atributos: [], esDebil: false}],
    relaciones: [],
    atributos: [],
});

function crearAlmacenamiento(): AlmacenamientoLocal {
    return new AlmacenamientoLocal(new AlmacenamientoEnMemoria());
}

describe("Almacenamiento de Modelos Entidad Relación", () => {

    it("El almacenamiento debe iniciar con un espacio de trabajo vacío", () => {
        const almacenamiento = crearAlmacenamiento();
        expect(almacenamiento.listarModelos()).toEqual([]);
        expect(almacenamiento.cantidadModelos()).toBe(0);
    });

    it("El almacenamiento permite al usuario preservar un nuevo modelo", () => {
        const almacenamiento = crearAlmacenamiento();
        const diseño = modeloConNombre("CLIENTE");
        const guardado = almacenamiento.guardarModelo("Mi Sistema", diseño);

        expect(guardado.nombre).toBe("Mi Sistema");
        expect(guardado.datos).toEqual(diseño);
        expect(guardado.id).toBeTruthy();
        expect(guardado.últimaActualización).toBeTruthy();
    });

    it("Cuando el almacenamiento guarda un modelo sin nombre entonces le asigna automáticamente un título por defecto", () => {
        const almacenamiento = crearAlmacenamiento();

        const merGuardado = almacenamiento.guardarModelo("", modeloVacio());

        expect(merGuardado.nombre).toBe("Sin nombre");
    });

    it("El almacenamiento genera identificadores para cada modelo guardado", () => {
        const almacenamiento = crearAlmacenamiento();
        const merUno = almacenamiento.guardarModelo("Ventas", modeloVacio());
        const merDos = almacenamiento.guardarModelo("Inventario", modeloVacio());

        expect(merUno.id).not.toBe(merDos.id);
    });

    it("El almacenamiento mantiene registro de los últimos cambios guardados del modelo trabajado", () => {
        const almacenamiento = crearAlmacenamiento();
        const antes = new Date().toISOString();

        const guardado = almacenamiento.guardarModelo("Logística", modeloVacio());
        const despues = new Date().toISOString();

        expect(guardado.últimaActualización >= antes).toBeTruthy();
        expect(guardado.últimaActualización <= despues).toBeTruthy();
    });

    it("El almacenamiento muestra los modelos ordenados descendentemente por fecha de actualización", () => {
        const almacenamiento = crearAlmacenamiento();
        const primerMERGuardado = "ONE PIECE";
        const segundoMERGuardado = "STAR TREK";

        almacenamiento.guardarModelo(primerMERGuardado, modeloVacio());
        almacenamiento.guardarModelo(segundoMERGuardado, modeloVacio());

        const catalogo = almacenamiento.listarModelos();
        expect(catalogo[0].nombre).toBe(segundoMERGuardado);
        expect(catalogo[1].nombre).toBe(primerMERGuardado);
    });

    it("El almacenamiento recuerda Modelos Entidad Relación", () => {
        const almacenamiento = crearAlmacenamiento();
        const diseño = modeloConNombre("PEDIDO");
        const guardado = almacenamiento.guardarModelo("Sistema de Pedidos", diseño);

        const cargado = almacenamiento.cargarModelo(guardado.id);

        expect(cargado).toEqual(diseño);
    });

    it("El almacenamiento sabe borrar modelos que ya no se desean, preservando los que sí", () => {
        const almacenamiento = crearAlmacenamiento();
        const primerMER = almacenamiento.guardarModelo("HISTORIA ARGENTINA", modeloVacio());
        const segundoMER = almacenamiento.guardarModelo("No sirve", modeloVacio());
        const tercerMER = almacenamiento.guardarModelo("CONEXIÓN DE RÍOS", modeloVacio());

        almacenamiento.eliminarModelo(segundoMER.id);

        const idsDisponibles = almacenamiento.listarModelos().map(m => m.id);
        expect(idsDisponibles).toContain(primerMER.id);
        expect(idsDisponibles).toContain(tercerMER.id);
        expect(idsDisponibles).not.toContain(segundoMER.id);
    });

    it("El almacenamiento sabe cambiar los nombres de sus Modelos Entidad Relación guardados", () => {
        const almacenamiento = crearAlmacenamiento();
        const guardado = almacenamiento.guardarModelo("Versión 1", modeloVacio());
        const nuevoNombre = "Versión Final Historia";

        almacenamiento.renombrarModelo(guardado.id, nuevoNombre);

        const modeloActualizado = almacenamiento.listarModelos().find(m => m.id === guardado.id)!;
        expect(modeloActualizado.nombre).toBe(nuevoNombre);
    });

    it("El almacenamiento conserva el nombre original del MER si es que al cambiar quedó su nombre vacío", () => {
        const almacenamiento = crearAlmacenamiento();
        const guardado = almacenamiento.guardarModelo("Nombre No Modificado", modeloVacio());

        almacenamiento.renombrarModelo(guardado.id, "   ");

        const modelo = almacenamiento.listarModelos().find(m => m.id === guardado.id);
        expect(modelo?.nombre).toBe("Nombre No Modificado");
    });
});