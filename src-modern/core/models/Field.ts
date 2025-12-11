/**
 * Field model - Represents a work item field
 */
export type FieldType = 'text' | 'number';

export interface Field {
  name: string;
  value?: string;
  type?: FieldType; // Used only for unknown fields, default is 'text'
}
