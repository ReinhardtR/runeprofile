"use strict";
exports.__esModule = true;
exports.getKillCountParts = void 0;
var getKillCountParts = function (killCount) {
    var parts = killCount.split(": ");
    var name = parts[0];
    var amount = Number(parts[1]);
    return [name, amount];
};
exports.getKillCountParts = getKillCountParts;
