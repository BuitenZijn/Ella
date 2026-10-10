'use client'

import { useCallback, useMemo, type KeyboardEvent, type ReactNode } from 'react'
import {
  Table,
  TableScroll,
  TableHead,
  TableHeadRow,
  TableHeadCell,
  TableHeadText,
  TableBody,
  TableRow,
  TableCell,
  TableCellText,
  TableEmptyState,
  TableFooter,
  TablePagination,
  FilterBar,
  SearchFilter,
  SelectFilter,
  MultiSelectFilter,
  Checkbox,
  YStack,
  Text,
  neutralColors,
  brandColors,
} from '@ella/ui'
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  Check,
} from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

/**
 * Column definition for DataTable
 */
export interface ColumnDef<T> {
  /** Unique column ID */
  id: string
  /** Column header label */
  header: string
  /** Key to access data from row, or custom accessor function */
  accessor: keyof T | ((row: T) => unknown)
  /** Custom cell renderer */
  cell?: (value: unknown, row: T) => ReactNode
  /** Whether column is sortable */
  sortable?: boolean
  /** Fixed width in pixels */
  width?: number
  /** Flex grow value */
  flex?: number
  /** Min width in pixels */
  minWidth?: number
}

/**
 * Filter definition for DataTable
 */
export interface FilterDef {
  /** Unique filter ID */
  id: string
  /** Filter label */
  label?: string
  /** Filter type */
  type: 'search' | 'select' | 'multi-select'
  /** Options for select/multi-select filters */
  options?: { label: string; value: string }[]
  /** Placeholder text */
  placeholder?: string
  /** Width of filter control */
  width?: number | string
}

/**
 * Sort state
 */
export interface SortState {
  column: string
  direction: 'asc' | 'desc'
}

/**
 * Filter values - keyed by filter ID
 */
export type FilterValues = Record<string, string | string[] | undefined>

/**
 * Pagination state
 */
/**
 * Selection state
 */
export interface SelectionState {
  /** Currently selected row keys */
  selectedKeys: Set<string>
  /** Whether all rows are selected */
  isAllSelected: boolean
  /** Whether some (but not all) rows are selected */
  isIndeterminate: boolean
}

export interface PaginationState {
  page: number
  pageSize: number
  totalCount: number
}

interface DataTableProps<T> {
  /** Data items to display */
  data: T[]
  /** Column definitions */
  columns: ColumnDef<T>[]
  /** Filter definitions */
  filters?: FilterDef[]
  /** Current filter values */
  filterValues?: FilterValues
  /** Filter change callback */
  onFilterChange?: (values: FilterValues) => void
  /** Current sort state */
  sort?: SortState
  /** Sort change callback */
  onSortChange?: (sort: SortState) => void
  /** Pagination state */
  pagination?: PaginationState
  /** Page change callback */
  onPageChange?: (page: number) => void
  /** Page size change callback */
  onPageSizeChange?: (pageSize: number) => void
  /** Callback when row is clicked */
  onRowClick?: (row: T) => void
  /** Empty state content */
  emptyState?: ReactNode
  /** Loading state */
  loading?: boolean
  /** Key extractor for rows */
  getRowKey: (row: T) => string
  /** Enable row selection */
  selectable?: boolean
  /** Currently selected row keys */
  selectedKeys?: Set<string>
  /** Callback when selection changes */
  onSelectionChange?: (selectedKeys: Set<string>) => void
  /** Names a row for screen readers, e.g. its title ("Select Old Town") */
  getRowLabel?: (row: T) => string
}

// Keep in step with TableRow's padding ($5) and gap ($4) in @ella/ui
const ROW_PADDING_X = 24
const CELL_GAP = 18
const SELECT_COLUMN_WIDTH = 48
/** Width a flexible column without a minWidth gets before the table scrolls */
const FLEX_COLUMN_MIN_WIDTH = 140

/**
 * The narrowest the table can get before its columns would be clipped.
 * Narrower screens scroll sideways instead, so the actions column stays
 * reachable on phones and tablets.
 */
function getMinTableWidth<T>(columns: ColumnDef<T>[], selectable: boolean) {
  const widths = columns.map(
    column => column.width ?? column.minWidth ?? FLEX_COLUMN_MIN_WIDTH,
  )
  if (selectable) widths.push(SELECT_COLUMN_WIDTH)
  const content = widths.reduce((sum, width) => sum + width, 0)
  return content + CELL_GAP * (widths.length - 1) + ROW_PADDING_X * 2
}

const focusRing = {
  outlineColor: brandColors.primary,
  outlineStyle: 'solid',
  outlineWidth: 2,
  outlineOffset: -2,
} as const

/** Enter and Space activate a focused non-button element, as for a button */
function onActivateKey(action: () => void) {
  return (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }
}

