# Route optimization — Global Express

Live UI: [`route.html`](../route.html)

## Features implemented

| Feature | Status |
|--------|--------|
| Multi-stop list (add / remove / clear) | Yes |
| Depot lat/lng | Yes |
| Package **demand** per stop | Yes |
| Vehicle **capacity** | Yes |
| Fleet size (max vehicles) | Yes |
| **Time windows** (start–end minutes) | Yes (soft: flags LATE) |
| Service time + speed for ETAs | Yes |
| Distance matrix (Haversine miles) | Yes |
| **Nearest neighbor** TSP | Yes |
| **2-opt** local search | Yes |
| **Clarke–Wright savings** CVRP | Yes |
| Multi-vehicle route output | Yes |
| Schematic map | Yes |
| Sample Houston + Anita/Peggy-style stops | Yes |

## Algorithms (deeper dive)

### 1. Distance layer
Great-circle (Haversine) miles between every pair of nodes.  
Production upgrade: replace with OSRM / Google Distance Matrix (road time).

### 2. Nearest neighbor (construction)
From the depot, repeatedly append the closest unvisited customer, then return to depot.  
Complexity: \(O(n^2)\). Quality: often 15–25% above optimal on Euclidean TSP.

### 3. 2-opt (improvement)
While an improving edge swap exists: reverse a segment of the tour so two edges are replaced by two shorter ones.  
Fixed depot endpoints. Complexity: roughly \(O(n^2)\) per pass; repeated until local optimum.

### 4. Clarke–Wright savings (CVRP)
1. Start with one route per customer: `Depot → i → Depot`.
2. Savings \(s(i,j) = d(0,i) + d(0,j) - d(i,j)\).
3. Sort savings descending; merge routes if:
   - \(i\) and \(j\) are endpoints of **different** routes,
   - combined demand ≤ capacity.
4. Optionally force-merge toward max vehicle count if capacity allows.
5. Run **2-opt** on each resulting route.

### 5. Time windows (soft)
Drive time from distance / speed; wait if early; count **LATE** if arrival after window end.  
Hard TW would reject merges that violate windows (future enhancement).

## Not yet (roadmap)

- Hard time-window constraints in merge logic
- ALNS / LNS destroy-repair
- Road network distances
- Real-time reoptimization when a stop is added mid-day
- Pickup–delivery pairs (PDP) for car-buy transport

## How to use

1. Open `/route.html`
2. **Load sample** or add stops (lat, lng, demand, windows)
3. Set vehicles + capacity
4. Choose **CVRP** or **TSP**
5. **Optimize routes** → ordered stops, miles, load, timeline
