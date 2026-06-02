import { describe, it, expect } from "vitest"
import { sortItems } from "./useSortTable"

describe("sortItems", () => {
  it("retorna array vazio quando data é vazia", () => {
    expect(sortItems([], "nome", "asc")).toEqual([])
  })

  it("retorna data sem modificar quando sortKey é null", () => {
    const data = [{ nome: "Z" }, { nome: "A" }]
    expect(sortItems(data, null, "asc")).toBe(data)
  })

  it("ordena strings em ordem ascendente", () => {
    const data = [{ nome: "Carlos" }, { nome: "Ana" }, { nome: "Bruno" }]
    expect(sortItems(data, "nome", "asc").map(d => d.nome)).toEqual(["Ana", "Bruno", "Carlos"])
  })

  it("ordena strings em ordem descendente", () => {
    const data = [{ nome: "Carlos" }, { nome: "Ana" }, { nome: "Bruno" }]
    expect(sortItems(data, "nome", "desc").map(d => d.nome)).toEqual(["Carlos", "Bruno", "Ana"])
  })

  it("ordena números em ordem ascendente", () => {
    const data = [{ score: 15 }, { score: 3 }, { score: 9 }]
    expect(sortItems(data, "score", "asc").map(d => d.score)).toEqual([3, 9, 15])
  })

  it("ordena números em ordem descendente", () => {
    const data = [{ score: 15 }, { score: 3 }, { score: 9 }]
    expect(sortItems(data, "score", "desc").map(d => d.score)).toEqual([15, 9, 3])
  })

  it("coloca null ao final em ordem ascendente", () => {
    const data = [{ nome: null }, { nome: "Ana" }, { nome: null }]
    const result = sortItems(data, "nome", "asc")
    expect(result[0].nome).toBe("Ana")
    expect(result[1].nome).toBeNull()
    expect(result[2].nome).toBeNull()
  })

  it("coloca null ao final em ordem descendente", () => {
    const data = [{ nome: "Ana" }, { nome: null }, { nome: "Bruno" }]
    const result = sortItems(data, "nome", "desc")
    expect(result[2].nome).toBeNull()
  })

  it("ordena datas ISO lexicograficamente", () => {
    const data = [
      { data: "2024-03-15" },
      { data: "2023-12-01" },
      { data: "2024-01-10" },
    ]
    expect(sortItems(data, "data", "asc").map(d => d.data)).toEqual([
      "2023-12-01",
      "2024-01-10",
      "2024-03-15",
    ])
  })
})
