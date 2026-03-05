import json

raw_data = """
1 0 0 4.5 0 42 0 0 0 0 0 0 14
2 4 42.5 15.5 0 63 6.5 0 0 0 0 54.5 0
3 0 0 0 1 18.5 0 0 0 0 0 26 2
4 0 53.5 20 0.5 0 21 0 0 0 0 4.5 2
5 0 20 0 29 0 0 0 0 0 0 46.5 3.5
6 6 0 34 46.5 0 0 0 0 0 0 0 0
7 0 0 33 9 2 0 0 0 0 0 50 0
8 0 0 24 7.5 0.5 0 0 0 0 0 8.5 0
9 0 0 21 0 0 0 0 0 0 52 50 0
10 0 0 2 0 0 0 0 0 0 0 15 0
11 0 0 6.5 23 0 0 0 0 0 0 21.5 0
12 0 0 7.5 6 0 0 0 0 0 0 0 0
13 0 6 12.5 3 0 0 0 0 0 0 1 0
14 0 0 0 16 2.5 0 0 0 0 0 0 31
15 0 0 7.5 9.5 0 0 0 0 0 0 0 20
16 0 0 0 2.5 15.5 0 0 0 0 0 12.5 3
17 0 18 0 0 0 0 0 0 0 0 0 3
18 0 2.5 7.5 0 0 0 0 0 0 9 0 21
19 0 0 0 0 0 0 0 0 0 0 0 0.5
20 0 0 5 2.5 0 0 1 0 0 0 3 34.5
21 12.5 0 0 0 8.5 0 10.5 0 0 25 17.5 36
22 0 0 10 5.5 0 0 0 0 0 0 38 0
23 0 0 7 0 0 0 8 0 0 1 13.5 0
24 0 0 9.5 28.5 0 0 0 0 0 38.5 5.5 15
25 0 0 35 0 0 0 0 0 0 6 14.5 34
26 0 0 9 10 0 0 0 0 0 27.5 0 9
27 0 0 16 43 0 0 0 0 0 23.5 0 12
28 41 18 64 10 0 0 0 0 0 26 0 3.5
29 0  1 0 0 52.5 0 0 0 3 25 26
30 5.5  18.5 0 0 5.5 0 0 0 1.5 0 5.5
31 6.5  0  0  0  0 0.5  5
"""

matrix = []
for line in raw_data.strip().split("\n"):
    parts = line.split()[1:] # skip day number
    row = []
    # 29, 30, 31 have missing days for Feb/etc. Let's fix missing parts
    # For day 29: Jan Feb Mar Apr Mei Jun Jul Ags Sep Okt Nop Des
    # "29 0  1 0 0 52.5 0 0 0 3 25 26" -> Feb is empty.
    
    if line.startswith("29"):
        row = [0, None, 1, 0, 0, 52.5, 0, 0, 0, 3, 25, 26]
    elif line.startswith("30"):
        row = [5.5, None, 18.5, 0, 0, 5.5, 0, 0, 0, 1.5, 0, 5.5]
    elif line.startswith("31"):
        row = [6.5, None, 0, None, 0, None, 0, 0.5, None, 0.5, None, 5]
    else:
        for p in parts:
            if p == '-' or p == '':
                row.append(None)
            else:
                row.append(float(p))
    matrix.append(row)

payload = [
    {
        "year": 2011,
        "station_id": "PCH. KADIPATEN",
        "data": matrix
    }
]

import os
os.makedirs("src/scripts/data", exist_ok=True)
with open("src/scripts/data/kadipaten_2011_2020.json", "w") as f:
    json.dump(payload, f, indent=2)

print("Created JSON!")
