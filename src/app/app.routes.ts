import { Routes } from '@angular/router';
import { ConstantTableList } from './constant-table-list/constant-table-list';
import { ConstantSortingTable } from './constant-sorting-table/constant-sorting-table';
import { ConstantTable } from './constant-table/constant-table';

export const routes: Routes = [
  {
    path: '',
    component: ConstantTableList,
  },
  {
    path: 'edit/:id',
    component: ConstantSortingTable,
  },
  {
    path: 'table/:id',
    component: ConstantTable,
  },
];
