const BASE_URL = 'https://emsifa.github.io/api-wilayah-indonesia/api';

export async function getProvinces() {
    const res = await fetch(`${BASE_URL}/provinces.json`);
    return res.json();
}

export async function getRegencies(provinceId) {
    const res = await fetch(`${BASE_URL}/regencies/${provinceId}.json`);
    return res.json();
}

export async function getDistricts(regencyId) {
    const res = await fetch(`${BASE_URL}/districts/${regencyId}.json`);
    return res.json();
}

export async function getVillages(districtId) {
    const res = await fetch(`${BASE_URL}/villages/${districtId}.json`);
    return res.json();
}
