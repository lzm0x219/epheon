#!/usr/bin/env node

import { strict as assert } from "node:assert";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");
const OUTPUT_DIR = path.join(REPO_ROOT, "standards", "solar");
const HORIZONS_API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api";
const BASIS =
  "JPL Horizons API: geocentric apparent ecliptic longitude of the Sun (quantity 31, ObsEcLon), linearly interpolated from hourly UTC samples.";

const TERM_DEFINITIONS = [
  { name: "小寒", angle: 285 },
  { name: "大寒", angle: 300 },
  { name: "立春", angle: 315 },
  { name: "雨水", angle: 330 },
  { name: "惊蛰", angle: 345 },
  { name: "春分", angle: 0 },
  { name: "清明", angle: 15 },
  { name: "谷雨", angle: 30 },
  { name: "立夏", angle: 45 },
  { name: "小满", angle: 60 },
  { name: "芒种", angle: 75 },
  { name: "夏至", angle: 90 },
  { name: "小暑", angle: 105 },
  { name: "大暑", angle: 120 },
  { name: "立秋", angle: 135 },
  { name: "处暑", angle: 150 },
  { name: "白露", angle: 165 },
  { name: "秋分", angle: 180 },
  { name: "寒露", angle: 195 },
  { name: "霜降", angle: 210 },
  { name: "立冬", angle: 225 },
  { name: "小雪", angle: 240 },
  { name: "大雪", angle: 255 },
  { name: "冬至", angle: 270 }
];

const YEARS = [2024, 2025];
const MONTHS = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11
};

/**
 * 读取 Horizons 的小时级太阳视黄经采样。
 *
 * @returns 解析后的 UTC 样本。
 */
async function fetchSolarLongitudeSamples() {
  const url = new URL(HORIZONS_API_URL);
  url.search = new URLSearchParams({
    format: "text",
    COMMAND: "'10'",
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'500@399'",
    START_TIME: "'2024-01-01 00:00'",
    STOP_TIME: "'2026-01-01 00:00'",
    STEP_SIZE: "'1 h'",
    TIME_TYPE: "'UT'",
    TIME_DIGITS: "'SECONDS'",
    QUANTITIES: "'31'",
    CAL_FORMAT: "'CAL'",
    CSV_FORMAT: "'YES'",
    ANG_FORMAT: "'DEG'"
  }).toString();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Horizons request failed: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  return parseHorizonsSamples(text);
}

/**
 * 解析 Horizons 文本输出中的时间和视黄经列。
 *
 * @param text Horizons API 原始文本输出。
 * @returns 样本数组。
 */
function parseHorizonsSamples(text) {
  const start = text.indexOf("$$SOE");
  const end = text.indexOf("$$EOE");
  assert(start >= 0 && end > start, "Horizons response is missing $$SOE/$$EOE markers.");

  const lines = text
    .slice(start + 5, end)
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const [calendar, , , longitude] = line.split(",");
    assert(calendar !== undefined && longitude !== undefined, `Unexpected Horizons row: ${line}`);

    return {
      utcMs: parseHorizonsCalendarUtc(calendar.trim()),
      longitudeDegrees: Number.parseFloat(longitude.trim())
    };
  });
}

/**
 * 将 Horizons 的 `YYYY-Mon-DD HH:MM:SS` 时间转换成 UTC 毫秒。
 *
 * @param input Horizons 输出的时间字符串。
 * @returns UTC 毫秒时间戳。
 */
function parseHorizonsCalendarUtc(input) {
  const match =
    /^(?<year>\d{4})-(?<month>[A-Z][a-z]{2})-(?<day>\d{2}) (?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})$/.exec(
      input
    );
  assert(match?.groups !== undefined, `Unexpected Horizons timestamp: ${input}`);

  const monthIndex = MONTHS[match.groups.month];
  assert(monthIndex !== undefined, `Unknown month token: ${match.groups.month}`);

  return Date.UTC(
    Number.parseInt(match.groups.year, 10),
    monthIndex,
    Number.parseInt(match.groups.day, 10),
    Number.parseInt(match.groups.hour, 10),
    Number.parseInt(match.groups.minute, 10),
    Number.parseInt(match.groups.second, 10)
  );
}

/**
 * 将 [0, 360) 视黄经展开成单调递增序列，方便检测节气交点。
 *
 * @param samples 原始 Horizons 样本。
 * @returns 带展开黄经的样本。
 */
function unwrapSamples(samples) {
  let turns = 0;

  return samples.map((sample, index) => {
    if (index > 0) {
      const previous = samples[index - 1];
      assert(previous !== undefined, "Missing previous sample.");

      if (sample.longitudeDegrees < previous.longitudeDegrees) {
        turns += 1;
      }
    }

    return {
      ...sample,
      unwrappedLongitudeDegrees: sample.longitudeDegrees + turns * 360
    };
  });
}

