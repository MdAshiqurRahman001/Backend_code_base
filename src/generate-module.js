// npm run generate -- --sync
// npm run generate "ModuleName"

const fs = require("fs");
const path = require("path");
const { getDMMF } = require("@prisma/internals");

/* =========================
 * PATHS (AUTO-ROBUST)
 * ========================= */
const CWD = process.cwd(); // project root
const SRC_DIR = path.join(CWD, "src");

const MODULES_DIR = path.join(SRC_DIR, "app", "modules");
const ROUTES_INDEX_PATH = path.join(SRC_DIR, "app", "routes", "index.ts");
const PRISMA_SCHEMA_PATH = path.join(CWD, "prisma", "schema.prisma");

/* =========================
 * UTILS
 * ========================= */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const pluralize = (str) => `${str}s`;

const fileExists = (p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
};

const readFile = (p) => fs.readFileSync(p, "utf8");
const writeFile = (p, content) => fs.writeFileSync(p, content, "utf8");

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Convert fieldName -> "Field name" (for messages) */
const toLabel = (name) =>
  name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());

/**
 * Ensures a named/default import exists without duplicating.
 * Also removes duplicates for the same module specifier.
 *
 * Supports:
 *  - import X from "m";
 *  - import { A, B } from "m";
 *  - import X, { A, B } from "m";
 */
const ensureImportSmart = (content, spec) => {
  const { modulePath, defaultImport, namedImports = [] } = spec;

  const fromRe = new RegExp(
    `^import\\s+[^;]*\\s+from\\s+["']${escapeRegExp(modulePath)}["'];\\s*$`,
    "gm"
  );

  const existingImports = [...content.matchAll(fromRe)].map((m) => m[0]);

  const parseImportLine = (line) => {
    const re = new RegExp(
      `^import\\s+(.+)\\s+from\\s+["']${escapeRegExp(modulePath)}["'];\\s*$`
    );
    const m = line.match(re);
    if (!m) return null;
    const clause = m[1].trim();

    let def = null;
    let named = [];

    const both = clause.match(/^([A-Za-z_$][\w$]*)\s*,\s*\{([^}]+)\}$/);
    if (both) {
      def = both[1].trim();
      named = both[2]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return { def, named };
    }

    const onlyNamed = clause.match(/^\{([^}]+)\}$/);
    if (onlyNamed) {
      named = onlyNamed[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return { def, named };
    }

    const onlyDefault = clause.match(/^([A-Za-z_$][\w$]*)$/);
    if (onlyDefault) {
      def = onlyDefault[1].trim();
      return { def, named: [] };
    }

    return { def: null, named: [] };
  };

  let mergedDefault = defaultImport || null;
  const mergedNamed = new Set(namedImports);

  for (const line of existingImports) {
    const parsed = parseImportLine(line);
    if (!parsed) continue;

    if (!mergedDefault && parsed.def) mergedDefault = parsed.def;
    parsed.named.forEach((n) => mergedNamed.add(n));
  }

  content = content.replace(fromRe, "").replace(/\n{3,}/g, "\n\n");

  const namedPart =
    mergedNamed.size > 0 ? `{ ${[...mergedNamed].sort().join(", ")} }` : null;

  let finalLine = null;
  if (mergedDefault && namedPart) {
    finalLine = `import ${mergedDefault}, ${namedPart} from "${modulePath}";`;
  } else if (mergedDefault) {
    finalLine = `import ${mergedDefault} from "${modulePath}";`;
  } else if (namedPart) {
    finalLine = `import ${namedPart} from "${modulePath}";`;
  } else {
    return content;
  }

  const importRegex = /^import .*;$/gm;
  const imports = [...content.matchAll(importRegex)];
  if (!imports.length) return `${finalLine}\n${content}`;

  const last = imports[imports.length - 1];
  const idx = last.index + last[0].length;
  return content.slice(0, idx) + "\n" + finalLine + content.slice(idx);
};

const isObjectIdField = (schemaText, modelName, fieldName) => {
  const modelBlockRe = new RegExp(
    `model\\s+${modelName}\\s*\\{([\\s\\S]*?)\\n\\}`,
    "m"
  );
  const match = schemaText.match(modelBlockRe);
  if (!match) return false;

  const block = match[1];
  const fieldLineRe = new RegExp(
    `^\\s*${fieldName}\\s+\\w+[\\?\\[\\]\\s\\w@()".:]*@db\\.ObjectId`,
    "m"
  );
  return fieldLineRe.test(block);
};

const isPlainSearchableStringField = (fieldName, schemaText, modelName) => {
  if (["id", "password", "createdAt", "updatedAt"].includes(fieldName)) {
    return false;
  }

  if (fieldName.endsWith("Id")) return false;

  const nonSearchableKeywords = [
    "image",
    "photo",
    "avatar",
    "cover",
    "documentfront",
    "documentback",
    "file",
    "token",
    "link",
    "url",
    "account",
    "payment",
    "customer",
    "stripe",
    "secret",
    "hash",
  ];

  const lower = fieldName.toLowerCase();

  if (nonSearchableKeywords.some((word) => lower.includes(word))) {
    return false;
  }

  if (isObjectIdField(schemaText, modelName, fieldName)) {
    return false;
  }

  return true;
};

