import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Path to your orders.json
    const filePath = path.join(process.cwd(), "app", "data", "orders.json");

    if (!fs.existsSync(filePath)) {
      return new NextResponse("No orders file found.", { status: 404 });
    }

    // Read JSON data
    const rawData = fs.readFileSync(filePath, "utf8");
    const orders = JSON.parse(rawData);

    if (!Array.isArray(orders) || orders.length === 0) {
      return new NextResponse("No orders available.", { status: 200 });
    }

    // Convert JSON → CSV
    const headers = Object.keys(orders[0]);
    const csvRows = [
      headers.join(","), // header row
      ...orders.map((order: any) =>
        headers.map((field) => JSON.stringify(order[field] ?? "")).join(",")
      ),
    ];
    const csvData = csvRows.join("\n");

    // Return CSV as file
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=orders.csv",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Failed to export orders.", { status: 500 });
  }
}
