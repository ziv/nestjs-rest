import {Logger, Module} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";
import MongodbAdapter from "nestjs-rest-mongodb";
import {MongoClient} from "mongodb";
import {Articles, Authors, Comments, Root} from "./controllers";
import Describe from "std-json-api/desciptor";

function createAdapter(client: MongoClient, id: string) {
    const descriptor = Describe(id)
        .setBaseUrl("http://localhost:3001")
        .setIdKey('_id')
        .build();
    return {
        adapter: new MongodbAdapter({
            descriptor,
            collection: client.db("demo").collection(id),
            relatedCollections: {}
        }),
    };
}

@Module({
    providers: [
        {
            provide: MongoClient,
            useFactory: async (): Promise<MongoClient> => {
                const client = new MongoClient("mongodb://mongodb:27017");
                await client.connect();
                return client;
            },
        },
        {
            provide: "Comments",
            inject: [MongoClient],
            useFactory: (client: MongoClient) => createAdapter(client, "comments"),
        },
        {
            provide: "Articles",
            inject: [MongoClient],
            useFactory: (client: MongoClient) => createAdapter(client, "articles"),
        },
        {
            provide: "Authors",
            inject: [MongoClient],
            useFactory: (client: MongoClient) => createAdapter(client, "authors"),
        },
    ],
    controllers: [Root, Comments, Articles, Authors],
})
export class App {
}

(async () => {
    const app = await NestFactory.create(App);

    await app.listen(3001, "0.0.0.0");
    Logger.log("Server is running on http://localhost:3001", "Bootstrap");
})();