const toObjectIdZod = (label) =>
  `z.string({
    required_error: "${label} is required",
    invalid_type_error: "${label} must be a text value"
  }).regex(/^[0-9a-fA-F]{24}$/, "Invalid ${label}")`;

const scalarToZod = ({ type, isList, label, requiredInCreate }) => {
  const reqMsg = `${label} is required`;

  const wrapArray = (inner) =>
    `z.array(${inner}, {
      required_error: "${reqMsg}",
      invalid_type_error: "${label} must be an array"
    })`;

  let base;
  switch (type) {
    case "String": {
      base = `z.string({
        required_error: "${reqMsg}",
        invalid_type_error: "${label} must be a text value"
      })${requiredInCreate ? `.min(1, "${reqMsg}")` : ""}`;
      break;
    }
    case "Int": {
      base = `z.number({
        required_error: "${reqMsg}",
        invalid_type_error: "${label} must be a number"
      }).int("${label} must be an integer")`;
      break;
    }
    case "Float": {
      base = `z.number({
        required_error: "${reqMsg}",
        invalid_type_error: "${label} must be a number"
      })`;
      break;
    }
    case "Boolean": {
      base = `z.boolean({
        required_error: "${reqMsg}",
        invalid_type_error: "${label} must be true/false"
      })`;
      break;
    }
    case "DateTime": {
      base = `z.coerce.date({
        required_error: "${reqMsg}",
        invalid_type_error: "Please provide a valid ${label}"
      })`;
      break;
    }
    default:
      base = null;
  }
  if (!base) return null;
  return isList ? wrapArray(base) : base;
};

const enumToZod = ({ enumName, isList, label }) => {
  const base = `z.nativeEnum(${enumName}, {
    errorMap: () => ({ message: "Please select a valid ${label}" })
  })`;

  if (!isList) return base;

  return `z.array(${base}, {
    required_error: "${label} is required",
    invalid_type_error: "${label} must be an array"
  })`;
};

const shouldSkipField = (f) => {
  if (["id", "createdAt", "updatedAt"].includes(f.name)) return true;
  if (f.name === "userId") return true;
  if (f.name === "createdBy") return true;
  if (f.kind === "object") return true;
  return false;
};

const readPrismaSchema = () => {
  if (!fileExists(PRISMA_SCHEMA_PATH)) {
    throw new Error(`schema.prisma not found at: ${PRISMA_SCHEMA_PATH}`);
  }
  return readFile(PRISMA_SCHEMA_PATH);
};

/* =========================
 * PRISMA -> ZOD GENERATION
 * ========================= */
const getModelFromDmmf = async (modelName) => {
  const schemaText = readPrismaSchema();
  const dmmf = await getDMMF({ datamodel: schemaText });

  const model = dmmf.datamodel.models.find(
    (m) => m.name.toLowerCase() === modelName.toLowerCase()
  );

  if (!model) {
    throw new Error(`Prisma model '${modelName}' not found in schema.prisma`);
  }

  return { model, schemaText };
};

const buildZodShape = ({ model, schemaText }, mode) => {
  const lines = [];

  for (const f of model.fields) {
    if (shouldSkipField(f)) continue;

    const isList = !!f.isList;
    const requiredInCreate = !!f.isRequired && !f.hasDefaultValue;
    const optional = mode === "update" ? true : !requiredInCreate;

    const label = toLabel(f.name);

    let zodExpr = null;

    if (
      f.kind === "scalar" &&
      f.type === "String" &&
      isObjectIdField(schemaText, model.name, f.name)
    ) {
      const base = toObjectIdZod(label);
      zodExpr = isList
        ? `z.array(${base}, {
            required_error: "${label} is required",
            invalid_type_error: "${label} must be an array"
          })`
        : base;
    } else if (f.kind === "enum") {
      zodExpr = enumToZod({ enumName: f.type, isList, label });
    } else if (f.kind === "scalar") {
      zodExpr = scalarToZod({
        type: f.type,
        isList,
        label,
        requiredInCreate,
      });
    }

    if (!zodExpr) continue;

    if (!optional && isList) {
      zodExpr += `.min(1, "Please select at least one ${label.toLowerCase()}")`;
    }

    if (optional) zodExpr = `${zodExpr}.optional()`;

    lines.push(`  ${f.name}: ${zodExpr},`);
  }

  return lines.join("\n");
};

