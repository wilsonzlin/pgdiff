import * as shelljs from "shelljs";
import * as Path from "path";

const PGDIFF_BIN_WIN = Path.join(__dirname, "..", "resources", "win", "pgdiff.exe");
const PGDIFF_BIN_MACOS = Path.join(__dirname, "..", "resources", "macos", "pgdiff");
const PGDIFF_BIN_LINUX = Path.join(__dirname, "..", "resources", "linux", "pgdiff");

const PGDIFF_BIN = {
  linux: PGDIFF_BIN_LINUX,
  win32: PGDIFF_BIN_WIN,
  darwin: PGDIFF_BIN_MACOS,
}[process.platform];

if (!PGDIFF_BIN) {
  throw new TypeError(`Unsupported platform: ${process.platform}`);
}

export interface IDatabaseConnectionConfig {
  user: string;
  password: string;
  SSL?: boolean;
  host: string;
  port?: number;
  database: string;
  schema?: string;
}

export enum SchemaType {
  SCHEMA = "SCHEMA",
  ROLE = "ROLE",
  SEQUENCE = "SEQUENCE",
  TABLE = "TABLE",
  COLUMN = "COLUMN",
  INDEX = "INDEX",
  VIEW = "VIEW",
  FOREIGN_KEY = "FOREIGN_KEY",
  FUNCTION = "FUNCTION",
  TRIGGER = "TRIGGER",
  OWNER = "OWNER",
  GRANT_RELATIONSHIP = "GRANT_RELATIONSHIP",
  GRANT_ATTRIBUTE = "GRANT_ATTRIBUTE",
}

// This type assertion only works if all values in the enum are the exact same as their enum names
export const SCHEMA_TYPES: SchemaType[] = Object.keys(SchemaType) as SchemaType[];

Object.freeze(SCHEMA_TYPES);

export function pgdiff (from: IDatabaseConnectionConfig, to: IDatabaseConnectionConfig, schemaType: SchemaType): string {
  let fromOptions = `-u ${from.user} -w ${from.password} -h ${from.host} -p ${from.port} -d ${from.database} -o 'sslmode=${from.SSL ?
    "require" : "disable"}' -s ${from.schema}`;
  let toOptions = `-U ${to.user} -W ${to.password} -H ${to.host} -P ${to.port} -D ${to.database} -O 'sslmode=${to.SSL ?
    "require" : "disable"}' -S ${to.schema}`;

  let res = shelljs.exec(`${PGDIFF_BIN} ${fromOptions} ${toOptions} ${schemaType}`);
  let status = res.code;
  let diff = res.stdout;
  let errors = res.stderr;

  console.error(errors);

  if (status) {
    throw new Error(`Failed to run pgdiff with error ${status}`);
  }

  return diff;
}

export function diff (from: IDatabaseConnectionConfig, to: IDatabaseConnectionConfig, types: SchemaType[] = SCHEMA_TYPES): string {
  return types.map(t => pgdiff(from, to, t)).join("\n");
}
