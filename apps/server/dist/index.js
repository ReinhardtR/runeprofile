"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var fastify_1 = __importDefault(require("fastify"));
var client_1 = require("db/client");
var data_schema_1 = require("./lib/data-schema");
var utils_1 = require("./lib/utils");
var fastify = (0, fastify_1["default"])({
    logger: true
});
var port = 3002;
fastify.post("submit", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var input, accountHash, username, accountType, skills, model, collectionLog, modelBuffer, queries;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("SUBMITTED TO SERVER");
                input = data_schema_1.playerDataSchema.parse(req.body);
                accountHash = input.accountHash, username = input.username, accountType = input.accountType, skills = input.skills, model = input.model, collectionLog = input.collectionLog;
                modelBuffer = {
                    obj: Buffer.from(model.obj, "utf-8"),
                    mtl: Buffer.from(model.mtl, "utf-8")
                };
                queries = [];
                // Create Account and their Collection Log
                queries.push(client_1.prisma.account.upsert({
                    where: { accountHash: accountHash },
                    update: __assign(__assign({ username: username, accountType: accountType, modelObj: modelBuffer.obj, modelMtl: modelBuffer.mtl }, skills), { collectionLog: {
                            upsert: {
                                create: {
                                    totalObtained: collectionLog.total_obtained,
                                    totalItems: collectionLog.total_items,
                                    uniqueItems: collectionLog.unique_items,
                                    uniqueObtained: collectionLog.unique_obtained
                                },
                                update: {
                                    totalObtained: collectionLog.total_obtained,
                                    totalItems: collectionLog.total_items,
                                    uniqueItems: collectionLog.unique_items,
                                    uniqueObtained: collectionLog.unique_obtained
                                }
                            }
                        } }),
                    create: __assign(__assign({ accountHash: accountHash, username: username, accountType: accountType, modelObj: modelBuffer.obj, modelMtl: modelBuffer.mtl }, skills), { collectionLog: {
                            create: {
                                totalObtained: collectionLog.total_obtained,
                                totalItems: collectionLog.total_items,
                                uniqueItems: collectionLog.unique_items,
                                uniqueObtained: collectionLog.unique_obtained
                            }
                        } })
                }));
                Object.values(collectionLog.tabs).forEach(function (tab) {
                    Object.entries(tab).forEach(function (_a) {
                        var _b;
                        var sourceName = _a[0], source = _a[1];
                        // Create Kill Counts
                        (_b = source.kill_count) === null || _b === void 0 ? void 0 : _b.forEach(function (killCount) {
                            var _a = (0, utils_1.getKillCountParts)(killCount), killCountName = _a[0], killCountAmount = _a[1];
                            queries.push(client_1.prisma.killCount.upsert({
                                where: {
                                    killCountId: {
                                        accountHash: accountHash,
                                        name: killCountName
                                    }
                                },
                                create: {
                                    accountHash: accountHash,
                                    name: killCountName,
                                    amount: killCountAmount,
                                    itemSourceName: sourceName
                                },
                                update: {
                                    amount: killCountAmount
                                }
                            }));
                        });
                        // Create CollectedItems
                        source.items.forEach(function (item) {
                            queries.push(client_1.prisma.collectedItem.upsert({
                                where: {
                                    collectedItemId: {
                                        accountHash: accountHash,
                                        itemId: item.id
                                    }
                                },
                                create: {
                                    accountHash: accountHash,
                                    itemId: item.id,
                                    quantity: item.quantity
                                },
                                update: {
                                    quantity: item.quantity
                                }
                            }));
                        });
                    });
                });
                return [4 /*yield*/, client_1.prisma.$transaction(queries)];
            case 1:
                _a.sent();
                return [2 /*return*/, res.status(200).send({ message: "Success" })];
        }
    });
}); });
fastify.listen({ port: port }, function (err, address) {
    if (err)
        throw err;
});