const generateValidationFileContent = async (modelName, exportName) => {
  const { model, schemaText } = await getModelFromDmmf(modelName);

  const createShape = buildZodShape({ model, schemaText }, "create");
  const updateShape = buildZodShape({ model, schemaText }, "update");

  const enumNames = [
    ...new Set(model.fields.filter((f) => f.kind === "enum").map((f) => f.type)),
  ];

  const enumImports = enumNames.length ? `, ${enumNames.join(", ")}` : "";

  return `
import { z } from 'zod';
import { Prisma${enumImports} } from '@prisma/client';

// Auto-generated from Prisma model: ${modelName}
const createSchema = z.object({
${createShape || "  // no scalar fields to validate"}
}).strict();

const updateSchema = z.object({
${updateShape || "  // no scalar fields to validate"}
}).strict();

export const ${exportName} = {
  createSchema,
  updateSchema,
};
`.trim();
};

/* =========================
 * PRISMA -> UTILS GENERATION
 * ========================= */
const shouldSkipUtilsField = (f) => {
  if (f.kind === "object") return true;
  if (f.isList) return true;
  return false;
};

const generateUtilsFileContent = async (modelName, moduleName) => {
  const { model, schemaText } = await getModelFromDmmf(modelName);

  const stringFields = [];
  const enumFields = [];
  const booleanFields = [];
  const numberFields = [];
  const dateFields = [];

  for (const f of model.fields) {
    if (shouldSkipUtilsField(f)) continue;

    if (f.kind === "enum") {
      enumFields.push(f.name);
      continue;
    }

    if (f.kind !== "scalar") continue;

    if (f.type === "String") stringFields.push(f.name);
    if (f.type === "Boolean") booleanFields.push(f.name);
    if (f.type === "Int" || f.type === "Float") numberFields.push(f.name);
    if (f.type === "DateTime") dateFields.push(f.name);
  }

  const filterTypeLines = [`    searchTerm?: string | undefined;`];

  if (stringFields.includes("id")) {
    filterTypeLines.push(`    id?: string | undefined;`);
  }

  if (dateFields.includes("createdAt")) {
    filterTypeLines.push(`    createdAt?: string | undefined;`);
  }

  stringFields.forEach((field) => {
    if (field === "id") return;
    filterTypeLines.push(`    ${field}?: string | undefined;`);
  });

  enumFields.forEach((field) => {
    filterTypeLines.push(`    ${field}?: string | undefined;`);
  });

  numberFields.forEach((field) => {
    filterTypeLines.push(`    ${field}?: number | undefined;`);
    filterTypeLines.push(`    ${field}Min?: number | undefined;`);
    filterTypeLines.push(`    ${field}Max?: number | undefined;`);
  });

  dateFields.forEach((field) => {
    if (field === "createdAt") return;
    filterTypeLines.push(`    ${field}?: string | undefined;`);
  });

  if (booleanFields.length) {
    filterTypeLines.push(`    // boolean`);
    booleanFields.forEach((field) => {
      filterTypeLines.push(`    ${field}?: boolean | undefined;`);
    });
  }

  const searchAbleFields = stringFields.filter((field) =>
    isPlainSearchableStringField(field, schemaText, modelName)
  );

  const filterableFields = [`"searchTerm"`];

  if (stringFields.includes("id")) {
    filterableFields.push(`"id"`);
  }

  if (dateFields.includes("createdAt")) {
    filterableFields.push(`"createdAt"`);
  }

  stringFields.forEach((field) => {
    if (field === "id") return;
    filterableFields.push(`"${field}"`);
  });

  enumFields.forEach((field) => {
    filterableFields.push(`"${field}"`);
  });

  numberFields.forEach((field) => {
    filterableFields.push(`"${field}"`);
    filterableFields.push(`"${field}Min"`);
    filterableFields.push(`"${field}Max"`);
  });

  dateFields.forEach((field) => {
    if (field === "createdAt") return;
    filterableFields.push(`"${field}"`);
  });

  if (booleanFields.length) {
    filterableFields.push(`// boolean`);
    booleanFields.forEach((field) => {
      filterableFields.push(`"${field}"`);
    });
  }

  const parts = [];

  parts.push(`export type I${capitalize(moduleName)}FilterRequest = {
${filterTypeLines.join("\n")}
}`);

  if (booleanFields.length) {
    parts.push(`
export const BOOLEAN_FIELDS = new Set([
${booleanFields.map((field) => `    "${field}",`).join("\n")}
]);
`.trim());

    parts.push(`
export const toBoolean = (v: any) => {
    if (typeof v === "boolean") return v;
    if (typeof v !== "string") return v;

    const val = v.trim().toLowerCase();
    if (val === "true") return true;
    if (val === "false") return false;

    return v;
};
`.trim());
  }

  if (numberFields.length) {
    parts.push(`
export const NUMBER_FIELDS = new Set([
${numberFields.map((field) => `    "${field}",`).join("\n")}
]);
`.trim());

    parts.push(`
export const toNumber = (v: any) => {
    if (typeof v === "number") return v;
    if (typeof v !== "string") return v;

    const parsed = Number(v);
    return Number.isNaN(parsed) ? v : parsed;
};
`.trim());
  }

  parts.push(`
export const ${moduleName}SearchAbleFields = [${searchAbleFields
      .map((field) => `"${field}"`)
      .join(", ")}];

export const ${moduleName}FilterableFields = [
    ${filterableFields.join(",\n    ")},
];
`.trim());

  return parts.join("\n\n");
};

