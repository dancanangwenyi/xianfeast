import { getAllRows, getRow, appendRow, updateRow, queryRows } from "../sheets"
import { getSheetsClient } from "../auth"
import jest from "jest"

// Mock the Google Sheets client
jest.mock("../auth", () => ({
  getSheetsClient: jest.fn(),
}))

const mockSheetsClient = {
  spreadsheets: {
    values: {
      get: jest.fn(),
      append: jest.fn(),
      update: jest.fn(),
    },
  },
}

describe("Google Sheets Helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSheetsClient as jest.Mock).mockReturnValue(mockSheetsClient)
  })

  describe("getAllRows", () => {
    it("should fetch and parse all rows from a sheet", async () => {
      const mockData = {
        data: {
          values: [
            ["user-1", "alice@example.com", "Alice", "active"],
            ["user-2", "bob@example.com", "Bob", "active"],
          ],
        },
      }

      mockSheetsClient.spreadsheets.values.get.mockResolvedValue(mockData)

      const columns = ["id", "email", "name", "status"]
      const rows = await getAllRows("users", columns)

      expect(rows).toHaveLength(2)
      expect(rows[0]).toEqual({
        id: "user-1",
        email: "alice@example.com",
        name: "Alice",
        status: "active",
      })
      expect(rows[1]).toEqual({
        id: "user-2",
        email: "bob@example.com",
        name: "Bob",
        status: "active",
      })
    })

    it("should return empty array when sheet is empty", async () => {
      mockSheetsClient.spreadsheets.values.get.mockResolvedValue({ data: { values: [] } })

      const columns = ["id", "email", "name", "status"]
      const rows = await getAllRows("users", columns)

      expect(rows).toEqual([])
    })
  })

  describe("getRow", () => {
    it("should fetch a single row by ID", async () => {
      const mockData = {
        data: {
          values: [
            ["user-1", "alice@example.com", "Alice", "active"],
            ["user-2", "bob@example.com", "Bob", "active"],
          ],
        },
      }

      mockSheetsClient.spreadsheets.values.get.mockResolvedValue(mockData)

      const columns = ["id", "email", "name", "status"]
      const row = await getRow("users", "user-2", columns)

      expect(row).toEqual({
        id: "user-2",
        email: "bob@example.com",
        name: "Bob",
        status: "active",
      })
    })

    it("should return null when row not found", async () => {
      mockSheetsClient.spreadsheets.values.get.mockResolvedValue({ data: { values: [] } })

      const columns = ["id", "email", "name", "status"]
      const row = await getRow("users", "nonexistent", columns)

      expect(row).toBeNull()
    })
  })

  describe("queryRows", () => {
    it("should filter rows using a predicate function", async () => {
      const mockData = {
        data: {
          values: [
            ["user-1", "alice@example.com", "Alice", "active"],
            ["user-2", "bob@example.com", "Bob", "disabled"],
            ["user-3", "charlie@example.com", "Charlie", "active"],
          ],
        },
      }

      mockSheetsClient.spreadsheets.values.get.mockResolvedValue(mockData)

      const columns = ["id", "email", "name", "status"]
      const activeUsers = await queryRows("users", columns, (row) => row.status === "active")

      expect(activeUsers).toHaveLength(2)
      expect(activeUsers[0].name).toBe("Alice")
      expect(activeUsers[1].name).toBe("Charlie")
    })
  })

  describe("appendRow", () => {
    it("should append a new row with auto-generated ID and timestamp", async () => {
      mockSheetsClient.spreadsheets.values.append.mockResolvedValue({ data: {} })

      const columns = ["id", "email", "name", "status", "created_at"]
      const newUser = {
        email: "dave@example.com",
        name: "Dave",
        status: "active",
      }

      await appendRow("users", newUser, columns)

      expect(mockSheetsClient.spreadsheets.values.append).toHaveBeenCalledWith(
        expect.objectContaining({
          range: "users!A:ZZ",
          valueInputOption: "RAW",
          requestBody: expect.objectContaining({
            values: expect.arrayContaining([expect.any(Array)]),
          }),
        }),
      )
    })
  })

  describe("updateRow", () => {
    it("should update an existing row by ID", async () => {
      const mockData = {
        data: {
          values: [
            ["user-1", "alice@example.com", "Alice", "active"],
            ["user-2", "bob@example.com", "Bob", "active"],
          ],
        },
      }

      mockSheetsClient.spreadsheets.values.get.mockResolvedValue(mockData)
      mockSheetsClient.spreadsheets.values.update.mockResolvedValue({ data: {} })

      const columns = ["id", "email", "name", "status"]
      await updateRow("users", "user-2", { status: "disabled" }, columns)

      expect(mockSheetsClient.spreadsheets.values.update).toHaveBeenCalledWith(
        expect.objectContaining({
          range: "users!A3:ZZ3", // Row 3 (header + 2 data rows)
          valueInputOption: "RAW",
          requestBody: expect.objectContaining({
            values: [["user-2", "bob@example.com", "Bob", "disabled"]],
          }),
        }),
      )
    })

    it("should throw error when row not found", async () => {
      mockSheetsClient.spreadsheets.values.get.mockResolvedValue({ data: { values: [] } })

      const columns = ["id", "email", "name", "status"]

      await expect(updateRow("users", "nonexistent", { status: "disabled" }, columns)).rejects.toThrow(
        "Row with id nonexistent not found",
      )
    })
  })
})
