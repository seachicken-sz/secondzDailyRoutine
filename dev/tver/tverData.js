// TVerモード：既存のグラフデータを画面表示向けに整形
const TVER_MODE_REPORT_PATH = "../graph/tverRankingReport.json";
const TVER_MODE_WORKS_PATH = "../data/memberWorksJson.json";
const TVER_MODE_GRAPH_PATH = "../graph/";

async function loadTverModeData() {
  const [reportResponse, worksResponse] = await Promise.all([
    fetch(TVER_MODE_REPORT_PATH, { cache: "no-store" }),
    fetch(TVER_MODE_WORKS_PATH, { cache: "no-store" })
  ]);
  if (!reportResponse.ok || !worksResponse.ok) {
    throw new Error("TVerデータを取得できませんでした");
  }

  const [reportData, works] = await Promise.all([
    reportResponse.json(),
    worksResponse.json()
  ]);
  if (!reportData?.reports || !Array.isArray(works)) {
    throw new Error("TVerデータ形式が正しくありません");
  }

  // 配信中の対象はmemberWorksJsonのTVerリンクを基準にする。
  // 一覧から除いたエピソードは表示せず、ランキングだけの古い履歴も表示しない。
  const activeWorks = works.filter((item) =>
    item.workType === "tv" && item.platformUrl && item.episodeId
  );
  const records = activeWorks.map((item) => {
    const seriesId = getTverModeSeriesId(item.platformUrl);
    const report = reportData.reports[seriesId];
    if (!report || String(report.episodeId || "") !== String(item.episodeId)) return null;
    return {
      seriesId,
      episodeId: String(item.episodeId),
      title: report.programTitle || item.title || "TVer",
      subtitle: report.subtitle || "",
      broadcastDate: report.broadcastDate || "",
      updatedAt: report.updatedAt || reportData.updatedAt || "",
      seriesUrl: item.platformUrl,
      graphUrl: TVER_MODE_GRAPH_PATH + "?id=" + encodeURIComponent(seriesId),
      likesText: String(report.likes ?? "—"),
      currentLikes: getTverModeLatestValue(report.likePoints, "likes"),
      likeImprovement: getTverModeImprovement(report.likePoints, "likes", false),
      previousLikes: getTverModeComparable(report.previousLikePoints, report.likePoints, "likes"),
      previousBestLikes: getTverModeMaximum(report.previousLikePoints, "likes"),
      rankings: Array.isArray(report.rankings) ? report.rankings.map((rank) => ({
        label: String(rank.label || rank.type || "ランキング"),
        currentRank: getTverModeRank(rank.currentRank),
        improvement: getTverModeImprovement(rank.currentPoints, "rank", true),
        previousRank: getTverModeComparable(rank.previousPoints, rank.currentPoints, "rank"),
        previousBestRank: getTverModeMinimum(rank.previousPoints, "rank")
      })) : []
    };
  }).filter(Boolean);
  records.sort((a, b) => (b.broadcastDate || "").localeCompare(a.broadcastDate || ""));
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
