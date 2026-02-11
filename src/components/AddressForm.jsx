import { useState, useEffect, useRef } from 'react';
import { getProvinces, getRegencies, getDistricts, getVillages } from '../data/wilayah';

const CACHE_KEY = 'pupuk_address_cache';

function getCachedAddress() {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
    } catch { return {}; }
}

function saveCachedAddress(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

export default function AddressForm({ value, onChange }) {
    const [provinces, setProvinces] = useState([]);
    const [regencies, setRegencies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);

    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedRegency, setSelectedRegency] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedVillage, setSelectedVillage] = useState('');

    const [loadingProv, setLoadingProv] = useState(false);
    const [loadingReg, setLoadingReg] = useState(false);
    const [loadingDist, setLoadingDist] = useState(false);
    const [loadingVillage, setLoadingVillage] = useState(false);

    // Refs for auto-focus
    const regencyRef = useRef(null);
    const districtRef = useRef(null);
    const villageRef = useRef(null);

    // Load provinces on mount & restore cache
    useEffect(() => {
        loadProvinces();
    }, []);

    async function loadProvinces() {
        setLoadingProv(true);
        try {
            const data = await getProvinces();
            setProvinces(data);

            // Restore cached address
            const cached = getCachedAddress();
            if (cached.provinceId) {
                setSelectedProvince(cached.provinceId);
                onChange({
                    province: cached.provinceName || '',
                    kabupaten: cached.regencyName || '',
                    kecamatan: cached.districtName || '',
                    kelurahan: cached.villageName || '',
                });

                // Load cascading data
                if (cached.provinceId) {
                    const regData = await getRegencies(cached.provinceId);
                    setRegencies(regData);
                    if (cached.regencyId) {
                        setSelectedRegency(cached.regencyId);
                        const distData = await getDistricts(cached.regencyId);
                        setDistricts(distData);
                        if (cached.districtId) {
                            setSelectedDistrict(cached.districtId);
                            const vilData = await getVillages(cached.districtId);
                            setVillages(vilData);
                            if (cached.villageId) {
                                setSelectedVillage(cached.villageId);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load provinces:', e);
        }
        setLoadingProv(false);
    }

    const handleProvinceChange = async (e) => {
        const id = e.target.value;
        const name = provinces.find(p => p.id === id)?.name || '';
        setSelectedProvince(id);
        setSelectedRegency('');
        setSelectedDistrict('');
        setSelectedVillage('');
        setRegencies([]);
        setDistricts([]);
        setVillages([]);
        onChange({ province: name, kabupaten: '', kecamatan: '', kelurahan: '' });
        saveCachedAddress({ provinceId: id, provinceName: name });

        if (id) {
            setLoadingReg(true);
            setTimeout(() => regencyRef.current?.focus(), 50); // Auto-focus next field
            const data = await getRegencies(id);
            setRegencies(data);
            setLoadingReg(false);
        }
    };

    const handleRegencyChange = async (e) => {
        const id = e.target.value;
        const name = regencies.find(r => r.id === id)?.name || '';
        setSelectedRegency(id);
        setSelectedDistrict('');
        setSelectedVillage('');
        setDistricts([]);
        setVillages([]);
        onChange({ ...value, kabupaten: name, kecamatan: '', kelurahan: '' });
        const cached = getCachedAddress();
        saveCachedAddress({ ...cached, regencyId: id, regencyName: name });

        if (id) {
            setLoadingDist(true);
            setTimeout(() => districtRef.current?.focus(), 50); // Auto-focus next field
            const data = await getDistricts(id);
            setDistricts(data);
            setLoadingDist(false);
        }
    };

    const handleDistrictChange = async (e) => {
        const id = e.target.value;
        const name = districts.find(d => d.id === id)?.name || '';
        setSelectedDistrict(id);
        setSelectedVillage('');
        setVillages([]);
        onChange({ ...value, kecamatan: name, kelurahan: '' });
        const cached = getCachedAddress();
        saveCachedAddress({ ...cached, districtId: id, districtName: name });

        if (id) {
            setLoadingVillage(true);
            setTimeout(() => villageRef.current?.focus(), 50); // Auto-focus next field
            const data = await getVillages(id);
            setVillages(data);
            setLoadingVillage(false);
        }
    };

    const handleVillageChange = (e) => {
        const id = e.target.value;
        const name = villages.find(v => v.id === id)?.name || '';
        setSelectedVillage(id);
        onChange({ ...value, kelurahan: name });
        const cached = getCachedAddress();
        saveCachedAddress({ ...cached, villageId: id, villageName: name });
    };

    return (
        <>
            <div className="form-group">
                <label>Provinsi <span className="required">*</span></label>
                <select className="form-input" value={selectedProvince} onChange={handleProvinceChange} disabled={loadingProv}>
                    <option value="">{loadingProv ? 'Memuat...' : '-- Pilih Provinsi --'}</option>
                    {provinces.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Kabupaten/Kota <span className="required">*</span></label>
                <select
                    ref={regencyRef}
                    className="form-input"
                    value={selectedRegency}
                    onChange={handleRegencyChange}
                    disabled={!selectedProvince}
                >
                    <option value="">{loadingReg ? 'Sedang memuat data...' : '-- Pilih Kabupaten/Kota --'}</option>
                    {regencies.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Kecamatan <span className="required">*</span></label>
                <select
                    ref={districtRef}
                    className="form-input"
                    value={selectedDistrict}
                    onChange={handleDistrictChange}
                    disabled={!selectedRegency}
                >
                    <option value="">{loadingDist ? 'Sedang memuat data...' : '-- Pilih Kecamatan --'}</option>
                    {districts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Desa/Kelurahan <span className="required">*</span></label>
                <select
                    ref={villageRef}
                    className="form-input"
                    value={selectedVillage}
                    onChange={handleVillageChange}
                    disabled={!selectedDistrict}
                >
                    <option value="">{loadingVillage ? 'Sedang memuat data...' : '-- Pilih Desa/Kelurahan --'}</option>
                    {villages.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                </select>
            </div>
        </>
    );
}
