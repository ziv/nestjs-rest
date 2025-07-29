import {Controller, Get, Inject, Logger, Module} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";
import MongodbAdapter from "nestjs-rest-mongodb";
import {MongoClient} from "mongodb";
import JsonApiController, {JsonApiControllerOptions,} from "nestjs-rest/controller";

@Controller("flags")
export class Ctr extends JsonApiController {
    constructor(@Inject("JSON_API_FLAGS") options: JsonApiControllerOptions) {
        super(options);
    }

    @Get("favicon.ico")
    favicon() {
        // Handle favicon requests
        return {message: "Favicon request received"};
    }
}

@Module({
    controllers: [Ctr],
    providers: [
        {
            provide: "JSON_API_FLAGS",
            useFactory: async () => {
                const client = new MongoClient("mongodb://localhost:27017");
                await client.connect();
                const collection = client.db("flags").collection("flags");
                const adapter = new MongodbAdapter({
                    collection,
                    id: "flags",
                    // baseUrl: "http://localhost:3001",
                    // projectItems: {
                    //   key: 1,
                    //   name: 1,
                    // },
                    // updateSchema: z.any(),
                    // creationSchema: z.any(),
                    // projectItem: {
                    //   key: 1,
                    //   name: 1,
                    //   description: 1,
                    //   createdAt: 1,
                    //   updatedAt: 1,
                    //   temporary: 1,
                    //   archived: 1,
                    //   appearances: 1,
                    //   status: 1,
                    //   statusLog: 1,
                    //   statusType: 1,
                    //   statusReason: 1,
                    //   on: 1,
                    // },
                });
                return {
                    adapter,
                    baseUrl: "http://localhost:3001",
                    resourceId: "flags",
                };
            },
        },
    ],
})
export class App {
}

(async () => {
    const app = await NestFactory.create(App);

    await app.listen(3001);
    Logger.log("Server is running on http://localhost:3001", "Bootstrap");
})();
