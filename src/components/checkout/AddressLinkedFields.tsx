'use client'

import { useEffect, useState } from 'react'
import { TW_CITIES, TW_POSTCODE } from '@/lib/tw-postcode'

interface Props {
  /** Initial city / district / zip from saved address or last form */
  initialCity?: string
  initialDistrict?: string
  initialZip?: string
  cityError?: string
  zipError?: string
  /** Pulled out of recipient address by upstream when user picks saved address */
  syncKey?: string
}

/**
 * Three linked dropdowns + auto-fill of zip code. Uses TW_POSTCODE table.
 * The form fields submitted are:
 *   recipientCity (e.g. "台北市")
 *   recipientDistrict (e.g. "大安區")  -- new field
 *   recipientZip (e.g. "106")
 */
export function AddressLinkedFields({
  initialCity,
  initialDistrict,
  initialZip,
  cityError,
  zipError,
  syncKey,
}: Props) {
  const [city, setCity] = useState(initialCity ?? '')
  const [district, setDistrict] = useState(initialDistrict ?? '')
  const [zip, setZip] = useState(initialZip ?? '')

  // Re-sync when parent changes saved address
  useEffect(() => {
    const c = initialCity ?? ''
    setCity(c)
    let d = initialDistrict ?? ''
    const z = initialZip ?? ''
    // If only city + zip available (legacy saved address), look up district by zip
    if (!d && c && z && TW_POSTCODE[c]) {
      const found = TW_POSTCODE[c].find((x) => x.zip === z)
      if (found) d = found.district
    }
    setDistrict(d)
    setZip(z)
  }, [syncKey, initialCity, initialDistrict, initialZip])

  const districts = city ? TW_POSTCODE[city] ?? [] : []

  function pickCity(c: string) {
    setCity(c)
    setDistrict('')
    setZip('')
  }

  function pickDistrict(d: string) {
    setDistrict(d)
    const found = TW_POSTCODE[city]?.find((x) => x.district === d)
    setZip(found?.zip ?? '')
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="recipientCity" className="block text-sm mb-1.5">
            縣市 <span className="text-danger">*</span>
          </label>
          <select
            id="recipientCity"
            name="recipientCity"
            required
            value={city}
            onChange={(e) => pickCity(e.target.value)}
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink bg-white"
            form="checkout-form"
          >
            <option value="">請選擇⋯</option>
            {TW_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {cityError && <p className="text-xs text-danger mt-1">{cityError}</p>}
        </div>

        <div>
          <label htmlFor="recipientDistrict" className="block text-sm mb-1.5">
            區 / 鄉鎮 <span className="text-danger">*</span>
          </label>
          <select
            id="recipientDistrict"
            name="recipientDistrict"
            required
            disabled={!city}
            value={district}
            onChange={(e) => pickDistrict(e.target.value)}
            className="w-full border border-line rounded-md px-3 py-2 focus:outline-none focus:border-ink bg-white disabled:bg-cream-100"
            form="checkout-form"
          >
            <option value="">{city ? '請選擇⋯' : '請先選縣市'}</option>
            {districts.map((d) => (
              <option key={`${d.district}-${d.zip}`} value={d.district}>
                {d.district}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="recipientZip" className="block text-sm mb-1.5">
          郵遞區號 <span className="text-danger">*</span>
        </label>
        <input
          id="recipientZip"
          name="recipientZip"
          required
          readOnly
          value={zip}
          placeholder="自動帶入"
          className="w-full sm:w-32 border border-line rounded-md px-3 py-2 focus:outline-none bg-cream-100 text-ink-soft"
          form="checkout-form"
        />
        {zipError && <p className="text-xs text-danger mt-1">{zipError}</p>}
      </div>
    </>
  )
}
