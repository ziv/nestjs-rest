import { Controller, Get, Logger, Module, Req } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  RestAdapterFilter,
  RestAdapterPagination,
  RestAdapterSorting,
} from "std-json-api/json-api-query";
import JsonApiAdapter from "std-json-api/json-api-adapter";
import JsonApiCrudAdapter from "std-json-api/crud-adapter";

class Adapter implements JsonApiCrudAdapter {
  resource() {
    return "foo";
  }

  async multiple<R = any>(
    filter: RestAdapterFilter,
    sorting: RestAdapterSorting[],
    pagination: RestAdapterPagination,
  ): Promise<{ data: R[]; total: number }> {
    return {
      data: new Array<any>(20).fill(0).map((_, i) => ({
        id: i,
        foo: "bar",
      })) as R[],
      total: 200,
    };
  }
}

@Controller("")
export class Ctr {
  a = new JsonApiAdapter(new Adapter(), {
    baseUrl: "http://localhost:3001",
  });

  @Get("*")
  def(@Req() req: Request) {
    const search = new URL(req.url, `http://localhost:3000/`).search;
    return this.a.multiple(search);
  }
}

@Module({
  controllers: [Ctr],
})
export class App {
}

(async () => {
  const app = await NestFactory.create(App);

  await app.listen(3001);
  Logger.log("Server is running on http://localhost:3001", "Bootstrap");
})();
