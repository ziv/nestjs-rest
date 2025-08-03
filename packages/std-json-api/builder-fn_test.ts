import {describe, it} from 'node:test';
import expect from "expect";
import {
    Attributes,
    CollectionDocument,
    Data,
    Id,
    Links,
    Meta,
    Resource,
    Resources,
    SingleDocument,
    Type
} from "./builder-fn";

describe('functional builder', () => {
    for (const f of [Data, Meta, Links, Type, Attributes, Id]) {
        it(`${f.name} should be a function`, () => {
            expect(f).toBeInstanceOf(Function);
        });
    }

    it('should create metadata', () => {
        expect(Meta({test: 'value'})({})).toEqual({
            meta: {test: 'value'}
        });
    });

    it('should create links', () => {
        expect(Links({self: 'https://example.com/self'})({})).toEqual({
            links: {self: 'https://example.com/self'}
        });
    });

    it('should create type', () => {
        expect(Type('test-type')({})).toEqual({
            type: 'test-type'
        });
    });

    it('should create attributes', () => {
        expect(Attributes({id: 'test-id'})({})).toEqual({
            attributes: {id: 'test-id'}
        });
    });

    it('should create id', () => {
        expect(Id('test-id')({})).toEqual({
            id: 'test-id'
        });
    });
});

describe('documents', () => {
    it('should create a resource', () => {
        const res = Resource(
            Id('test-id'),
            Type('test-type'),
            Attributes({foo: 'bar'}),
        );
        expect(res).toEqual({
            id: 'test-id',
            type: 'test-type',
            attributes: {foo: 'bar'}
        });
    });

    it('should create a single document', () => {
        const doc = SingleDocument(
            Data(
                Resource(
                    Id('test-id'),
                    Type('test-type'),
                    Attributes({foo: 'bar'}),
                    Links({self: 'https://example.com/self'})
                )
            ),
            Meta({foo: 'bar'}),
            Links({self: 'https://example.com/self'})
        );
        expect(doc).toEqual({
            data: {
                id: 'test-id',
                type: 'test-type',
                attributes: {foo: 'bar'},
                links: {self: 'https://example.com/self'}
            },
            meta: {foo: 'bar'},
            links: {self: 'https://example.com/self'},
            jsonapi: {version: "1.0"}
        });
    });

    it('should create a collection document', () => {
        const col = CollectionDocument(
            Data([
                    Resources(
                        Id('test-id-1'),
                        Type('test-type'),
                        Attributes({foo: 'bar1'}),
                        Links({self: 'https://example.com/self1'})
                    ),
                    Resources(
                        Id('test-id-2'),
                        Type('test-type'),
                        Attributes({foo: 'bar2'}),
                        Links({self: 'https://example.com/self2'})
                    ),
                ]
            ),
            Meta({count: 2}),
            Links({self: 'https://example.com/self'})
        );
        expect(col).toEqual({
            data: [
                {
                    id: 'test-id-1',
                    type: 'test-type',
                    attributes: {foo: 'bar1'},
                    links: {self: 'https://example.com/self1'}
                },
                {
                    id: 'test-id-2',
                    type: 'test-type',
                    attributes: {foo: 'bar2'},
                    links: {self: 'https://example.com/self2'}
                }
            ],
            meta: {count: 2},
            links: {self: 'https://example.com/self'},
            jsonapi: {version: "1.0"}
        })
    });
});