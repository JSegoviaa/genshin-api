import { defineResource, head } from "../../core/resource";
import { slugify } from "../../core/slug";
import { localSpecialtySchema } from "./local-specialty.schema";

export const localSpecialtyResource = defineResource({
  name: "local-specialties",
  title: "Local Specialties",
  description:
    "Regional plants and materials used for character ascension. Each specialty lists the characters that need it.",
  example: "silk-flower",
  schema: localSpecialtySchema,
  refs: {
    region: "regions",
    releaseVersion: { resource: "versions", key: "name" },
  },
  filters: {
    region: { description: "Region slug", get: (l) => l.region },
    releaseVersion: {
      description: "Release version, e.g. 1.0 or luna-i",
      get: (l) => l.releaseVersion,
    },
  },
  sorts: {},
  summary: (l, ctx) => ({
    ...head("local-specialties", l, ctx),
    region: ctx.ref("regions", l.region),
    icon: ctx.image(l.images.icon),
  }),
  detail: (l, ctx) => ({
    ...head("local-specialties", l, ctx),
    region: ctx.ref("regions", l.region),
    releaseVersion: ctx.refByName("versions", l.releaseVersion),
    images: ctx.images(l.images),
    characters: ctx.related<{ localSpecialty: string | null }>(
      "characters",
      (c) => !!c.localSpecialty && slugify(c.localSpecialty) === l.slug,
    ),
  }),
});
