export interface TableColumn {
  title: React.ReactNode;
  dataIndex: string;
  key?: string;
  /** Mark this column as an action column so the card layout can render it separately at the card footer. */
  isAction?: boolean;
}
