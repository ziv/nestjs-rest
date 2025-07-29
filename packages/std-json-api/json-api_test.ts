import {describe, it} from 'node:test';
import {strict} from 'node:assert';
import {JsonApiBuilder} from "std-json-api/json-api";

const self = 'https://example.com/api/test/123';

describe('JSON API, class builder, resource', () => {

    const resource = JsonApiBuilder.resource('test-id', 'test-type')
        .links({
            self
        })
        .attributes({
            foo: 'bar'
        }).build();

    it('should have self link', () => {
        strict.equal(resource.links?.self, self);
    });

    it('should have property foo with value bar on attributes', () => {
        strict.equal(resource.attributes?.foo, 'bar');
    });

    it('should have type test-type', () => {
        strict.equal(resource.type, 'test-type');
    });

    it('should have id test-id', () => {
        strict.equal(resource.id, 'test-id');
    });
});