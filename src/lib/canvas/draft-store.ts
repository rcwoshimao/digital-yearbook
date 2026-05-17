const DRAFT_PREFIX = "draft:";
const DRAFT_ASSET_PREFIX = "__draft_asset__:";
const DB_NAME = "yearbook-drafts";
const DB_VERSION = 1;
const ASSET_STORE = "assets";

export type DraftPayload = {
  version: 1;
  updatedAt: string;
  canvas: Record<string, unknown>;
};

type StoredAsset = {
  blob: Blob;
  mimeType: string;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function draftStorageKey(yearbookId: string) {
  return `${DRAFT_PREFIX}${yearbookId}`;
}

function assetDatabaseKey(yearbookId: string, assetKey: string) {
  return `${yearbookId}:${assetKey}`;
}

function isDraftAssetRef(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(DRAFT_ASSET_PREFIX);
}

function draftAssetRef(assetKey: string) {
  return `${DRAFT_ASSET_PREFIX}${assetKey}`;
}

function parseDraftAssetRef(ref: string) {
  return ref.slice(DRAFT_ASSET_PREFIX.length);
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in the browser."));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(ASSET_STORE)) {
          database.createObjectStore(ASSET_STORE);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not open draft database."));
    });
  }

  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(ASSET_STORE, mode);
        const store = transaction.objectStore(ASSET_STORE);
        const request = run(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Draft asset transaction failed."));
      }),
  );
}

async function putAsset(yearbookId: string, assetKey: string, blob: Blob) {
  const record: StoredAsset = {
    blob,
    mimeType: blob.type || "image/png",
  };

  await runTransaction("readwrite", (store) =>
    store.put(record, assetDatabaseKey(yearbookId, assetKey)),
  );
}

async function getAsset(yearbookId: string, assetKey: string): Promise<Blob | null> {
  const record = await runTransaction<StoredAsset | undefined>("readonly", (store) =>
    store.get(assetDatabaseKey(yearbookId, assetKey)),
  );

  return record?.blob ?? null;
}

async function clearAssets(yearbookId: string) {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(ASSET_STORE, "readwrite");
    const store = transaction.objectStore(ASSET_STORE);
    const request = store.openCursor();
    const prefix = `${yearbookId}:`;

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        return;
      }

      if (typeof cursor.key === "string" && cursor.key.startsWith(prefix)) {
        cursor.delete();
      }

      cursor.continue();
    };

    request.onerror = () => reject(request.error ?? new Error("Could not clear draft assets."));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not clear draft assets."));
  });
}

async function srcToBlob(src: string): Promise<Blob> {
  if (src.startsWith("data:")) {
    const response = await fetch(src);
    return response.blob();
  }

  const response = await fetch(src);
  if (!response.ok) {
    throw new Error("Could not read image data for draft.");
  }

  return response.blob();
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not encode draft image."));
    reader.readAsDataURL(blob);
  });
}

async function compressImageBlob(blob: Blob, maxEdge = 2000, quality = 0.85): Promise<Blob> {
  if (!blob.type.startsWith("image/") || blob.type.includes("gif")) {
    return blob;
  }

  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not decode draft image."));
      element.src = objectUrl;
    });

    const largestEdge = Math.max(image.naturalWidth, image.naturalHeight);
    if (largestEdge <= maxEdge) {
      return blob;
    }

    const scale = maxEdge / largestEdge;
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return blob;
    }

    context.drawImage(image, 0, 0, width, height);

    const compressed = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", quality);
    });

    return compressed ?? blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function replaceImageSrcWithAsset(
  yearbookId: string,
  src: string,
  assetKey: string,
): Promise<string> {
  const blob = await compressImageBlob(await srcToBlob(src));
  await putAsset(yearbookId, assetKey, blob);
  return draftAssetRef(assetKey);
}

async function resolveImageSrc(yearbookId: string, src: string): Promise<string> {
  if (!isDraftAssetRef(src)) {
    return src;
  }

  const assetKey = parseDraftAssetRef(src);
  const blob = await getAsset(yearbookId, assetKey);
  if (!blob) {
    throw new Error("Missing draft image asset.");
  }

  return blobToDataUrl(blob);
}

async function serializeCanvasForDraft(
  yearbookId: string,
  canvasJson: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const json = structuredClone(canvasJson);
  const objects = json.objects;

  if (Array.isArray(objects)) {
    for (let index = 0; index < objects.length; index += 1) {
      const object = objects[index] as { src?: string; type?: string };
      const isImage = object.type === "image" || object.type === "Image";

      if (isImage && typeof object.src === "string" && object.src.length > 0) {
        object.src = await replaceImageSrcWithAsset(yearbookId, object.src, `object-${index}`);
      }
    }
  }

  const backgroundImage = json.backgroundImage as { src?: string } | undefined;
  if (backgroundImage?.src) {
    backgroundImage.src = await replaceImageSrcWithAsset(
      yearbookId,
      backgroundImage.src,
      "background",
    );
  }

  return json;
}

async function hydrateCanvasForRestore(
  yearbookId: string,
  canvasJson: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const json = structuredClone(canvasJson);
  const objects = json.objects;

  if (Array.isArray(objects)) {
    for (const object of objects) {
      const candidate = object as { src?: string };
      if (typeof candidate.src === "string") {
        candidate.src = await resolveImageSrc(yearbookId, candidate.src);
      }
    }
  }

  const backgroundImage = json.backgroundImage as { src?: string } | undefined;
  if (backgroundImage?.src) {
    backgroundImage.src = await resolveImageSrc(yearbookId, backgroundImage.src);
  }

  return json;
}

export function hasDraft(yearbookId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(draftStorageKey(yearbookId)) !== null;
  } catch {
    return false;
  }
}

export function readDraftPayload(yearbookId: string): DraftPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(draftStorageKey(yearbookId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as DraftPayload | Record<string, unknown>;

    if ("version" in parsed && parsed.version === 1 && "canvas" in parsed) {
      return parsed as DraftPayload;
    }

    return {
      version: 1,
      updatedAt: new Date(0).toISOString(),
      canvas: parsed as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

export async function saveDraft(yearbookId: string, canvasJson: Record<string, unknown>) {
  await clearAssets(yearbookId);

  const canvas = await serializeCanvasForDraft(yearbookId, canvasJson);
  const payload: DraftPayload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    canvas,
  };

  try {
    window.localStorage.setItem(draftStorageKey(yearbookId), JSON.stringify(payload));
  } catch (error) {
    await clearAssets(yearbookId);
    throw error;
  }
}

export async function loadDraftCanvas(yearbookId: string): Promise<Record<string, unknown> | null> {
  const payload = readDraftPayload(yearbookId);
  if (!payload) {
    return null;
  }

  try {
    return await hydrateCanvasForRestore(yearbookId, payload.canvas);
  } catch {
    return null;
  }
}

export async function clearDraft(yearbookId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(draftStorageKey(yearbookId));
  } catch {
    // Ignore storage errors while clearing.
  }

  try {
    await clearAssets(yearbookId);
  } catch {
    // Ignore asset cleanup errors while clearing.
  }
}
