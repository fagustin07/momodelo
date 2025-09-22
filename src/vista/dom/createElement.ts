export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K, properties: Partial<Omit<HTMLElementTagNameMap[K], "style"> & { style: Partial<CSSStyleDeclaration> }> = {}, children: (Node | string)[] = [],
) {
    const newElement = document.createElement(tagName);
    const { style, ...propertiesWithoutStyle } = properties;
    Object.assign(newElement, propertiesWithoutStyle);
    if (style) Object.assign(newElement.style, style);
    newElement.append(...children);
    return newElement;
}

type SVGAttributesMap = {
    "path": {
        d: string,
        stroke: string,
        fill: string,
        pathLength: number,
    },
    "svg": {
        width: number,
        height: number,
    },
    "g": {
        class: string,
        transform: string,
    },
    "rect": {
        x: number,
        y: number,
        width: number,
        height: number,
        stroke: string,
        fill: string,
        transform: string
    },
    "text": {
        x: number,
        y: number,
    },
    "foreignObject": {
        width: number,
        height: number,
        x: number,
        y: number,
    },
    "line": {
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        stroke: string,
        'stroke-width': number,
        'pointer-events': string
    },
    "polygon": {
        fill: string,
        stroke: string,
        'stroke-width': number,
        'pointer-events': string
    }
};

type SVGAttributes<K extends keyof SVGElementTagNameMap> = K extends keyof SVGAttributesMap ? SVGAttributesMap[K] : `UNKNOWN TAG: ${K}`;

export function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tagName: K, attributes: Partial<SVGAttributes<K>> = {}, children: (Node | string)[] = [],
) {
    const newElement = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    for (const [attributeName, attributeValue] of Object.entries(attributes)) {
        newElement.setAttribute(attributeName, String(attributeValue));
    }
    newElement.append(...children);
    return newElement;
}
