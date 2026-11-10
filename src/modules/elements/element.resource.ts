import { defineResource, head } from "../../core/resource";
import { elementSchema } from "./element.schema";

export const elementResource = defineResource({
  name: "elements",
  title: "Elements",
  description:
    "The elemental types of Teyvat. Each element lists the characters that wield it and the enemies that deal its damage.",
  example: "pyro",
  schema: elementSchema,
  refs: {},
  filters: {},
  sorts: {},
  summary: (e, ctx) => ({
    ...head("elements", e, ctx),
    icon: ctx.image(e.images.icon),
  }),
  detail: (e, ctx) => ({
    ...head("elements", e, ctx),
    images: ctx.images(e.images),
    characters: ctx.related<{ element: string | null }>(
      "characters",
      (c) => c.element === e.slug,
    ),
    enemies: ctx.related<{ elements: string[] }>("enemies", (x) =>
      x.elements.includes(e.slug),
    ),
  }),
});
