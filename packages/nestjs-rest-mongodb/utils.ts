import { attributes, identifier, resource } from "std-json-api/json-api";

export function record2resource<T>(id: string, resourceId: string, attrs: T) {
  return resource(
    identifier(id, resourceId),
    attributes(attrs),
  );
}
