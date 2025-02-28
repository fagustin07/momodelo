export class Atributo {
    private _nombre: string;

    constructor(nombre: string = 'ATRIBUTO') {
        this._nombre = nombre;
    }

    cambiarNombre(nuevoNombre: string) {
        return new Atributo(nuevoNombre);
    }

    nombre() {
        return this._nombre;
    }
}