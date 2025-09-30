export type TableGrid = string[][];

export type SetFromGrid = (grid: TableGrid) => void;

export type ParseHtmlTable = (table: string | HTMLTableElement) => TableGrid | null;
