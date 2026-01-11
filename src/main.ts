import "./style.css";
import {Entidad} from "./modelo/entidad.ts";
import {Atributo} from "./modelo/atributo.ts";
import {coordenada} from "./posicion.ts";
import {init} from "./vista.ts";
import {Relacion} from "./modelo/relacion.ts";
import {createElement} from "./vista/dom/createElement.ts";

const entidades: Entidad[] = [
    new Entidad("CLIENTE", [
        new Atributo("nombre", coordenada(-45, 70)),
        new Atributo("dni", coordenada(115, 70))
    ], coordenada(100, 100)),

    new Entidad("PEDIDO", [
        new Atributo("fecha", coordenada(210, -60)),
        new Atributo("monto", coordenada(230, 10))
    ], coordenada(600, 100)),

    new Entidad("PRODUCTO", [
        new Atributo("codigo", coordenada(-150, -50)),
        new Atributo("descripcion", coordenada(-150, 20))
    ], coordenada(600, 400))
];
const coord = coordenada(50,60);

const relaciones: Relacion[] = [
    new Relacion(entidades[0], entidades[1], "REALIZA", ['1', '1'], ['0', 'N'], coord),
    new Relacion(entidades[1], entidades[2], "CONTIENE", ['0', '1'], ['1', 'N'], coord),
]

const elementoRaíz = createElement("main");
document.body.append(elementoRaíz);

init(elementoRaíz, entidades, relaciones);
