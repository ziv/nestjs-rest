import {describe, it} from 'node:test';
import expect from "expect";
import { Describe } from "./descriptor";

describe('descriptor', () => {
    it('should throw for missing ID key', () => {
        const d = Describe('test').setBaseUrl('http://localhost');
        expect(() => d.build()).toThrow();
    });

    it('should throw for missing base url', () => {
        const d = Describe('test').setIdKey('test');
        expect(() => d.build()).toThrow();
    });

    it('should create a valid descriptor', () => {
        expect(
            Describe('test')
                .setBaseUrl('http://localhost')
                .setIdKey('test')
                .addAttr('id', 'number')
                .addAttrs({
                    name: 'string',
                    age: 'number'
                })
                .build()
        ).toEqual({
            resourceId: 'test',
            baseUrl: 'http://localhost',
            idKey: 'test',
            relationships: {},
            attributes: {
                id: 'number',
                name: 'string',
                age: 'number'
            }
        });
    });
});