/**
 * 从展开后的黄经序列里插值出 2024/2025 的 24 节气时刻。
 *
 * @param samples 展开后的小时样本。
 * @returns 节气 fixture。
 */
function buildSolarTerms(samples) {
  const solarTerms = [];
  let sampleIndex = 0;
  let previousTarget = Number.NEGATIVE_INFINITY;

  for (const year of YEARS) {
    for (const term of TERM_DEFINITIONS) {
      let target = term.angle;
      while (target <= previousTarget) {
        target += 360;
      }

      while (sampleIndex + 1 < samples.length) {
        const current = samples[sampleIndex];
        const next = samples[sampleIndex + 1];
        assert(current !== undefined && next !== undefined, "Missing interpolation samples.");

        if (
          current.unwrappedLongitudeDegrees <= target &&
          next.unwrappedLongitudeDegrees >= target
        ) {
          const ratio =
            (target - current.unwrappedLongitudeDegrees) /
            (next.unwrappedLongitudeDegrees - current.unwrappedLongitudeDegrees);
          const utcMs = Math.round(current.utcMs + ratio * (next.utcMs - current.utcMs));

          solarTerms.push({
            year,
            name: term.name,
            targetLongitudeDegrees: term.angle,
            instant: toIsoSecondString(utcMs),
            basis: BASIS
          });
          previousTarget = target;
          break;
        }

        sampleIndex += 1;
      }
    }
  }

  return solarTerms;
}

/**
 * 构造太阳黄经 fixture。当前最小集直接复用节气交接时刻和目标黄经。
 *
 * @param solarTerms 节气 fixture。
 * @returns 太阳黄经 fixture。
 */
function buildSolarLongitudes(solarTerms) {
  return solarTerms.map((term) => ({
    year: term.year,
    term: term.name,
    input: term.instant,
    longitudeDegrees: term.targetLongitudeDegrees,
    basis: term.basis
  }));
}

/**
 * 把毫秒时间戳收敛成秒级 UTC ISO 字符串，便于 fixture 稳定 diff。
 *
 * @param utcMs UTC 毫秒时间戳。
 * @returns 秒级 UTC ISO 字符串。
 */
function toIsoSecondString(utcMs) {
  return new Date(Math.round(utcMs / 1000) * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * 对生成结果做最小自检，避免把错位数据写入仓库。
 *
 * @param solarTerms 节气 fixture。
 * @param solarLongitudes 太阳黄经 fixture。
 * @returns 校验通过时不返回值。
 */
function validateFixtures(solarTerms, solarLongitudes) {
  assert.equal(
    solarTerms.length,
    YEARS.length * TERM_DEFINITIONS.length,
    "Unexpected solar term count."
  );
  assert.equal(
    solarLongitudes.length,
    YEARS.length * TERM_DEFINITIONS.length,
    "Unexpected solar longitude count."
  );

  for (let index = 1; index < solarTerms.length; index += 1) {
    const previous = Date.parse(solarTerms[index - 1].instant);
    const current = Date.parse(solarTerms[index].instant);
    assert(current > previous, "Solar terms must be strictly increasing.");
  }

  assert.equal(solarTerms[0]?.name, "小寒");
  assert.equal(solarTerms.at(-1)?.name, "冬至");
}

/**
 * 写出两份 solar fixture。
 *
 * @param solarTerms 节气 fixture。
 * @param solarLongitudes 太阳黄经 fixture。
 * @returns 写文件完成时不返回值。
 */
async function writeFixtures(solarTerms, solarLongitudes) {
  await mkdir(OUTPUT_DIR, { recursive: true });

  await writeFile(
    path.join(OUTPUT_DIR, "terms.json"),
    `${JSON.stringify({ solarTerms }, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    path.join(OUTPUT_DIR, "longitudes.json"),
    `${JSON.stringify({ solarLongitudes }, null, 2)}\n`,
    "utf8"
  );
}

async function main() {
  const samples = unwrapSamples(await fetchSolarLongitudeSamples());
  const solarTerms = buildSolarTerms(samples);
  const solarLongitudes = buildSolarLongitudes(solarTerms);

  validateFixtures(solarTerms, solarLongitudes);
  await writeFixtures(solarTerms, solarLongitudes);

  console.log(`Wrote ${solarTerms.length} solar terms to standards/solar/terms.json`);
  console.log(
    `Wrote ${solarLongitudes.length} solar longitude samples to standards/solar/longitudes.json`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