/* =========================
 * ROUTES PATCHER (POST/PUT)
 * ========================= */
const findRoutesFilePath = (moduleDir, moduleName) => {
  const candidates = [
    path.join(moduleDir, `${moduleName}.routes.ts`),
    path.join(moduleDir, `${moduleName}.route.ts`),
  ];
  for (const c of candidates) if (fileExists(c)) return c;

  const files = fs.readdirSync(moduleDir);
  const found = files.find(
    (f) => f.endsWith(".routes.ts") || f.endsWith(".route.ts")
  );
  return found ? path.join(moduleDir, found) : null;
};

const patchCrudValidation = ({
  fileContent,
  method,
  validationExportName,
  schemaKey,
  onlyPaths,
}) => {
  const routeRegex = new RegExp(
    `router\\.${method}\\(\\s*(['"\`])([^'"\`]+)\\1\\s*,([\\s\\S]*?)\\)\\s*;`,
    "gm"
  );

  return fileContent.replace(routeRegex, (full, quote, routePath, rest) => {
    if (!onlyPaths.includes(routePath)) return full;
    if (full.includes("validateRequest(")) return full;

    if (rest.includes("auth()")) {
      const replacedRest = rest.replace(
        /auth\(\)\s*,/,
        `auth(), validateRequest(${validationExportName}.${schemaKey}),`
      );
      return `router.${method}(${quote}${routePath}${quote},${replacedRest});`;
    }

    return `router.${method}(${quote}${routePath}${quote}, validateRequest(${validationExportName}.${schemaKey}),${rest});`;
  });
};

const ensureValidationInRoutes = (moduleDir, moduleName) => {
  const routesPath = findRoutesFilePath(moduleDir, moduleName);
  if (!routesPath) return;

  let content = readFile(routesPath);

  content = ensureImportSmart(content, {
    modulePath: "../../middlewares/validateRequest",
    defaultImport: "validateRequest",
  });

  const validationExportName = `${moduleName.toLowerCase()}Validation`;

  content = ensureImportSmart(content, {
    modulePath: `./${moduleName.toLowerCase()}.validation`,
    namedImports: [validationExportName],
  });

  content = patchCrudValidation({
    fileContent: content,
    method: "post",
    validationExportName,
    schemaKey: "createSchema",
    onlyPaths: ["/"],
  });

  content = patchCrudValidation({
    fileContent: content,
    method: "put",
    validationExportName,
    schemaKey: "updateSchema",
    onlyPaths: ["/:id"],
  });

  content = patchCrudValidation({
    fileContent: content,
    method: "patch",
    validationExportName,
    schemaKey: "updateSchema",
    onlyPaths: ["/:id"],
  });

  writeFile(routesPath, content);
  console.log(`✅ Patched routes validation: ${path.relative(CWD, routesPath)}`);
};

/* =========================
 * SERVICE PATCHER (getList sync)
 * ========================= */
const findServiceFilePath = (moduleDir, moduleName) => {
  const candidates = [
    path.join(moduleDir, `${moduleName}.service.ts`),
    path.join(moduleDir, `${moduleName}.services.ts`),
  ];
  for (const c of candidates) if (fileExists(c)) return c;

  const files = fs.readdirSync(moduleDir);
  const found = files.find(
    (f) => f.endsWith(".service.ts") || f.endsWith(".services.ts")
  );
  return found ? path.join(moduleDir, found) : null;
};

const generateServiceSyncConfig = async (moduleName) => {
  const Capitalized = capitalize(moduleName);
  const prismaModelName = capitalize(moduleName);
  const { model } = await getModelFromDmmf(prismaModelName);

  const hasBooleanFields = model.fields.some(
    (f) => f.kind === "scalar" && f.type === "Boolean" && !f.isList
  );

  const hasNumberFields = model.fields.some(
    (f) =>
      f.kind === "scalar" &&
      (f.type === "Int" || f.type === "Float") &&
      !f.isList
  );

  const serviceUtilsImports = [
    `I${Capitalized}FilterRequest`,
    `${moduleName}SearchAbleFields`,
  ];

  if (hasBooleanFields) {
    serviceUtilsImports.push("BOOLEAN_FIELDS", "toBoolean");
  }

  if (hasNumberFields) {
    serviceUtilsImports.push("NUMBER_FIELDS", "toNumber");
  }

  return {
    Capitalized,
    hasBooleanFields,
    hasNumberFields,
    serviceUtilsImports,
  };
};

