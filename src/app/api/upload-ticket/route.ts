import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createTemporaryUpload,
  getTemporaryVideoBucket,
  getUserStoragePrefix,
} from "@/lib/supabase";
import { getExtensionFromMime } from "@/lib/utils";
import {
  AUDIO_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MAX_AUDIO_SIZE,
  MAX_IMAGE_SIZE,
} from "@/types";

type UploadKind = "audio" | "image";

interface UploadTicketBody {
  kind: UploadKind;
  contentType: string;
  size: number;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { kind, contentType, size } =
      (await request.json()) as UploadTicketBody;
    const allowedTypes =
      kind === "audio" ? AUDIO_MIME_TYPES : kind === "image" ? IMAGE_MIME_TYPES : null;
    const maxSize =
      kind === "audio" ? MAX_AUDIO_SIZE : kind === "image" ? MAX_IMAGE_SIZE : 0;

    if (
      !allowedTypes ||
      !allowedTypes.includes(contentType) ||
      !Number.isFinite(size) ||
      size <= 0 ||
      size > maxSize
    ) {
      return NextResponse.json(
        { error: "Invalid upload request." },
        { status: 400 }
      );
    }

    const prefix = getUserStoragePrefix(session.user.email);
    const jobId = crypto.randomUUID();
    const extension = getExtensionFromMime(contentType);
    const storagePath = `${prefix}/inputs/${jobId}/${kind}.${extension}`;
    const ticket = await createTemporaryUpload(storagePath);

    return NextResponse.json({
      ...ticket,
      bucket: getTemporaryVideoBucket(),
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Could not prepare the upload.", details },
      { status: 500 }
    );
  }
}
