const BASE_URL = 'https://emsifa.github.io/api-wilayah-indonesia/api';

export async function getProvinces() {
    const response = await fetch(`${BASE_URL}/provinces.json`);
    const data = await response.json();
    return data.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRegencies(provinceId) {
    const response = await fetch(`${BASE_URL}/regencies/${provinceId}.json`);
    const data = await response.json();
    return data.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getDistricts(regencyId) {
    const response = await fetch(`${BASE_URL}/districts/${regencyId}.json`);
    const data = await response.json();
    return data.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getVillages(districtId) {
    const response = await fetch(`${BASE_URL}/villages/${districtId}.json`);
    const data = await response.json();
    return data.sort((a, b) => a.name.localeCompare(b.name));
}