const generateGetListBlock = async (moduleName) => {
  const {
    Capitalized,
    hasBooleanFields,
    hasNumberFields,
  } = await generateServiceSyncConfig(moduleName);

  const rangeConditionsLine = hasNumberFields
    ? `  const rangeConditions: Record<string, { gte?: number; lte?: number }> = {};`
    : "";

  const booleanFilterBlock = hasBooleanFields
    ? `
      if (BOOLEAN_FIELDS.has(key)) {
        value = toBoolean(value);
        andConditions.push({ [key]: value });
        return;
      }`
    : "";

  const numberFilterBlock = hasNumberFields
    ? `
      if (key.endsWith("Min")) {
        const baseField = key.replace(/Min$/, "");
        value = toNumber(value);
        if (NUMBER_FIELDS.has(baseField)) {
          rangeConditions[baseField] = {
            ...(rangeConditions[baseField] || {}),
            gte: value,
          };
        }
        return;
      }

      if (key.endsWith("Max")) {
        const baseField = key.replace(/Max$/, "");
        value = toNumber(value);
        if (NUMBER_FIELDS.has(baseField)) {
          rangeConditions[baseField] = {
            ...(rangeConditions[baseField] || {}),
            lte: value,
          };
        }
        return;
      }

      if (NUMBER_FIELDS.has(key)) {
        value = toNumber(value);
        andConditions.push({ [key]: value });
        return;
      }`
    : "";

  const rangeConditionsApplyBlock = hasNumberFields
    ? `
  Object.keys(rangeConditions).forEach((field) => {
    andConditions.push({
      [field]: rangeConditions[field],
    });
  });`
    : "";

  return `// get all ${Capitalized}
const get${Capitalized}List = async (
  options: IPaginationOptions,
  filters: I${Capitalized}FilterRequest
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.${Capitalized}WhereInput[] = [];
${rangeConditionsLine}

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...${moduleName}SearchAbleFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
      ],
    });
  }
  if (Object.keys(filterData).length) {
    Object.keys(filterData).forEach((key) => {
      let value = (filterData as any)[key];
      if (value === "" || value === null || value === undefined) return;${booleanFilterBlock}${numberFilterBlock}

      if (["createdAt"].includes(key) && value) {
        const start = new Date(value);
        start.setHours(0, 0, 0, 0);
        const end = new Date(value);
        end.setHours(23, 59, 59, 999);
        andConditions.push({
          [key]: {
            gte: start.toISOString(),
            lte: end.toISOString(),
          },
        });
        return;
      }

      // if (key === "status") {
      //   const statuses = Array.isArray(value) ? value : [value];
      //   andConditions.push({
      //     status: { in: statuses },
      //   });
      //   return;
      // }

      andConditions.push({ [key]: value });
    });
  }${rangeConditionsApplyBlock}

  const whereConditions: Prisma.${Capitalized}WhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.${moduleName}.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.${moduleName}.count({ where: whereConditions });

  return {
    meta: { total, page, limit },
    data: result,
  };
};`;
};

const syncServiceGetList = async (moduleDir, moduleName) => {
  const servicePath = findServiceFilePath(moduleDir, moduleName);
  if (!servicePath) return;

  let content = readFile(servicePath);
  const { Capitalized, serviceUtilsImports } = await generateServiceSyncConfig(
    moduleName
  );

  content = ensureImportSmart(content, {
    modulePath: `./${moduleName}.utils`,
    namedImports: serviceUtilsImports,
  });

  content = content.replace(
    new RegExp(
      `type\\s+I${Capitalized}FilterRequest\\s*=\\s*\\{[\\s\\S]*?\\};\\s*`,
      "m"
    ),
    ""
  );

  content = content.replace(
    new RegExp(
      `const\\s+${moduleName}SearchAbleFields\\s*=\\s*\\[[\\s\\S]*?\\];\\s*`,
      "m"
    ),
    ""
  );

  const getListRegex = new RegExp(
    `//\\s*get\\s+all\\s+${Capitalized}[\\s\\S]*?//\\s*get\\s+${Capitalized}\\s+by\\s+user\\s*id`,
    "mi"
  );

  const newGetListBlock = `${await generateGetListBlock(
    moduleName
  )}\n\n// get ${Capitalized} by user id`;

  if (getListRegex.test(content)) {
    content = content.replace(getListRegex, newGetListBlock);
    writeFile(servicePath, content);
    console.log(`✅ Synced service getList: ${path.relative(CWD, servicePath)}`);
  } else {
    console.log(`⚠️ Skip service getList patch: ${path.relative(CWD, servicePath)}`);
  }
};

/* =========================
 * VALIDATION SYNC FOR EXISTING MODULES
 * =========================
 * overwrite = false => only create validation if missing
 * overwrite = true  => always rewrite validation/utils to match Prisma
 */
