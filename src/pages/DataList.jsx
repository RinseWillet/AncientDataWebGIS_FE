import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoads } from "../features/road/roadThunks";
import { fetchSites } from "../features/site/siteThunks";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper
} from '@tanstack/react-table';

import './DataList.css';

const DataList = () => {
    const navigate = useNavigate();
    const [dataSwitch, setDataSwitch] = useState(false); // false = Roads, true = Sites
    const { siteData, loading: siteLoading, error: siteError } = useSelector((state) => state.sites);
    const { roadData, loading, error } = useSelector((state) => state.roads);
    const dispatch = useDispatch();


    const getInitialPageSize = () => {
        const width = window.innerWidth;
        if (width <= 400) return 10;
        if (width <= 850) return 13;
        return 15;
    };

    // Redux state for user (not needed here yet but useful for future buttons)
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {

        if (!dataSwitch) {
            dispatch(fetchRoads());
        } else {
            dispatch(fetchSites());
        };

    }
        , [dispatch, dataSwitch]);

    const columns = useMemo(() => {
        if (!dataSwitch) {
            return [
                {
                    id: "id",
                    header: "ID",
                    accessorKey: "id",
                },
                {
                    id: "name",
                    header: "Name",
                    accessorKey: "name",
                },
                {
                    id: "type",
                    header: "Type",
                    accessorKey: "type",
                },
                {
                    id: "date",
                    header: "Date",
                    accessorKey: "date",
                },
            ];
        } else {
            return [
                {
                    id: "id",
                    header: "ID",
                    accessorKey: "id",
                },
                {
                    id: "name",
                    header: "Name",
                    accessorKey: "name",
                },
                {
                    id: "siteType",
                    header: "Type",
                    accessorKey: "type",
                },
            ];
        }
    }, [dataSwitch]);

    const rowData = useMemo(() => {
        const source = dataSwitch ? siteData?.features : roadData?.features || [];

        if (!Array.isArray(source)) return [];

        return source.map((feature) => {
            const props = feature.properties || {};
            return {
                id: props.id,
                name: props.name,
                type: props.type || props.siteType || "",
                date: props.date || "",
            };
        });
    }, [siteData, roadData, dataSwitch]);

    const table = useReactTable({
        data: rowData,
        columns,
        initialState: {
            sorting: [{ id: 'name', desc: false }],
            pagination: {
                pageIndex: 0,
                pageSize: getInitialPageSize(),
            },
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const handleRowClick = (row) => {
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
                <p className={`dataSwitch-label__roads ${dataSwitch ? "" : "switched"}`}>Roads</p>
                <button
                    className={`dataSwitch-btn ${dataSwitch ? "switched" : ""}`}
                    onClick={() => setDataSwitch(!dataSwitch)}
                >
                    <div className="thumb" />
                </button>
                <p className={`dataSwitch-label__sites ${dataSwitch ? "switched" : ""}`}>Sites</p>
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
                                        {{
                                            asc: " 🔼",
                                            desc: " 🔽"
                                        }[header.column.getIsSorted()] ?? null}
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