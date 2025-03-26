import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/sqlite-core";

export const vector32 = customType<{
    data: number[];
    config: { dimensions: number };
    configRequired: false;
    driverData: Buffer;
}>({
    dataType(config) {
        return `F32_BLOB(${config?.dimensions})`;
    },
    fromDriver(value: Buffer) {
        return Array.from(new Float32Array(value.buffer));
    },
    toDriver(value: number[]) {
        return sql`vector32(${JSON.stringify(value)})`;
    },
});