const syncValidationsForExistingModules = async ({ overwrite = false } = {}) => {
  if (!fileExists(MODULES_DIR)) {
    console.log("⚠️ modules directory not found:", MODULES_DIR);
    return;
  }

  const entries = fs.readdirSync(MODULES_DIR, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  for (const folderName of dirs) {
    const moduleDir = path.join(MODULES_DIR, folderName);

    const moduleName = folderName;
    const prismaModelName = capitalize(folderName);

    const validationFilePath = path.join(
      moduleDir,
      `${moduleName.toLowerCase()}.validation.ts`
    );

    const utilsFilePath = path.join(
      moduleDir,
      `${moduleName.toLowerCase()}.utils.ts`
    );

    try {
      ensureValidationInRoutes(moduleDir, moduleName);
      await syncServiceGetList(moduleDir, moduleName);

      const shouldWriteValidation =
        overwrite || !fileExists(validationFilePath);

      if (shouldWriteValidation) {
        const validationExportName = `${moduleName.toLowerCase()}Validation`;
        const validationContent = await generateValidationFileContent(
          prismaModelName,
          validationExportName
        );

        writeFile(validationFilePath, validationContent);

        console.log(
          overwrite
            ? `✅ Synced validation (overwritten): ${path.relative(
              CWD,
              validationFilePath
            )}`
            : `✅ Created missing validation: ${path.relative(
              CWD,
              validationFilePath
            )}`
        );
      }

      const shouldWriteUtils = overwrite || !fileExists(utilsFilePath);

      if (shouldWriteUtils) {
        const utilsContent = await generateUtilsFileContent(
          prismaModelName,
          moduleName
        );

        writeFile(utilsFilePath, utilsContent);

        console.log(
          overwrite
            ? `✅ Synced utils (overwritten): ${path.relative(
              CWD,
              utilsFilePath
            )}`
            : `✅ Created missing utils: ${path.relative(
              CWD,
              utilsFilePath
            )}`
        );
      }
    } catch (e) {
      console.log(`⚠️ Skip '${folderName}': ${e.message}`);
    }
  }
};

/* =========================
 * TEMPLATES (NEW MODULE)
 * ========================= */
const templates = async (moduleName) => {
  const Capitalized = capitalize(moduleName);

  const validationExportName = `${moduleName.toLowerCase()}Validation`;
  const prismaModelName = capitalize(moduleName);

  const { model } = await getModelFromDmmf(prismaModelName);

  const hasUserIdField = model.fields.some((f) => f.name === "userId");

  const hasBooleanFields = model.fields.some(
    (f) => f.kind === "scalar" && f.type === "Boolean" && !f.isList
  );

  const hasNumberFields = model.fields.some(
    (f) =>
      f.kind === "scalar" &&
      (f.type === "Int" || f.type === "Float") &&
      !f.isList
  );

  const serviceUtilsImports = [
    `I${Capitalized}FilterRequest`,
    `${moduleName}SearchAbleFields`,
  ];

  if (hasBooleanFields) {
    serviceUtilsImports.push("BOOLEAN_FIELDS", "toBoolean");
  }

  if (hasNumberFields) {
    serviceUtilsImports.push("NUMBER_FIELDS", "toNumber");
  }

  const rangeConditionsLine = hasNumberFields
    ? `  const rangeConditions: Record<string, { gte?: number; lte?: number }> = {};`
    : "";

  const booleanFilterBlock = hasBooleanFields
    ? `
      if (BOOLEAN_FIELDS.has(key)) {
        value = toBoolean(value);
        andConditions.push({ [key]: value });
        return;
      }`
    : "";

  const numberFilterBlock = hasNumberFields
    ? `
      if (key.endsWith("Min")) {
        const baseField = key.replace(/Min$/, "");
        value = toNumber(value);
        if (NUMBER_FIELDS.has(baseField)) {
          rangeConditions[baseField] = {
            ...(rangeConditions[baseField] || {}),
            gte: value,
          };
        }
        return;
      }

      if (key.endsWith("Max")) {
        const baseField = key.replace(/Max$/, "");
        value = toNumber(value);
        if (NUMBER_FIELDS.has(baseField)) {
          rangeConditions[baseField] = {
            ...(rangeConditions[baseField] || {}),
            lte: value,
          };
        }
        return;
      }

      if (NUMBER_FIELDS.has(key)) {
        value = toNumber(value);
        andConditions.push({ [key]: value });
        return;
      }`
    : "";

  const rangeConditionsApplyBlock = hasNumberFields
    ? `
  Object.keys(rangeConditions).forEach((field) => {
    andConditions.push({
      [field]: rangeConditions[field],
    });
  });`
    : "";

  return {
    controller: `
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ${moduleName}Service } from './${moduleName}.service';
import { Request, Response } from 'express';
import pick from '../../../shared/pick';
import { ${moduleName}FilterableFields } from './${moduleName}.utils';

// create ${Capitalized}
const create${Capitalized} = catchAsync(async (req: Request, res: Response) => {
  const result = await ${moduleName}Service.create${Capitalized}(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: '${Capitalized} created successfully',
    data: result,
  });
});

// get all ${Capitalized}
const get${Capitalized}List = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  const filters = pick(req.query, ${moduleName}FilterableFields);
  const result = await ${moduleName}Service.get${Capitalized}List(options, filters);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: '${Capitalized} list retrieved successfully',
    data: result,
  });
});
${hasUserIdField ? `
// get ${Capitalized} by userId
const get${Capitalized}ByUserId = catchAsync(async (req: Request, res: Response) => {
  const result = await ${moduleName}Service.get${Capitalized}ByUserId(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: '${Capitalized} details retrieved successfully',
    data: result,
  });
});
` : ''}
// get ${Capitalized} by id
const get${Capitalized}ById = catchAsync(async (req: Request, res: Response) => {
  const result = await ${moduleName}Service.get${Capitalized}ById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: '${Capitalized} retrieved successfully',
    data: result,
  });
});

// update ${Capitalized}
const update${Capitalized} = catchAsync(async (req: Request, res: Response) => {
  const result = await ${moduleName}Service.update${Capitalized}(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: '${Capitalized} updated successfully',
    data: result,
  });
});

// delete ${Capitalized}
const delete${Capitalized} = catchAsync(async (req: Request, res: Response) => {
  const result = await ${moduleName}Service.delete${Capitalized}(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: '${Capitalized} deleted successfully',
    data: result,
  });
});

export const ${moduleName}Controller = {
  create${Capitalized},
  get${Capitalized}List,${hasUserIdField ? `\n  get${Capitalized}ByUserId,` : ''}
  get${Capitalized}ById,
  update${Capitalized},
  delete${Capitalized},
};
`.trim(),

    service: `
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { Prisma } from "@prisma/client";
import {
  ${serviceUtilsImports.join(",\n  ")}
} from "./${moduleName}.utils";

// create ${Capitalized}
const create${Capitalized} = async (data: any) => {

  const result = await prisma.${moduleName}.create({
    data
  });

  return result;
};

// get all ${Capitalized}
const get${Capitalized}List = async (
  options: IPaginationOptions,
  filters: I${Capitalized}FilterRequest
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.${Capitalized}WhereInput[] = [];
${rangeConditionsLine}

  if (searchTerm) {
    andConditions.push({
      OR: [
        ...${moduleName}SearchAbleFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
      ],
    });
  }

  if (Object.keys(filterData).length) {
    Object.keys(filterData).forEach((key) => {
      let value = (filterData as any)[key];
      if (value === "" || value === null || value === undefined) return;${booleanFilterBlock}${numberFilterBlock}

      if (["createdAt", "updatedAt"].includes(key) && value) {
        const start = new Date(value);
        start.setHours(0, 0, 0, 0);
        const end = new Date(value);
        end.setHours(23, 59, 59, 999);
        andConditions.push({
          [key]: {
            gte: start.toISOString(),
            lte: end.toISOString(),
          },
        });
        return;
      }

      // if (key === "status") {
      //   const statuses = Array.isArray(value) ? value : [value];
      //   andConditions.push({
      //     status: { in: statuses },
      //   });
      //   return;
      // }

      andConditions.push({ [key]: value });
    });

  }${rangeConditionsApplyBlock}

  const whereConditions: Prisma.${Capitalized}WhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.${moduleName}.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.${moduleName}.count({ where: whereConditions });

  return {
    meta: { total, page, limit },
    data: result,
  };
};
${hasUserIdField ? `
// get ${Capitalized} by user id
const get${Capitalized}ByUserId = async (userId: string) => {

  const result = await prisma.${moduleName}.findMany({ where: { userId } });

  if (!result.length) {
    throw new ApiError(httpStatus.NOT_FOUND, '${Capitalized} not found');
  }

  return result;
};
` : ''}
// get ${Capitalized} by id
const get${Capitalized}ById = async (id: string) => {

  const result = await prisma.${moduleName}.findUnique({ where: { id } });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, '${Capitalized} not found');
  }

  return result;
};

// update ${Capitalized}
const update${Capitalized} = async (id: string, data: any) => {

  const existing${Capitalized} = await prisma.${moduleName}.findUnique({ where: { id } });

  if (!existing${Capitalized}) {
    throw new ApiError(httpStatus.NOT_FOUND, '${Capitalized} not found');
  }

  const result = await prisma.${moduleName}.update({
    where: { id },
    data
  });

  return result;
};

// delete ${Capitalized}
const delete${Capitalized} = async (id: string) => {

  const existing${Capitalized} = await prisma.${moduleName}.findUnique({ where: { id } });

  if (!existing${Capitalized}) {
    throw new ApiError(httpStatus.NOT_FOUND, '${Capitalized} not found');
  }

  const result = await prisma.${moduleName}.delete({ where: { id } });

  return result;
};

export const ${moduleName}Service = {
  create${Capitalized},
  get${Capitalized}List,${hasUserIdField ? `\n  get${Capitalized}ByUserId,` : ''}
  get${Capitalized}ById,
  update${Capitalized},
  delete${Capitalized},
};
`.trim(),

    routes: `
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ${moduleName}Controller } from './${moduleName}.controller';
import { ${validationExportName} } from './${moduleName}.validation';

const router = express.Router();

router.post('/', auth(), validateRequest(${validationExportName}.createSchema), ${moduleName}Controller.create${Capitalized});

router.get('/', auth(), ${moduleName}Controller.get${Capitalized}List);
${hasUserIdField ? `\nrouter.get('/get/by/userId', auth(), ${moduleName}Controller.get${Capitalized}ByUserId);\n` : ''}
router.get('/:id', auth(), ${moduleName}Controller.get${Capitalized}ById);

router.put('/:id',auth(),validateRequest(${validationExportName}.updateSchema),${moduleName}Controller.update${Capitalized});

router.delete('/:id', auth(), ${moduleName}Controller.delete${Capitalized});

export const ${moduleName}Routes = router;
`.trim(),

    validation: await generateValidationFileContent(
      prismaModelName,
      validationExportName
    ),

    utils: await generateUtilsFileContent(
      prismaModelName,
      moduleName
    ),
  };
};

