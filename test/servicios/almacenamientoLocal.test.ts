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

describe("Almacenamiento de trabajos", () => {

    it("El almacenamiento debe iniciar con un espacio de trabajo vacío", () => {
        const almacenamiento = crearAlmacenamiento();
        expect(almacenamiento.listarTrabajos()).toEqual([]);
        expect(almacenamiento.cantidadTrabajos()).toBe(0);
    });

    it("El almacenamiento permite al usuario preservar un nuevo trabajo", () => {
        const almacenamiento = crearAlmacenamiento();
        const diseño = modeloConNombre("CLIENTE");
        const guardado = almacenamiento.guardarTrabajo("Mi Sistema", diseño);

        expect(guardado.nombre).toBe("Mi Sistema");
        expect(guardado.datos).toEqual(diseño);
        expect(guardado.id).toBeTruthy();
        expect(guardado.últimaActualización).toBeTruthy();
    });

    it("Cuando el almacenamiento guarda un trabajo sin nombre entonces le asigna automáticamente un título por defecto", () => {
        const almacenamiento = crearAlmacenamiento();

        const guardado = almacenamiento.guardarTrabajo("", modeloVacio());

        expect(guardado.nombre).toBe("Sin nombre");
    });

    it("El almacenamiento genera identificadores para cada trabajo guardado", () => {
        const almacenamiento = crearAlmacenamiento();
        const uno = almacenamiento.guardarTrabajo("Ventas", modeloVacio());
        const dos = almacenamiento.guardarTrabajo("Inventario", modeloVacio());

        expect(uno.id).not.toBe(dos.id);
    });

    it("El almacenamiento mantiene registro de los últimos cambios guardados del trabajo", () => {
        const almacenamiento = crearAlmacenamiento();
        const antes = new Date().toISOString();

        const guardado = almacenamiento.guardarTrabajo("Logística", modeloVacio());
        const despues = new Date().toISOString();

        expect(guardado.últimaActualización >= antes).toBeTruthy();
        expect(guardado.últimaActualización <= despues).toBeTruthy();
    });

    it("El almacenamiento muestra los trabajos ordenados descendentemente por fecha de actualización", () => {
        const almacenamiento = crearAlmacenamiento();
        const primero = "ONE PIECE";
        const segundo = "STAR TREK";

        almacenamiento.guardarTrabajo(primero, modeloVacio());
        almacenamiento.guardarTrabajo(segundo, modeloVacio());

        const catalogo = almacenamiento.listarTrabajos();
        expect(catalogo[0].nombre).toBe(segundo);
        expect(catalogo[1].nombre).toBe(primero);
    });

    it("El almacenamiento recuerda trabajos guardados", () => {
        const almacenamiento = crearAlmacenamiento();
        const diseño = modeloConNombre("PEDIDO");
        const guardado = almacenamiento.guardarTrabajo("Sistema de Pedidos", diseño);

        const cargado = almacenamiento.cargarTrabajo(guardado.id);

        expect(cargado).toEqual(diseño);
    });

    it("El almacenamiento sabe borrar trabajos que ya no se desean, preservando los que sí", () => {
        const almacenamiento = crearAlmacenamiento();
        const primero = almacenamiento.guardarTrabajo("HISTORIA ARGENTINA", modeloVacio());
        const segundo = almacenamiento.guardarTrabajo("No sirve", modeloVacio());
        const tercero = almacenamiento.guardarTrabajo("CONEXIÓN DE RÍOS", modeloVacio());

        almacenamiento.eliminarTrabajo(segundo.id);

        const idsDisponibles = almacenamiento.listarTrabajos().map(m => m.id);
        expect(idsDisponibles).toContain(primero.id);
        expect(idsDisponibles).toContain(tercero.id);
        expect(idsDisponibles).not.toContain(segundo.id);
    });

    it("El almacenamiento sabe cambiar los nombres de sus trabajos guardados", () => {
        const almacenamiento = crearAlmacenamiento();
        const guardado = almacenamiento.guardarTrabajo("Versión 1", modeloVacio());
        const nuevoNombre = "Versión Final Historia";

        almacenamiento.renombrarTrabajo(guardado.id, nuevoNombre);

        const trabajoActualizado = almacenamiento.listarTrabajos().find(m => m.id === guardado.id)!;
        expect(trabajoActualizado.nombre).toBe(nuevoNombre);
    });

    it("El almacenamiento conserva el nombre original del trabajo si es que al cambiar quedó su nombre vacío", () => {
        const almacenamiento = crearAlmacenamiento();
        const guardado = almacenamiento.guardarTrabajo("Nombre No Modificado", modeloVacio());

        almacenamiento.renombrarTrabajo(guardado.id, "   ");

        const trabajo = almacenamiento.listarTrabajos().find(m => m.id === guardado.id);
        expect(trabajo?.nombre).toBe("Nombre No Modificado");
    });
});
