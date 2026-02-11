const BASE_URL = 'https://ibnux.github.io/data-indonesia';

const STATIC_PROVINCES = [
    { "id": "11", "name": "ACEH" },
    { "id": "12", "name": "SUMATERA UTARA" },
    { "id": "13", "name": "SUMATERA BARAT" },
    { "id": "14", "name": "RIAU" },
    { "id": "15", "name": "JAMBI" },
    { "id": "16", "name": "SUMATERA SELATAN" },
    { "id": "17", "name": "BENGKULU" },
    { "id": "18", "name": "LAMPUNG" },
    { "id": "19", "name": "KEPULAUAN BANGKA BELITUNG" },
    { "id": "21", "name": "KEPULAUAN RIAU" },
    { "id": "31", "name": "DKI JAKARTA" },
    { "id": "32", "name": "JAWA BARAT" },
    { "id": "33", "name": "JAWA TENGAH" },
    { "id": "34", "name": "DAERAH ISTIMEWA YOGYAKARTA" },
    { "id": "35", "name": "JAWA TIMUR" },
    { "id": "36", "name": "BANTEN" },
    { "id": "51", "name": "BALI" },
    { "id": "52", "name": "NUSA TENGGARA BARAT" },
    { "id": "53", "name": "NUSA TENGGARA TIMUR" },
    { "id": "61", "name": "KALIMANTAN BARAT" },
    { "id": "62", "name": "KALIMANTAN TENGAH" },
    { "id": "63", "name": "KALIMANTAN SELATAN" },
    { "id": "64", "name": "KALIMANTAN TIMUR" },
    { "id": "65", "name": "KALIMANTAN UTARA" },
    { "id": "71", "name": "SULAWESI UTARA" },
    { "id": "72", "name": "SULAWESI TENGAH" },
    { "id": "73", "name": "SULAWESI SELATAN" },
    { "id": "74", "name": "SULAWESI TENGGARA" },
    { "id": "75", "name": "GORONTALO" },
    { "id": "76", "name": "SULAWESI BARAT" },
    { "id": "81", "name": "MALUKU" },
    { "id": "82", "name": "MALUKU UTARA" },
    { "id": "91", "name": "PAPUA" },
    { "id": "92", "name": "PAPUA BARAT" },
    { "id": "93", "name": "PAPUA SELATAN" },
    { "id": "94", "name": "PAPUA TENGAH" },
    { "id": "95", "name": "PAPUA PEGUNUNGAN" },
    { "id": "96", "name": "PAPUA BARAT DAYA" }
];

export async function getProvinces() {
    // Return static data sorted alphabetically
    return [...STATIC_PROVINCES].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRegencies(provinceId) {
    try {
        const response = await fetch(`${BASE_URL}/kabupaten/${provinceId}.json`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data)
            ? data.map(item => ({ ...item, name: item.nama })).sort((a, b) => a.name.localeCompare(b.name))
            : [];
    } catch (error) {
        console.error("Failed to fetch regencies:", error);
        return [];
    }
}

export async function getDistricts(regencyId) {
    try {
        const response = await fetch(`${BASE_URL}/kecamatan/${regencyId}.json`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data)
            ? data.map(item => ({ ...item, name: item.nama })).sort((a, b) => a.name.localeCompare(b.name))
            : [];
    } catch (error) {
        console.error("Failed to fetch districts:", error);
        return [];
    }
}

export async function getVillages(districtId) {
    try {
        const response = await fetch(`${BASE_URL}/kelurahan/${districtId}.json`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data)
            ? data.map(item => ({ ...item, name: item.nama })).sort((a, b) => a.name.localeCompare(b.name))
            : [];
    } catch (error) {
        console.error("Failed to fetch villages:", error);
        return [];
    }
}
