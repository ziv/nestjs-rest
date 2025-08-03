import {describe, it} from 'node:test';
import queryStringParser from "std-json-api/query-string-parser";
import expect from "expect";

describe('parse-query-string without JSON API items', () => {
    const parsed = queryStringParser('a=1&b=2');

    it('should have the "a" property', () => {
        expect(parsed.a).toBe('1');
    });

    it('should have the "b" property', () => {
        expect(parsed.b).toBe('2');
    });

    it('should have empty sorting', () => {
        expect(parsed.sort).toEqual({});
    });

    it('should have empty filter', () => {
        expect(parsed.filter).toEqual({});
    });

    it('should have empty include', () => {
        expect(parsed.include).toEqual([]);
    });

    it('should have empty pagination', () => {
        expect(parsed.page).toEqual({offset: 0, limit: 20});
    });
});

describe('parse-query-string with JSON API items', () => {
    const parsed = queryStringParser('page[offset]=20&a=1&page[limit]=30&b=2&sort=f1,-f2,f3&filter[f2]=2&include=f1,f2.f3');

    it('should have the "a" property', () => {
        expect(parsed.a).toBe('1');
    });

    it('should have the "b" property', () => {
        expect(parsed.b).toBe('2');
    });

    it('should have empty sorting', () => {
        expect(parsed.sort).toEqual({
            f1: 1,
            f2: -1,
            f3: 1
        });
    });

    it('should have empty filter', () => {
        expect(parsed.filter).toEqual({
            f2: '2'
        });
    });

    it('should have empty include', () => {
        expect(parsed.include).toEqual([
            'f1',
            'f2.f3'
        ]);
    });

    it('should have empty pagination', () => {
        expect(parsed.page).toEqual({offset: 20, limit: 30});
    });
});