export type Type = 'string' | 'number' | 'date' | 'object' | 'array' | 'unknown' //  typeof String | typeof Number | typeof Boolean | typeof Date | typeof Array | typeof Object | typeof Function | typeof Symbol | string;
export type Attributes = Record<string, Type>;
export type Relationships = Record<string, { resource: string; idKey: string }>;

export type ResourceDescriptor = {
    resourceId: string;
    baseUrl: string;
    idKey: string; // the primary key for the resource
    attributes: Attributes;
    relationships: Relationships;
}

export class JsonApiDescriptor {
    desc = {
        attributes: {},
        relationships: {},
    } as Partial<ResourceDescriptor> & Pick<ResourceDescriptor, 'attributes' | 'relationships'>;

    constructor(resourceId: string) {
        this.desc.resourceId = resourceId;
    }

    setBaseUrl(url: string) {
        if (this.desc.baseUrl) {
            throw new Error(`Base URL is already set to ${this.desc.baseUrl}.`);
        }
        this.desc.baseUrl = url;
        return this;
    }

    setIdKey(name: string) {
        if (this.desc.idKey) {
            throw new Error(`ID key is already set to ${this.desc.idKey}.`);
        }
        this.desc.idKey = name;
        return this;
    }

    addAttr(name: string, type: Type = 'string') {
        if (name in this.desc.attributes) {
            throw new Error(`Attribute ${name} already exists.`);
        }
        this.desc.attributes[name] = type;
        return this;
    }

    addAttrs(attrs: Attributes) {
        for (const [name, type] of Object.entries(attrs)) {
            this.addAttr(name, type);
        }
        return this;
    }

    addRelationship(name: string, resource: string, idKey: string) {
        if (name in this.desc.relationships) {
            throw new Error(`Relationship ${name} already exists.`);
        }
        this.desc.relationships[name] = {resource, idKey};
        return this;
    }

    build() {
        if (!this.desc.idKey) {
            throw new Error("ID key is not set.");
        }
        if (!this.desc.baseUrl) {
            throw new Error("Base URL is not set.");
        }
        return this.desc as ResourceDescriptor;
    }
}

export default function Describe(resourceId: string) {
    return new JsonApiDescriptor(resourceId);
}
