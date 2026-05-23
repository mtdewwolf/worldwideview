import fs from "fs";
import path from "path";

const MESH_DIR = path.join(process.cwd(), "data", "niantic-meshes");
const MAX_MESH_BYTES = 50 * 1024 * 1024;

export function getMeshDir(): string {
    return MESH_DIR;
}

export function ensureMeshDir(): void {
    fs.mkdirSync(MESH_DIR, { recursive: true });
}

export function meshFilePath(siteId: string): string {
    const safe = siteId.replace(/[^a-zA-Z0-9._-]/g, "_");
    return path.join(MESH_DIR, `${safe}.glb`);
}

export function meshExists(siteId: string): boolean {
    return fs.existsSync(meshFilePath(siteId));
}

export async function writeMeshFile(siteId: string, buffer: Buffer): Promise<string> {
    if (buffer.length > MAX_MESH_BYTES) {
        throw new Error(`Mesh exceeds ${MAX_MESH_BYTES} byte limit`);
    }
    ensureMeshDir();
    const filePath = meshFilePath(siteId);
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
}

export function readMeshFile(siteId: string): Buffer | null {
    const filePath = meshFilePath(siteId);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
}
