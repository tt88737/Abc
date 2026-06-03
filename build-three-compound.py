import json
import random
import sys
from itertools import combinations
from pathlib import Path


NUMS_ALL = [f"{i:02d}" for i in range(1, 50)]


def regular_nums(row):
    return [
        str((ball.get("numberText") or ball.get("number") or "")).zfill(2)
        for ball in (row.get("balls") or [])[:6]
    ]


def display_year(row):
    date = str(row.get("date") or "")
    return date[:4] if len(date) >= 4 else str(row.get("year") or "")


def windows(rows):
    if not rows:
        return []
    max_issue = max(int(row.get("issue") or 0) for row in rows)
    out = []
    for start in range(1, max_issue + 1, 5):
        end = start + 4
        chunk = [row for row in rows if start <= int(row.get("issue") or 0) <= end]
        if chunk:
            out.append({"start": start, "end": end, "count": len(chunk), "rows": chunk})
    return out


def draw_hit(row, pool):
    return len(set(regular_nums(row)) & set(pool)) >= 3


def coverage(rows, pool):
    result = []
    pool_set = set(pool)
    for item in windows(rows):
        hits = []
        for row in item["rows"]:
            matched = sorted(set(regular_nums(row)) & pool_set, key=int)
            if len(matched) >= 3:
                hits.append({"issue": int(row.get("issue") or 0), "date": row.get("date"), "matched": matched})
        result.append({
            "start": item["start"],
            "end": item["end"],
            "count": item["count"],
            "hits": hits,
            "covered": bool(hits),
        })
    return result


def score_pool(rows, pool):
    wins = coverage(rows, pool)
    completed = [item for item in wins if item["count"] >= 5]
    covered = sum(1 for item in completed if item["covered"])
    hit_draws = sum(len(item["hits"]) for item in completed)
    recent = sum(idx for idx, item in enumerate(completed[-10:], 1) if item["covered"])
    return covered, hit_draws, recent, -sum(int(num) for num in pool)


def frequency_order(rows):
    counts = {num: 0 for num in NUMS_ALL}
    for row in rows:
        for num in regular_nums(row):
            counts[num] += 1
    return sorted(NUMS_ALL, key=lambda num: (-counts[num], int(num)))


def greedy_seed(rows, size, order):
    selected = []
    while len(selected) < size:
        best_num = None
        best_score = None
        for num in order:
            if num in selected:
                continue
            candidate = sorted(selected + [num], key=int)
            score = score_pool(rows, candidate)
            if best_score is None or score > best_score:
                best_score = score
                best_num = num
        selected = sorted(selected + [best_num], key=int)
    return selected


def improve(rows, start_pool):
    selected = sorted(start_pool, key=int)
    best_score = score_pool(rows, selected)
    improved = True
    rounds = 0
    while improved and rounds < 80:
        improved = False
        rounds += 1
        for out_num in selected[:]:
            outside = [num for num in NUMS_ALL if num not in selected]
            for in_num in outside:
                candidate = sorted([num for num in selected if num != out_num] + [in_num], key=int)
                score = score_pool(rows, candidate)
                if score > best_score:
                    selected = candidate
                    best_score = score
                    improved = True
                    break
            if improved:
                break
    return selected, best_score


def best_pool(rows, size):
    freq = frequency_order(rows)
    seeds = [
        greedy_seed(rows, size, NUMS_ALL),
        greedy_seed(rows, size, freq),
        sorted(freq[:size], key=int),
    ]
    rng = random.Random(20260602 + size + len(rows))
    for _ in range(60):
        seeds.append(sorted(rng.sample(NUMS_ALL, size), key=int))
    best = None
    best_score = None
    for seed_pool in seeds:
        pool, score = improve(rows, seed_pool)
        if best_score is None or score > best_score:
            best = pool
            best_score = score
    wins = coverage(rows, best)
    metrics = pool_metrics(wins)
    return {
        "poolSize": size,
        "pool": best,
        "windows": wins,
        **metrics,
        "computedBy": "python-local-search",
    }


def pool_metrics(wins):
    completed = [item for item in wins if item["count"] >= 5]
    total = len(completed)
    covered = sum(1 for item in completed if item["covered"])
    hit_draws = sum(len(item["hits"]) for item in completed)
    hit_rate = round(covered / total * 100, 2) if total else 0
    recent = completed[-10:]
    recent_covered = sum(1 for item in recent if item["covered"])
    recent_hit_rate = round(recent_covered / len(recent) * 100, 2) if recent else 0
    current_miss = 0
    for item in reversed(completed):
        if item["covered"]:
            break
        current_miss += 1
    max_miss = 0
    run = 0
    for item in completed:
        if item["covered"]:
            max_miss = max(max_miss, run)
            run = 0
        else:
            run += 1
    max_miss = max(max_miss, run)
    health_status = "正常观察"
    health_reason = "完整窗口覆盖表现稳定"
    if total >= 2 and current_miss >= 2:
        health_status = "降权观察"
        health_reason = "连续完整漏窗达到2个"
    if total >= 3 and max_miss > 0 and current_miss > max_miss:
        health_status = "触发重算"
        health_reason = "当前完整漏窗超过历史最大漏窗"
    if recent and recent_hit_rate + 20 < hit_rate:
        health_status = "降权观察"
        health_reason = "近10完整窗口覆盖率明显低于全年"
    return {
        "covered": covered,
        "total": total,
        "hitDraws": hit_draws,
        "hitRate": hit_rate,
        "recentCovered": recent_covered,
        "recentTotal": len(recent),
        "recentHitRate": recent_hit_rate,
        "currentMiss": current_miss,
        "maxMiss": max_miss,
        "healthStatus": health_status,
        "healthReason": health_reason,
    }


