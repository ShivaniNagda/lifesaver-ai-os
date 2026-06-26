import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class JsonDb<T extends { id?: string; _id?: string; createdAt?: Date | string; updatedAt?: Date | string }> {
  private filePath: string;

  constructor(collectionName: string) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), "utf8");
    }
  }

  private read(): T[] {
    try {
      const data = fs.readFileSync(this.filePath, "utf8");
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  private write(data: T[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf8");
  }

  public async find(query: Partial<T> = {}): Promise<T[]> {
    const items = this.read();
    return items.filter((item) => {
      for (const key in query) {
        if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  public async findOne(query: Partial<T>): Promise<T | null> {
    const items = await this.find(query);
    return items[0] || null;
  }

  public async findById(id: string): Promise<T | null> {
    const items = this.read();
    return items.find((item) => item.id === id || item._id === id) || null;
  }

  public async create(doc: Omit<T, "id" | "_id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<T> {
    const items = this.read();
    const id = doc.id || `local_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const newDoc = {
      ...doc,
      id,
      _id: id,
      createdAt: now,
      updatedAt: now,
    } as unknown as T;
    
    items.push(newDoc);
    this.write(items);
    return newDoc;
  }

  public async findByIdAndUpdate(id: string, update: Partial<T>): Promise<T | null> {
    const items = this.read();
    const idx = items.findIndex((item) => item.id === id || item._id === id);
    if (idx === -1) return null;

    const updatedDoc = {
      ...items[idx],
      ...update,
      updatedAt: new Date().toISOString(),
    } as T;

    items[idx] = updatedDoc;
    this.write(items);
    return updatedDoc;
  }

  public async findByIdAndDelete(id: string): Promise<T | null> {
    const items = this.read();
    const idx = items.findIndex((item) => item.id === id || item._id === id);
    if (idx === -1) return null;

    const deleted = items[idx];
    items.splice(idx, 1);
    this.write(items);
    return deleted;
  }

  public async deleteMany(query: Partial<T> = {}): Promise<{ deletedCount: number }> {
    const items = this.read();
    const initialCount = items.length;
    const remaining = items.filter((item) => {
      for (const key in query) {
        if (item[key] === query[key]) {
          return false;
        }
      }
      return true;
    });
    this.write(remaining);
    return { deletedCount: initialCount - remaining.length };
  }
}
