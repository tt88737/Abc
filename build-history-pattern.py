import json
import sys
from pathlib import Path


NUMS_ALL = [f"{i:02d}" for i in range(1, 50)]
POOL_SIZE = 8


def display_year(row):
    date = str(row.get("date") or "")
    return date[:4] if len(date) >= 4 else str(row.get("year") or "")


def special_num(row):
    balls = row.get("balls") or []
    if len(balls) < 7:
        return ""
    return str(balls[6].get("numberText") or balls[6].get("number") or "").zfill(2)


def fixed_five_windows(rows):
    by_year = {}
    for row in rows:
        year = display_year(row)
        if year:
            by_year.setdefault(year, []).append(row)
    out = []
    for year, year_rows in sorted(by_year.items()):
        sorted_rows = sorted(year_rows, key=lambda row: int(row.get("issue") or 0))
        max_issue = max((int(row.get("issue") or 0) for row in sorted_rows), default=0)
        for start in range(1, max_issue + 1, 5):
            end = start + 4
            chunk = [row for row in sorted_rows if start <= int(row.get("issue") or 0) <= end]
            if len(chunk) < 5:
                continue
            nums = sorted({special_num(row) for row in chunk if special_num(row)}, key=int)
            out.append({"year": year, "start": start, "end": end, "count": len(chunk), "nums": nums})
    return out


def num_window_masks(windows):
    masks = {num: 0 for num in NUMS_ALL}
    for idx, win in enumerate(windows):
        bit = 1 << idx
        for num in win["nums"]:
            if num in masks:
                masks[num] |= bit
    return masks


def exact_best_pool(windows):
    if not windows:
        return NUMS_ALL[:POOL_SIZE], 0

    masks_by_num = num_window_masks(windows)
    candidates = sorted(NUMS_ALL, key=lambda num: (-masks_by_num[num].bit_count(), int(num)))
    masks = [masks_by_num[num] for num in candidates]
    suffix_union = [0] * (len(candidates) + 1)
    for idx in range(len(candidates) - 1, -1, -1):
        suffix_union[idx] = suffix_union[idx + 1] | masks[idx]

    best_count = -1
    best_nums = []

    def coverage_upper_bound(start, covered, slots):
        gains = sorted(((mask & ~covered).bit_count() for mask in masks[start:]), reverse=True)
        return min(len(windows), covered.bit_count() + sum(gains[:slots]))

    def better(nums, count):
        nonlocal best_count, best_nums
        sorted_nums = sorted(nums, key=int)
        if count > best_count:
            return True
        if count == best_count and (not best_nums or [int(n) for n in sorted_nums] < [int(n) for n in best_nums]):
            return True
        return False

    def dfs(start, chosen, covered):
        nonlocal best_count, best_nums
        slots = POOL_SIZE - len(chosen)
        if slots == 0:
            count = covered.bit_count()
            if better(chosen, count):
                best_count = count
                best_nums = sorted(chosen, key=int)
            return
        if len(candidates) - start < slots:
            return
        if (covered | suffix_union[start]).bit_count() < best_count:
            return
        if coverage_upper_bound(start, covered, slots) < best_count:
            return

        best_next = []
        for idx in range(start, len(candidates)):
            gain = (masks[idx] & ~covered).bit_count()
            best_next.append((gain, -int(candidates[idx]), idx))
        best_next.sort(reverse=True)

        used_first = set()
        for _, _, idx in best_next:
            if idx < start or idx in used_first:
                continue
            used_first.add(idx)
            dfs(idx + 1, chosen + [candidates[idx]], covered | masks[idx])
            if (covered | suffix_union[start]).bit_count() <= best_count:
                break

    dfs(0, [], 0)
    if len(best_nums) < POOL_SIZE:
        for num in NUMS_ALL:
            if num not in best_nums:
                best_nums.append(num)
            if len(best_nums) >= POOL_SIZE:
                break
    return best_nums[:POOL_SIZE], max(best_count, 0)


def coverage_stats(windows, pool):
    pool_set = set(pool)
    evaluated = []
    for win in windows:
        covered = any(num in pool_set for num in win["nums"])
        evaluated.append({**win, "covered": covered})
    covered_count = sum(1 for win in evaluated if win["covered"])
    misses = [win for win in evaluated if not win["covered"]]
    max_miss = 0
    current_miss = 0
    run = 0
    for win in evaluated:
        if win["covered"]:
            max_miss = max(max_miss, run)
            run = 0
        else:
            run += 1
    max_miss = max(max_miss, run)
    for win in reversed(evaluated):
        if win["covered"]:
            break
        current_miss += 1
    total = len(evaluated)
    hit_rate = round(covered_count / total * 100, 2) if total else 0
    return {
        "windows": evaluated,
        "covered": covered_count,
        "misses": misses,
        "total": total,
        "hitRate": hit_rate,
        "currentMiss": current_miss,
        "maxMiss": max_miss,
    }


def build_item(source, rows, range_name, generated_at):
    source_rows = [row for row in rows if row.get("source") == source]
    latest = max(source_rows, key=lambda row: (str(row.get("date") or ""), int(row.get("issue") or 0)), default=None)
    current_year = display_year(latest) if latest else ""
    scoped_rows = source_rows if range_name == "all" else [row for row in source_rows if display_year(row) == current_year]
    windows = fixed_five_windows(scoped_rows)
    pool, _ = exact_best_pool(windows)
    stats = coverage_stats(windows, pool)
    years = sorted({display_year(row) for row in scoped_rows if display_year(row)}, reverse=True)
    year_pools = []
    for year in years:
        year_windows = [win for win in windows if win["year"] == year]
        year_pool, _ = exact_best_pool(year_windows)
        year_stats = coverage_stats(year_windows, year_pool)
        year_pools.append({
            "year": year,
            "pool": year_pool,
            "exact": True,
            "covered": year_stats["covered"],
            "total": year_stats["total"],
            "hitRate": year_stats["hitRate"],
            "currentMiss": year_stats["currentMiss"],
            "maxMiss": year_stats["maxMiss"],
        })
    return {
        "source": source,
        "range": range_name,
        "currentYear": current_year,
        "pool": pool,
        "exact": True,
        "method": "exact-49c8-window-coverage",
        "computedAt": generated_at,
        "yearPools": year_pools,
        **stats,
    }


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    generated_at = sys.argv[2] if len(sys.argv) > 2 else ""
    records_path = root / "data" / "records.json"
    state_path = root / "data" / "history-pattern-state.json"
    payload = json.loads(records_path.read_text(encoding="utf-8"))
    rows = payload.get("records", [])
    items = []
    for source in ("am", "hk"):
        for range_name in ("year", "all"):
            items.append(build_item(source, rows, range_name, generated_at))
    state_path.write_text(json.dumps({"generatedAt": generated_at, "items": items}, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