def item_better(new_item, old_item):
    if not old_item:
        return True
    return (
        int(new_item.get("covered", 0)),
        int(new_item.get("hitDraws", 0)),
        float(new_item.get("hitRate", 0)),
    ) > (
        int(old_item.get("covered", 0)),
        int(old_item.get("hitDraws", 0)),
        float(old_item.get("hitRate", 0)),
    )


def pool_diff(before_pool, after_pool):
    before = sorted([str(num).zfill(2) for num in before_pool], key=int)
    after = sorted([str(num).zfill(2) for num in after_pool], key=int)
    before_set = set(before)
    after_set = set(after)
    kept = [num for num in after if num in before_set]
    added = [num for num in after if num not in before_set]
    removed = [num for num in before if num not in after_set]
    change_count = len(added) + len(removed)
    if not before:
        change_level = "首次生成"
    elif change_count <= 2:
        change_level = "稳定"
    elif change_count <= 4:
        change_level = "中等变化"
    else:
        change_level = "重构"
    return {
        "kept": kept,
        "added": added,
        "removed": removed,
        "changeCount": change_count,
        "changeLevel": change_level,
    }


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    records_path = root / "data" / "records.json"
    state_path = root / "data" / "three-compound-state.json"
    generated_at = sys.argv[2] if len(sys.argv) > 2 else ""
    payload = json.loads(records_path.read_text(encoding="utf-8"))
    records = payload.get("records", [])
    previous = {}
    if state_path.exists():
        try:
            old_payload = json.loads(state_path.read_text(encoding="utf-8"))
            previous = {(item.get("source"), str(item.get("year"))): item for item in old_payload.get("items", [])}
        except Exception:
            previous = {}
    items = []
    for source in ("am", "hk"):
        source_rows = [row for row in records if row.get("source") == source and row.get("date")]
        if not source_rows:
            continue
        latest = max(source_rows, key=lambda row: (str(row.get("date") or ""), int(row.get("issue") or 0)))
        year = display_year(latest)
        year_rows = sorted([row for row in source_rows if display_year(row) == year], key=lambda row: int(row.get("issue") or 0))
        old_item = previous.get((source, year), {})
        old_pools = {int(item.get("poolSize")): item for item in old_item.get("pools", []) if item.get("poolSize")}
        pools = []
        changed = False
        for size in (5, 6, 7, 8):
            candidate = best_pool(year_rows, size)
            old_pool = old_pools.get(size)
            if item_better(candidate, old_pool):
                before_pool = old_pool.get("pool", []) if old_pool else []
                before_covered = old_pool.get("covered") if old_pool else None
                before_hit_rate = old_pool.get("hitRate") if old_pool else None
                diff = pool_diff(before_pool, candidate["pool"])
                old_history = list((old_pool or {}).get("changeHistory", []))
                candidate["status"] = "有变更" if old_pool else "首次生成"
                candidate["changeTime"] = generated_at
                candidate["changeHistory"] = [{
                    "changedAt": generated_at,
                    "issue": int(latest.get("issue") or 0),
                    "beforePool": before_pool,
                    "afterPool": candidate["pool"],
                    "beforeCovered": before_covered,
                    "afterCovered": candidate["covered"],
                    "beforeHitRate": before_hit_rate,
                    "afterHitRate": candidate["hitRate"],
                    **diff,
                    "reason": "发现更优完整窗口覆盖池" if old_pool else "首次生成三中三复式池",
                }] + old_history[:29]
                changed = True
                pools.append(candidate)
            else:
                old_pool["status"] = "无变更"
                refreshed = coverage(year_rows, old_pool.get("pool", []))
                old_pool.update(pool_metrics(refreshed))
                old_pool["windows"] = refreshed
                old_pool["changeHistory"] = list(old_pool.get("changeHistory", []))
                pools.append(old_pool)
        items.append({
            "source": source,
            "year": year,
            "latestIssue": int(latest.get("issue") or 0),
            "computedAt": generated_at,
            "status": "有变更" if changed else "无变更",
            "pools": pools,
        })
    state_path.write_text(json.dumps({"generatedAt": generated_at, "items": items}, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
