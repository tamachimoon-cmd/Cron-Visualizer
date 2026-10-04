import test from "node:test";
import assert from "node:assert/strict";
import {describeCron,matchesCron,nextRuns,parseCron} from "../src/cron.js";
test("accepts five fields",()=>assert.equal(parseCron("*/15 9-17 * * MON-FRI").length,5));
test("rejects four fields",()=>assert.throws(()=>parseCron("* * * *"),/5 campos/));
test("rejects invalid minute",()=>assert.throws(()=>parseCron("61 * * * *")));
test("matches weekday",()=>assert.equal(matchesCron("0 9 * * MON-FRI",new Date(2026,8,28,9,0)),true));
test("calculates runs",()=>assert.equal(nextRuns("0 9 * * *",2,new Date(2026,8,28,8,58)).length,2));
test("describes fixed time",()=>assert.match(describeCron("0 9 * * MON-FRI"),/09:00/));