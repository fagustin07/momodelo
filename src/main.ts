import "./style.css";
import {Entidad} from "./modelo/entidad.ts";
import {Atributo} from "./modelo/atributo.ts";
import {coordenada} from "./posicion.ts";
import {init} from "./vista.ts";
import {Relacion} from "./modelo/relacion.ts";
import {createElement} from "./vista/dom/createElement.ts";

const cliente = new Entidad("CLIENTE", [
    new Atributo("nombre", coordenada(-45, 70)),
    new Atributo("dni", coordenada(70, 120), 'pk'),
], coordenada(110.18182373046875, 116));

const pedido = new Entidad("PEDIDO", [
    new Atributo("fecha", coordenada(156.18182373046875, -80.36363220214844), 'pk'),
    new Atributo("monto", coordenada(166.727294921875, 28.18182373046875)),
], coordenada(569.6363525390625, 165.45452880859375));

const producto = new Entidad("PRODUCTO", [
    new Atributo("codigo", coordenada(-150, -50), 'pk'),
    new Atributo("descripcion", coordenada(-150, 20)),
], coordenada(222, 396.3636474609375));
producto.marcarComoDebil();

const alimento = new Entidad("ALIMENTO", [
    new Atributo("nombre", coordenada(-45, 70), 'pk'),
    new Atributo("tipo", coordenada(70, 120)),
], coordenada(710.1818237304688, 394.4544982910156));

const entidades = [cliente, pedido, producto, alimento];

const relaciones = [
    new Relacion(cliente, pedido, "REALIZA", ['1', 'N'], ['0', '1'], coordenada(300, 200)),
    new Relacion(producto, pedido, "CONTIENE", ['1', 'N'], ['0', 'N'], coordenada(400, 300)),
    new Relacion(producto, alimento, "ASOCIADO_A", ['1', '1'], ['0', 'N'], coordenada(500, 400), 'débil'),
];

const textoMR = `ALIMENTO < nombre(PK), tipo >

PEDIDO < fecha(PK), monto >

PRODUCTO < codigo(PK), descripcion, nombre(PK,FK) >

CLIENTE < nombre, dni(PK) >

REALIZA < fecha(PK,FK), dni(FK) >

CONTIENE < codigo(PK,FK), nombre_producto(PK,FK), fecha_pedido(PK,FK) >

INSERTAR EN alimento {
    <'Comida', 'general'>,
    <'Bebida', 'general'>
}

INSERTAR EN pedido {
    <'2024-01-01', 100.5>,
    <'2024-02-01', 250>
}

INSERTAR EN cliente {
    <'Ana', 12345678>,
    <'Luis', 87654321>
}

INSERTAR EN producto {
    <1, 'Pizza', 'Comida'>,
    <2, 'Gaseosa', 'Bebida'>
}

INSERTAR EN realiza {
    <'2024-01-01', 12345678>,
    <'2024-02-01', 87654321>
}

INSERTAR EN contiene {
    <1, 'Comida', '2024-01-01'>,
    <2, 'Bebida', '2024-02-01'>
}`;

const textoAR = `CLIENTE`;

const elementoRaíz = createElement("main");
document.body.append(elementoRaíz);

init(elementoRaíz, entidades, relaciones, textoMR, textoAR);
