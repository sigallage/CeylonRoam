from __future__ import annotations

import math
EARTH_RADIUS_KM = 6371.0088


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points on Earth."""
    lat1_r = math.radians(lat1)
    lng1_r = math.radians(lng1)
    lat2_r = math.radians(lat2)
    lng2_r = math.radians(lng2)

    dlat = lat2_r - lat1_r
    dlng = lng2_r - lng1_r

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return EARTH_RADIUS_KM * c


def build_distance_matrix(coords: list[tuple[float, float]]) -> list[list[float]]:
    n = len(coords)
    dist = [[0.0] * n for _ in range(n)]
    for i in range(n):
        lat1, lng1 = coords[i]
        for j in range(i + 1, n):
            lat2, lng2 = coords[j]
            d = haversine_km(lat1, lng1, lat2, lng2)
            dist[i][j] = d
            dist[j][i] = d
    return dist


def path_length(dist: list[list[float]], order: list[int], return_to_start: bool) -> float:
    if len(order) <= 1:
        return 0.0
    total = 0.0
    for a, b in zip(order, order[1:]):
        total += dist[a][b]
    if return_to_start and len(order) > 1:
        total += dist[order[-1]][order[0]]
    return total


def two_opt_open_path_any(cost: list[list[float]], order: list[int]) -> list[int]:
    """2-opt improvement for an OPEN path that works for asymmetric matrices.

    Uses full path cost evaluation per swap (OK for small N).
    """
    n = len(order)
    if n < 4:
        return order

    best = order
    best_cost = path_length(cost, best, return_to_start=False)

    improved = True
    while improved:
        improved = False
        for i in range(1, n - 2):
            for k in range(i + 1, n - 1):
                candidate = best[:]
                candidate[i : k + 1] = reversed(candidate[i : k + 1])
                c = path_length(cost, candidate, return_to_start=False)
                if c + 1e-12 < best_cost:
                    best = candidate
                    best_cost = c
                    improved = True
        # loop again if improved

    return best


def two_opt_cycle_any(cost: list[list[float]], order: list[int]) -> list[int]:
    """2-opt improvement for a closed tour that works for asymmetric matrices."""
    n = len(order)
    if n < 4:
        return order

    best = order
    best_cost = path_length(cost, best, return_to_start=True)

    improved = True
    while improved:
        improved = False
        for i in range(1, n - 1):
            for k in range(i + 1, n):
                candidate = best[:]
                candidate[i:k] = reversed(candidate[i:k])
                c = path_length(cost, candidate, return_to_start=True)
                if c + 1e-12 < best_cost:
                    best = candidate
                    best_cost = c
                    improved = True

    return best


def greedy_nearest_neighbor(dist: list[list[float]], start: int = 0) -> list[int]:
    n = len(dist)
    if n == 0:
        return []

    unvisited = set(range(n))
    order = [start]
    unvisited.remove(start)

    current = start
    while unvisited:
        next_node = min(unvisited, key=lambda j: dist[current][j])
        order.append(next_node)
        unvisited.remove(next_node)
        current = next_node

    return order


def best_greedy_route(dist: list[list[float]], try_all_starts: bool) -> list[int]:
    n = len(dist)
    if n == 0:
        return []
    if not try_all_starts or n == 1:
        return greedy_nearest_neighbor(dist, 0)

    best_order: list[int] | None = None
    best_len = float("inf")
    for start in range(n):
        order = greedy_nearest_neighbor(dist, start)
        length = path_length(dist, order, return_to_start=False)
        if length < best_len:
            best_len = length
            best_order = order
    return best_order or greedy_nearest_neighbor(dist, 0)


def optimize_order_from_cost_matrix(
    cost: list[list[float]],
    *,
    return_to_start: bool,
    try_all_starts: bool,
) -> list[int]:
    order = best_greedy_route(cost, try_all_starts=try_all_starts)
    if return_to_start:
        return two_opt_cycle_any(cost, order)
    return two_opt_open_path_any(cost, order)


def optimize_route(
    coords: list[tuple[float, float]],
    return_to_start: bool = False,
    try_all_starts: bool = True,
) -> tuple[list[int], list[list[float]]]:
    dist = build_distance_matrix(coords)
    order = optimize_order_from_cost_matrix(
        dist,
        return_to_start=return_to_start,
        try_all_starts=try_all_starts,
    )

    return order, dist