// =============================================================================
// DataTable Component
// =============================================================================

export function DataTable<T>({
  data,
  columns,
  filters,
  filterValues = {},
  onFilterChange,
  sort,
  onSortChange,
  pagination,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  emptyState,
  loading,
  getRowKey,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  getRowLabel,
}: DataTableProps<T>) {
  // Get cell value from row using accessor
  const getCellValue = useCallback(
    (row: T, accessor: keyof T | ((row: T) => unknown)): unknown => {
      if (typeof accessor === 'function') {
        return accessor(row)
      }
      return row[accessor]
    },
    [],
  )

  // Selection state helpers
  const allRowKeys = useMemo(() => data.map(getRowKey), [data, getRowKey])
  const isAllSelected =
    selectable &&
    data.length > 0 &&
    allRowKeys.every(key => selectedKeys.has(key))
  const isIndeterminate = selectable && selectedKeys.size > 0 && !isAllSelected

  // Handle select all toggle
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return
    if (isAllSelected) {
      // Deselect all
      onSelectionChange(new Set())
    } else {
      // Select all
      onSelectionChange(new Set(allRowKeys))
    }
  }, [isAllSelected, allRowKeys, onSelectionChange])

  // Handle single row selection
  const handleRowSelect = useCallback(
    (rowKey: string) => {
      if (!onSelectionChange) return
      const newSelected = new Set(selectedKeys)
      if (newSelected.has(rowKey)) {
        newSelected.delete(rowKey)
      } else {
        newSelected.add(rowKey)
      }
      onSelectionChange(newSelected)
    },
    [selectedKeys, onSelectionChange],
  )

  // Handle sort click
  const handleSortClick = useCallback(
    (columnId: string) => {
      if (!onSortChange) return

      if (sort?.column === columnId) {
        // Toggle direction
        onSortChange({
          column: columnId,
          direction: sort.direction === 'asc' ? 'desc' : 'asc',
        })
      } else {
        // New column, default to asc
        onSortChange({ column: columnId, direction: 'asc' })
      }
    },
    [sort, onSortChange],
  )

  // Handle filter change
  const handleFilterChange = useCallback(
    (filterId: string, value: string | string[] | undefined) => {
      if (!onFilterChange) return
      onFilterChange({ ...filterValues, [filterId]: value })
    },
    [filterValues, onFilterChange],
  )

  const minTableWidth = useMemo(
    () => getMinTableWidth(columns, selectable),
    [columns, selectable],
  )

  // Pagination icons
  const paginationIcons = useMemo(
    () => ({
      chevronLeft: (
        <ChevronLeft size={16} color={neutralColors.text.secondary} />
      ),
      chevronRight: (
        <ChevronRight size={16} color={neutralColors.text.secondary} />
      ),
      chevronsLeft: (
        <ChevronsLeft size={16} color={neutralColors.text.secondary} />
      ),
      chevronsRight: (
        <ChevronsRight size={16} color={neutralColors.text.secondary} />
      ),
      chevronDown: (
        <ChevronDown size={14} color={neutralColors.text.secondary} />
      ),
    }),
    [],
  )

  return (
    <YStack gap='$4' width='100%'>
      {/* Filters */}
      {filters && filters.length > 0 && (
        <FilterBar>
          {filters.map(filter => {
            switch (filter.type) {
              case 'search':
                return (
                  <SearchFilter
                    key={filter.id}
                    value={(filterValues[filter.id] as string) || ''}
                    onChange={value =>
                      handleFilterChange(filter.id, value || undefined)
                    }
                    placeholder={filter.placeholder || 'Zoeken…'}
                    width={filter.width || 240}
                    searchIcon={
                      <Search size={16} color={neutralColors.text.muted} />
                    }
                    clearIcon={<X size={14} color={neutralColors.text.muted} />}
                  />
                )
              case 'select':
                return (
                  <SelectFilter
                    key={filter.id}
                    value={filterValues[filter.id] as string | undefined}
                    onChange={value => handleFilterChange(filter.id, value)}
                    options={filter.options || []}
                    label={filter.label}
                    placeholder={filter.placeholder || 'Kiezen…'}
                    width={filter.width || 180}
                    chevronIcon={
                      <ChevronDown
                        size={16}
                        color={neutralColors.text.secondary}
                      />
                    }
                    checkIcon={<Check size={16} />}
                  />
                )
              case 'multi-select':
                return (
                  <MultiSelectFilter
                    key={filter.id}
                    value={(filterValues[filter.id] as string[]) || []}
                    onChange={value =>
                      handleFilterChange(
                        filter.id,
                        value.length > 0 ? value : undefined,
                      )
                    }
                    options={filter.options || []}
                    label={filter.label}
                    placeholder={filter.placeholder || 'Kiezen…'}
                    chevronIcon={
                      <ChevronDown
                        size={16}
                        color={neutralColors.text.secondary}
                      />
                    }
                    checkIcon={<Check size={14} color='white' />}
                    closeIcon={<X size={12} />}
                  />
                )
              default:
                return null
            }
          })}
        </FilterBar>
      )}

      {/* Table */}
      <Table>
        <TableScroll>
          <YStack minWidth={minTableWidth}>
            {/* Header */}
            <TableHead>
              <TableHeadRow>
                {selectable && (
                  <TableHeadCell width={SELECT_COLUMN_WIDTH}>
                    <Checkbox
                      checked={
                        isIndeterminate ? 'indeterminate' : isAllSelected
                      }
                      onCheckedChange={handleSelectAll}
                      size='sm'
                      aria-label='Alle rijen selecteren'
                    />
                  </TableHeadCell>
                )}
                {columns.map(column => {
                  const isSorted = sort?.column === column.id
                  const canSort = column.sortable && !!onSortChange
                  return (
                    <TableHeadCell
                      key={column.id}
                      sortable={column.sortable}
                      sorted={isSorted}
                      flex={column.flex}
                      width={column.width}
                      minWidth={column.minWidth}
                      {...(canSort && {
                        role: 'button',
                        tabIndex: 0,
                        'aria-label': `Sort by ${column.header}${
                          isSorted
                            ? `, gesorteerd ${sort?.direction === 'asc' ? 'oplopend' : 'aflopend'}`
                            : ''
                        }`,
                        onPress: () => handleSortClick(column.id),
                        onKeyDown: onActivateKey(() =>
                          handleSortClick(column.id),
                        ),
                        focusVisibleStyle: focusRing,
                      })}
                    >
                      <TableHeadText sorted={isSorted}>
                        {column.header}
                      </TableHeadText>
                      {column.sortable &&
                        isSorted &&
                        (sort?.direction === 'asc' ? (
                          <ChevronUp
                            size={14}
                            color={neutralColors.text.secondary}
                            aria-hidden
                          />
                        ) : (
                          <ChevronDown
                            size={14}
                            color={neutralColors.text.secondary}
                            aria-hidden
                          />
                        ))}
                    </TableHeadCell>
                  )
                })}
              </TableHeadRow>
            </TableHead>

            {/* Body */}
            {!loading && data.length > 0 && (
              <TableBody>
                {data.map(row => {
                  const rowKey = getRowKey(row)
                  const isSelected = selectedKeys.has(rowKey)
                  const rowLabel = getRowLabel?.(row)
                  return (
                    <TableRow
                      key={rowKey}
                      interactive={!!onRowClick}
                      selected={isSelected}
                      {...(onRowClick && {
                        tabIndex: 0,
                        onPress: () => onRowClick(row),
                        onKeyDown: onActivateKey(() => onRowClick(row)),
                        focusVisibleStyle: focusRing,
                      })}
                    >
                      {selectable && (
                        <TableCell width={SELECT_COLUMN_WIDTH}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleRowSelect(rowKey)}
                            size='sm'
                            aria-label={
                              rowLabel
                                ? `${rowLabel} selecteren`
                                : 'Rij selecteren'
                            }
                          />
                        </TableCell>
                      )}
                      {columns.map(column => {
                        const value = getCellValue(row, column.accessor)
                        return (
                          <TableCell
                            key={column.id}
                            flex={column.flex}
                            width={column.width}
                            minWidth={column.minWidth}
                          >
                            {column.cell ? (
                              column.cell(value, row)
                            ) : (
                              <TableCellText>
                                {String(value ?? '')}
                              </TableCellText>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            )}
          </YStack>
        </TableScroll>

        {/* Outside the scroll area, so it stays centred on narrow screens */}
        {loading ? (
          <TableEmptyState>
            <Text color={neutralColors.text.secondary}>Laden…</Text>
          </TableEmptyState>
        ) : data.length === 0 ? (
          <TableEmptyState>
            {emptyState || (
              <Text color={neutralColors.text.secondary}>Geen gegevens</Text>
            )}
          </TableEmptyState>
        ) : null}

        {/* Footer with pagination */}
        {pagination && (
          <TableFooter>
            <TablePagination
              totalItems={pagination.totalCount}
              pageSize={pagination.pageSize}
              currentPage={pagination.page}
              onPageChange={onPageChange || (() => {})}
              onPageSizeChange={onPageSizeChange || (() => {})}
              icons={paginationIcons}
            />
          </TableFooter>
        )}
      </Table>
    </YStack>
  )
}

// Re-export types
export type { DataTableProps }
