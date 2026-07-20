import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const csvPath = resolve("db/selenite_games.csv");
const outputPath = resolve("public/assets/json/Games.json");

const csv = readFileSync(csvPath, "utf-8");

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(cell);
        cell = "";
      } else if (char === "\r" && nextChar === "\n") {
        row.push(cell);
        cell = "";
        rows.push(row);
        row = [];
        i++;
      } else if (char === "\n") {
        row.push(cell);
        cell = "";
        rows.push(row);
        row = [];
      } else if (char === "\r") {
        row.push(cell);
        cell = "";
        rows.push(row);
        row = [];
      } else {
        cell += char;
      }
    }
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

const rows = parseCSV(csv);
const headers = rows[0];

if (!headers || headers.length < 4) {
  throw new Error("CSV header is missing or malformed");
}

const games = rows.slice(1).map((row) => {
  const [name, , image, iframe] = row;
  return {
    name: name?.trim() || "",
    link: iframe?.trim() || "",
    image: image?.trim() || "",
    categories: ["all"],
  };
}).filter((game) => game.name && game.link && game.image);

writeFileSync(outputPath, JSON.stringify(games, null, 2) + "\n");

console.log(`Converted ${games.length} games to ${outputPath}`);