/* =========================
 * ROUTE REGISTRATION (INDEX)
 * ========================= */
const registerRoute = (moduleName) => {
  if (!fileExists(ROUTES_INDEX_PATH)) {
    console.error("❌ routes index.ts not found:", ROUTES_INDEX_PATH);
    return;
  }

  const routeVar = `${moduleName}Routes`;
  const routePath = `/${pluralize(moduleName.toLowerCase())}`;
  const importStatement = `import { ${routeVar} } from "../modules/${moduleName}/${moduleName}.routes";`;

  let fileContent = readFile(ROUTES_INDEX_PATH);

  if (fileContent.includes(importStatement)) {
    console.log("⚠️ Route already registered, skipping...");
    return;
  }

  const importRegex = /^import .*;$/gm;
  const imports = [...fileContent.matchAll(importRegex)];
  if (imports.length === 0) {
    console.error("❌ No import statements found in routes index.ts");
    return;
  }

  const lastImport = imports[imports.length - 1];
  const insertImportIndex = lastImport.index + lastImport[0].length;

  fileContent =
    fileContent.slice(0, insertImportIndex) +
    "\n" +
    importStatement +
    fileContent.slice(insertImportIndex);

  const routesArrayEndIndex = fileContent.indexOf(
    "];",
    fileContent.indexOf("const moduleRoutes")
  );

  if (routesArrayEndIndex === -1) {
    console.error("❌ moduleRoutes array not found in routes index.ts");
    return;
  }

  const routeEntry = `
  {
    path: "${routePath}",
    route: ${routeVar},
  },`;

  fileContent =
    fileContent.slice(0, routesArrayEndIndex) +
    routeEntry +
    "\n" +
    fileContent.slice(routesArrayEndIndex);

  writeFile(ROUTES_INDEX_PATH, fileContent);
  console.log(`✅ Route registered: ${routePath}`);
};

