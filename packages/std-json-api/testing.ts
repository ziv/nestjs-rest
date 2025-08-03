import {describe, it} from "node:test";
import expect from "expect";

export type SchemaTest = {
    name: string;
    url: string;
    invalidSchema: [unknown, string?][];
    validSchema: [unknown, string?][];
    testFunction: (data: any) => void;
};

export function SpecTest(st: SchemaTest) {
    let c = 0;
    describe(`${st.name}\n  ${st.url}`, () => {
        for (const [data, message] of st.validSchema) {
            it(`should pass, ${message} (${--c})`, () => {
                expect(() => st.testFunction(data)).not.toThrow();
            });
        }
        for (const [data, message] of st.invalidSchema) {
            it(`should throw, ${message} (${--c})`, () => {
                expect(() => st.testFunction(data)).toThrow();
            });
        }
    });
}