import {describe, it} from 'node:test';
import JsonApiBuilder from "std-json-api/builder";
import expect from "expect";

describe('builder', () => {
    it('should create resource', () => {
        const res = JsonApiBuilder
            .resource('test-id', 'test-type')
            .attributes({foo: 'bar'})
            .metadata({foo: 'bar'})
            .links({self: 'https://example.com/self'})
            .build();

        expect(res).toHaveProperty('attributes', {foo: 'bar'});
        expect(res).toHaveProperty('meta', {foo: 'bar'});
        expect(res).toHaveProperty('id', 'test-id');
        expect(res).toHaveProperty('type', 'test-type');
        expect(res).toHaveProperty('links', {self: 'https://example.com/self'});
    });

    it('should create empty resource', () => {
        const res = JsonApiBuilder
            .resource('test-id', 'test-type')
            .as();

        expect(res).toHaveProperty('id', 'test-id');
        expect(res).toHaveProperty('type', 'test-type');
    });
});

describe('single document builder', () => {
    it('should create a single document with data', () => {
        const doc = JsonApiBuilder
            .singleDocument()
            .data({
                id: 'test-id',
                type: 'test-type',
                attributes: {foo: 'bar'},
                links: {self: 'https://example.com/self'}
            })
            .metadata({foo: 'bar'})
            .links({self: 'https://example.com/self'})
            .build();

        expect(doc).toHaveProperty('data.id', 'test-id');
        expect(doc).toHaveProperty('data.type', 'test-type');
        expect(doc).toHaveProperty('data.attributes', {foo: 'bar'});
        expect(doc).toHaveProperty('data.links', {self: 'https://example.com/self'});
        expect(doc).toHaveProperty('meta', {foo: 'bar'});
        expect(doc).toHaveProperty('links', {self: 'https://example.com/self'});
    });
});

describe('multiple document builder', () => {
    it('should create a collection document with data', () => {
        const col = JsonApiBuilder
            .collectionDocument()
            .data([
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
            ])
            .metadata({foo: 'bar'})
            .links({self: 'https://example.com/self'})
            .build();
        expect(col).toHaveProperty('data.length', 2);
        expect(col.data[0]).toHaveProperty('id', 'test-id-1');
        expect(col.data[0]).toHaveProperty('type', 'test-type');
        expect(col.data[0]).toHaveProperty('attributes', {foo: 'bar1'});
        expect(col.data[0]).toHaveProperty('links', {self: 'https://example.com/self1'});
        expect(col.data[1]).toHaveProperty('id', 'test-id-2');
        expect(col.data[1]).toHaveProperty('type', 'test-type');
        expect(col.data[1]).toHaveProperty('attributes', {foo: 'bar2'});
        expect(col.data[1]).toHaveProperty('links', {self: 'https://example.com/self2'});
        expect(col).toHaveProperty('meta', {foo: 'bar'});
        expect(col).toHaveProperty('links', {self: 'https://example.com/self'});
    });
});