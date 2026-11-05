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

  const records = works.filter(item => item.workType === "tv" && item.platformUrl)
    .map((item, index) => {
      const seriesId = getTverModeSeriesId(item.platformUrl);
      const episodeId = String(item.episodeId || "").trim();
      const candidate = reportData.reports[seriesId];
      // レポートが旧エピソードのものなら紐付けない。
      const report = candidate && episodeId && candidate.episodeId === episodeId ? candidate : null;
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
        members: Array.isArray(item.members) ? item.members : [],
        title: item.title || item.programName || report?.programTitle || "TVer",
        subtitle: report?.subtitle || "",
        broadcastDate: report?.broadcastDate || "",
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
  records.sort((a, b) => {
    if (a.broadcastDate && b.broadcastDate) return b.broadcastDate.localeCompare(a.broadcastDate) || a.index - b.index;
    if (a.broadcastDate) return -1;
    if (b.broadcastDate) return 1;
    return a.index - b.index;
  });
  return { updatedAt: reportData.updatedAt || "", records };
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
