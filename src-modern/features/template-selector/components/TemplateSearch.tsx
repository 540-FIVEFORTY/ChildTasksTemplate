/**
 * Template search box with a drop-down list of matching template names
 */
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { TextField } from 'azure-devops-ui/TextField';
import { Icon } from 'azure-devops-ui/Icon';

import { filterTemplates } from '../utils/templateSearch';

interface TemplateSearchProps {
  templates: string[];
  query: string;
  onQueryChange: (query: string) => void;
  onPick: (name: string) => void;
  isSelected: (name: string) => boolean;
}

const LISTBOX_ID = 'template-search-listbox';

export function TemplateSearch({
  templates,
  query,
  onQueryChange,
  onPick,
  isSelected,
}: TemplateSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = useMemo(() => filterTemplates(templates, query), [templates, query]);
  const showList = isOpen && suggestions.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const pick = (name: string) => {
    onPick(name);
    onQueryChange('');
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Enter':
        if (showList && suggestions[activeIndex]) {
          event.preventDefault();
          pick(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen(false);
        } else if (query) {
          event.preventDefault();
          event.stopPropagation();
          onQueryChange('');
        }
        break;
    }
  };

  return (
    <div className="template-search">
      <TextField
        value={query}
        onChange={(_, value) => {
          onQueryChange(value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder="Search templates"
        ariaLabel="Search templates"
        prefixIconProps={{ iconName: 'Search' }}
        role="combobox"
        ariaAutoComplete="list"
        ariaExpanded={showList}
        ariaControls={LISTBOX_ID}
        ariaActiveDescendant={showList ? `${LISTBOX_ID}-${activeIndex}` : undefined}
        autoComplete={false}
        className="template-search__input"
      />

      {showList && (
        <ul id={LISTBOX_ID} role="listbox" className="template-search__list">
          {suggestions.map((name, index) => {
            const selected = isSelected(name);
            return (
              <li
                key={name}
                id={`${LISTBOX_ID}-${index}`}
                role="option"
                aria-selected={selected}
                className={`template-search__option${
                  index === activeIndex ? ' template-search__option--active' : ''
                }`}
                // Keep focus in the input so blur does not close the list first.
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pick(name)}
              >
                <span className="template-search__check">
                  {selected && <Icon iconName="CheckMark" />}
                </span>
                <span className="template-search__name">{name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
