import { useState, useMemo } from "react"

export function sortItems(data, sortKey, sortDir) {
  if (!sortKey || !data?.length) return data ?? []
  return [...data].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey]
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === "number" && typeof vb === "number")
      return sortDir === "asc" ? va - vb : vb - va
    const sa = String(va).toLowerCase(), sb = String(vb).toLowerCase()
    return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa)
  })
}

export function useSortTable(data, { defaultKey = null, defaultDir = "asc" } = {}) {
  const [sortKey, setSortKey] = useState(defaultKey)
  const [sortDir, setSortDir] = useState(defaultDir)

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sortedData = useMemo(() => sortItems(data, sortKey, sortDir), [data, sortKey, sortDir])

  return { sortedData, sortKey, sortDir, handleSort }
}
