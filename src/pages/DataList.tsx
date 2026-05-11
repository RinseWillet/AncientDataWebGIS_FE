import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import type { RootState } from '../app/store';
import { fetchRoads } from '../features/road/roadThunks';
import { fetchSites } from '../features/site/siteThunks';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type Row,
} from '@tanstack/react-table';
import './DataList.css';

interface RowItem {
  id: number | string;
  name: string;
  type: string;
  date: string;
}

interface GeoJsonFeature {
  properties?: {
    id?: number | string;
    name?: string;
    type?: string;
    siteType?: string;
    date?: string;
  };
}

interface GeoJsonCollection {
  features?: GeoJsonFeature[];
}

const getInitialPageSize = (): number => {
  const width = window.innerWidth;
  if (width <= 400) return 10;
  if (width <= 850) return 13;
  return 15;
};

const DataList = () => {
  const navigate = useNavigate();
  const [dataSwitch, setDataSwitch] = useState(false); // false = Roads, true = Sites
  const { siteData, loading: siteLoading, error: siteError } = useAppSelector(
    (state: RootState) => state.sites,
  );
  const { roadData, loading, error } = useAppSelector((state: RootState) => state.roads);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!dataSwitch) {
      dispatch(fetchRoads());
    } else {
      dispatch(fetchSites());
    }
  }, [dispatch, dataSwitch]);

  const columns = useMemo<ColumnDef<RowItem>[]>(() => {
    if (!dataSwitch) {
      return [
        { id: 'id', header: 'ID', accessorKey: 'id' },
        { id: 'name', header: 'Name', accessorKey: 'name' },
        { id: 'type', header: 'Type', accessorKey: 'type' },
        { id: 'date', header: 'Date', accessorKey: 'date' },
      ];
    } else {
      return [
        { id: 'id', header: 'ID', accessorKey: 'id' },
        { id: 'name', header: 'Name', accessorKey: 'name' },
        { id: 'siteType', header: 'Type', accessorKey: 'type' },
      ];
    }
  }, [dataSwitch]);

  const rowData = useMemo<RowItem[]>(() => {
    const source = dataSwitch
      ? (siteData as GeoJsonCollection | null)?.features
      : (roadData as GeoJsonCollection | null)?.features ?? [];

    if (!Array.isArray(source)) return [];

    return source.map((feature) => {
      const p = feature.properties ?? {};
      return {
        id: p.id ?? '',
        name: p.name ?? '',
        type: p.type ?? p.siteType ?? '',
        date: p.date ?? '',
      };
    });
  }, [siteData, roadData, dataSwitch]);

  const table = useReactTable<RowItem>({
    data: rowData,
    columns,
    initialState: {
      sorting: [{ id: 'name', desc: false }],
      pagination: { pageIndex: 0, pageSize: getInitialPageSize() },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleRowClick = (row: Row<RowItem>) => {
    const id = row.original.id;
    if (!dataSwitch) {
      navigate(`roadinfo/${id}`);
    } else {
      navigate(`siteinfo/${id}`);
    }
  };

  return (
    <div className="pagebox">
      <div className="typeSwitch">
        <p className={`dataSwitch-label__roads ${dataSwitch ? '' : 'switched'}`}>Roads</p>
        <button
          className={`dataSwitch-btn ${dataSwitch ? 'switched' : ''}`}
          onClick={() => setDataSwitch(!dataSwitch)}
        >
          <div className="thumb" />
        </button>
        <p className={`dataSwitch-label__sites ${dataSwitch ? 'switched' : ''}`}>Sites</p>
      </div>

      <div className="table-container">
        {!dataSwitch && loading && <p className="status-msg">Loading roads...</p>}
        {!dataSwitch && error && <p className="status-msg error">{error}</p>}
        {dataSwitch && siteLoading && <p className="status-msg">Loading sites...</p>}
        {dataSwitch && siteError && <p className="status-msg error">{siteError}</p>}
        <table className="react-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {({ asc: ' 🔼', desc: ' 🔽' } as Record<string, string>)[
                      header.column.getIsSorted() as string
                    ] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} onClick={() => handleRowClick(row)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Prev
          </button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataList;

