import { Injectable } from '@angular/core';
import { DBSchema, openDB } from 'idb';
import { patch, UpdatePayload } from 'pragmatism/core';
import { createPersonalConstantTable, PersonalConstantTable } from '../models';

interface IDBStoreSchema extends DBSchema {
  tables: {
    key: string;
    value: PersonalConstantTable;
  };
}

export interface CreateParams
  extends Omit<
    PersonalConstantTable,
    'id' | 'included' | 'ordered' | 'pinned'
  > {}

export type EditParams = UpdatePayload<PersonalConstantTable, 'id'>;

@Injectable({
  providedIn: 'root',
})
export class ConstantTableStore {
  #open() {
    return openDB<IDBStoreSchema>('arcaea-personal-chart-rating', 1, {
      upgrade: (database, oldVersion, newVersion, transaction, event) => {
        database.createObjectStore('tables', { keyPath: 'id' });
      },
    });
  }

  async list() {
    const db = await this.#open();
    const keys = await db.getAll('tables');
    db.close();
    return keys;
  }

  async create(params: CreateParams) {
    const db = await this.#open();
    await db.put('tables', {
      ...createPersonalConstantTable(),
      id: Date.now().toString(),
      ...params,
    });
    db.close();
  }

  async edit(params: EditParams) {
    const data = await this.get(params.id);
    const updated = patch(data, params);
    await this.put(updated);
  }

  async put(table: PersonalConstantTable) {
    const db = await this.#open();
    await db.put('tables', table);
    db.close();
  }

  async delete(id: string) {
    const db = await this.#open();
    await db.delete('tables', id);
    db.close();
  }

  async get(id: string) {
    const db = await this.#open();
    const table = await db.get('tables', id);
    db.close();
    if (!table) {
      throw new Error();
    }
    return table;
  }
}
