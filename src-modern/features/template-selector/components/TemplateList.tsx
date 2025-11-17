/**
 * Template List Component
 */
import { Checkbox } from 'azure-devops-ui/Checkbox';
import { Observer } from 'azure-devops-ui/Observer';

interface TemplateListProps {
  templates: string[];
  onToggle: (name: string) => void;
  isSelected: (name: string) => boolean;
}

export function TemplateList({ templates, onToggle, isSelected }: TemplateListProps) {
  const renderRow = (item: string): JSX.Element => {
    return (
      <div style={{ padding: '8px', display: 'flex', alignItems: 'center' }}>
        <Observer checked={isSelected(item)}>
          {(props) => (
            <Checkbox
              {...props}
              onChange={() => onToggle(item)}
              label={item}
            />
          )}
        </Observer>
      </div>
    );
  };

  if (templates.length === 0) {
    return <div>No templates available</div>;
  }

  return (
    <div>
      {templates.map((template, index) => (
        <div key={index}>{renderRow(template)}</div>
      ))}
    </div>
  );
}
