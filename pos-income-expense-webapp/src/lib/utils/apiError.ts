import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INVALID_STATE"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number
) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiSuccessList<T>(data: T[], total?: number) {
  return NextResponse.json({ data, total: total ?? data.length });
}
