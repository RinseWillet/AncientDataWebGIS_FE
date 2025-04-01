import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import RoadService from "../services/RoadService";
import SiteService from "../services/SiteService";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper
} from '@tanstack/react-table';


import './DataList.css'; // Reuse your styles

const DataList = () => {
    const navigate = useNavigate();
    const [dataSwitch, setDataSwitch] = useState(false); // false = Roads, true = Sites
    const [data, setData] = useState([]);

    const getInitialPageSize = () => {
        const width = window.innerWidth;
        if (width <= 400) return 10;
        if (width <= 850) return 13;
        return 15;
    };

    // Redux state for user (not needed here yet but useful for future buttons)
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = !dataSwitch
                    ? await RoadService.findAllGeoJson()
                    : await SiteService.findAllGeoJson();

                setData(response.data?.features || []);
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, [dataSwitch]);

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
        if (!Array.isArray(data)) return [];

        return data.map((feature) => {
            const props = feature.properties;
            return {
                id: props.id,
                name: props.name,
                type: props.type || props.siteType || "",
                date: props.date || "",
            };
        });
    }, [data]);

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