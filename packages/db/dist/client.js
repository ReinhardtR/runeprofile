"use strict";
exports.__esModule = true;
exports.prisma = void 0;
/**
 * Instantiates a single instance PrismaClient and save it on the global object.
 * @link https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
 */
var client_1 = require("@prisma/client");
var prismaGlobal = global;
exports.prisma = prismaGlobal.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"]
    });
if (process.env.NODE_ENV !== "production") {
    prismaGlobal.prisma = exports.prisma;
}
