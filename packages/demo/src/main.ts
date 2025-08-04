import {Logger, Module} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";
import {Root} from "./controllers";
import {Describe} from 'std-json-api/desciptor';
import MongodbAdapter from "nestjs-rest-mongodb";
import {MongoClient} from "mongodb";

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
    // providers: [
    //     {
    //         provide: MongoClient,
    //         useFactory: async (): Promise<MongoClient> => {
    //             const client = new MongoClient("mongodb://mongodb:27017");
    //             await client.connect();
    //             return client;
    //         },
    //     },
    //     {
    //         provide: "Comments",
    //         inject: [MongoClient],
    //         useFactory: (client: MongoClient) => createAdapter(client, "comments"),
    //     },
    //     {
    //         provide: "Articles",
    //         inject: [MongoClient],
    //         useFactory: (client: MongoClient) => createAdapter(client, "articles"),
    //     },
    //     {
    //         provide: "Authors",
    //         inject: [MongoClient],
    //         useFactory: (client: MongoClient) => createAdapter(client, "authors"),
    //     },
    // ],
    // controllers: [Root, Comments, Articles, Authors],
    controllers: [Root],
})
export class App {
}

(async () => {
    const app = await NestFactory.create(App);

    await app.listen(3001, "0.0.0.0");
    Logger.log("Server is running on http://localhost:3001", "Bootstrap");
})();