/* =========================
 * MAIN GENERATOR
 * ========================= */
const generateModule = async (moduleName) => {
  if (!moduleName) {
    console.error("❌ Please provide a module name!");
    process.exit(1);
  }

  if (!fileExists(MODULES_DIR)) fs.mkdirSync(MODULES_DIR, { recursive: true });

  const modulePath = path.join(MODULES_DIR, moduleName);
  if (fileExists(modulePath)) {
    console.error(`❌ Module '${moduleName}' already exists!`);
    process.exit(1);
  }

  fs.mkdirSync(modulePath, { recursive: true });

  const tpl = await templates(moduleName);

  Object.entries(tpl).forEach(([key, content]) => {
    const filePath = path.join(modulePath, `${moduleName}.${key}.ts`);
    writeFile(filePath, content.trim());
    console.log(`✅ Created: ${path.relative(CWD, filePath)}`);
  });

  registerRoute(moduleName);
  console.log(`🎉 Module '${moduleName}' created successfully!`);
};

/* =========================
 * CLI
 * ========================= */
const args = process.argv.slice(2);
const first = args[0];

(async () => {
  try {
    if (first === "--sync") {
      await syncValidationsForExistingModules({ overwrite: true });
      console.log("✅ Sync completed!");
      return;
    }

    const moduleName = first;
    if (!moduleName) {
      console.error(
        '❌ Please provide a module name! (ex: npm run generate Room OR npm run generate -- --sync)'
      );
      process.exit(1);
    }

    await generateModule(moduleName);
    return;
  } catch (e) {
    console.error("❌ Generate failed:", e.message);
    process.exit(1);
  }
})();