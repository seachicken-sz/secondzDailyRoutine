// TVerモード：既存のグラフデータを画面表示向けに整形
const TVER_MODE_REPORT_PATH = "../graph/tverRankingReport.json";
const TVER_MODE_WORKS_PATH = "../data/memberWorksJson.json";
const TVER_MODE_GRAPH_PATH = "../graph/";

async function loadTverModeData() {
  // memberWorksを表示の正とする。レポート取得失敗時も番組一覧を表示。
  const worksResponse = await fetch(TVER_MODE_WORKS_PATH, { cache: "no-store" });
  if (!worksResponse.ok) throw new Error("memberWorksの取得に失敗しました");
  const works = await worksResponse.json();
  if (!Array.isArray(works)) throw new Error("memberWorksの形式が正しくありません");

  let reportData = { reports: {}, updatedAt: "" };
  try {
    const response = await fetch(TVER_MODE_REPORT_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error("ランキング取得失敗: " + response.status);
    const data = await response.json();
    if (data && typeof data.reports === "object" && data.reports) reportData = data;
  } catch (error) {
    console.warn("ランキング取得不可。簡易カードを表示します", error);
  }

  const nowJst = getTverModeJapanNow();
  const records = works.filter(item => item.workType === "tv" && item.platformUrl)
    .map((item, index) => {
      const seriesId = getTverModeSeriesId(item.platformUrl);
      const episodeId = String(item.episodeId || "").trim();
      const candidate = reportData.reports[seriesId];
      // レポートが旧エピソードのものなら紐付けない。
      const report = candidate && episodeId && String(candidate.episodeId || "") === episodeId ? candidate : null;
      // ランキングの有無に関わらず、memberWorksで判明しているエピソード情報を表示する。
      const broadcastDate = item.broadcastDate || report?.broadcastDate || "";
      const episodeTitle = item.episodeTitle || item.subtitle || report?.subtitle || "";
      const rankings = Array.isArray(report?.rankings) ? report.rankings.map(rank => ({
        label: String(rank.label || rank.type || "ランキング"),
        currentRank: getTverModeRank(rank.currentRank),
        bestRank: getTverModeMinimum(rank.currentPoints, "rank"),
        improvement: getTverModeImprovement(rank.currentPoints, "rank", true),
        previousRank: getTverModeComparable(rank.previousPoints, rank.currentPoints, "rank"),
        previousBestRank: getTverModeMinimum(rank.previousPoints, "rank")
      })) : [];
      return {
        index, seriesId, episodeId,
        // 同一エピソードの放送日を優先。未取得番組は登録曜日・時刻から直近の放送予定日時を推定。
        sortTimestamp: getTverModeSortTimestamp(broadcastDate, item.weekday, item.time, nowJst),
        members: Array.isArray(item.members) ? item.members : [],
        title: item.title || item.programName || report?.programTitle || "TVer",
        subtitle: episodeTitle,
        broadcastDate,
        updatedAt: report?.updatedAt || "",
        seriesUrl: item.platformUrl,
        graphUrl: report ? TVER_MODE_GRAPH_PATH + "?id=" + encodeURIComponent(seriesId) : "",
        hasReport: Boolean(report),
        rankings,
        displayRankType: rankings.some(rank => rank.currentRank !== null) ? "current" : "best",
        likesText: report?.likes == null ? "—" : String(report.likes),
        favoritesText: report?.favorites == null ? "—" : String(report.favorites),
        likeImprovement: report ? getTverModeImprovement(report.likePoints, "likes", false) : null,
        previousLikes: report ? getTverModeComparable(report.previousLikePoints, report.likePoints, "likes") : null,
        previousBestLikes: report ? getTverModeMaximum(report.previousLikePoints, "likes") : null
      };
    });
  records.sort((a, b) => b.sortTimestamp - a.sortTimestamp || a.index - b.index);
  return { updatedAt: reportData.updatedAt || "", records };
}

// 曜日・時刻による並び順は日本時間を基準にする（放送日として画面には表示しない）。
function getTverModeJapanNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date()).filter(x => x.type !== "literal").map(x => [x.type, Number(x.value)]));
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
}
function getTverModeSortTimestamp(broadcastDate, weekday, time, nowJst) {
  if (broadcastDate) {
    const match = String(broadcastDate).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return 0;
  const current = new Date(nowJst);
  const currentWeekday = current.getUTCDay();
  const m = String(time || "00:00").match(/^(\d{1,2}):(\d{2})$/);
  const hours = m ? Number(m[1]) : 0;
  const minutes = m ? Number(m[2]) : 0;
  const startOfToday = Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate());
  let estimated = startOfToday - ((currentWeekday - weekday + 7) % 7) * 86400000 +
    (hours * 60 + minutes) * 60000;
  if (estimated > nowJst) estimated -= 7 * 86400000;
  return estimated;
}

function getTverModeSeriesId(url) {
  try {
    const pathname = new URL(url, location.href).pathname.split("/").filter(Boolean);
    return pathname[0] === "series" ? (pathname[1] || "") : "";
  } catch (_) {
    return "";
  }
}

function getTverModeRank(rank) {
  const value = Number(rank);
  return Number.isInteger(value) && value > 0 ? value : null;
}
function getTverModePoints(points, field) {
  if (!Array.isArray(points)) return [];
  return points.filter((point) => Number.isFinite(Number(point.hour)) &&
    Number.isFinite(Number(point[field])) && Number(point[field]) > 0
  ).map((point) => ({ hour: Number(point.hour), value: Number(point[field]) }))
    .sort((a, b) => a.hour - b.hour);
}
function getTverModeLatestValue(points, field) {
  const list = getTverModePoints(points, field);
  return list.length ? list[list.length - 1].value : null;
}
function getTverModeImprovement(points, field, lowerIsBetter) {
  const list = getTverModePoints(points, field);
  if (list.length < 2) return null;
  const latest = list[list.length - 1];
  const earlier = list[list.length - 2];
  // 取得時刻の差が分かるよう、実際の記録間隔（時間単位）も返す。
  const delta = lowerIsBetter ? earlier.value - latest.value : latest.value - earlier.value;
  return delta > 0 ? { delta, hours: latest.hour - earlier.hour } : null;
}
function getTverModeComparable(previousPoints, currentPoints, field) {
  const latest = getTverModePoints(currentPoints, field).at(-1);
  if (!latest) return null;
  const list = getTverModePoints(previousPoints, field);
  if (!list.length) return null;
  const nearest = list.reduce((best, point) =>
    Math.abs(point.hour - latest.hour) < Math.abs(best.hour - latest.hour) ? point : best
  );
  if (Math.abs(nearest.hour - latest.hour) > 1) return null;
  return { value: nearest.value, hour: nearest.hour };
}
function getTverModeMaximum(points, field) {
  const list = getTverModePoints(points, field);
  return list.length ? Math.max(...list.map((point) => point.value)) : null;
}
function getTverModeMinimum(points, field) {
  const list = getTverModePoints(points, field);
  return list.length ? Math.min(...list.map((point) => point.value)) : null;
}
