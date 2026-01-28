# nestjs-rest

A [`JSON:API`](https://jsonapi.org/) compliant REST controller for
[`NestJS`](https://nestjs.com/).

[![nestjs-rest release](https://github.com/ziv/nestjs-rest/actions/workflows/ci.yml/badge.svg)](https://github.com/ziv/nestjs-rest/actions/workflows/ci.yml)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

# Overview

This project bring the `JSON:API` specification to the `NestJS` framework,
providing zero code REST controller that supports CRUD operations,
sorting, pagination, filtering, and more using simple configurations.

## Contents

| Package Name                                            | Version                                                          | Description                                                                                |
|---------------------------------------------------------|------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| [`std-json-api`](./packages/std-json-api)               | ![NPM Version](https://img.shields.io/npm/v/std-json-api)        | Standard `JSON:API` implementation, providing the core functionality of document structure |
| [`nestjs-rest`](./packages/nestjs-rest)                 | ![NPM Version](https://img.shields.io/npm/v/nestjs-rest)         | NestJS controller that implements the `JSON:API`                                           |                     
| [`nestjs-rest-mongodb`](./packages/nestjs-rest-mongodb) | ![NPM Version](https://img.shields.io/npm/v/nestjs-rest-mongodb) | MongoDB adapter for `nestjs-rest`                                                          |                     

## Specification

`JSON:API/v1` specification is a standard for building APIs in JSON
format([reference](./packages/std-json-api/specs.md)).

### Implementation Report

| Spec                | Subject    | Status | Reference                                       |
|---------------------|------------|--------|-------------------------------------------------|
| content-negotiation |            | 🚧     | https://jsonapi.org/format/#content-negotiation |
| document structure  |            | ✈️     | https://jsonapi.org/format/#document-structure  |
| fetching data       |            | ✈️     | https://jsonapi.org/format/#fetching            |
|                     | sorting    | ✈️     | https://jsonapi.org/format/#fetching-sorting    |
|                     | pagination | ✈️     | https://jsonapi.org/format/#fetching-pagination |
|                     | filtering  | ✈️     | https://jsonapi.org/format/#fetching-filtering  |
| crud                |            | ✈️     | https://jsonapi.org/format/#crud                |
| query parameters    |            | ✈️     | https://jsonapi.org/format/#query-parameters    |
| errors              |            | 🚧     | https://jsonapi.org/format/#errors              |
| extensions          |            | 🚧     | https://jsonapi.org/extensions/                 |

### Pagination Strategies

There are two pagination strategies supported by this project:

| Pagination Strategy     | Status | Description                                                                                          |
|-------------------------|--------|------------------------------------------------------------------------------------------------------|
| Offset-based pagination | ✈️     | Default pagination strategy using offset and limit query parameters.                                 |
| Cursor-based pagination | ✈️     | Pagination strategy using cursor to provide a more efficient way to paginate through large datasets. |

### Adapters Implementation Report

| Adapter | Status | Description                                                    | Readme                                             |
|---------|--------|----------------------------------------------------------------|----------------------------------------------------|
| Mongodb | ✈️     | Simple (without relationships) adapter for Mongodb collection. | [readme](./packages/nestjs-rest-mongodb/readme.md) |

---

#### Legend

    ✅ done ✈️ departed (ready for testing) 🚧 in progress 🚫 not started 🫥 not planned

---

# TODO

- [x] Add a MongoDB adapter.
- [x] Convert to be JSON:API compliant.
- [ ] Add a client library.
- [ ] Add any SQL DB adapter.
- [ ] Add Typeorm support.
