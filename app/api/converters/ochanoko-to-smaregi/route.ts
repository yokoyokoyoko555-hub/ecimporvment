import { NextResponse } from "next/server";
import iconv from "iconv-lite";
import {
  buildSmaregiCsv,
  convertOchanokoRowsToSmaregi,
  decodeOchanokoCsv,
} from "@/lib/ochanoko-smaregi";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const departmentId = String(form.get("departmentId") || "");
    if (!(file instanceof File))
      return NextResponse.json(
        { error: "おちゃのこCSVを選択してください" },
        { status: 400 },
      );
    if (file.size > MAX_FILE_BYTES)
      return NextResponse.json(
        { error: "CSVファイルは10MB以下にしてください" },
        { status: 413 },
      );
    const text = decodeOchanokoCsv(new Uint8Array(await file.arrayBuffer()));
    const converted = convertOchanokoRowsToSmaregi(text, departmentId);
    const body = iconv.encode(buildSmaregiCsv(converted.rows), "cp932");
    return new NextResponse(new Uint8Array(body).buffer, {
      headers: {
        "Content-Type": "text/csv; charset=Shift_JIS",
        "Content-Disposition":
          'attachment; filename="onepiece-smaregi.csv"',
        "Cache-Control": "no-store",
        "X-Converted-Count": String(converted.rows.length),
        "X-Skipped-Count": String(converted.skipped),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "CSV変換に失敗しました",
      },
      { status: 422 },
    );
  }
}
