import fs from 'node:fs';
import {execSync} from "node:child_process";


const libs: { name: string; version: string }[] = [
    "std-json-api",
    "nestjs-rest",
].map(lib => ({
    name: lib,
    version: execSync(`npm view ${lib} version`).toString().trim()
}));

for (const item of ['nestjs-rest', 'nestjs-rest-mongodb']) {
    const path = `./packages/${item}/package.json`;
    const pkg = JSON.parse(fs.readFileSync(path, "utf8"));

    for (const lib of libs) {
        if (pkg.peerDependencies && pkg.peerDependencies[lib.name] && pkg.peerDependencies[lib.name] === "*") {
            pkg.peerDependencies[lib.name] = `^${lib.version}`;
        }
    }

    fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
}