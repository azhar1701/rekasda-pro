import math
from typing import List, Dict, Any

def round_num(value: float, decimals: int) -> float:
    factor = 10 ** decimals
    return round(value * factor) / factor

def calculate_fj_mock(params: Dict[str, float], data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not data:
        raise ValueError('Data bulanan tidak boleh kosong.')
    
    luas_das = params.get('luasDas', 0)
    smc = params.get('smc', 0)
    ism = params.get('ism', 0)
    infiltration_factor = params.get('infiltrationFactor', 0)
    k = params.get('k', 0)
    exposed_surface = params.get('exposedSurface', 0)
    initial_gw_storage = params.get('initialGwStorage', 0)

    if luas_das <= 0: raise ValueError('Luas DAS harus > 0 km².')
    if smc <= 0: raise ValueError('Soil Moisture Capacity (SMC) harus > 0 mm.')
    if not (0 <= infiltration_factor <= 1): raise ValueError('Infiltration Factor harus antara 0 dan 1.')
    if not (0 <= k <= 1): raise ValueError('Recession Constant K harus antara 0 dan 1.')
    if not (0 <= exposed_surface <= 1): raise ValueError('Exposed Surface (m) harus antara 0 dan 1.')

    results = []
    prev_sm = ism
    prev_vg = initial_gw_storage

    for row in data:
        month = row.get('month', '')
        p = row.get('precipitation', 0)
        eto = row.get('eto', 0)
        days_in_month = row.get('daysInMonth', 30)

        delta_s = p - eto

        if delta_s >= 0:
            eta = eto
            sm = min(prev_sm + delta_s, smc)
        else:
            drying_fraction = exposed_surface * abs(delta_s) / smc
            sm = max(0, prev_sm * (1 - drying_fraction))
            eta = p + (prev_sm - sm)

        delta_sm = sm - prev_sm
        ws = max(0, p - eta - delta_sm)

        i = ws * infiltration_factor
        dro = ws - i

        vg = k * (prev_vg + i)
        bf = (1 - k) * (prev_vg + i)

        tro = bf + dro

        seconds = days_in_month * 86400
        discharge = (tro * luas_das * 1000) / seconds

        results.append({
            'month': month,
            'precipitation': round_num(p, 2),
            'eto': round_num(eto, 2),
            'deltaS': round_num(delta_s, 2),
            'soilMoisture': round_num(sm, 2),
            'eta': round_num(eta, 2),
            'waterSurplus': round_num(ws, 2),
            'infiltration': round_num(i, 2),
            'gwStorage': round_num(vg, 2),
            'baseFlow': round_num(bf, 2),
            'directRunoff': round_num(dro, 2),
            'totalRunoff': round_num(tro, 2),
            'discharge': round_num(discharge, 4),
            'daysInMonth': days_in_month
        })

        prev_sm = sm
        prev_vg = vg

    return results

def calculate_weibull_dependable_flow(discharge_series: List[float], target_probability: float) -> Dict[str, Any]:
    if len(discharge_series) < 2:
        raise ValueError('Minimal 2 data debit diperlukan untuk analisis Weibull.')
    if target_probability <= 0 or target_probability >= 100:
        raise ValueError('Probabilitas target harus antara 0% dan 100% (eksklusif).')

    n = len(discharge_series)
    sorted_series = sorted(discharge_series, reverse=True)

    ranked_series = []
    for index, discharge in enumerate(sorted_series):
        rank = index + 1
        probability = (float(rank) / (n + 1)) * 100.0
        ranked_series.append({
            'rank': rank,
            'discharge': round_num(discharge, 4),
            'probability': round_num(probability, 2)
        })

    target = target_probability

    if target <= ranked_series[0]['probability']:
        return {'qAndalan': ranked_series[0]['discharge'], 'probability': target, 'rankedSeries': ranked_series}
    if target >= ranked_series[-1]['probability']:
        return {'qAndalan': ranked_series[-1]['discharge'], 'probability': target, 'rankedSeries': ranked_series}

    lower = ranked_series[0]
    upper = ranked_series[1]

    for i in range(n - 1):
        if ranked_series[i]['probability'] <= target and ranked_series[i + 1]['probability'] >= target:
            lower = ranked_series[i]
            upper = ranked_series[i + 1]
            break

    p_range = upper['probability'] - lower['probability']
    if p_range == 0:
        q_andalan = lower['discharge']
    else:
        q_andalan = lower['discharge'] + ((upper['discharge'] - lower['discharge']) * (target - lower['probability']) / p_range)

    return {
        'qAndalan': round_num(q_andalan, 4),
        'probability': target,
        'rankedSeries': ranked_series
    }
