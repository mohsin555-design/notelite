import db from "@/lib/db";

// GET all notes
export async function GET() {
  const notes = db.prepare("SELECT * FROM notes").all();
  return Response.json(notes);
}

// POST create note
export async function POST(req: Request) {
  const { title, content } = await req.json();

  const result = db
    .prepare("INSERT INTO notes (title, content) VALUES (?, ?)")
    .run(title, content);

  return Response.json({ id: result.lastInsertRowid });
}