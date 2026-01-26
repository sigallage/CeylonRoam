from __future__ import annotations

import math
from dataclasses import dataclass


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


def two_opt_open_path(dist: list[list[float]], order: list[int]) -> list[int]:
    """2-opt improvement for an OPEN path (no edge from end->start)."""
    n = len(order)
    if n < 4:
        return order

    improved = True
    while improved:
        improved = False
        for i in range(1, n - 2):
            a = order[i - 1]
            b = order[i]
            for k in range(i + 1, n - 1):
                c = order[k]
                d = order[k + 1]

                current = dist[a][b] + dist[c][d]
                swapped = dist[a][c] + dist[b][d]

                if swapped + 1e-12 < current:
                    order[i : k + 1] = reversed(order[i : k + 1])
                    improved = True
        # loop again if improved
    return order


def two_opt_cycle(dist: list[list[float]], order: list[int]) -> list[int]:
    """2-opt improvement for a closed tour (includes end->start)."""
    n = len(order)
    if n < 4:
        return order

    improved = True
    while improved:
        improved = False
        for i in range(n - 1):
            a = order[i]
            b = order[(i + 1) % n]
            for k in range(i + 2, n - (0 if i > 0 else 1)):
                c = order[k % n]
                d = order[(k + 1) % n]

                current = dist[a][b] + dist[c][d]
                swapped = dist[a][c] + dist[b][d]

                if swapped + 1e-12 < current:
                    # reverse segment (i+1..k)
                    i1 = i + 1
                    k1 = k
                    order[i1 : k1 + 1] = reversed(order[i1 : k1 + 1])
                    improved = True
        # loop again if improved

    return order


def optimize_route(
    coords: list[tuple[float, float]],
    return_to_start: bool = False,
    try_all_starts: bool = True,
) -> tuple[list[int], list[list[float]]]:
    dist = build_distance_matrix(coords)
    order = best_greedy_route(dist, try_all_starts=try_all_starts)

    if return_to_start:
        order = two_opt_cycle(dist, order)
    else:
        order = two_opt_open_path(dist, order)

    return order, dist
