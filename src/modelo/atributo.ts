export class Atributo {
    private _nombre: string;

    constructor(nombre: string = 'ATRIBUTO') {
        this._nombre = nombre;
    }

    nombre() {
        return this._nombre;
    }
}