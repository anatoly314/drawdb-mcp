/**
 * DrawDB WebSocket Command Types
 * These match the protocol defined in the DrawDB frontend
 */

export interface DrawDBCommand {
  id: string;
  command: string;
  params: Record<string, any>;
}

export interface DrawDBResponse {
  id: string;
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Table-related types
export interface DrawDBField {
  id: string;
  name: string;
  type: string;
  primary: boolean;
  unique: boolean;
  notNull: boolean;
  increment: boolean;
  default: string;
  check: string;
  comment: string;
}

export interface DrawDBTable {
  id: string;
  name: string;
  x: number;
  y: number;
  locked?: boolean;
  fields: DrawDBField[];
  comment: string;
  indices: any[];
  color: string;
}

// Relationship types
export interface DrawDBRelationship {
  id: string;
  name: string;
  startTableId: string;
  startFieldId: string;
  endTableId: string;
  endFieldId: string;
  cardinality: 'one_to_one' | 'one_to_many' | 'many_to_one';
  updateConstraint: 'No action' | 'Restrict' | 'Cascade' | 'Set null' | 'Set default';
  deleteConstraint: 'No action' | 'Restrict' | 'Cascade' | 'Set null' | 'Set default';
}

// Area type
export interface DrawDBArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

// Note type
export interface DrawDBNote {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
}

// Enum type
export interface DrawDBEnum {
  id: string;
  name: string;
  values: string[];
}

// Type (custom type)
export interface DrawDBType {
  id: string;
  name: string;
  fields: DrawDBField[];
}

// Full diagram state
export interface DrawDBDiagram {
  database: string;
  tables: DrawDBTable[];
  relationships: DrawDBRelationship[];
  areas: DrawDBArea[];
  notes: DrawDBNote[];
  enums: DrawDBEnum[];
  types: DrawDBType[];
}
