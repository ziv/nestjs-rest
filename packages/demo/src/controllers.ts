import {Controller, Get, Inject, Res} from "@nestjs/common";
import JsonApiController, {
    JsonApiControllerOptions,
} from "nestjs-rest/controller";
import {Response} from "express";

@Controller("authors")
export class Authors extends JsonApiController {
    constructor(@Inject("Authors") options: JsonApiControllerOptions) {
        super(options);
    }
}

@Controller("comments")
export class Comments extends JsonApiController {
    constructor(@Inject("Comments") options: JsonApiControllerOptions) {
        super(options);
    }
}

@Controller("articles")
export class Articles extends JsonApiController {
    constructor(@Inject("Articles") options: JsonApiControllerOptions) {
        super(options);
    }
}

@Controller("")
export class Root {
    @Get("version")
    version() {
        return {version: "1.0.0"};
    }

    @Get("favicon.ico")
    favicon() {
        return {message: "Favicon request received"};
    }
}
